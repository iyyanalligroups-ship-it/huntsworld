const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String, required: true },
  password: { type: String },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  referral_code: { type: String },
  referred_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email_otp: { type: String },
  number_otp: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour
}, { timestamps: true });

// Ensure we don't have multiple pending registrations for the same identifiers
pendingUserSchema.index({ email: 1 });
pendingUserSchema.index({ phone: 1 });

module.exports = mongoose.models.PendingUser || mongoose.model("PendingUser", pendingUserSchema);
