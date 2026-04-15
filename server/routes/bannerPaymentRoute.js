// const express = require('express');
// const router = express.Router();
// const bannerPaymentController = require('../controllers/bannerPaymentController');

// router.post('/create-banner-payments', bannerPaymentController.createBannerPayment);
// router.get('/fetch-all-banner-payments', bannerPaymentController.getAllBannerPayments);
// router.get('/fetch-banner-payments-by-id/:id', bannerPaymentController.getBannerPaymentById);
// router.put('/update-banner-payments-by-id/:id', bannerPaymentController.updateBannerPayment);
// router.delete('/delete-banner-payments-by-id/:id', bannerPaymentController.deleteBannerPayment);

// module.exports = router;


const express = require('express');
const router = express.Router();
const bannerPaymentController = require('../controllers/bannerPaymentController');

router.post('/create-order', bannerPaymentController.createBannerOrder);
router.post('/verify-payment', bannerPaymentController.verifyBannerPayment);
router.post('/create-banner', bannerPaymentController.createBanner);
router.get('/active/:user_id', bannerPaymentController.getActiveBanner);
router.post('/cancel/:id', bannerPaymentController.cancelBanner);
router.post('/upgrade', bannerPaymentController.upgradeBanner);
router.put('/update/:id', bannerPaymentController.updateBanner);
router.delete('/delete/:banner_id', bannerPaymentController.deleteBanner);
router.get('/active-purchased-seller', bannerPaymentController.getAllActiveBannerPayments);
router.get('/check-subscription-and-plan/:user_id', bannerPaymentController.checkUserSubscriptionAndPlan);
router.get('/rectangle-banner-by-user-id', bannerPaymentController.getUserBannerDetails);
router.get("/default/active", bannerPaymentController.getActiveDefaultBanner);
// router.get('/fetch-banners-for-admin-panel',  bannerPaymentController.getBannerWithSellerInfo);
router.patch("/toggle-approval/:id", bannerPaymentController.toggleBannerApproval);
// routes/banner.routes.js
router.get(
  "/banner/expire-date/:user_id",
  bannerPaymentController.getBannerExpireDate
);


// ==========================================================
// 1️⃣ Rectangle Banner (Small / Sidebar)
// ==========================================================
router.get(
  "/rectangle/:user_id",
  bannerPaymentController.getRectangleBannersByLocation
);

// ==========================================================
// 2️⃣ Premium Banner Image (Large Banner)
// ==========================================================
router.get(
  "/premium",
  bannerPaymentController.getBannerImageByLocation
);
router.get(
  "/fetch-pending-banners-for-admin",
  bannerPaymentController.getPendingBannersForAdmin
);
router.get(
  "/fetch-approved-banners-for-admin",
  bannerPaymentController.getApprovedBannersForAdmin
);

// router.get('/rectangle-banner-by-user-id/:user_id',  bannerPaymentController.getUserBannerDetails);

router.put('/mark-read/:id', bannerPaymentController.markBannerAsRead);

module.exports = router;
