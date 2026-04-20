const express = require("express");
const {
  createProduct,
  getProducts,
  getProductsByUserId,
  getMerchantByUserId,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductBySellerId,
  getProductByName,
  getAllProductsPaginated,
  verifyProduct,
  getSuggestions,
  searchCompanies,
  searchProducts,
  getAllProductsBySellerId,
  fetchProductsByIds,
  fetchAllProductsByServiceProviderUserId,
  getNotVerifiedProducts,
  getProductsBySellerId,
  fetchProductsByServiceProviderId,
  suggestProductNames,
  unverifyProduct,
  getProductForEdit,
  getAllOthersProducts,
  getProductPhotoLimit,
  getProductVideoAccess,
  getCompanyVideoAccess,
  markProductAsRead
} = require("../controllers/productController");
const router = express.Router();

router.post("/create-products", createProduct);
router.get("/fetch-all-products", getProducts);
router.get("/fetch-all-not-verified-products", getNotVerifiedProducts);
router.get("/fetch-all-products-for-seller/:user_id", getProductsByUserId);
router.get(
  "/fetch-all-products-for-seller-by-id/:userId",
  getProductBySellerId
);
router.get("/show-in-product-wise", getAllProductsPaginated);

router.put("/update-products/:id", updateProduct);
router.delete("/delete-products/:id", deleteProduct);

//get the product by name
router.get("/fetch-product-by-id/:productId", getProductById);
router.get("/get-suggestion", getSuggestions);
router.get("/get-company", searchCompanies);
router.get("/get-products", searchProducts);
// GET /api/merchant/:userId
router.get("/merchant-info-by-user-id/:userId", getMerchantByUserId);
router.get("/fetch-all-products-by-seller-id/:userId", getAllProductsBySellerId);
//verify the product
router.put("/:id/verify", verifyProduct);
router.put("/:id/unverify", unverifyProduct);
router.post("/fetch-products-by-ids", fetchProductsByIds);
// Assuming appended to existing router
router.get('/fetch-all-products-by-service-provider-user-id/:userId', fetchAllProductsByServiceProviderUserId);

router.get(
  "/fetch-products-by-service-provider-id/:providerId",
  fetchProductsByServiceProviderId
); // Add new rout
router.get("/edit/:id", getProductForEdit);
router.get("/fetch-others-products", getAllOthersProducts);

router.get('/suggest', suggestProductNames);
router.post('/product-photo-limit', getProductPhotoLimit);
router.post('/product-video-access', getProductVideoAccess);
router.post('/company-video-access', getCompanyVideoAccess);
router.put('/mark-read/:id', markProductAsRead);

module.exports = router;
