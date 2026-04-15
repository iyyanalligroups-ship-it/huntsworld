// models/distributorRequest.model.js
const mongoose = require('mongoose');

const distributorRequestSchema = new mongoose.Schema({
  manufacturer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  child_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, // Admin, Manufacturer, or Child
  partnership_type: {
    type: String,
    enum: ['distributor', 'supplier'],
    required: true,
    default: 'distributor'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  isReadByRecipient: {
    type: Boolean,
    default: false
  },
  message: { type: String }
}, { timestamps: true });

// Prevent duplicate pending/accepted requests between same two parties
distributorRequestSchema.index({ manufacturer_id: 1, child_id: 1 }, { unique: true });

module.exports = mongoose.model('DistributorRequest', distributorRequestSchema);
