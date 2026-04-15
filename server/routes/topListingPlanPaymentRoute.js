const express = require('express');
const router = express.Router();
const topListingController = require('../controllers/topListingPlanPaymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create-order', topListingController.createTopListingOrder);
router.post('/verify-payment', topListingController.verifyTopListingPayment);
router.post('/upgrade', topListingController.upgradeTopListing);
router.post('/cancel', topListingController.cancelTopListing);
router.get('/active/:userId', authMiddleware, topListingController.getActiveTopListing);
router.get('/top-listing-config', topListingController.getTopListingMonthlyRate);
router.get("/gst-config", topListingController.getGSTConfig);
router.get(
  "/seller-products",
  topListingController.getTopListingSellerProducts
);


module.exports = router;
