const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const redeemPointsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coupon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CouponName',
  },
  redeem_point: {
    type: Number,
    required: true,
  },
  coupon_code: {
    type: String,
    required: true,
    unique: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',   // ← new request starts as pending
  },
  letter_image_url: {
    type: String,
    required: false,
  },
  amount_in_inr: {
    type: Number,
    required: true,
  },
  redemption_type: {
    type: String,
    enum: ['cash', 'coupon'],
    required: true,
    default: 'cash'
  },
  markAsRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Pre-save hook to generate custom coupon_code
redeemPointsSchema.pre('validate', function (next) {
  if (!this.coupon_code) {
    this.coupon_code = `TRAN-${uuidv4()}`;
  }
  next();
});

module.exports = mongoose.model('RedeemPoints', redeemPointsSchema);
