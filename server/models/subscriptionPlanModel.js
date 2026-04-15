// const mongoose = require("mongoose");

// const subscriptionPlanSchema = mongoose.Schema(
//   {
//     plan_code: {
//       type: String,
//       required: true,
//       unique: true, // prevent duplicates at DB level
//       uppercase: true, // optional: always store in uppercase
//       trim: true
//     },
//     plan_name: {
//       type: String,
//       required: true,
//       uppercase: true, // optional: always store in uppercase
//     },
//     price: {
//       type: Number,
//       required: true,
//     },
//     description: {
//       type: String,
//     },
//      strike_amount: {           // NEW FIELD
//       type: Number,
//       default: null,           // null means no strikethrough price
//       min: [0, "Strike amount cannot be negative"]
//     },
//     status: {
//       type: String,
//       enum: ["Active", "Inactive"],
//       default: "Active",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);



const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    plan_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    plan_name: {
      type: String,
      required: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: true,
    },
    strike_amount: {
      type: Number,
      default: null,
      min: 0,
    },
    razorpay_plan_id: {
      type: String,
      trim: true,
      default: null,
    },
    razorpay_plan_id_test: {
      type: String,
      trim: true,
      default: null,
    },
    razorpay_plan_id_live: {
      type: String,
      trim: true,
      default: null,
    },
    strike_amount: {           // NEW FIELD
      type: Number,
      default: null,           // null means no strikethrough price
      min: [0, "Strike amount cannot be negative"]
    },
        business_type: {
      type: String,
      enum: ["merchant", "grocery_seller", "free"], // restrict to these values
      required: true,           // or false — depending on your needs
      lowercase: true,          // optional but recommended for consistency
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
