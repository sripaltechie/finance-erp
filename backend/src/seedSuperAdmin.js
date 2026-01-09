// Run this file manually: "node src/seedSuperAdmin.js"
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // You might need a User model for SuperAdmin or just use hardcoded credentials in .env

// SIMPLE APPROACH:
// We don't save Super Admin in DB. We verify strictly against .env variables.
// So no seeding is required if you use the middleware I wrote above.
// Just set SUPER_ADMIN_EMAIL=your@email.com in your .env file.