const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/authMiddleware');
const { createLoan, getLoans } = require('../controllers/loanController');

router.use(verifyUser);

router.post('/', createLoan);
router.get('/', getLoans);

module.exports = router;