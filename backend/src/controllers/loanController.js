const Loan = require('../models/Loan');
const Company = require('../models/Company');
const CapitalLog = require('../models/CapitalLog');
const Customer = require('../models/Customer');

// @desc    Create a New Loan (Disbursement)
// @route   POST /api/loans
exports.createLoan = async (req, res) => {
  try {
    const { 
      customerId, 
      loanType, // 'Daily' or 'Monthly'
      principalAmount, 
      startDate,
      
      // Daily Specifics
      dailyInstallment, 
      totalDays,
      
      // Monthly Specifics
      interestRate
    } = req.body;

    const companyId = req.user.companyId;
    const staffId = req.user.id;

    // 1. 💰 CAPITAL CHECK: Do we have enough money?
    const company = await Company.findById(companyId);
    if (company.capital.current < principalAmount) {
      return res.status(400).json({ 
        message: `Insufficient Funds! Current Balance: ₹${company.capital.current}` 
      });
    }

    // 2. 📝 PREPARE DATA based on Type
    let loanData = {
      companyId,
      customerId,
      loanType,
      principalAmount: Number(principalAmount),
      startDate: startDate || new Date(),
      createdBy: staffId,
      status: 'Active'
    };

    if (loanType === 'Daily') {
      loanData.dailyInstallmentAmount = Number(dailyInstallment);
      loanData.totalDays = Number(totalDays);
      loanData.lastPaidIndex = 0; // Starts at 0
      loanData.partialPaymentBalance = 0;
    } else {
      // Monthly
      loanData.monthlyInterestRate = Number(interestRate);
      loanData.currentPrincipalBalance = Number(principalAmount); // Starts full
      loanData.interestDue = 0;
      // Next interest date = 30 days from now
      const nextDate = new Date(startDate || new Date());
      nextDate.setDate(nextDate.getDate() + 30);
      loanData.nextInterestGenerationDate = nextDate;
    }

    // 3. 💾 SAVE TO DB (Atomic-like operations)
    
    // A. Create Loan
    const newLoan = await Loan.create(loanData);

    // B. Deduct Capital from Company
    company.capital.current -= Number(principalAmount);
    await company.save();

    // C. Log the Transaction (Money OUT)
    await CapitalLog.create({
      companyId,
      amount: Number(principalAmount),
      type: 'Withdrawal', // Money leaving the drawer
      description: `Loan Disbursement to Customer (Loan #${newLoan._id.toString().slice(-4)})`,
      date: new Date()
    });

    res.status(201).json({ 
      message: "Loan Disbursed Successfully", 
      loan: newLoan,
      remainingCapital: company.capital.current 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Loans for this Branch (with Filters)
// @route   GET /api/loans
exports.getLoans = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let query = { companyId: req.user.companyId };

    if (status) query.status = status;
    if (type) query.loanType = type;
    
    // If searching by Customer Name, we need a smarter query (Join)
    // For MVP, we fetch loans and populate customer, then filter in memory 
    // OR filter customers first. Efficient approach:
    if (search) {
       const customers = await Customer.find({ 
         fullName: { $regex: search, $options: 'i' },
         companyId: req.user.companyId
       }).select('_id');
       
       const custIds = customers.map(c => c._id);
       query.customerId = { $in: custIds };
    }

    const loans = await Loan.find(query)
      .populate('customerId', 'fullName mobile shortId')
      .sort({ createdAt: -1 });

    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};