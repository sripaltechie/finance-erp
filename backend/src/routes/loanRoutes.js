const express = require('express');
const router = express.Router();
const { verifyClient } = require('../middleware/authMiddleware');
const { createLoan, getLoans } = require('../controllers/loanController');

router.use(verifyClient);

router.post('/', createLoan);
router.get('/', getLoans);

module.exports = router;