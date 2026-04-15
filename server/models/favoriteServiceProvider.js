const mongoose = require("mongoose");

const favoriteServiceProviderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider", // Reference to ServiceProvider model
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("FavoriteServiceProvider", favoriteServiceProviderSchema);
