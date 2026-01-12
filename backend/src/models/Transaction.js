// File: backend/src/models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  amount: { type: Number, required: true }, // Total Cash Received
  paymentSplit: [{
        modeId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Links to Company.paymentModes._id
        modeName: { type: String }, // Snapshot (in case name changes later)
        amount: { type: Number, required: true }
    }],
  installmentIndexes: [Number],
  date: { type: Date, default: Date.now },

  // 🧠 LOGIC: Breakdown of where the money went
  type: { 
    type: String, 
    enum: ['Daily_Installment', 'Monthly_Interest', 'Principal_Payment'], 
    required: true 
  },

  // Only for Daily Loans
  dailyStats: {
    daysCovered: { type: Number }, // e.g., 2 full days
    indexesCleared: [Number],      // e.g., [56, 57]
    isPartial: { type: Boolean, default: false } // True if it left a remainder
  },

  // Only for Monthly Loans
  monthlyStats: {
    interestComponent: { type: Number, default: 0 }, // How much went to interest
    principalComponent: { type: Number, default: 0 } // How much reduced the loan
  },

  location: {
    lat: Number,
    lng: Number
  }

}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);