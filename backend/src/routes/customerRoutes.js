const express = require('express');
const router = express.Router();
const { verifyClient } = require('../middleware/authMiddleware'); // Your Auth Guard
const { 
    createCustomer, 
    getCustomers, 
    getCustomerById, 
    updateCustomer,
    checkConflict 
} = require('../controllers/customerController'); // The file you provided

// Protect all routes (Only logged in staff/admin can access)
router.use(verifyClient);

// 1. List & Create
router.get('/', getCustomers);
router.post('/', createCustomer);

// 2. Conflict Checks (Call this BEFORE creating)
router.post('/check-conflict', checkConflict);

// 3. Single Customer Operations (View / Update / Assign Collection Boy)
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

module.exports = router;