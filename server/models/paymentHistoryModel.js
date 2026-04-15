// models/paymentHistory.model.js
const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 🔥 WHAT THIS PAYMENT IS FOR
    payment_type: {
      type: String,
      enum: [
        'subscription',
        'banner',
        'trust_seal',
        'e_book',
        'trending_point',
        'top_listing',
        'trending_point_free',
        'other'
      ],
      required: true,
    },

    /* ===============================
       OPTIONAL ENTITY REFERENCES
       (used based on payment_type)
    =============================== */

    subscription_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null,
    },

    user_subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserSubscription',
      default: null,
    },

    banner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Banner',
      default: null,
    },

    trust_seal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustSealRequest',
      default: null,
    },

    ebook_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EbookPayment',
      default: null,
    },

    trending_point_payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrendingPointsPayment',
      default: null,
    },

    top_listing_payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TopListingPayment',
      default: null,
    },

    /* ===============================
       RAZORPAY DETAILS
    =============================== */

    razorpay_order_id: {
      type: String,
      required: false,
      sparse: true
    },

    razorpay_subscription_id: {
      type: String,
      default: null,
    },

    razorpay_payment_id: {
      type: String,
      default: null,
    },

    razorpay_signature: {
      type: String,
      default: null,
    },

    /* ===============================
       AMOUNT DETAILS (PAISE)
    =============================== */

    amount: {
      type: Number,
      required: true, // base amount
    },

    gst_percentage: {
      type: Number,
      default: 0,
    },

    gst_amount: {
      type: Number,
      default: 0,
    },

    total_amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: 'INR',
    },

    receipt: {
      type: String,
      default: null,
    },

    /* ===============================
       STATUS & METADATA
    =============================== */

    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'created',
    },

    captured: {
      type: Boolean,
      default: false,
    },

    paid_at: {
      type: Date,
      default: null,
    },

    refunded_at: {
      type: Date,
      default: null,
    },

    payment_method: {
      type: String,
      default: null, // UPI / CARD / NETBANKING
    },

    notes: {
      type: String,
      default: null,
    },

    is_manual_entry: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
