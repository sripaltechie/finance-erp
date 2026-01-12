const express = require('express');
const router = express.Router();
const { registerClient, loginClient } = require('../controllers/clientAuthController');

router.post('/client/register', registerClient);
router.post('/client/login', loginClient); // <--- Add this

module.exports = router;