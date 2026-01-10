const Company = require('../models/Company');
const Client = require('../models/Client');
const CapitalLog = require('../models/CapitalLog');

// @desc    Create a new Company (Branch)
// @route   POST /api/companies
exports.createCompany = async (req, res) => {
  try {
    const { name, address, settings,initialCapital } = req.body;
    const clientId = req.user.id; // From Auth Middleware

    // 1. Check Subscription Limits
    const client = await Client.findById(clientId);
    const currentCompanyCount = await Company.countDocuments({ clientId });

    let limit = 1; // Default (Basic)
    if (client.subscriptionPlan === 'Pro') limit = 3;
    if (client.subscriptionPlan === 'Enterprise') limit = 999;

    if (currentCompanyCount >= limit) {
      return res.status(403).json({ 
        message: `Upgrade Plan! You reached the limit of ${limit} companies.` 
      });
    }

    // 2. Create the Company
    const newCompany = await Company.create({
      clientId,
      name,
      address,
      settings: settings || {}, // Default settings if none provided
      capital : {
        initial : Nummber(initialCapital) || 0,
        current : Nummber(initialCapital) || 0,
      }
    });

    if (initialCapital > 0) {
      await CapitalLog.create({
        companyId: newCompany._id,
        amount: Number(initialCapital),
        type: 'Initial',
        description: 'Opening Balance'
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