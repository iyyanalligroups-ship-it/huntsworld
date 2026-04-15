const mongoose = require("mongoose");

const favoriteCompanySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant", // Reference to Merchant model
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("FavoriteCompany", favoriteCompanySchema);
