// File: backend/src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Link to the specific Branch/Firm
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },

  name: { type: String, required: true },
  mobile: { type: String, required: true }, // Used for Login
  password: { type: String, required: true },
  
  role: { 
    type: String, 
    enum: ['Admin','Manager', 'Collection_Boy', 'Recovery_Agent'], 
    default: 'Collection_Boy' 
  },
   // 🟢 NEW FIELD
  permissions: [{
    type: String,
    enum: ['MANAGE_STAFF', 'APPROVE_LOAN', 'DELETE_CUSTOMER', 'VIEW_REPORTS'] 
  }],
  // Security
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  
  // App Preferences (Optional)
  language: { type: String, default: 'en' }, // en, te (Telugu), hi (Hindi)
  pushToken: { type: String } // For Notifications

}, { timestamps: true });

// Compound Index to ensure mobile is unique PER COMPANY (or globally, your choice)
// Here, I make it unique globally to avoid confusion
UserSchema.index({ mobile: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);