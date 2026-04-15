const express = require('express');
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
    getReferralData,
    requestClaim,
    adminGetAllClaims,
    adminMarkAsPaid,
    getUserPaymentAccount,
    adminGetPayoutHistory,
    markReferralAsRead
} = require("../controllers/referralController");

// User Endpoints
router.get("/my-data", authMiddleware, getReferralData);
router.post("/request-claim", authMiddleware, requestClaim);

// Admin Endpoints
router.get("/admin/all-claims", authMiddleware, adminGetAllClaims);
router.post("/admin/mark-paid", authMiddleware, adminMarkAsPaid);
router.get("/admin/payment-account/:userId", authMiddleware, getUserPaymentAccount);
router.get("/admin/payout-history", authMiddleware, adminGetPayoutHistory);
router.put("/admin/mark-read/:id", authMiddleware, markReferralAsRead);

module.exports = router;
