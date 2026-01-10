const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load Config
dotenv.config();

// Initialize App
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allows mobile devices and web browsers to connect
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance-erp");
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes
const customerRoutes = require('./routes/customerRoutes');
const capitalRoutes = require('./routes/capitalRoutes'); // You need to create this similar to customerRoutes

// ... middlewares ...

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/capital', capitalRoutes); // New Capital Module

// ... server listen ...

// Base Route
app.get('/', (req, res) => {
    res.send('Finance & Lending API is running...');
});


app.get('/api/admin-check', async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            res.json({ name: admin.name, role: admin.role });
        } else {
            res.status(404).json({ message: "No admin found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});


// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});