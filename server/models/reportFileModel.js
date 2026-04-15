// models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // ✅ WHO REPORTED
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
  
    },

    // ✅ WHO IS BEING REPORTED
    reported_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",

    },

    // OPTIONAL: chat context (keep if needed)
    sender_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    attachments: [
      {
        type: String,
        validate: {
          validator: (v) =>
            /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|mp3|wav|ogg|aac)(\?.*)?$/i.test(
              v
            ),
          message: "Invalid attachment URL",
        },
      },
    ],

    // SAME STATUS FLOW AS HELP DESK
    status: {
      type: String,
      enum: ["pending", "picked", "closed"],
      default: "pending",
    },

    picked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    is_blocked: { type: Boolean, default: false },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: Date,
  },
  { timestamps: true }
);

reportSchema.index(
  { reported_by: 1, reported_user_id: 1, createdAt: -1 }
);

module.exports = mongoose.model("Report", reportSchema);
