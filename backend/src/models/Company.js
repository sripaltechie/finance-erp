// File: backend/src/models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  
  name: { type: String, required: true }, // e.g. "Sai Finance - Vijayawada"
  address: { type: String },
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

module.exports = mongoose.model('Company', CompanySchema);