const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Company = require('../models/Company');
const Customer = require('../models/Customer');
const CapitalLog = require('../models/CapitalLog');

// @desc    Create Loan with Advanced Calculation
// @route   POST /api/loans/create-advanced
exports.createAdvancedLoan = async (req, res) => {
     // Start Transaction Session   
    try {
        const {
            companyId,
            customerId,
            loanType,
            disbursementMode,
            paymentSplit,
            financials,
            deductions, // Array of extra charges
            penaltyConfig,
            notes
        } = req.body;

        // const companyId = companyId;
        console.log("companyId",req.user);

        // 1. Validation
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // 2. Calculate Deductions & Net Disbursement
        let upfrontDeductions = 0;
        const principal = Number(financials.principalAmount);
        const rate = Number(financials.interestRate);
        const duration = Number(financials.duration) || 100;

        // A. Interest Upfront?
        if (financials.deductionConfig?.interest === 'Upfront') {
            let interestAmount = 0;
            if (loanType === 'Monthly') {
                // Simple Interest: (P * R * Months) / 100
                interestAmount = (principal * rate) / 100;
            } else if (loanType === 'Daily') {
                 // For Daily, interest is often flat or calculated differently. 
                 // Assuming flat rate for duration if upfront selected for daily.
                 // Or typically daily loans have interest built-in to installment.
                 // Let's assume standard simple interest logic or 0 if not applicable.
                 interestAmount = (principal * rate) / 100; 
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

         // Check for specific fields if they persist in some versions of frontend      

        const netDisbursement = principal - upfrontDeductions;

        // 3. Check Company Capital 
          // 3. Handle Payment Split & Capital Deduction
        const company = await Company.findById(companyId);
        console.log("company",company);
        if (!company) throw new Error("Company not found");

        let finalPaymentSplit = []; // Array for DB: [{ modeId, amount }]
        
        if (disbursementMode === 'Split' && paymentSplit) {
            // Case A: Dynamic Split (Object or Array)
            // If paymentSplit is { cash: 100, online: 200 } (Legacy/Simple)
            if (paymentSplit && typeof paymentSplit === 'object') {
                 // Try to map 'cash' and 'online' to actual modes if possible, or store loosely
                 // For now, let's assume the frontend sends modeIds as keys if using dynamic modes
                 // If the frontend is sending { cash: ..., online: ... }, we might need default modes.
                 // But the new frontend sends keys as modeIds (e.g. { "65a...": "5000" })
            }

            // Iterate over keys to handle dynamic modeIds
            for (const [key, val] of Object.entries(paymentSplit)) {
                const amount = Number(val);
                if (amount > 0) {
                    // Check if key is a valid Mode ID in company
                    // Or if it's 'cash'/'online' mapping to a mode
                    let mode = company.paymentModes.id(key);
                     // Fallback: if key is 'cash' or 'online', find the first matching active mode
                    if (!mode && (key === 'cash' || key === 'online')) {
                         const type = key.charAt(0).toUpperCase() + key.slice(1); // 'Cash' or 'Online'
                         mode = company.paymentModes.find(m => m.type === type && m.isActive);
                    }

                    if (mode) {
                        if (mode.currentBalance < amount) {
                            throw new Error(`Insufficient funds in ${mode.name}. Bal: ${mode.currentBalance}`);
                        }
                        mode.currentBalance -= amount;
                        finalPaymentSplit.push({ modeId: mode._id, amount });
                    } else {
                        // Fallback for 'cash'/'online' keys if simple logic still used
                        // Ignore or handle if needed
                    }
                }
            }
        } 
        // If finalPaymentSplit is empty, maybe it's Single Mode
        if (finalPaymentSplit.length === 0 && disbursementMode !== 'Split') {
            // Case B: Single Mode
            // disbursementMode might be 'Cash', 'Online' OR a specific Mode ID
            // Ideally frontend should send mode ID if it's dynamic
            // Let's assume disbursementMode holds the ID if it's not 'Split'
            // OR we fetch the default mode for 'Cash'
            
            // Check if disbursementMode is an ID
            let mode = company.paymentModes.id(disbursementMode);
              // Or 'Cash'/'Online' string
            
            if (!mode) {
                // Try finding by type if ID not sent
                mode = company.paymentModes.find(m => m.type === disbursementMode && m.isActive);
            }

            if (mode) {
                if (mode.currentBalance < netDisbursement) {
                    throw new Error(`Insufficient funds in ${mode.name}`);
                }
                mode.currentBalance -= netDisbursement;
                finalPaymentSplit.push({ modeId: mode._id, amount: netDisbursement });
            } else {
                // If no mode found (and we need to deduct capital), throw error
                // Unless we allow creation without deduction (not recommended)
                throw new Error(`Invalid Disbursement Mode: ${disbursementMode}`);
            }
        }

        // Validate Split Total against Net Disbursement
        const totalSplit = finalPaymentSplit.reduce((acc, curr) => acc + curr.amount, 0);
        // Allow tiny variance for float math
        if (Math.abs(totalSplit - netDisbursement) > 1) {
             throw new Error(`Disbursement Mismatch! Need: ${netDisbursement}, Allocated: ${totalSplit}`);
        }

        // Save Capital Changes
        await company.save({});


        // 4. Create Loan
        const newLoan = await Loan.create({
            companyId,
            customerId,
            loanType,
            loanType,
            disbursementMode: finalPaymentSplit.length > 1 ? 'Split' : (disbursementMode || 'Cash'),
             // Map our calculated split array to the schema's paymentSplit
            // Note: Schema expects { cash: number, online: number } in previous version
            // BUT we updated it to array in recent steps or need to map it back if schema is old.
            // Assuming Schema is updated to support dynamic split or we map it to old fields roughly.
            // Let's use the flexible `paymentSplit` if schema allows, otherwise map to cash/online buckets.
            paymentSplit: {
                cash: finalPaymentSplit.filter(s => {
                    const m = company.paymentModes.id(s.modeId); 
                    return m && m.type === 'Cash';
                }).reduce((a, b) => a + b.amount, 0),
                online: finalPaymentSplit.filter(s => {
                    const m = company.paymentModes.id(s.modeId); 
                    return m && m.type === 'Online';
                }).reduce((a, b) => a + b.amount, 0)
            },

            // Store the detailed split array instead of simple cash/online object
            // This requires Loan Schema update to accept array if not already
            // If schema expects object { cash, online }, we might need to map it back or update schema.
            // Assuming Schema allows flexible structure or we update it.
            // Let's map to schema's `paymentSplit` if it is strictly { cash, online }
            // BUT for dynamic modes, we need an array.
            
            // NOTE: Updating to save specific Mode IDs for better tracking
            // We'll save this in a new field or reuse 'paymentSplit' if schema allows
            // For now, let's assume we use the legacy structure for compatibility if schema wasn't updated, 
            // OR better: Update Loan Schema to support `paymentSplit: [{ modeId, amount }]`.
            
            // Using the flexible 'deductions' and 'financials'
            
            financials: {
                ...financials,
                netDisbursementAmount: netDisbursement
            },
            
            deductions: deductions || [],
            penaltyConfig,
            notes,
            status: 'Active',
            // Saving the transaction detail for reference
            // Storing in a temporary field or notes if schema is rigid, 
            // but ideally Loan Schema should have `transactions` or `disbursementDetails`
            disbursementDetails: finalPaymentSplit 
        });

        // 5. Log Capital Entry
        await CapitalLog.create([{
            companyId,
            amount: netDisbursement,
            type: 'Withdrawal',
            description: `Loan Disbursement to ${customer.fullName}`,
            date: new Date()
        }]);


        res.status(201).json(newLoan[0]);

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