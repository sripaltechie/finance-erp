const Capital = require('../models/Capital');
const Loan = require('../models/Loan');
const Company = require('../models/Company');
const Transaction = require('../models/Transaction');

// @desc    Add Capital (Investment)
// @route   POST /api/capital
const addCapital = async (req, res) => {
    try {
        const { amount, source, notes, type } = req.body;
        
        // 1. Create Entry
        const newCapital = await Capital.create({
            companyId: req.user.companyId, // From Auth Middleware
            amount: Number(amount),
            type: type || 'Injection',
            source,
            notes,
            addedBy: req.user._id
        });

        res.status(201).json(newCapital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Current Business Balance (Capital + Profits - Expenses)
// @route   GET /api/capital/stats
const getCapitalStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        // 1. Total Capital Injected
        const capitalDocs = await Capital.find({ companyId });
        const totalInvestment = capitalDocs.reduce((acc, curr) => 
            curr.type === 'Injection' ? acc + curr.amount : acc - curr.amount, 0
        );

        // NOTE: In future steps, we will subtract "Active Loans" from this
        // to show "Cash in Hand".
        
        res.json({ 
            totalInvestment,
            history: capitalDocs 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get Dashboard Stats for Client
// @route   GET /api/capital/dashboard-stats
const getDashboardStats = async (req, res) => {
    try {
    // 🟢 1. GET COMPANY ID FROM QUERY PARAMS
    const { companyId } = req.query; 
    if (!companyId || companyId === 'undefined' || companyId.length !== 24) {
      return res.status(400).json({ message: "A valid Company ID is required" });
    }    

    // 🟢 2. SECURITY CHECK: Ensure this Client actually owns this Company
    // req.user.id comes from the Token (Client ID)
    const company = await Company.findOne({ _id: companyId, clientId: req.user.id });
    
    if (!company) {
      return res.status(403).json({ message: "Access denied. You do not own this company." });
    }

    // 3. (Rest of the logic remains the same, using 'company._id') ...
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayTransactions = await Transaction.aggregate([
      { 
        $match: { 
          companyId: company._id, 
          type: 'Credit',
          date: { $gte: startOfDay, $lte: endOfDay } 
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const activeLoansCount = await Loan.countDocuments({ companyId: company._id, status: 'Active' });

    const marketOutstanding = await Loan.aggregate([
        { $match: { companyId: company._id, status: 'Active' } },
        { $group: { _id: null, total: { $sum: "$summary.pendingBalance" } } }
    ]);

    res.json({
      cashBalance: company.capital?.cashBalance || 0,
      bankBalance: company.capital?.bankBalance || 0,
      todayCollection: todayTransactions.length > 0 ? todayTransactions[0].total : 0,
      activeLoans: activeLoansCount,
      overdueAmount: marketOutstanding.length > 0 ? marketOutstanding[0].total : 0
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { addCapital, getCapitalStats, getDashboardStats};

