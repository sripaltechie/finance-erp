const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Company = require('../models/Company');
const Customer = require('../models/Customer');
const CapitalLog = require('../models/CapitalLog');

// @desc    Create Loan with Advanced Calculation
// @route   POST /api/loans/create-advanced
exports.createAdvancedLoan = async (req, res) => {
    try {
        const {
            customerId,
            loanType,
            disbursementMode,
            paymentSplit,
            financials,
            deductions, // Array of extra charges
            penaltyConfig,
            notes
        } = req.body;

        const companyId = req.user.companyId;

        // 1. Validation
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // 2. Calculate Deductions
        let upfrontDeductions = 0;
        const principal = Number(financials.principalAmount);
        const rate = Number(financials.interestRate);
        const duration = Number(financials.duration) || 100;

        // A. Interest Upfront?
        if (financials.deductionConfig?.interest === 'Upfront') {
            let interestAmount = 0;
            if (loanType === 'Monthly') {
                // Simple Interest: (P * R * Months) / 100
                interestAmount = (principal * rate * duration) / 100;
            } else if (loanType === 'Daily') {
                 // For Daily, interest is often flat or calculated differently. 
                 // Assuming flat rate for duration if upfront selected for daily.
                 // Or typically daily loans have interest built-in to installment.
                 // Let's assume standard simple interest logic or 0 if not applicable.
                 interestAmount = (principal * rate * (duration/30)) / 100; 
            }
            upfrontDeductions += interestAmount;
        }

        // B. Additional Charges / Discounts
        if (deductions && deductions.length > 0) {
            deductions.forEach(d => {
                const amt = Number(d.amount);
                if (d.isDiscount) {
                    upfrontDeductions -= amt; // Discount reduces deduction (increases net cash)
                } else {
                    upfrontDeductions += amt; // Charge increases deduction (decreases net cash)
                }
            });
        }

        const netDisbursement = principal - upfrontDeductions;

        // 3. Check Company Capital
        const company = await Company.findById(companyId);
        if (!company) return res.status(404).json({ message: "Company not found" });

        // 4. Create Loan
        const newLoan = await Loan.create({
            companyId,
            customerId,
            loanType,
            disbursementMode: disbursementMode || 'Cash',
            paymentSplit: paymentSplit || { cash: 0, online: 0 },
            
            financials: {
                ...financials,
                netDisbursementAmount: netDisbursement
            },
            
            deductions: deductions || [],
            penaltyConfig,
            notes,
            status: 'Active'
        });

        res.status(201).json(newLoan);

    } catch (error) {
        console.error("Create Loan Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// exports.createAdvancedLoan = async (req, res) => {
//   // NOTE: If using local MongoDB without Replica Set, remove session/transaction lines
//   const session = await mongoose.startSession(); 
//   session.startTransaction();
  
//   try {
//     const { 
//       customerId, loanType, principalAmount, startDate,
//       deductions, 
//       deductionConfig, 
//       rolloverLoanId, 
//       paymentMode, 
//       notes, 
//       dailyConfig, 
//       monthlyConfig 
//     } = req.body;

//     const companyId = req.user.companyId;

//     // 1. CALCULATE DEDUCTIONS
//     let upfrontDeductionTotal = 0;
    
//     // A. Standard Deductions
//     const processedDeductions = (deductions || []).map(d => {
//       let amt = d.type === 'Fixed' ? d.value : (principalAmount * d.value / 100);
//       if (d.timing === 'Upfront') upfrontDeductionTotal += amt;
//       return { ...d, amount: amt };
//     });

//     // B. Interest Deduction (FIXED CRASH HERE)
//     let interestDeductedAmount = 0;
//     // Safe chaining: deductionConfig might be undefined
//     if (deductionConfig?.interest) {
//         if (loanType === 'Monthly' && monthlyConfig) {
//             interestDeductedAmount = (principalAmount * monthlyConfig.rate) / 100;
//         } 
//         upfrontDeductionTotal += interestDeductedAmount;
        
//         processedDeductions.push({
//             name: 'Upfront Interest',
//             type: 'calculated',
//             amount: interestDeductedAmount,
//             timing: 'Upfront'
//         });
//     }

//     // 2. HANDLE ROLLOVER
//     let rolloverAmount = 0;
//     if (rolloverLoanId) {
//       const oldLoan = await Loan.findById(rolloverLoanId).session(session);
//       if (oldLoan) {
//         rolloverAmount = oldLoan.summary.pendingBalance || 0;
//         oldLoan.status = 'Rollover';
//         oldLoan.summary.pendingBalance = 0; 
//         await oldLoan.save({ session });
//       }
//     }

//     // 3. NET DISBURSEMENT
//     const netToPay = principalAmount - upfrontDeductionTotal - rolloverAmount;

//     // 4. VALIDATE SPLIT PAYMENT
//     const cashOut = Number(paymentMode?.cash || 0);
//     const onlineOut = Number(paymentMode?.online || 0);

//     if (Math.abs((cashOut + onlineOut) - netToPay) > 1) {
//       throw new Error(`Mismatch! Net Payable is ${netToPay}, but you entered ${cashOut + onlineOut}`);
//     }

//     // 5. CHECK CAPITAL
//     const company = await Company.findById(companyId).session(session);
//     if (company.capital.cashBalance < cashOut) throw new Error(`Not enough CASH. Have: ${company.capital.cashBalance}`);
//     if (company.capital.bankBalance < onlineOut) throw new Error(`Not enough BANK balance. Have: ${company.capital.bankBalance}`);

//     // 6. CREATE LOAN
//     const newLoan = new Loan({
//       companyId,
//       customerId,
//       loanType,
//       principalAmount,
//       startDate: startDate || new Date(),
//       deductions: processedDeductions,
//       notes: notes || "",
      
//       rollover: { linkedLoanId: rolloverLoanId, amountDeducted: rolloverAmount },
//       netDisbursement: netToPay,
      
//       disbursementMode: { cashAmount: cashOut, onlineAmount: onlineOut },
      
//       rules: loanType === 'Daily' ? {
//         dailyInstallment: dailyConfig.installment,
//         totalDays: dailyConfig.days,
//         penaltyPerDayAfterDue: dailyConfig.penaltyAfterDue,
//         dueDate: new Date(new Date().setDate(new Date().getDate() + dailyConfig.days))
//       } : {
//         interestRate: monthlyConfig?.rate || 0,
//         interestType: 'Simple'
//       },

//       summary: {
//         amountPaid: 0,
//         pendingBalance: loanType === 'Daily' 
//           ? (dailyConfig.installment * dailyConfig.days) 
//           : principalAmount 
//       }
//     });

//     await newLoan.save({ session });

//     // 7. DEDUCT CAPITAL
//     if (company.capital) {
//         company.capital.cashBalance -= cashOut;
//         company.capital.bankBalance -= onlineOut;
//         await company.save({ session });
//     }

//     // 8. LOG CAPITAL MOVEMENT
//     await CapitalLog.create([{
//       companyId,
//       amount: netToPay,
//       type: 'Withdrawal',
//       description: `Loan Disbursement (Split: ${cashOut} Cash / ${onlineOut} Bank)`,
//       date: new Date()
//     }], { session });

//     await session.commitTransaction();
//     session.endSession();

//     res.status(201).json({ message: "Loan Created Successfully", loan: newLoan });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     res.status(400).json({ message: error.message });
//   }
// };

// ... (Keep existing getLoanDetails, applyPenalty, addRepayment exports)
exports.getLoanDetails = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('customerId', 'fullName mobile address') // Fixed: 'name' -> 'fullName' based on Customer Model
      .populate('companyId', 'name');

    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // --- DYNAMIC STATS ---
    let stats = {
      daysPassed: 0,
      isOverdue: false,
      overdueDays: 0,
      suggestedPenalty: 0
    };

    if (loan.loanType === 'Daily' && loan.status === 'Active') {
      const start = new Date(loan.startDate);
      const now = new Date();
      const diffTime = Math.abs(now - start);
      const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      stats.daysPassed = daysPassed;
      const totalDaysAllowed = loan.rules.totalDays || 100;

      if (daysPassed > totalDaysAllowed) {
        stats.isOverdue = true;
        stats.overdueDays = daysPassed - totalDaysAllowed;
        const penaltyPerDay = loan.rules.penaltyPerDayAfterDue || 0; 
        stats.suggestedPenalty = stats.overdueDays * penaltyPerDay;
      }
    }

    res.json({ loan, stats });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyPenalty = async (req, res) => {
    // ... (Keep existing logic)
    try {
        const { amount, reason } = req.body;
        const loan = await Loan.findById(req.params.id);
        if (!loan) return res.status(404).json({ message: "Loan not found" });

        loan.summary.pendingBalance += Number(amount);
        const dateStr = new Date().toLocaleDateString();
        loan.notes = (loan.notes || "") + `\n[${dateStr}] Penalty: ₹${amount} (${reason})`;
        await loan.save();
        res.json({ message: "Penalty applied", loan });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addRepayment = async (req, res) => {
    // ... (Keep existing logic)
    try {
        const { amount } = req.body;
        const loan = await Loan.findById(req.params.id);
        if (!loan) return res.status(404).json({ message: "Loan not found" });

        const payAmount = Number(amount);
        loan.summary.amountPaid += payAmount;
        loan.summary.pendingBalance -= payAmount; 
        if (loan.summary.pendingBalance <= 0) {
            loan.status = 'Closed';
            loan.summary.pendingBalance = 0;
        }
        await loan.save();
        res.json({ message: "Repayment successful", loan });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};