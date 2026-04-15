const express = require("express");
const router = express.Router();
const trustSealRequestController = require("../controllers/trustSealRequestController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post(
  "/create",
  authMiddleware,
  trustSealRequestController.createTrustSealRequest
);
router.post(
  "/verify-payment",
  trustSealRequestController.verifyTrustSealPayment
);
router.get("/requests", trustSealRequestController.getTrustSealRequests);
router.post(
  "/update-status",
  trustSealRequestController.updateTrustSealRequestStatus
);
router.get(
  "/status/:user_id",
  trustSealRequestController.getUserTrustSealStatus
);
router.post(
  "/mark-read",
  trustSealRequestController.markTrustSealNotificationAsRead
);
router.get(
  "/fetch-student-requests/:student_id",
  trustSealRequestController.getTrustSealRequestsByPincode
);
router.post(
  "/pick/:request_id",
  trustSealRequestController.pickTrustSealRequest
);
router.post("/update-images", trustSealRequestController.updateTrustSealImages);
// Admin verify trust seal request
router.post(
  "/admin/verify",
  trustSealRequestController.adminVerifyTrustSealRequest
);
router.get(
  "/fetch-all-active-users",
  trustSealRequestController.getAllActiveTrustSealUsers
);
router.get(
  "/fetch-trust-seal-price",
  trustSealRequestController.getTrustSealPrice
);
router.get(
  "/fetch-trust-seal-certificate-detail/:userId",authMiddleware,
  trustSealRequestController.getMerchantTrustSealDetails
);
router.get(
  "/check-trust-seal-exist/:user_id",
  trustSealRequestController.checkTrustSealRequest
);
router.get(
  "/check-status/:user_id",
  trustSealRequestController.checkTrustSealStatus
);
router.get(
  "/notifications/trust-seal/:id",authMiddleware,
  trustSealRequestController.getTrustSealRequestDetails
);

router.get("/my-verified-companies/:student_id",
   trustSealRequestController.getMyVerifiedCompanies);
   router.delete(
  "/delete-request/:request_id",
  authMiddleware, // ← assuming you want only authenticated admins
  trustSealRequestController.deleteTrustSealRequest
);
module.exports = router;
