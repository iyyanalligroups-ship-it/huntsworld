// routes/categoryRoute.js

const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { getGlobalOthersIds } = require("../utils/createGlobalOthers");

// All your existing category routes
router.post("/create-category", categoryController.createCategory);
router.get("/fetch-all-category", categoryController.getCategories);
router.delete("/delete-category/:id", categoryController.deleteCategory);
router.get("/fetch-all-category-for-super-sub-category", categoryController.getCategoriesForSuperSubCategory);
router.get("/fetch-by-id-category/:id", categoryController.getCategoryById);
router.put("/update-category/:id", categoryController.updateCategory);
router.post("/create-full-category-tree", categoryController.createCategoryTree);

router.get("/fetch-top-categories", categoryController.getTopTrendingCategories);
router.get("/fetch-top-categories-for-admin", categoryController.getTopTrendingCategoriesForAdmin);
router.get("/fetch-top-sub-categories", categoryController.getTopTrendingSubCategories);
router.get("/fetch-top-products", categoryController.getTopTrendingProducts);
router.get("/fetch-categories-by-name/:category_name", categoryController.getCategoriesByName);
router.get("/fetch-categories-by-country-name/:country/:category_name", categoryController.getCategoriesByCountryName);
router.get("/fetch-sub-categories-by-name/:sub_category_name", categoryController.getSubCategoriesByName);
router.get("/fetch-sub-categories-by-country-name/:country/:sub_category_name", categoryController.getSubCategoriesByCountryName);
router.get("/fetch-deep-sub-category-products/:modelName/:categoryName", categoryController.getProductsByCategoryName);

// BULLETPROOF ENDPOINT — ALWAYS WORKS
router.get("/global-others-ids", async (req, res) => {
  try {
    const ids = await getGlobalOthersIds(); // Creates if missing
    res.json({
      success: true,
      data: ids,
    });
  } catch (error) {
    console.error("Error fetching global others IDs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize category system",
    });
  }
});

module.exports = router;
