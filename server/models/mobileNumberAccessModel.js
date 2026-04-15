const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "denied", "expired"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  deniedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("MobileNumberAccess", permissionSchema);
