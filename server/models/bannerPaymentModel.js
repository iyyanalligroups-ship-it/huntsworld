// const mongoose = require('mongoose');

// const BannerPaymentSchema = new mongoose.Schema({
//   user_id: {
//     type: mongoose.Schema.Types.ObjectId, // assuming relation to users
//     required: true,
//     unique: true
//   },
//   days: {
//     type: Number
//   },
//   amount: {
//     type: Number
//   },
//   payment_status: {
//     type: String
//   },
//   transaction_id: {
//     type: String
//   },
//   status: {
//     type: String,
//     enum: ['Active', 'Expired', 'Cancelled'],
//     default: 'Active',
//     required: true
//   }
// }, {
// timestamps:true
// });
// Updated BannerPayment Model



const mongoose = require("mongoose");

const BannerPaymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSubscription",
      required: true,
    },

    /* -----------------------------------------
       PURCHASE DETAILS
    ----------------------------------------- */

    days: {
      type: Number,
      required: true,
      min: [1, "Days must be at least 1"],
    },

    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
      comment: "Amount charged for THIS transaction only",
    },

    total_amount_paid: {
      type: Number,
      default: 0,
      comment: "Cumulative total amount paid across banner lifecycle",
    },

    purchase_type: {
      type: String,
      enum: ["initial", "upgrade"],
      default: "initial",
    },

    previous_banner_payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BannerPayment",
      default: null,
    },

    /* -----------------------------------------
       GST DETAILS
    ----------------------------------------- */

    gst_percentage: {
      type: Number,
      default: 0,
    },

    gst_amount: {
      type: Number,
      default: 0,
    },

    /* -----------------------------------------
       RAZORPAY DETAILS
    ----------------------------------------- */

    razorpay_order_id: {
      type: String,
      required: true,
      index: true,
    },

    razorpay_payment_id: {
      type: String,
    },

    razorpay_signature: {
      type: String,
    },

    payment_status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      required: true,
    },

    /* -----------------------------------------
       BANNER STATUS
    ----------------------------------------- */

    status: {
      type: String,
      enum: ["Active", "Expired", "Cancelled"],
      default: "Active",
      required: true,
    },

    end_date: {
      type: Date,
    },

    /* -----------------------------------------
       TIMESTAMPS
    ----------------------------------------- */

    created_at: {
      type: Date,
      default: Date.now,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.BannerPayment ||
  mongoose.model("BannerPayment", BannerPaymentSchema);
