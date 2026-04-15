const mongoose = require("mongoose");

const PostByRequirementSchema = new mongoose.Schema(
  {
    product_or_service: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit_of_measurement: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["product", "service"],
      required: true,
      default: "product",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplier_preference: {
      type: String,
      enum: ["All India", "Specific States"],
      required: true,
    },
    selected_states: {
      type: [String],
      default: [],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    super_sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperSubCategory",
    },
    deep_sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeepSubCategory",
    },
    is_unmatched: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Export the model
module.exports = mongoose.model("PostByRequirement", PostByRequirementSchema);
