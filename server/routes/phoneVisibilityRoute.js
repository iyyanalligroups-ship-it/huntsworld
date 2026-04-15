// routes/phoneVisibility.js
const express = require("express");
const router = express.Router();
const {
  getPhoneVisibility,
  updatePhoneVisibility,
} = require("../controllers/phoneVisibilityController");
const {authMiddleware} =require("../middleware/authMiddleware")

// Public or protected - get current setting
router.get("/phone-visibility", authMiddleware,getPhoneVisibility);

// Admin only - update setting
router.put("/phone-visibility",authMiddleware, updatePhoneVisibility);

module.exports = router;
