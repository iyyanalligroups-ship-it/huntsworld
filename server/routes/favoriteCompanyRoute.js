const express = require("express");
const {
  addFavoriteCompany,
  getFavoriteCompanies,
  removeFavoriteCompany,
} = require("../controllers/favoriteCompanyController");


const router = express.Router();

// Add a company to favorites
router.post("/add-favorite-company", protect, addFavoriteCompany);

// Get favorite companies of logged-in user
router.get("/fetch-favorite-company-by-user", protect, getFavoriteCompanies);

// Remove a company from favorites
router.delete("/delete-favorite-company-by-id/:id", protect, removeFavoriteCompany);

module.exports = router;
