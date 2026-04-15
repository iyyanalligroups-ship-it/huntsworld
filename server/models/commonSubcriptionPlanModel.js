const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "trend points", "digital book"

  category: {
    type: String,
    enum: ['points', 'ads', 'ebook', 'wallet', 'service','gst'], // add as needed
    required: true
  },

  durationType: {
    type: String,
    enum: ['per_day', 'one_time', 'per_point', 'per_month','3_month', 'per_book', 'develop_only','percentage'],
    required: true
  },

  durationValue: { type: Number }, // e.g. 1, 100 (for points, days etc)
  price: { type: Number, required: true }, // e.g. 45, 750
  description: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('CommonSubscriptionPlan', subscriptionPlanSchema);