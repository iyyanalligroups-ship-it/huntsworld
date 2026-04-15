// models/ComplaintNotification.js
const mongoose = require("mongoose");

const complaintNotificationSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ComplaintNotification", complaintNotificationSchema);