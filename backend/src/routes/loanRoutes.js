const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/authMiddleware');
const { createAdvancedLoan, getLoanDetails,applyPenalty,addRepayment } = require('../controllers/loanController');

router.use(verifyUser);

router.post('/create-advanced', createAdvancedLoan);
// router.get('/', getLoans);
router.get('/:id', getLoanDetails);
router.post('/:id/penalty', verifyUser, applyPenalty);
router.post('/:id/repayment', verifyUser, addRepayment);

module.exports = router;