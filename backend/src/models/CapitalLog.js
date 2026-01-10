const mongoose = require('mongoose');

const CapitalLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  amount: { type: Number, required: true },
  
  type: { 
    type: String, 
    enum: ['Initial', 'Injection', 'Withdrawal'], 
    required: true 
  },
  
  description: { type: String }, // e.g., "Sold Gold", "Personal Expense"
  date: { type: Date, default: Date.now }
  
}, { timestamps: true });

module.exports = mongoose.model('CapitalLog', CapitalLogSchema);