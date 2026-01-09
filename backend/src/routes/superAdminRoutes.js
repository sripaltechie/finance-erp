const express = require('express');
const router = express.Router();
const verifySuperAdmin = require('../middleware/superAdminMiddleware');
const { getAllClients, approveClient } = require('../controllers/superAdminController');

// All routes here require Super Admin Token
router.use(verifySuperAdmin);

router.get('/clients', getAllClients);
router.put('/clients/:id/approve', approveClient);

module.exports = router;