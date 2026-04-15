const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");
const { uploadCategoryImage, updateCategoryImage, deleteCategoryImage, getCategoryImage}= require("../controller/categoryController");

// 📌 Upload a single company logo
router.post("/upload-category", upload.single("category_image"), uploadCategoryImage);

// 📌 Update company logo
router.put("/update-category", upload.single("category_image"), updateCategoryImage);

// 📌 Delete company logo
router.delete("/delete-category", deleteCategoryImage);

// 📌 Get company logo
router.get("/category/:category_name", getCategoryImage);

module.exports = router;