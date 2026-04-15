const mongoose = require("mongoose");

const StudentPaymentHistorySchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrustSealRequest",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transaction_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    payment_method: {
      type: String,
      enum: ["BANK", "UPI"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    paid_at: {
      type: Date,
      default: Date.now,
    },
    paid_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentPaymentHistory", StudentPaymentHistorySchema);
