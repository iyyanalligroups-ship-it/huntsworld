
// const mongoose = require('mongoose');

// const SubscriptionPlanElementMappingSchema = new mongoose.Schema({
//   subscription_plan_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'SubscriptionPlan'
//   },
//   element_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'SubscriptionPlanElement'
//   },
//   value: {
//     type: String,
//     maxlength: 255,
//     default: null
//   },
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('SubscriptionPlanElementMapping', SubscriptionPlanElementMappingSchema);

const mongoose = require("mongoose");

const SubscriptionPlanFeatureSchema = new mongoose.Schema(
  {
    subscription_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    feature_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlanElement",
      required: true,
    },

    is_enabled: {
      type: Boolean,
      default: false,
    },

    // ✅ UNIVERSAL VALUE STRUCTURE
    value: {
      type: {
        type: String,
        enum: ["DURATION", "NUMBER", "BOOLEAN", "TEXT"],
        required: function () {
          return this.is_enabled === true;
        },
      },

      data: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      unit: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// 🚀 Prevent duplicate feature per plan
SubscriptionPlanFeatureSchema.index(
  { subscription_plan_id: 1, feature_id: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "SubscriptionPlanElementMapping",
  SubscriptionPlanFeatureSchema
);
