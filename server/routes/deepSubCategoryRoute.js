const express = require("express");
const router = express.Router();
const deepSubCategoryController = require("../controllers/deepSubCategory");

router.post("/create-deep-sub-category", deepSubCategoryController.createDeepSubCategory);
router.get("/fetch-all-deep-sub-category", deepSubCategoryController.getDeepSubCategories);
router.get("/fetch-all-deep-sub-category-for-product", deepSubCategoryController.getAllDeepSubCategoriesForProduct);
router.get("/fetch-deep-sub-category-by-id/:id", deepSubCategoryController.getDeepSubCategoryById);
router.put("/update-deep-sub-category/:id", deepSubCategoryController.updateDeepSubCategory);
router.delete("/delete-deep-sub-category/:id", deepSubCategoryController.deleteDeepSubCategory);

module.exports = router;