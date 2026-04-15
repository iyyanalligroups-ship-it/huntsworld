const mongoose = require("mongoose");

// models/GrocerySellerRequirement.js
const GrocerySellerRequirementSchema = new mongoose.Schema({
  requirement_type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  product_name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit_of_measurement: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['product', 'service'],
    required: true,
    default: 'product'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplier_preference: {
    type: String,
    enum: ['All India', 'Specific States'],
    required: true,
    default: 'All India'
  },
  selected_states: {
    type: [String],
    default: []
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  sub_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
  },
  is_unmatched: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('GrocerySellerRequirement', GrocerySellerRequirementSchema);