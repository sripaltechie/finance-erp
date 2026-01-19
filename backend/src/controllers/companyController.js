const Company = require('../models/Company');
const Client = require('../models/Client');
const CapitalLog = require('../models/CapitalLog');
const User = require('../models/User'); // Import User model
const bcrypt = require('bcryptjs');
// import { PLATFORMS, DURATIONS, BASE_PRICES, PLANS } from '../../../shared/PricingData';
const { PLATFORMS, DURATIONS, BASE_PRICES, PLANS } = require('../../../shared/PricingData');


// @desc    Create a new Company (Branch)
// @route   POST /api/companies


exports.createCompany = async (req, res) => {
  try {
    const { name, address,initialCapital, settings } = req.body;
    const clientId = req.user.id; // From Auth Middleware

    // 1. Fetch Client to check Plan
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });
    
    
    // 2. 🛡️ CHECK PLAN LIMITS
    const currentCompanyCount = await Company.countDocuments({ clientId });
     // Default to 'Basic' if plan is missing or invalid
    const userPlan = client.subscriptionPlan || 'Basic';
    const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS['Basic'];
    
    if (currentCompanyCount >= limits.maxCompanies) {
      return res.status(403).json({ 
        message: `Plan Limit Reached! Your ${userPlan} plan allows max ${limits.maxCompanies} companies. Upgrade to add more.` 
      });
    }

    // 3. Create the Company
    const newCompany = await Company.create({
      clientId,
      name,
      address,
      settings: settings || {}, // Default settings if none provided
      capital : {
        initial : Number(initialCapital) || 0,
        current : Number(initialCapital) || 0,
      }
    });

    // 4. Log Initial Capital
    if (initialCapital > 0) {
      await CapitalLog.create({
        companyId: newCompany._id,
        amount: Number(initialCapital),
        type: 'Initial',
        description: 'Opening Balance'
      });
    }

    
    // 🟢 5. AUTO-CREATE USER FOR OWNER (So they can login to Mobile App)
    // Check if a user exists with the owner's mobile
    const existingUser = await User.findOne({ mobile: client.mobile });    
    if (!existingUser) {
        // Hash the same password they used for Client Login (or a default one)
        // For security, we usually ask them to set it, but here we reuse the Client password 
        // Note: You can't decrypt the client hash, so we might need a default '123456' 
        // or require them to register separately. 
        // For User Experience, let's set a default pattern or copy if we had raw password (we don't).        
        // Strategy: Set default password as their mobile number for first login
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(client.mobile, salt); // Default pass = mobile
        await User.create({
            companyId: newCompany._id,
            name: client.ownerName + " (Owner)",
            mobile: client.mobile,
            password: hashedPassword,
            role: 'Admin', // Full Access in App
            isActive: true
        });
    }
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Companies for the logged-in Client
// @route   GET /api/companies
exports.getMyCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ clientId: req.user.id });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ==========================================

// 🟢 PAYMENT MODE CRUD OPERATIONS

// ==========================================

// @desc    Add a New Payment Mode (Wallet)
// @route   POST /api/companies/:id/payment-modes

// @desc    Get All Payment Modes for a Company
// @route   GET /api/companies/:companyId/payment-modes
exports.getPaymentModes = async (req, res) => {
    try {
        const { companyId } = req.params;
        // Verify ownership (Client) or employment (User)
        // Ideally checking permissions here
        
        const company = await Company.findById(companyId);
        if (!company) return res.status(404).json({ message: "Company not found" });
        
        res.json(company.paymentModes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a New Payment Mode
// @route   POST /api/companies/:companyId/payment-modes
exports.addPaymentMode = async (req, res) => {
  try {
    const { companyId  } = req.params; // Company ID
    const { name, type, initialBalance } = req.body;
    const clientId = req.user.id;

    // 1. Fetch Company & Client
    const company = await Company.findOne({ _id: companyId, clientId });
    if (!company) return res.status(404).json({ message: "Company not found" });

    const client = await Client.findById(clientId);

    // 2. 🛡️ PLAN RESTRICTION LOGIC
    // Define Limits (You can move this to a config file later)
    const PLAN_LIMITS = {
      'Basic': 3,    // e.g. 1 Cash + 1 Bank
      'Pro': 5,      // e.g. 2 Cash + 3 Banks
      'Enterprise': 99 // Unlimited
    };

    const currentCount = company.paymentModes.length;
    const allowedLimit = PLAN_LIMITS[client.subscriptionPlan] || 2;

    if (currentCount >= allowedLimit) {
      return res.status(403).json({ 
        message: `Plan Limit Reached! Your ${client.subscriptionPlan} plan allows max ${allowedLimit} payment modes. Upgrade to add more.` 
      });
    }

    // 3. Add New Mode
    const newMode = {
      name,
      type, // 'Cash' or 'Online'
      initialBalance: Number(initialBalance) || 0,
      currentBalance: Number(initialBalance) || 0
    };

    company.paymentModes.push(newMode);
    await company.save();

    res.status(201).json(company.paymentModes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Update Payment Mode (Name, Status)
// @route   PUT /api/companies/:companyId/payment-modes/:modeId
exports.updatePaymentMode = async (req, res) => {
    try {
        const { companyId, modeId } = req.params;
        const { name, type, initialBalance, isActive } = req.body;

        const company = await Company.findById(companyId);
        // console.log("company",company);
        if (!company) return res.status(404).json({ message: "Company not found" });

        const mode = company.paymentModes.id(modeId);
        // console.log("modeid",mode);
        if (!mode) return res.status(404).json({ message: "Payment mode not found" });

        if (name) mode.name = name;
        if (type) mode.type = type;
        
        // Note: Updating initialBalance might cause discrepancies if transactions exist based on old balance.
        // The frontend warns about this, but backend allows it here as requested.
        if (initialBalance !== undefined) {
             // If balance logic depends on initial + transactions, changing initial changes current.
             // Simple adjustment: 
             // New Current = Old Current - Old Initial + New Initial
             const diff = Number(initialBalance) - mode.initialBalance;
             mode.initialBalance = Number(initialBalance);
             mode.currentBalance += diff; 
        }

        if (typeof isActive !== 'undefined') mode.isActive = isActive;

        await company.save();
        res.json(company.paymentModes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Delete Payment Mode (Soft Delete / Deactivate preferred if used)
// @route   DELETE /api/companies/:companyId/payment-modes/:modeId
exports.deletePaymentMode = async (req, res) => {
    try {
        const { companyId, modeId } = req.params;

        const company = await Company.findById(companyId);
        if (!company) return res.status(404).json({ message: "Company not found" });

        // Logic: Only allow delete if currentBalance == initialBalance (unused)
        // Otherwise, suggest deactivation.
        const mode = company.paymentModes.id(modeId);
        if(mode.currentBalance !== mode.initialBalance) {
             return res.status(400).json({ message: "Cannot delete wallet with active transactions. Deactivate it instead." });
        }

        company.paymentModes.pull(modeId);
        await company.save();
        res.json(company.paymentModes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.checkAllowedLimitPm = async(req,res)=>{

const currentModes = await PaymentMode.countDocuments({ companyId });
const plan = PLANS.find(p => p.id === client.planId);

  if (currentModes >= plan.limitations.maxPaymentModes) {
    return res.status(403).json({ 
      message: `Your ${plan.name} plan only allows ${plan.limitations.maxPaymentModes} payment modes. Please upgrade to Gold or Platinum.` 
    });
  }
};