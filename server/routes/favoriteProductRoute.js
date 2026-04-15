const express = require("express");
const {
  addFavorite,
  getFavorites,
  toggleFavorite,
  removeFavorite,
  getFavoritesByUser,
  getFavoriteProductsByUser,
  trackFavorite
} = require("../controllers/favoriteProductController");
const {authMiddleware}=require('../middleware/authMiddleware')

const router = express.Router();

// Add a product to favorites
router.post("/add-favorite-products",authMiddleware, addFavorite);

// Get favorite products of logged-in user
router.get("/fetch-favorite-products-by-user",authMiddleware, getFavorites);

router.get("/favorite-products/:userId", getFavoriteProductsByUser);


router.post("/add-favorite-specific-user",authMiddleware,  toggleFavorite);


router.get("/fetch-favorite-product-by-user/:userId",authMiddleware, getFavoritesByUser);


// Remove a product from favorites
router.delete("/delete-favorite-products-by-id/:favoriteId",authMiddleware, removeFavorite);

// Track favorite action for analytics or debugging
router.post("/track-favorite/:userId/:productId", trackFavorite);

module.exports = router;