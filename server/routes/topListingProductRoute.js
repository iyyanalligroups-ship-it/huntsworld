const express = require("express");
const router = express.Router();
const controller = require("../controllers/topListingProductController");

router.post("/add", controller.addTopListingProduct);
router.get("/seller/:user_id", controller.getSellerTopListingProducts);
router.put("/update/:id", controller.updateTopListingProduct);
router.delete("/delete/:id", controller.deleteTopListingProduct);
router.get("/homepage", controller.getHomepageTopListingProducts);

module.exports = router;
