const mongoose = require("mongoose");

const UserActiveFeatureSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  user_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserSubscription",
    required: true,
  },
  feature_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlanElement",
    required: true
  },
  feature_code: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },

   /* =========================
     📦 PRODUCT LIMIT FEATURE
  ========================= */
  product_limit: {
    is_unlimited: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }
  },

  /* =========================
     🖼️ PRODUCT PHOTOS LIMIT
  ========================= */
  product_photo_limit: {
    is_unlimited: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }
  },
/* =========================
     🎥 COMPANY VIDEO FEATURE
  ========================= */
  company_video_duration: {
    total_seconds: { type: Number, default: 0 },
    original_value: { type: Number },
    original_unit: {
      type: String,
      enum: ["seconds", "minutes", "hours"]
    }
  },

  /* =========================
     🎥 PRODUCT VIDEO FEATURE
  ========================= */
  product_video_duration: {
    total_seconds: { type: Number, default: 0 },
    original_value: { type: Number },
    original_unit: {
      type: String,
      enum: ["seconds", "minutes", "hours"]
    }
  },

  activated_at: { type: Date, required: true, default: Date.now },
  expires_at: { type: Date, default: null }, // null = follows subscription

  status: {
    type: String,
    enum: ["active", "expired", "upgraded_away"],
    default: "active",
    index: true
  },

  // ── Only relevant for DIGITAL_BOOK feature ───────────────────────────────
  // How many cities user can still choose for free from plan
  initial_plan_city_count:     { type: Number, default: 0 },
  remaining_plan_city_count:   { type: Number, default: 0 },
  selected_plan_cities: {
    type: [String],            // normalized city names
    default: []
  }

}, { timestamps: true });

// Important indexes
UserActiveFeatureSchema.index({ user_id: 1, feature_code: 1, status: 1 });
UserActiveFeatureSchema.index({ user_subscription_id: 1 });

module.exports = mongoose.model("UserActiveFeature", UserActiveFeatureSchema);
