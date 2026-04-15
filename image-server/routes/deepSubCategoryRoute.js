const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");

const {
  uploadDeepSubCategoryImage,
  updateDeepSubCategoryImage,
  deleteDeepSubCategoryImage,
  getDeepSubCategoryImage,
} = require("../controller/deepSubCategoryController");

// 📤 Upload
router.post(
  "/upload-deep-sub-category",
  upload.single("deep_sub_category_image"),
  uploadDeepSubCategoryImage
);

// ♻️ Update
router.put(
  "/update-deep-sub-category",
  upload.single("deep_sub_category_image"),
  updateDeepSubCategoryImage
);

// ❌ Delete
router.delete("/delete-deep-sub-category", deleteDeepSubCategoryImage);

// 📥 Get
router.get("/deep-sub-category/:deep_sub_category_name", getDeepSubCategoryImage);

module.exports = router;
