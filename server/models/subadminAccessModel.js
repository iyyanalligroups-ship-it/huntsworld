const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  permissions: [{
    page: { type: String, required: true },
    actions: [{ type: String, enum: ['edit', 'delete'], required: true }],
  }],
  approved_permissions: [{
    page: { type: String, required: true },
    actions: [{ type: String, enum: ['edit', 'delete'], required: true }],
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  request_date: {
    type: Date,
    default: Date.now,
  },
  approval_date: {
    type: Date,
  },
  rejection_date: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);