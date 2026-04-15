const express = require("express");
const router = express.Router();
const superSubCategoryController = require("../controllers/superSubCategoryController");

router.post("/create-super-sub-category", superSubCategoryController.createSuperSubCategory);
router.get("/fetch-all-super-sub-category", superSubCategoryController.getSuperSubCategories);
router.get("/fetch-all-super-sub-category-deep-sub-category", superSubCategoryController.getAllSuperSubCategoriesForDeepSubCategory);
router.get("/fetch-super-sub-category-by-id/:id", superSubCategoryController.getSuperSubCategoryById);
router.put("/update-super-sub-category/:id", superSubCategoryController.updateSuperSubCategory);
router.delete("/delete-super-sub-category/:id", superSubCategoryController.deleteSuperSubCategory);

module.exports = router;
