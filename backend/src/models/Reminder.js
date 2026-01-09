// File: backend/src/models/Reminder.js
const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Collection Boy

  promisedDate: { type: Date, required: true },
  note: { type: String },
  voiceNoteUrl: { type: String }, // S3 Link

  postponeCount: { type: Number, default: 0 }, // Logic for "High Risk"
  status: { type: String, enum: ['Pending', 'Resolved', 'Dismissed'], default: 'Pending' }

}, { timestamps: true });

module.exports = mongoose.model('Reminder', ReminderSchema);