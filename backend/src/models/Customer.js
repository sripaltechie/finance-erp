// File: backend/src/models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  
  // Basic Info
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  shortId: { type: String }, // For Quick Search (e.g., "100")
  
  // Locations (For Map & Geo-fencing)
  address: { type: String },
  geoCoordinates: {
    lat: Number,
    lng: Number
  },

  // 🟢 LOGIC: Credit Score & Levels
  creditScore: { type: Number, default: 500 },
  level: { 
    type: String, 
    enum: ['Level 1', 'Level 2', 'Level 3'], 
    default: 'Level 2' // Start as Neutral
  },

  // ⚠️ LOGIC: Defaulter / Recovery Management (Level 3 specific)
  recoveryMetadata: {
    isDefaulter: { type: Boolean, default: false },
    legalStatus: { type: String, enum: ['None', 'Notice Sent', 'Legal Case'], default: 'None' },
    assignedRecoveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  isActive: { type: Boolean, default: true }

}, { timestamps: true });

// Ensure mobile is unique ONLY within the same company
CustomerSchema.index({ companyId: 1, mobile: 1 }, { unique: true });
// Index for fast search by Short ID
CustomerSchema.index({ companyId: 1, shortId: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);