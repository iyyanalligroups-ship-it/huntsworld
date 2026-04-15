const express = require("express");
const {
  addFavoriteServiceProvider,
  getFavoriteServiceProviders,
  removeFavoriteServiceProvider,
} = require("../controllers/favoriteServiceProviderController");


const router = express.Router();

// Add a service provider to favorites
router.post("/add-favorite-providers", protect, addFavoriteServiceProvider);

// Get favorite service providers of logged-in user
router.get("/fetch-providers-by-user", protect, getFavoriteServiceProviders);

// Remove a service provider from favorites
router.delete("/delete-favorite-providers-by-id/:id", protect, removeFavoriteServiceProvider);

module.exports = router;
