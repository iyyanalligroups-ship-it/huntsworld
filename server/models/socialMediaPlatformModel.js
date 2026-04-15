const mongoose = require("mongoose");

const platformSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    iconName: {
      type: String,
      // e.g. "instagram", "facebook", "twitter", "youtube"
      // Will be used to dynamically import from lucide-react
      default: "link", // fallback
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 999,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Platform", platformSchema);
