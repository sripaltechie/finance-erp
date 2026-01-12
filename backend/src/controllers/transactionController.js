const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Company = require('../models/Company');

// @desc    Record a Payment (Collection) with Dynamic Payment Modes
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      loanId, 
      amount, // Total Amount Received
      paymentSplit, // Array: [{ modeId: "65a...", amount: 200 }, { modeId: "65b...", amount: 800 }]
      location, 
      notes 
    } = req.body;

    const collectedBy = req.user.id;
    const companyId = req.user.companyId;
    const totalPay = Number(amount);

    if (totalPay <= 0) throw new Error("Amount must be greater than 0");

    // 1. VALIDATION: Check if Split matches Total
    const splitTotal = paymentSplit.reduce((sum, item) => sum + Number(item.amount), 0);
    if (splitTotal !== totalPay) {
      throw new Error(`Mismatch! Total is ${totalPay}, but split adds up to ${splitTotal}`);
    }

    // 2. FETCH LOAN
    const loan = await Loan.findById(loanId).session(session);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== 'Active') throw new Error("Loan is not Active");

    // 3. FETCH COMPANY (To Verify & Update Wallets)
    const company = await Company.findById(companyId).session(session);
    if (!company) throw new Error("Company not found");

    // 4. PREPARE TRANSACTION DATA
    // We will enrich the paymentSplit with names for history
    const enrichedSplit = [];

    // 💰 CAPITAL UPDATE LOGIC (Dynamic Wallets)
    for (const split of paymentSplit) {
        // Find the specific wallet inside the company array
        const mode = company.paymentModes.id(split.modeId);

        if (!mode) {
            throw new Error(`Invalid Payment Mode ID: ${split.modeId}`);
        }
        if (!mode.isActive) {
            throw new Error(`Payment Mode '${mode.name}' is inactive`);
        }

        // A. Add Money to this Wallet
        mode.currentBalance += Number(split.amount);

        // B. Add to enriched list for Transaction History
        enrichedSplit.push({
            modeId: split.modeId,
            modeName: mode.name, // Snapshot the name (e.g., "HDFC Bank")
            amount: Number(split.amount)
        });
    }

    // Save the Company with updated balances
    await company.save({ session });

    // 5. LOAN UPDATE LOGIC (Daily/Monthly)
    let transactionData = {
      companyId,
      loanId,
      customerId: loan.customerId,
      collectedBy,
      amount: totalPay,
      
      // 🟢 SAVING THE ENRICHED SPLIT
      paymentSplit: enrichedSplit, 
      paymentType: 'Mixed',

      date: new Date(),
      location,
      dailyStats: {},
      monthlyStats: {},
      notes
    };

    // ====================================================
    // 🧠 CORE LOGIC: DAILY INDEX CALCULATION
    // ====================================================
    if (loan.loanType === 'Daily') {
      const installment = loan.rules.dailyInstallment;
      
      // Get current partial balance (leftover from previous)
      const currentPartial = loan.partialPaymentBalance || 0;
      const totalMoneyAvailable = totalPay + currentPartial;

      // Calculate Days Cleared
      const daysCleared = Math.floor(totalMoneyAvailable / installment);
      const remainder = totalMoneyAvailable % installment;
      
      // Calculate specific Indexes (e.g., 56, 57, 58)
      const startIndex = loan.lastPaidIndex + 1;
      const indexesCleared = [];
      for (let i = 0; i < daysCleared; i++) {
        indexesCleared.push(startIndex + i);
      }

      // Update Loan State
      loan.lastPaidIndex += daysCleared;
      loan.partialPaymentBalance = remainder;
      
      // Meta Data for Transaction
      transactionData.dailyStats = {
        daysCovered: daysCleared,
        indexesCleared: indexesCleared,
        isPartial: remainder > 0
      };
      transactionData.installmentIndexes = indexesCleared;

      // Auto-Close Check
      if (loan.lastPaidIndex >= loan.rules.totalDays && remainder === 0) {
        loan.status = 'Closed';
      }

    } 
    // ====================================================
    // 🧠 CORE LOGIC: MONTHLY INTEREST
    // ====================================================
    else {
      transactionData.paymentType = 'Monthly_Interest'; // Default Assumption
      
      let remainingPay = totalPay;
      let interestPaid = 0;
      let principalPaid = 0;

      // Priority 1: Clear Interest
      if (loan.interestDue > 0) {
        if (remainingPay >= loan.interestDue) {
          interestPaid = loan.interestDue;
          remainingPay -= loan.interestDue;
          loan.interestDue = 0;
        } else {
          interestPaid = remainingPay;
          loan.interestDue -= remainingPay;
          remainingPay = 0;
        }
      }

      // Priority 2: Reduce Principal
      if (remainingPay > 0) {
        principalPaid = remainingPay;
        loan.currentPrincipalBalance -= principalPaid;
        transactionData.paymentType = 'Principal_Payment'; // Update Type
      }

      transactionData.monthlyStats = {
        interestComponent: interestPaid,
        principalComponent: principalPaid
      };

      // Auto-Close Check
      if (loan.currentPrincipalBalance <= 0 && loan.interestDue <= 0) {
        loan.status = 'Closed';
      }
    }

    // Update Global Summaries
    loan.summary.amountPaid += totalPay;
    if (loan.loanType === 'Daily') {
      loan.summary.pendingBalance -= totalPay;
    } else {
      loan.summary.pendingBalance = loan.currentPrincipalBalance + loan.interestDue;
    }

    await loan.save({ session });

    // 6. CREATE TRANSACTION RECORD
    const newTxn = await Transaction.create([transactionData], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(newTxn[0]);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Transactions (Day Book)
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
    try {
        const { date, staffId, loanId } = req.query;
        let query = { companyId: req.user.companyId };

        // 1. Filter by Loan (Specific History)
        if (loanId) {
            query.loanId = loanId;
        }

        // 2. Filter by Date (Defaults to Today for Day Book)
        if (date) {
            const start = new Date(date); start.setHours(0,0,0,0);
            const end = new Date(date); end.setHours(23,59,59,999);
            query.date = { $gte: start, $lte: end };
        }

        // 3. Filter by Staff (Collection Boy)
        if (staffId) {
            query.collectedBy = staffId;
        }

        const txns = await Transaction.find(query)
            .populate('customerId', 'fullName shortId')
            .populate('collectedBy', 'name')
            .sort({ date: -1 });

        res.json(txns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};