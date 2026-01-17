const express = require('express');
const router = express.Router();
const { verifyClient } = require('../middleware/authMiddleware');
const { createStaff, getStaffByCompany,getStaffById, updateStaff, deleteStaff } = require('../controllers/userController');

router.use(verifyClient);

// Logic Check:
// app.js likely mounts this at '/api/staff'
// So POST /api/staff/ maps to createStaff (Correct)
// And GET /api/staff/:companyId maps to getStaffByCompany (Correct)

router.post('/', createStaff);
router.get('/:companyId', getStaffByCompany); // List All
router.get('/detail/:id', getStaffById);      // 🟢 Get Single (New)
router.put('/:id', updateStaff);              // Update
router.delete('/:id', deleteStaff);           // Delete


module.exports = router;