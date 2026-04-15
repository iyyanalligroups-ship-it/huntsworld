// const express = require("express");
// const router = express.Router();
// const { upload } = require("../utils/FileUpload");

// const {
//   uploadProductImage,
//   updateProductImage,
//   deleteProductImage,
//   getProductImage,
// } = require("../controller/productController");

// // Upload
// router.post("/upload-product", upload.single("product_image"), uploadProductImage);

// // Update
// router.put("/update-product", upload.single("product_image"), updateProductImage);

// // Delete
// router.delete("/delete-product", deleteProductImage);

// // Get
// router.get("/product/:product_name", getProductImage);

// module.exports = router;


const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");

const {
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
  getProductImage,
} = require("../controller/productController");

// Upload multiple product images
router.post("/upload-product", upload.array("product_image", 5), uploadProductImage);

// Update (replace) multiple product images
router.put("/update-product", upload.array("product_image", 5), updateProductImage);

// Delete all product images for a product
router.delete("/delete-product", deleteProductImage);

// Get a specific product image by filename
router.get("/product/:file_name", getProductImage);

module.exports = router;
