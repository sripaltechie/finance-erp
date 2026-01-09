const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  // Personal Details
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  
  // Business Info (Optional during signup)
  businessName: { type: String }, 
  address: { type: String },

  // 🛡️ APPROVAL STATUS (The Core Logic)
  accountStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Suspended'], 
    default: 'Pending' 
  },

  // Subscription Logic
  subscriptionPlan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Basic' },
  validTill: { type: Date }, // Set this when you Approve

  // Limits
  maxCompanies: { type: Number, default: 1 },

}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);