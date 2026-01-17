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

    res.status(201).json({ message: "Staff created successfully", staff: newStaff });

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
    if (!company) return res.status(403).json({ message: "Access Denied" });

    const staff = await User.find({ companyId }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get Single Staff by ID
// @route   GET /api/staff/detail/:id
exports.getStaffById = async (req, res) => {

  try {
    const { id } = req.params;
    
    // Find User
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: "Staff not found" });

    // Verify Owner Access
    // We check if the logged-in Client owns the company this staff belongs to
    const company = await Company.findOne({ _id: user.companyId, clientId: req.user.id });
    if(!company) return res.status(403).json({ message: "Unauthorized to view this staff" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Update Staff Details (Name, Role, Active Status)
// @route   PUT /api/staff/:id
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, isActive, password } = req.body;
        
        // Find user first to check ownership
        const userToUpdate = await User.findById(id);
        if(!userToUpdate) return res.status(404).json({ message: "Staff not found" });

        // Verify Owner owns the company this staff belongs to
        const company = await Company.findOne({ _id: userToUpdate.companyId, clientId: req.user.id });
        if(!company) return res.status(403).json({ message: "Unauthorized to edit this staff" });

        // Updates
        if(name) userToUpdate.name = name;
        if(role) userToUpdate.role = role;
        if(typeof isActive !== 'undefined') userToUpdate.isActive = isActive;
        
        // Password Reset
        if(password) {
             const salt = await bcrypt.genSalt(10);
             userToUpdate.password = await bcrypt.hash(password, salt);
        }

        await userToUpdate.save();
        res.json({ message: "Staff updated", staff: userToUpdate });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Staff
// @route   DELETE /api/staff/:id
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        
        const userToDelete = await User.findById(id);
        if(!userToDelete) return res.status(404).json({ message: "Staff not found" });

        // Verify Owner
        const company = await Company.findOne({ _id: userToDelete.companyId, clientId: req.user.id });
        if(!company) return res.status(403).json({ message: "Unauthorized" });

        await User.findByIdAndDelete(id);
        res.json({ message: "Staff deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};