const mongoose = require("mongoose");

const SubDealerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    merchant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    company_email: { type: String, required: true },
    company_phone_number: { type: String, required: true },
    company_name: { type: String, required: true },
    gst_number: { type: String, required: true, unique: true },
    pan: { type: String, required: true, unique: true },
    aadhar: { type: String, required: true, unique: true },
    company_type: {
      type: String,
      enum: ["Manufacturer", "Sub-dealer", "Retailer", "Trader"],
      required: true,
    },
    company_logo: { type: String },
    company_images: [String],
    description: { type: String },
    msme_certificate_number: { type: String },
    number_of_employees: { type: Number },
    year_of_establishment: { type: Number },
    verified_status: { type: Boolean, default: false },
    trustshield: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubDealer", SubDealerSchema);
