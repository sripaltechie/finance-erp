const Client = require('../models/Client');
const bcrypt = require('bcryptjs');

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