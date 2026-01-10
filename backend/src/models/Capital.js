const mongoose = require('mongoose');

const capitalSchema = new mongoose.Schema({
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    amount: { type: Number, required: true }, // e.g., 500000
    type: { 
        type: String, 
        enum: ['Injection', 'Withdrawal'], 
        default: 'Injection' // Injection = Adding money, Withdrawal = Taking profit
    },
    source: { type: String }, // e.g., "Personal Savings", "Bank Loan"
    date: { type: Date, default: Date.now },
    notes: String,
    
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Capital', capitalSchema);