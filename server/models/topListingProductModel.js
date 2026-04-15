// models/topListingProductModel.js

const mongoose = require("mongoose");

const topListingProductSchema = new mongoose.Schema(
  {
    topListingPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopListingPayment",
      required: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TopListingProduct",
  topListingProductSchema
);
