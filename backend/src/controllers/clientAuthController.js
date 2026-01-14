const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company'); 

// @desc    Register a new SaaS Client
// @route   POST /api/auth/client/register
exports.registerClient = async (req, res) => {
  try {
    const { ownerName, email, mobile, password, businessName } = req.body;

    // 1. Check Duplicates
    const existing = await Client.findOne({ $or: [{ email }, { mobile }] });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create Client (Status: PENDING by default)
    const newClient = await Client.create({
      ownerName,
      email,
      mobile,
      businessName,
      password: hashedPassword,
      accountStatus: 'Pending' // <--- Crucial
    });

    res.status(201).json({ 
      message: "Registration successful! Please contact Admin for approval.",
      clientId: newClient._id 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login Client (SaaS Owner)
// @route   POST /api/auth/client/login
exports.loginClient = async (req, res) => {
  console.log("hiiii222");
  try {
    const { identifier, password } = req.body;
     // 1. Check if client exists (Search by Email OR Mobile)
    // We construct a dynamic query
    
    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide email/mobile and password" });
    }

    // let query = {};
    // if (email) query.email = email;
    // if (mobile) query.mobile = mobile;
    // if (Object.keys(query).length === 0) {
    //   return res.status(400).json({ message: "Please provide email or mobile" });
    // }

    console.log("client is");
    const client = await Client.findOne({
       $or: [
        { email: identifier }, 
        { mobile: identifier }
      ]
    }); //
    console.log("client is",client);
    // 1. Check if client exists
    if (!client) {
      return res.status(400).json({ message: "User not found" });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // 3. CRITICAL: Check Approval Status
    // If you just registered, your status is 'Pending'. You cannot login yet.
    // For TESTING: You might want to manually change this to 'Active' in MongoDB Compass
    if (client.accountStatus !== 'Active') {
      return res.status(403).json({ message: "Account Pending Approval" });
    }
    
    // 4. Generate Token
    const token = jwt.sign({ id: client._id, role: 'Client' }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // 🟢 5. FETCH COMPANIES OWNED BY THIS CLIENT
    // const client = await Client.findOne(query); //
    // const company = await Company.findOne({ clientId: client._id });
    const companies = await Company.find({ clientId: client._id }).select('_id name');
    res.json({
      _id: client._id,
      ownerName: client.ownerName,
      businessName: client.businessName,
      token: token,
      companies: companies || null, // <--- Send list so App can pick one
      // companyId: company ? company._id : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};