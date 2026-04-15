const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

const {
  createPaymentAccount,
  getUserPaymentAccounts,
  getPaymentAccountById,
  updatePaymentAccount,
  deletePaymentAccount,
  adminVerifyPaymentAccount,
  setActivePaymentAccount,
  sendCouponEmail,
  checkStudentPaymentAccount,
  recordStudentPayment,
  getStudentPaymentHistory,
  getStudentPaymentHistoryByUserId
} = require("../controllers/paymentAccountController");

// User Routes
router.post("/", createPaymentAccount);
router.get("/user/:userId", getUserPaymentAccounts);
router.get("/student-history", authMiddleware, getStudentPaymentHistory); // Admin
router.get("/user-history/:userId", authMiddleware, getStudentPaymentHistoryByUserId); // Individual User
router.get("/:id", getPaymentAccountById);
router.patch("/:id", updatePaymentAccount);
router.delete("/:id", deletePaymentAccount);

// Admin Routes
router.patch("/:id/admin-verify", adminVerifyPaymentAccount);
router.patch("/:id/set-active", setActivePaymentAccount);
router.post("/send-coupon-email", sendCouponEmail);
router.get(
  "/check-student/:userId",
  checkStudentPaymentAccount
);

router.post("/record-payment", authMiddleware, recordStudentPayment);

module.exports = router;
