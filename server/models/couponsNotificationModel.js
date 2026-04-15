const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  recipient: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  redeemPointsId: { type: mongoose.Schema.Types.ObjectId, ref: 'RedeemPoints', required: true },
  amount_sent: { type: Boolean, default: false },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
});

// ✅ Prevent OverwriteModelError during development
module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
