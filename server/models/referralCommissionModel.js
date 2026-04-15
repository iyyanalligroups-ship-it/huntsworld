const mongoose = require("mongoose");

const referralCommissionSchema = new mongoose.Schema({
  referrer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referred_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSubscription', required: true },
  plan_amount: { type: Number, required: true }, // Amount paid by the referred person
  commission_percentage: { type: Number, default: 10 }, // Configurable %
  commission_amount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["EARNED", "CLAIM_REQUESTED", "PAID", "REJECTED"],
    default: "EARNED"
  },
  razorpay_payment_id: { type: String, unique: true, sparse: true },
  claim_request_date: { type: Date },
  paid_at: { type: Date },
  admin_remarks: { type: String },
  markAsRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("ReferralCommission", referralCommissionSchema);
