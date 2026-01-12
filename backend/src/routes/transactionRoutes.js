const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/authMiddleware');
const { createTransaction, getTransactions } = require('../controllers/transactionController');

router.use(verifyUser); // Staff access required

router.post('/', createTransaction); // The "Save" button in App
router.get('/', getTransactions);    // The "History" tab

module.exports = router;