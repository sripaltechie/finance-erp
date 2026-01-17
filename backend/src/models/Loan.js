const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Core Details
  loanType: { type: String, enum: ['Daily', 'Monthly'], required: true },
  status: { type: String, enum: ['Active', 'Closed', 'Rollover', 'Bad_Debt'], default: 'Active' },
  startDate: { type: Date, default: Date.now },

  // FINANCIAL STRUCTURE (Matching Web App)
  financials: {
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true }, // Monthly %
    duration: { type: Number, required: true },
    durationType: { type: String, enum: ['Days', 'Months'] },
    
    // For Daily Loans
    installmentAmount: { type: Number },
    
    // Commission Logic
    deductionConfig: {
      interest: { type: String, enum: ['Upfront', 'End'], default: 'End' }
    },
    
    // Tracking
    netDisbursementAmount: { type: Number },
    totalPrincipalPaid: { type: Number, default: 0 },
    totalInterestPaid: { type: Number, default: 0 }
  },

  // Additional Charges / Discounts
  deductions: [{
    name: { type: String },
    amount: { type: Number },
    type: { type: String, enum: ['Fixed', 'Percentage', 'Discount'] }, // Discount is handled as negative
    isDiscount: { type: Boolean, default: false }
  }],

  // PENALTY RULES
  penaltyConfig: {
    type: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
    amount: { type: Number, default: 0 },
    gracePeriod: { type: Number, default: 0 } // Days
  },

  // Disbursement Info
  disbursementMode: { type: String, enum: ['Cash', 'Online', 'Split'], default: 'Cash' },
  
  paymentSplit: {
      cash: { type: Number, default: 0 },
      online: { type: Number, default: 0 }
  },

  // Tracking
  notes: { type: String },
  
  // Generated Schedule (Optional storage)
  dues: [{
    date: Date,
    amount: Number,
    status: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },
    paidAmount: { type: Number, default: 0 }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);