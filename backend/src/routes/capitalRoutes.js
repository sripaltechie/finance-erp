const express = require('express');
const router = express.Router();
// Fixed Imports: No duplicates
const { verifyUser, verifyClient } = require('../middleware/authMiddleware');
const { addCapital, getCapitalStats, getDashboardStats } = require('../controllers/capitalController');

// Protect all routes (Only logged-in Managers/Staff can access)
router.use(verifyUser);
// 1. Routes for Staff / Branch Managers
router.post('/', verifyUser, addCapital);
// router.get('/stats', verifyUser, getCapitalStats); // Uncomment if needed for staff view

// 2. Routes for Client Owner (Dashboard)
// This requires the Client Token, not the Staff Token
router.get('/dashboard-stats', verifyClient, getDashboardStats); 

module.exports = router;

// console.log("Protect Middleware:", verifyClient);
// console.log("Controller:", getDashboardStats);


/* NOTE: These routes use 'verifyUser' because the controller expects 
  'req.companyId' which is set by the Staff/Manager login.
  
  If you want the Client (Owner) to access this, we would need 
  a separate route like router.get('/:companyId/stats', verifyClient, ...)
*/