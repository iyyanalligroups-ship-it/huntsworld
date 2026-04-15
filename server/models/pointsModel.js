const mongoose = require("mongoose");

const PointSchema = new mongoose.Schema(
  {
    point_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    point_count: {
      type: Number,
      required: true,
      default: 0,
    },
    point_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    // 🆕 Add duration field (Number)
    time_duration: {
      type: Number,
      required: true,
      default: 0, // in units of time_unit
    },
    // 🆕 Add unit field (String with enum)
    time_unit: {
      type: String,
      required: true,
      enum: ["seconds", "minutes", "hours","month","year"],
      default: "minutes",
    },
    // NEW FIELD: Amount in INR calculated from percentage

  },
  { timestamps: true }
);

module.exports = mongoose.model("Point", PointSchema);
