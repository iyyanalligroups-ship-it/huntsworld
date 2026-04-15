// models/SubscriptionExtensionLog.js
const mongoose = require('mongoose');

const subscriptionExtensionLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  user_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: true,
  },
  user_active_feature_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserActiveFeature',
    required: true,
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assuming admins are also in User collection
    required: true,
  },
  old_expires_at: {
    type: Date,
    required: true,
  },
  new_expires_at: {
    type: Date,
    required: true,
  },
  days_extended: {
    type: Number,
    required: true,
    min: 1,
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: 'Extended by admin',
  },
  extended_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SubscriptionExtensionLog', subscriptionExtensionLogSchema);
