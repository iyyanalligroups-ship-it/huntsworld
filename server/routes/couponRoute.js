const express = require("express");
const router = express.Router();
const couponNameController = require("../controllers/couponController");
router.post("/create-coupons", couponNameController.createCouponName);
router.get("/fetch-all-coupons", couponNameController.getCouponNames);
router.get("/fetch-coupons-by-id/:id", couponNameController.getCouponNameById);
router.put("/update-coupons/:id", couponNameController.updateCouponName);
router.delete("/delete-coupons/:id", couponNameController.deleteCouponName);

module.exports = router;
