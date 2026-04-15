const mongoose = require('mongoose');

const EbookPaymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    default: null,
    index: true,
  },
  upgraded_from_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EbookPayment',
    default: null,
  },

  // Cities user is buying extra (beyond plan quota)
  extra_cities: {
    type: [String],
    required: true,
    minlength: 1,
    validate: {
      validator: v => v.every(c => typeof c === 'string' && c.trim().length > 0),
      message: 'All city names must be valid strings'
    }
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },
  gst_percentage: { type: Number, default: 18, min: 0, max: 100 },
  gst_amount:   { type: Number, default: 0 },
  total_amount: { type: Number, required: true, min: 0 },

  razorpay_order_id:    { type: String, required: true, unique: true, index: true },
  razorpay_payment_id:  { type: String, sparse: true },
  razorpay_signature:   { type: String, sparse: true },

  payment_status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'created',
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ['Active', 'Expired', 'Cancelled', 'Pending'],
    default: 'Active',
    required: true,
    index: true
  },

  // Usually same as current subscription end date
  access_expires_at: { type: Date, default: null, index: true },

  purchased_at: Date,

}, { timestamps: true });

// Auto-calculate totals
EbookPaymentSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('gst_percentage')) {
    this.gst_amount = Math.round((this.amount * this.gst_percentage) / 100);
    this.total_amount = Math.round(this.amount + this.gst_amount);
  }
  next();
});

module.exports = mongoose.model('EbookPayment', EbookPaymentSchema);
