const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

// @desc    Add a new Staff Member (Collection Boy / Manager)
// @route   POST /api/staff
exports.createStaff = async (req, res) => {
  try {
    const { name, mobile, password, role, companyId } = req.body;
    const clientId = req.user.id; // Logged in Owner

    // 1. Security Check: Does this Company belong to this Client?
    const company = await Company.findOne({ _id: companyId, clientId });
    if (!company) {
      return res.status(403).json({ message: "Access Denied. You do not own this branch." });
    }

    // 2. Check Duplicate Mobile
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "Mobile number already registered." });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create Staff
    const newStaff = await User.create({
      name,
      mobile,
      password: hashedPassword,
      role: role || 'Collection_Boy',
      companyId
    });

    res.status(201).json({ message: "Staff created successfully", staffId: newStaff._id });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Staff for a specific Company
// @route   GET /api/staff/:companyId
exports.getStaffByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const clientId = req.user.id;

    // Security Check
    const company = await Company.findOne({ _id: companyId, clientId });
    if (!company) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const staff = await User.find({ companyId }).select('-password').sort({ createdAt: -1 });
    res.json(staff);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};