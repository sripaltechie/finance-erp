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
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Provide email/mobile and password" });
    }

    console.log("sripal",identifier,password);
    const client = await Client.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    });
    console.log("sripal",client);
    if (!client) return res.status(401).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    // Ensure this matches your Model's enum
    if (client.accountStatus !== 'Approved') {
      return res.status(403).json({ message: "Account Pending Approval" });
    }

    // Generate Token
    const token = jwt.sign(
      { id: client._id, role: 'Client' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    // Fetch Companies
    const companies = await Company.find({ clientId: client._id }).select('_id name');

    // SUCCESS RESPONSE
    res.json({
      token, // The interceptor will find this
      user: {
        _id: client._id,
        ownerName: client.ownerName,
        role: 'Client',
        companies: companies || []
      }
    });

  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};