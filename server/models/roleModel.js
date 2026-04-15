const mongoose = require("mongoose");
const Counter = require("../models/counterModel"); // ✅ IMPORT ONLY

const roleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      enum: [
        "USER",
        "MERCHANT",
        "SERVICE_PROVIDER",
        "SUB_DEALER",
        "GROCERY_SELLER",
        "STUDENT",
        "ADMIN",
        "SUB_ADMIN",
      ],
    },
  },
  { timestamps: true }
);

/* 🔥 AUTO-INCREMENT ROLE ID */
roleSchema.pre("save", async function (next) {
  try {
    if (!this.id) {
      const counter = await Counter.findOneAndUpdate(
        { _id: "role_id" },          // separate counter key
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.id = counter.seq;
    }
    next();
  } catch (err) {
    next(err);
  }
});

/* ✅ SAFE EXPORT */
module.exports =
  mongoose.models.Role || mongoose.model("Role", roleSchema);
