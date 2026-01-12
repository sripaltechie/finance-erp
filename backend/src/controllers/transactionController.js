const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Company = require('../models/Company');

// @desc    Record a Payment (Collection) with Split Logic
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      loanId, 
      amount, // Total Amount
      paymentSplit, // Array: [{ mode: 'Cash', amount: 200 }, { mode: 'PhonePe', amount: 800 }]
      location, 
      notes 
    } = req.body;

    const collectedBy = req.user.id;
    const companyId = req.user.companyId;
    const totalPay = Number(amount);

    // 1. Validate Total Matches Split
    const splitTotal = paymentSplit.reduce((sum, item) => sum + Number(item.amount), 0);
    if (splitTotal !== totalPay) {
      throw new Error(`Mismatch! Total is ${totalPay}, but split adds up to ${splitTotal}`);
    }

    // 2. Fetch Loan
    const loan = await Loan.findById(loanId).session(session);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== 'Active') throw new Error("Loan is not Active");

    // 3. Prepare Transaction Data
    let transactionData = {
      companyId,
      loanId,
      customerId: loan.customerId,
      collectedBy,
      amount: totalPay,
      
      // 🟢 THE NEW PAYMENT STRUCTURE
      paymentSplit: paymentSplit, 
      paymentType: 'Mixed', // Default

      date: new Date(),
      location,
      dailyStats: {},
      monthlyStats: {}
    };

    // ====================================================
    // 🧠 LOGIC: LOAN UPDATES (Same as before)
    // ====================================================
    if (loan.loanType === 'Daily') {
      const installment = loan.rules.dailyInstallment;
      const currentPartial = loan.partialPaymentBalance || 0;
      const totalMoneyAvailable = totalPay + currentPartial;
      const daysCleared = Math.floor(totalMoneyAvailable / installment);
      const remainder = totalMoneyAvailable % installment;
      const startIndex = loan.lastPaidIndex + 1;
      
      const indexesCleared = [];
      for (let i = 0; i < daysCleared; i++) indexesCleared.push(startIndex + i);

      loan.lastPaidIndex += daysCleared;
      loan.partialPaymentBalance = remainder;
      
      transactionData.dailyStats = {
        daysCovered: daysCleared,
        indexesCleared: indexesCleared,
        isPartial: remainder > 0
      };
      transactionData.installmentIndexes = indexesCleared; // Save for history

      if (loan.lastPaidIndex >= loan.rules.totalDays && remainder === 0) {
        loan.status = 'Closed';
      }
    } else {
      // Monthly Logic (Simplified for this snippet)
      // ... (Interest calculation logic stays here) ...
      transactionData.paymentType = 'Interest'; // Simplified
    }

    loan.summary.amountPaid += totalPay;
    loan.summary.pendingBalance -= totalPay;
    await loan.save({ session });

    // 4. Create Transaction
    const newTxn = await Transaction.create([transactionData], { session });

    // 5. 💰 UPDATE CAPITAL (WALLET SPLIT)
    // We iterate over the split to update the correct wallet
    let cashAdded = 0;
    let bankAdded = 0;

    paymentSplit.forEach(p => {
      if (p.mode === 'Cash') {
        cashAdded += Number(p.amount);
      } else {
        // Assume anything not 'Cash' is Online (PhonePe, GPay, Bank)
        bankAdded += Number(p.amount);
      }
    });

    await Company.findByIdAndUpdate(companyId, {
        $inc: { 
          'capital.cashBalance': cashAdded,
          'capital.bankBalance': bankAdded
        }
    }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(newTxn[0]);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};