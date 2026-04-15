// models/PhoneVisibility.js
const mongoose = require("mongoose");

const PhoneVisibilitySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    is_phone_number_view: {
      type: Boolean,
      default: true, // by default, phone is visible
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhoneVisibility", PhoneVisibilitySchema);
