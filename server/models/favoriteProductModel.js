const mongoose = require("mongoose");

const favoriteProductSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to Product model
      required: true,
    },
    
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("FavoriteProduct", favoriteProductSchema);
