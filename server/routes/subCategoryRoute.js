const express = require("express");
const router = express.Router();
const subCategoryController = require("../controllers/subCategoryController");

router.post("/create-sub-category", subCategoryController.createSubCategory);
router.get("/fetch-all-sub-category", subCategoryController.getSubCategories);
router.get("/fetch-all-sub-category-for-super-sub-category", subCategoryController.getAllSubCategoriesForSuperSubCategory);
router.get("/fetch-by-id-sub-category/:id", subCategoryController.getSubCategoryById);
router.put("/update-sub-category/:id", subCategoryController.updateSubCategory);
router.delete("/delete-sub-category/:id", subCategoryController.deleteSubCategory);


module.exports = router;
