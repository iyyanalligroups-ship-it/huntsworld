// Add this model if not present (e.g., in models/trackFavoriteModel.js)
const mongoose = require("mongoose");

const trackFavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  action: { type: String, enum: ["add", "remove", "toggle"], required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TrackFavorite", trackFavoriteSchema);