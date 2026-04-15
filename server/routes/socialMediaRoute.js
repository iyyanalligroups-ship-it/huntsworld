// File: routes/socialMediaRoutes.js

const express = require("express");
const router = express.Router();

// Import controllers
const {
  getSocialMedia,
  createSocialMedia,
  updateSocialMedia,
  deleteSocialMedia,
} = require("../controllers/socialMediaController");

// Optional: Import your auth middleware
// const { protect, admin } = require("../middleware/authMiddleware");

// Public route - anyone can read the active links
router.route("/")
  .get(getSocialMedia);

// Protected/Admin routes - only authenticated admins should access these
// Uncomment and adjust middleware as per your auth setup
router.route("/")
  .post(
    // protect, admin,
    createSocialMedia
  );

router.route("/:id")
  .put(
    // protect, admin,
    updateSocialMedia
  )
  .delete(
    // protect, admin,
    deleteSocialMedia
  );

module.exports = router;
