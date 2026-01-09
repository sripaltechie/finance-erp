const Client = require('../models/Client');

// @desc    Get All Clients (Filter by Status)
// @route   GET /api/super-admin/clients?status=Pending
exports.getAllClients = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { accountStatus: status } : {};
    
    const clients = await Client.find(query).select('-password').sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a Client (Manual Payment Confirmation)
// @route   PUT /api/super-admin/clients/:id/approve
exports.approveClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, durationInMonths } = req.body; // e.g., "Pro", 12

    // Calculate Expiry Date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (durationInMonths || 12));

    const client = await Client.findByIdAndUpdate(id, {
      accountStatus: 'Approved',
      subscriptionPlan: plan || 'Basic',
      validTill: expiryDate
    }, { new: true });

    if (!client) return res.status(404).json({ message: "Client not found" });

    // Optional: Send Email Notification here saying "Account Approved!"

    res.json({ message: `Client Approved for ${durationInMonths} months`, client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};