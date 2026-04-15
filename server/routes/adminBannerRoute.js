const express = require("express");
const router = express.Router();
const {authMiddleware} = require("../middleware/authMiddleware");

const {
  createBanner,
  updateBanner,
  deleteBanner,
  getActiveBanners,
  getAllBanners,
  toggleBannerStatus
} = require("../controllers/adminBanner");

// DB only routes
router.post("/create",authMiddleware, createBanner);
router.put("/update/:banner_id",authMiddleware, updateBanner);
router.delete("/delete/:banner_id",authMiddleware, deleteBanner);

router.get("/active", getActiveBanners);
router.get("/all", getAllBanners);
router.patch(
  "/status/:banner_id",
  authMiddleware,
  toggleBannerStatus
);

module.exports = router;
