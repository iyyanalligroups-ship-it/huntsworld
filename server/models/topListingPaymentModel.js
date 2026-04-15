const mongoose = require('mongoose');

const TopListingPaymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: true,
  },
  days: {
    type: Number,
    required: true,
    min: 1,
  },
  amount: {
    type: Number,
    required: true,
  },
  gst_percentage: {
    type: Number,
  },
  gst_amount: {
    type: Number,
  },
  razorpay_order_id: {
    type: String,
    required: true,
  },
  razorpay_payment_id: {
    type: String,
    default: null,
  },
  razorpay_signature: {
    type: String,
    default: null,
  },
  payment_status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created',
  },
  status: {
    type: String,
    enum: ['Active', 'Cancelled', 'Expired'],
    default: 'Active',
  },
  starts_at: {
    type: Date,
    default: null,
  },
  expires_at: {
    type: Date,
    default: null,
  },
  payment_history_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentHistory',
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  remaining_days: {
  type: Number,
  default: 0,
},

}, {
  timestamps: true,
});

module.exports = mongoose.model('TopListingPayment', TopListingPaymentSchema);
