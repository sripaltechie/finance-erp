const express = require('express');
const router = express.Router();
const { verifyClient } = require('../middleware/authMiddleware');
const { createStaff, getStaffByCompany } = require('../controllers/userController');

router.use(verifyClient);

router.post('/', createStaff);
router.get('/:companyId', getStaffByCompany);

module.exports = router;