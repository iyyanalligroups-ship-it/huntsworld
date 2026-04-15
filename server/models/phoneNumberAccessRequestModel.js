const mongoose = require('mongoose');

const phoneNumberAccessRequestSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  seller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  merchant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
  },
  request_date: {
    type: Date,
    default: Date.now,
  },
  approval_date: {
    type: Date,
  },
  expiry_date: {
    type: Date,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index to automatically expire requests after 3 months
phoneNumberAccessRequestSchema.index(
  { expiry_date: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model('PhoneNumberAccessRequest', phoneNumberAccessRequestSchema);
