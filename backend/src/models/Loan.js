// File: backend/src/models/Loan.js
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  loanType: { 
    type: String, 
    enum: ['Daily', 'Monthly'], 
    required: true 
  },
  
  status: { type: String, enum: ['Active', 'Closed', 'Rollover'], default: 'Active' },
  startDate: { type: Date, default: Date.now },

  // --- Financials ---
  principalAmount: { type: Number, required: true }, // The main loan (e.g., 10,000)
  
  // 🗓️ LOGIC FOR DAILY LOANS
  dailyInstallmentAmount: { type: Number }, // e.g., 500
  totalDays: { type: Number },              // e.g., 100
  lastPaidIndex: { type: Number, default: 0 }, // e.g., 55 (Means 55 days fully paid)
  partialPaymentBalance: { type: Number, default: 0 }, // e.g., 200 (Held for Day 56)

  // 📅 LOGIC FOR MONTHLY LOANS
  monthlyInterestRate: { type: Number }, // e.g., 2 (%)
  currentPrincipalBalance: { type: Number }, // Starts = principalAmount. Reduces on payment.
  interestDue: { type: Number, default: 0 }, // Accumulated unpaid interest
  nextInterestGenerationDate: { type: Date }, // When to run the Cron Job next

  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String

}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);