const mongoose = require("mongoose");

const PaymentAccountSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    payment_method: {
      type: String,
      enum: ["BANK", "UPI_ID", "UPI_NUMBER"],
      required: true,
    },

    // 🔹 Bank Details
    bank_details: {
      account_holder_name: { type: String },
      bank_name: { type: String },
      account_number: { type: String },
      ifsc_code: { type: String },
    },

    // 🔹 UPI Details
    upi_id: {
      type: String,
      lowercase: true,
      trim: true,
    },

    upi_number: {
      type: String,
      trim: true,
    },

    // 🔹 Admin Controls
    is_active: {
      type: Boolean,
      default: true,
    },

    is_verified_by_admin: {
      type: Boolean,
      default: false,
    },

    verified_at: {
      type: Date,
    },

    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    remarks: {
      type: String, // admin notes if rejected / clarification
    },
  },
  {
    timestamps: true,
  }
);

/* 🔐 Conditional Validation */
PaymentAccountSchema.pre("save", function (next) {
  if (this.payment_method === "BANK") {
    if (
      !this.bank_details?.account_holder_name ||
      !this.bank_details?.account_number ||
      !this.bank_details?.ifsc_code
    ) {
      return next(new Error("Complete bank details are required"));
    }
  }

  if (this.payment_method === "UPI_ID" && !this.upi_id) {
    return next(new Error("UPI ID is required"));
  }

  if (this.payment_method === "UPI_NUMBER" && !this.upi_number) {
    return next(new Error("UPI number is required"));
  }

  next();
});

module.exports = mongoose.model("PaymentAccount", PaymentAccountSchema);
