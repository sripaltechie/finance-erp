const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const User = require('../models/User');

// Helper to extract and verify token
const decodeToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const token = req.headers.authorization.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET);
  }
  return null;
};

/* 1. verifyClient
  ------------------------------------------------
  Used for: Owner Dashboard (Web)
  Checks: 'Client' Collection
  Access: Creating Companies, Adding Staff, Viewing Capital
*/
const verifyClient = async (req, res, next) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Check if this ID belongs to a CLIENT (Owner)
    const client = await Client.findById(decoded.id).select('-password');
    
    if (!client) {
      return res.status(401).json({ message: 'Not authorized as Client Owner' });
    }

    if (client.accountStatus !== 'Approved') {
      return res.status(403).json({ message: 'Account is not Approved yet.' });
    }

    // Attach Client to Request
    req.user = client; 
    // We don't attach companyId here because a Client can own MANY companies.
    // They will send companyId in the request body/params.
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/* 2. verifyUser (or verifyStaff)
  ------------------------------------------------
  Used for: Collection App (Android) & Branch Manager (Web)
  Checks: 'User' Collection
  Access: Creating Loans, Collecting Money, Viewing Customers
*/
const verifyUser = async (req, res, next) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // 🟢 Redirect logic: If the role is Client, hand off to verifyClient
    if (decoded.role === 'Client') {
      console.log("going to check client");
      return verifyClient(req, res, next);
    }

    // Check if this ID belongs to a STAFF member
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Not authorized as Staff' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'User account is deactivated' });
    }

    // Attach User AND their Company Context
    req.user = user;
    req.companyId = user.companyId; // Crucial for SaaS Isolation
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Pseudo-code concept
const verifyCompany = (req, res, next) => {
    // 1. Decrypt Token
    const user = decodeToken(req.headers.authorization);
    
    // 2. Attach Company ID to the Request Object
    req.user = user;
    req.companyId = user.companyId; 
    
    next();
};

const can = (permission) => {
    return (req, res, next) => {
        if (req.user.permissions.includes(permission)) next();
        else res.status(403).json({ message: "No Permission" });
    }
}
// Usage: router.delete('/:id', verifyUser, can('DELETE_CUSTOMER'), deleteCustomer);

module.exports = { verifyClient, verifyUser };