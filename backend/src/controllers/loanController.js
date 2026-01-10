const Loan = require('../models/Loan');
const Company = require('../models/Company');
const Customer = require('../models/Customer');
const CapitalLog = require('../models/CapitalLog');

// @desc    Create Loan with Advanced Calculation (Deductions, Rollover, Split Payment)
// @route   POST /api/loans/create-advanced
exports.createAdvancedLoan = async (req, res) => {
  const session = await mongoose.startSession(); // Use Transaction for safety
  session.startTransaction();

  try {
    const { 
      customerId, loanType, principalAmount, startDate,
      deductions, // Array: [{ name: 'Doc Fee', type: 'Fixed', value: 200, timing: 'Upfront' }]
      rolloverLoanId, // Optional: Old Loan ID to close
      paymentMode, // { cash: 6000, online: 4000 }
      
      // Rules
      dailyConfig, // { installment: 100, days: 100, penaltyAfterDue: 10 }
      monthlyConfig // { rate: 2 }
    } = req.body;

    const companyId = req.user.companyId;

    // 1. CALCULATE DEDUCTIONS
    let upfrontDeductionTotal = 0;
    const processedDeductions = deductions.map(d => {
      let amt = d.type === 'Fixed' ? d.value : (principalAmount * d.value / 100);
      if (d.timing === 'Upfront') upfrontDeductionTotal += amt;
      return { ...d, amount: amt };
    });

    // 2. HANDLE ROLLOVER (Old Loan)
    let rolloverAmount = 0;
    if (rolloverLoanId) {
      const oldLoan = await Loan.findById(rolloverLoanId).session(session);
      if (oldLoan) {
        // Calculate pending balance of old loan
        rolloverAmount = oldLoan.summary.pendingBalance || 0;
        
        // Close the Old Loan
        oldLoan.status = 'Rollover';
        oldLoan.summary.pendingBalance = 0; // Cleared
        await oldLoan.save({ session });
      }
    }

    // 3. CALCULATE NET DISBURSEMENT (Cash needed from drawer)
    // Formula: Principal - (Fees) - (Old Loan Debt)
    const netToPay = principalAmount - upfrontDeductionTotal - rolloverAmount;

    // 4. VALIDATE SPLIT PAYMENT matches NetToPay
    const cashOut = Number(paymentMode.cash || 0);
    const onlineOut = Number(paymentMode.online || 0);

    if (cashOut + onlineOut !== netToPay) {
      throw new Error(`Mismatch! Net Payable is ${netToPay}, but you entered ${cashOut + onlineOut}`);
    }

    // 5. CHECK CAPITAL (Wallet Balance)
    const company = await Company.findById(companyId).session(session);
    
    if (company.capital.cashBalance < cashOut) throw new Error(`Not enough CASH. Have: ${company.capital.cashBalance}`);
    if (company.capital.bankBalance < onlineOut) throw new Error(`Not enough BANK balance. Have: ${company.capital.bankBalance}`);

    // 6. CREATE LOAN
    const newLoan = new Loan({
      companyId,
      customerId,
      loanType,
      principalAmount,
      startDate: startDate || new Date(),
      deductions: processedDeductions,
      
      rollover: { linkedLoanId: rolloverLoanId, amountDeducted: rolloverAmount },
      netDisbursement: netToPay,
      
      disbursementMode: { cashAmount: cashOut, onlineAmount: onlineOut },
      
      rules: loanType === 'Daily' ? {
        dailyInstallment: dailyConfig.installment,
        totalDays: dailyConfig.days,
        penaltyPerDayAfterDue: dailyConfig.penaltyAfterDue,
        dueDate: new Date(new Date().setDate(new Date().getDate() + dailyConfig.days))
      } : {
        interestRate: monthlyConfig.rate,
        interestType: 'Simple'
      },

      summary: {
        amountPaid: 0,
        pendingBalance: loanType === 'Daily' 
          ? (dailyConfig.installment * dailyConfig.days) // Daily: Total Repayable (e.g. 10,000 + Interest implicitly)
          : principalAmount // Monthly: Principal stays until paid
      }
    });

    await newLoan.save({ session });

    // 7. DEDUCT CAPITAL
    company.capital.cashBalance -= cashOut;
    company.capital.bankBalance -= onlineOut;
    await company.save({ session });

    // 8. LOG CAPITAL MOVEMENT
    await CapitalLog.create([{
      companyId,
      amount: netToPay,
      type: 'Withdrawal',
      description: `Loan Disbursement (Split: ${cashOut} Cash / ${onlineOut} Bank)`,
      date: new Date()
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Loan Created Successfully", loan: newLoan });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};