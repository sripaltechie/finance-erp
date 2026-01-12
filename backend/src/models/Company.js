// File: backend/src/models/Company.js
const mongoose = require('mongoose');


const PaymentModeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "HDFC Bank", "Main Cash Drawer"
  type: { type: String, enum: ['Cash', 'Online'], required: true },
  
  // 💰 Money Management
  initialBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 }, // Updates with every transaction
  
  isActive: { type: Boolean, default: true }
});


const CompanySchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  
  name: { type: String, required: true }, // e.g. "Sai Finance - Vijayawada"
  address: { type: String },
  // 💰 NEW: Capital Management
  paymentModes: [PaymentModeSchema],
  logoUrl: { type: String },
  // ⚙️ THE FEATURE SETTINGS (Admin Controls)
  settings: {
    // Loan Logic
    allowPartialPayments: { type: Boolean, default: true },
    enableMonthlyInterest: { type: Boolean, default: true },
    interestCalculationType: { type: String, enum: ['Simple', 'Compound'], default: 'Simple' },
    
    // Security & Workflow
    requireAdminApprovalForLoans: { type: Boolean, default: false },
    geoFencingEnabled: { type: Boolean, default: false }, // Force GPS check for collection
    blockDefaultersAuto: { type: Boolean, default: true }, // Auto Level-3
    
    // Credit Score Config (The rules we discussed)
    creditScoreRules: {
      startingScore: { type: Number, default: 500 },
      dailyOnTimeReward: { type: Number, default: 10 },
      dailyMissedPenalty: { type: Number, default: -5 },
    }
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

CompanySchema.virtual('totalCapital').get(function() {
  if (!this.paymentModes) return 0;
  return this.paymentModes.reduce((sum, mode) => sum + (mode.currentBalance || 0), 0);
});

module.exports = mongoose.model('Company', CompanySchema);