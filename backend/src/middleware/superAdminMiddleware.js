const jwt = require('jsonwebtoken');

const verifySuperAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is the Hardcoded Super Admin Email (Simple & Secure for owner)
    if (decoded.email !== process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access Denied. Super Admin only." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = verifySuperAdmin;