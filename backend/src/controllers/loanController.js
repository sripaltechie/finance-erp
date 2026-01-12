const mongoose = require('mongoose'); // Ensure mongoose is imported
const Loan = require('../models/Loan');
const Company = require('../models/Company');
const Customer = require('../models/Customer');
const CapitalLog = require('../models/CapitalLog');

// @desc    Create Loan with Advanced Calculation (Deductions, Rollover, Split Payment)
// @route   POST /api/loans/create-advanced
exports.createAdvancedLoan = async (req, res) => {
  const session = await mongoose.startSession(); 
  session.startTransaction();

  try {
    const { 
      customerId, loanType, principalAmount, startDate,
      deductions, // Array: [{ name: 'Doc Fee', type: 'Fixed', value: 200, timing: 'Upfront' }]
      deductionConfig, // <--- NEW: Contains { interest: true/false }
      rolloverLoanId, 
      paymentMode, 
      notes, // <--- NEW: Optional notes field
      
      // Rules
      dailyConfig, 
      monthlyConfig 
    } = req.body;

    const companyId = req.user.companyId;

    // 1. CALCULATE DEDUCTIONS (Fees + Charges)
    let upfrontDeductionTotal = 0;
    
    // A. Standard Deductions (Doc charges, etc.)
    const processedDeductions = deductions.map(d => {
      let amt = d.type === 'Fixed' ? d.value : (principalAmount * d.value / 100);
      if (d.timing === 'Upfront') upfrontDeductionTotal += amt;
      return { ...d, amount: amt };
    });

    // B. NEW: Interest Deduction Logic
    let interestDeductedAmount = 0;
    if (deductionConfig && deductionConfig.interest) {
        if (loanType === 'Monthly') {
            // Calculate 1 Month Interest: (P * R) / 100
            interestDeductedAmount = (principalAmount * monthlyConfig.rate) / 100;
        } else {
            // For Daily, logic varies. Leaving 0 or customize here (e.g. 1st installment)
            interestDeductedAmount = 0; 
        }
        
        // Add to total upfront deductions
        upfrontDeductionTotal += interestDeductedAmount;
        
        // Push to processed deductions for record keeping
        processedDeductions.push({
            name: 'Upfront Interest',
            type: 'calculated',
            amount: interestDeductedAmount,
            timing: 'Upfront'
        });
    }

    // 2. HANDLE ROLLOVER (Old Loan)
    let rolloverAmount = 0;
    if (rolloverLoanId) {
      const oldLoan = await Loan.findById(rolloverLoanId).session(session);
      if (oldLoan) {
        rolloverAmount = oldLoan.summary.pendingBalance || 0;
        
        oldLoan.status = 'Rollover';
        oldLoan.summary.pendingBalance = 0; 
        await oldLoan.save({ session });
      }
    }

    // 3. CALCULATE NET DISBURSEMENT (Cash needed from drawer)
    const netToPay = principalAmount - upfrontDeductionTotal - rolloverAmount;

    // 4. VALIDATE SPLIT PAYMENT matches NetToPay
    const cashOut = Number(paymentMode.cash || 0);
    const onlineOut = Number(paymentMode.online || 0);

    // Allow small floating point differences
    if (Math.abs((cashOut + onlineOut) - netToPay) > 1) {
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
      notes: notes || "", // <--- NEW: Save notes (default empty string)
      
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
        // NEW: If interest is deducted upfront for Monthly, balance is Principal
        // If NOT deducted, balance is usually Principal (interest added later).
        // For Daily, it remains (Installment * Days).
        pendingBalance: loanType === 'Daily' 
          ? (dailyConfig.installment * dailyConfig.days) 
          : principalAmount 
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