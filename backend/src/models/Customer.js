const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    // 🏢 SAAS ISOLATION (Crucial for Multi-User System)
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    
    // --- BASIC INFO ---
    fullName: { type: String, required: true },
    mobile: { type: String, required: true }, // Unique constraint is handled via Index below
    shortId: { type: String }, // e.g., "100" for quick search
    
    isActive: { type: Boolean, default: true },
    
    // --- DETAILED LOCATIONS (From Your Code) ---
    locations: {
        residence: { 
            addressText: String, 
            geo: { lat: Number, lng: Number } 
        },
        collectionPoint: { 
            addressText: String,
            placeType: { type: String, enum: ['Shop', 'Home', 'Other'], default: 'Home' },
            geo: { lat: Number, lng: Number } 
        }
    },

    // --- DETAILED KYC (From Your Code) ---
    kyc: {
        aadhaarNumber: String,
        aadhaarPhoto: String, // URL to S3/Uploads
        profilePhoto: String,
        panCardNumber: String,
        panCardPhoto: String,
        rationCardNumber: String,
        rationCardPhoto: String
    },

    // --- FAMILY & INCOME (For Conflict Checks) ---
    familyMembers: [{
        name: String,
        relation: String,
        mobile: String,
        hasActiveLoan: { type: Boolean, default: false }
    }],

    incomeSource: { type: String, enum: ['Daily Wage', 'Monthly Salary', 'Business'] },
    incomeAmount: { type: Number },
    proofs: [{ type: String }], // Array of URLs (e.g. Electricity Bill)
    
    // --- RELATIONSHIPS ---
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    collectionBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Staff assigned to collect
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // --- 🟢 LOGIC: CREDIT SCORE & LEVELS ---
    creditScore: { type: Number, default: 500 },
    level: { 
        type: String, 
        enum: ['Level 1', 'Level 2', 'Level 3'], 
        default: 'Level 2' // Starts Neutral
    },
    bonusCoins: { type: Number, default: 0 },

    // --- ⚠️ LOGIC: RECOVERY (Level 3 Specifics) ---
    recoveryMetadata: {
        isDefaulter: { type: Boolean, default: false },
        legalStatus: { type: String, enum: ['None', 'Notice Sent', 'Legal Case'], default: 'None' },
        assignedRecoveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }

}, { timestamps: true });

// 🔒 SAAS SECURITY INDEXES
// 1. Mobile Number must be unique *PER COMPANY* (Not globally)
CustomerSchema.index({ companyId: 1, mobile: 1 }, { unique: true });

// 2. Ration Card should be unique *PER COMPANY* (Prevents duplicate loans)
CustomerSchema.index({ companyId: 1, 'kyc.rationCardNumber': 1 }, { 
    unique: true, 
    partialFilterExpression: { 'kyc.rationCardNumber': { $exists: true, $gt: "" } } 
});

// 3. Fast Search Index (For "Type 100 to find Suresh")
CustomerSchema.index({ companyId: 1, shortId: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);