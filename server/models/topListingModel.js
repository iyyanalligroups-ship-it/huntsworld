const mongoose = require('mongoose');

const TopListingPlanSchema = new mongoose.Schema({
  plan_name: {
    type: String,
    required: true,
    trim: true,
  },
  plan_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    // Example: TOPLIST_BRONZE_30D, TOPLIST_GOLD_90D
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  duration_days: {
    type: Number,
    required: true,
    min: 1,
    // How many days the top listing is active (30, 90, 180, etc.)
  },
  description: {
    type: String,
    trim: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  sort_order: {
    type: Number,
    default: 0,
    // Useful for displaying plans in specific order on frontend
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('TopListingPlan', TopListingPlanSchema);
