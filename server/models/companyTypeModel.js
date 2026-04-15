const mongoose = require("mongoose");

const companyTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true, // optional: store normalized
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }, // for frontend sorting
  },
  { timestamps: true }
);

module.exports = mongoose.models.CompanyType || mongoose.model("CompanyType", companyTypeSchema);
