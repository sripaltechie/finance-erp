const express = require('express');
const router = express.Router();
const { verifyClient } = require('../middleware/authMiddleware'); // You need to build this
const { createCompany, getMyCompanies, getPaymentModes, addPaymentMode,
     updatePaymentMode, deletePaymentMode  } = require('../controllers/companyController');

// All routes require the Client to be logged in
router.use(verifyClient);

router.post('/create', createCompany);
// @route   GET /api/companies
// @desc    Get all branches owned by the logged-in user
// @access  Private
router.get('/', getMyCompanies);

// @route   POST /api/companies/:id/payment-modes
// @desc    Add a new Wallet/Bank Account to a specific branch
// @access  Private
// router.post('/:id/payment-modes', verifyClient, addPaymentMode);
// Payment Mode Operations
router.get('/:companyId/payment-modes', getPaymentModes);
router.post('/:companyId/payment-modes',verifyClient, addPaymentMode);
router.put('/:companyId/payment-modes/:modeId',verifyClient, updatePaymentMode);
router.delete('/:companyId/payment-modes/:modeId',verifyClient, deletePaymentMode);

module.exports = router;