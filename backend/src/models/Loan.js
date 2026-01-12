const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Core Details
  loanType: { type: String, enum: ['Daily', 'Monthly'], required: true },
  status: { type: String, enum: ['Active', 'Closed', 'Rollover', 'Bad_Debt'], default: 'Active' },
  startDate: { type: Date, default: Date.now },

  // 💰 THE MONEY BREAKDOWN
  principalAmount: { type: Number, required: true }, // e.g., 10,000 (The "Chit Value")
  
  // 🟢 NEW: Deduction Configuration (Toggles)
  deductionConfig: {
    interest: { type: Boolean, default: false } // true = Upfront Deduction, false = End/Collect Later
  },

  // Deductions Logic (Upfront/End, Fixed/%)
  deductions: [{
    name: { type: String }, // e.g., "Document Fee"
    amount: { type: Number },
    type: { type: String, enum: ['Fixed', 'Percentage'] },
    value: { type: Number }, // Store the % (e.g., 2) or fixed val (e.g., 500)
    timing: { type: String, enum: ['Upfront', 'End_of_Loan'] }, // Upfront = Cut now. End = Add to due.
    isApplied: { type: Boolean, default: true }
  }],

  // 🔄 ROLLOVER (Old Loan Adjustment)
  rollover: {
    linkedLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    amountDeducted: { type: Number, default: 0 } // Amount cut from new loan to close old one
  },

  // 💸 NET DISBURSEMENT (What actually left the shop)
  netDisbursement: { type: Number }, // Principal - Upfront Deductions - Rollover
  
  // Payment Split (How you gave the money)
  disbursementMode: {
    cashAmount: { type: Number, default: 0 },
    onlineAmount: { type: Number, default: 0 },
    transactionRef: { type: String } // UPI Ref ID if any
  },

  // 🟢 NEW: Notes / Terms
  notes: { type: String, default: "" }, 

  // 🧠 CALCULATION RULES (Future-Proofing)
  rules: {
    // For Daily
    dailyInstallment: Number,
    totalDays: Number,
    penaltyPerDayAfterDue: { type: Number, default: 0 }, // e.g., ₹10 per day after 100 days
    dueDate: Date, // Auto-calculated (Start + 100 days)

    // For Monthly
    interestRate: Number, // % per month
    interestType: { type: String, enum: ['Simple', 'Compound'], default: 'Simple' }
  },

  // Running Balances
  summary: {
    amountPaid: { type: Number, default: 0 },
    pendingBalance: { type: Number } // Auto-updated
  }

}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);