const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/authMiddleware'); // Used for Branch Managers
const {  verifyClient } = require('../middleware/authMiddleware'); // Used for Branch Managers
const { addCapital, getCapitalStats } = require('../controllers/capitalController');
const { getDashboardStats } = require('../controllers/capitalController');

/* NOTE: These routes use 'verifyUser' because the controller expects 
  'req.companyId' which is set by the Staff/Manager login.
  
  If you want the Client (Owner) to access this, we would need 
  a separate route like router.get('/:companyId/stats', verifyClient, ...)
*/

// Protect all routes (Only logged-in Managers/Staff can access)
router.use(verifyUser);

// @route   POST /api/capital
// @desc    Add Cash Injection or Record Withdrawal
router.post('/', addCapital);

// @route   GET /api/capital/stats
// @desc    Get Current Cash & Bank Balance for the logged-in user's branch
// router.get('/stats', getCapitalStats);
console.log("Protect Middleware:", verifyClient);
console.log("Controller:", getDashboardStats);
router.get('/dashboard-stats', verifyClient, getDashboardStats); // 🟢 NEW ROUTE

module.exports = router;