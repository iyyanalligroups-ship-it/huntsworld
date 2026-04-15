const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");

router.get("/fetch-seller-by-slug/:slug", sellerController.getSellerBySlug);

module.exports = router;