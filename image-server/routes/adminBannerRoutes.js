const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");

const {
  uploadBannerImages,
  updateBannerImages,
  deleteBannerImages,
} = require("../controller/adminBannerController");

// Upload banner images
router.post(
  "/upload",
  upload.array("banner_images", 5),
  uploadBannerImages
);

// Update banner images (replace)
router.put(
  "/update",
  upload.array("banner_images", 5),
  updateBannerImages
);

// Delete banner images
router.delete("/delete", deleteBannerImages);

module.exports = router;
