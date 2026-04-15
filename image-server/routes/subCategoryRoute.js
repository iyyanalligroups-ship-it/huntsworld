const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");
const {
  uploadSubCategoryImage,
  updateSubCategoryImage,
  deleteSubCategoryImage,
  getSubCategoryImage
} = require("../controller/subCategoryController");

// 📌 Upload Sub-Category Image
router.post("/upload-sub-category", upload.single("sub_category_image"), uploadSubCategoryImage);

// 📌 Update Sub-Category Image
router.put("/update-sub-category", upload.single("sub_category_image"), updateSubCategoryImage);

// 📌 Delete Sub-Category Image
router.delete("/delete-sub-category", deleteSubCategoryImage);

// 📌 Get Sub-Category Image
router.get("/sub-category/:sub_category_name", getSubCategoryImage);

module.exports = router;
