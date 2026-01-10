const express = require('express');
const router = express.Router();
const { verifyClient } = require('../middleware/authMiddleware'); // You need to build this
const { createCompany, getMyCompanies } = require('../controllers/companyController');

// All routes require the Client to be logged in
router.use(verifyClient);

router.post('/', createCompany);
router.get('/', getMyCompanies);

module.exports = router;