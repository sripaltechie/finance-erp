const Capital = require('../models/Capital');

// @desc    Add Capital (Investment)
// @route   POST /api/capital
const addCapital = async (req, res) => {
    try {
        const { amount, source, notes, type } = req.body;
        
        // 1. Create Entry
        const newCapital = await Capital.create({
            companyId: req.user.companyId, // From Auth Middleware
            amount: Number(amount),
            type: type || 'Injection',
            source,
            notes,
            addedBy: req.user._id
        });

        res.status(201).json(newCapital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Current Business Balance (Capital + Profits - Expenses)
// @route   GET /api/capital/stats
const getCapitalStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        // 1. Total Capital Injected
        const capitalDocs = await Capital.find({ companyId });
        const totalInvestment = capitalDocs.reduce((acc, curr) => 
            curr.type === 'Injection' ? acc + curr.amount : acc - curr.amount, 0
        );

        // NOTE: In future steps, we will subtract "Active Loans" from this
        // to show "Cash in Hand".
        
        res.json({ 
            totalInvestment,
            history: capitalDocs 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addCapital, getCapitalStats };