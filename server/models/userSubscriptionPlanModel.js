
// const mongoose = require('mongoose');

// const razorpaySchema = new mongoose.Schema({
//   user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   subscription_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
//   razorpay_order_id: { type: String, required: true },
//   razorpay_payment_id: { type: String },
//   end_date: { type: Date },
//   razorpay_signature: { type: String },
//   amount: { type: Number, required: true }, // Base amount (excluding GST)
//   gst_percentage: { type: Number }, // Store GST percentage (e.g., 18)
//   gst_amount: { type: Number }, // Store calculated GST amount
//   currency: { type: String, default: 'INR' },
//   receipt: { type: String },
//   status: { type: String, default: 'created' },
//   captured: { type: Boolean, default: false },
//   created_at: { type: Date, default: Date.now },
//   paid_at: { type: Date },

//   // ★★★ NEW: Snapshot of features at purchase time
//   // This prevents issues when plan features change later
//   features_snapshot: [{
//     feature_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'SubscriptionPlanElement',
//     },
//     feature_name: {
//       type: String,
//       required: true, // Copied at purchase time
//     },
//     is_enabled: {
//       type: Boolean,
//       default: false,
//     },
//     value: {
//       type: {
//         type: String,
//         enum: ["DURATION", "NUMBER", "BOOLEAN", "TEXT", "NONE"],
//       },
//       data: mongoose.Schema.Types.Mixed,
//       unit: String,
//     },
//   }],
// }, { timestamps: true });

// module.exports = mongoose.model('UserSubscription', razorpaySchema);
const mongoose = require('mongoose');

// Register models used in cascading delete hooks to prevent MissingSchemaError
require('../models/trustSealRequestModel');

const razorpaySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    subscription_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },

    // 🔒 Locked snapshot of plan details at purchase time
    plan_snapshot: {
      plan_name: { type: String, required: true },
      plan_code: { type: String },
      price: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      duration_value: { type: Number },
      duration_unit: { type: String },
    },

    // ─────────────────────────────────────────────
    // Razorpay identifiers
    // ─────────────────────────────────────────────
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },

    // 🔁 Auto-renew (subscription based)
    razorpay_plan_id: {
      type: String,
      required: function () {
        return this.auto_renew === true;
      },
    },

    razorpay_subscription_id: {
      type: String,
      sparse: true,
    },

    razorpay_subscription_status: {
      type: String,
      enum: [
        'created',
        'authenticated',
        'active',
        'halted',
        'cancelled',
        'completed',
      ],
    },

    // ─────────────────────────────────────────────
    // Amounts (PAISE)
    // ─────────────────────────────────────────────
    amount: { type: Number, required: true }, // base amount
    gst_percentage: { type: Number, required: true },
    gst_amount: { type: Number, required: true },
    total_amount: { type: Number, required: true },

    // ─────────────────────────────────────────────
    // Subscription lifecycle
    // ─────────────────────────────────────────────
    status: {
      type: String,
      default: 'created',
      enum: ['created', 'paid', 'active', 'expired', 'cancelled', 'active_renewal'],
    },

    captured: { type: Boolean, default: false },
    paid_at: { type: Date },

    end_date: { type: Date },

    last_renewed_at: { type: Date },
    next_renewal_at: { type: Date },
apply_latest_plan_on_renewal: {
  type: Boolean,
  default: true
},

    renewal_count: {
      type: Number,
      default: 0,
    },

    renewal_failed_count: {
      type: Number,
      default: 0,
    },

    last_invoice_id: {
      type: String,
    },

    is_upgrade: {
      type: Boolean,
      default: false,
    },

    // Auto-disable when expires
    auto_off: {
      type: Boolean,
      default: true,
      required: true,
    },

    // 🔁 User choice for auto-renew
    auto_renew: {
      type: Boolean,
      default: false,
      required: true,
    },

    // ─────────────────────────────────────────────
    // Feature snapshot (CRITICAL for renewals)
    // ─────────────────────────────────────────────
    features_snapshot: [
      {
        feature_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SubscriptionPlanElement',
        },
        feature_name: {
          type: String,
          required: true,
        },
        feature_code: {
          type: String,
          required: true,
        },
        is_enabled: {
          type: Boolean,
          default: false,
        },
        value: {
          type: {
            type: String,
            enum: ['DURATION', 'NUMBER', 'BOOLEAN', 'TEXT', 'NONE'],
          },
          data: mongoose.Schema.Types.Mixed,
          unit: String,
        },
      },
    ],
  },
  { timestamps: true }
);
// Middleware to handle cleanup when a subscription is deleted
razorpaySchema.post(['findOneAndDelete', 'deleteOne', 'remove'], async function (doc) {
  if (doc) {
    const TrustSealRequest = mongoose.model('TrustSealRequest');
    try {
      // Deletes the associated trust seal when the subscription is removed
      await TrustSealRequest.deleteMany({ subscription_id: doc._id });
    } catch (err) {
      console.error(`Error in cleanup: ${err.message}`);
    }
  }
});
module.exports = mongoose.model('UserSubscription', razorpaySchema);
