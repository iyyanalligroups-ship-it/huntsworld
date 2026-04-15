

// const mongoose = require('mongoose');

// const SubscriptionPlanElementSchema = new mongoose.Schema({
//   element_name: {
//     type: String,
//     required: true,
//     maxlength: 255
//   }
// }, {
//   timestamps: true // to match Sequelize config
// });

// module.exports = mongoose.model('SubscriptionPlanElement', SubscriptionPlanElementSchema);
const mongoose = require("mongoose");

const SubscriptionPlanElementSchema = new mongoose.Schema(
  {
    feature_name: {
      type: String,
      required: [true, "Feature name is required"],
      trim: true,
      maxlength: 100,
    },

    feature_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * 🔹 Auto-generate feature_code from feature_name
 * Runs on create & update
 */
SubscriptionPlanElementSchema.pre("validate", function (next) {
  if (this.feature_name) {
    this.feature_code = this.feature_name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "") // remove special chars
      .replace(/\s+/g, "_");       // spaces → _
  }
  next();
});

module.exports = mongoose.model(
  "SubscriptionPlanElement",
  SubscriptionPlanElementSchema
);
