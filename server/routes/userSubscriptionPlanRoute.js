// const express = require("express");
// const {
// createSubscription,
// getAllSubscriptions,
// getSubscriptionById,
// updateSubscription,
// deleteSubscription,
// } = require("../controllers/userSubscriptionPlanController");


// const router = express.Router();

// // Create a new user subscription
// router.post("/create-usersubscriptionplans", createSubscription);

// // Get all user subscriptions (Admin only)
// router.get("/fetch-all-usersubscriptionplans", getAllSubscriptions);

// // Get a single user subscription by ID
// router.get("/fetch-usersubscriptionplans-by-id/:id", getSubscriptionById);

// // Update a user subscription
// router.put("/update-usersubscriptionplans-by-id/:id", updateSubscription);

// // Delete a user subscription
// router.delete("/delete-usersubscriptionplans-by-id/:id", deleteSubscription);

// module.exports = router;


// routes/razorpay.routes.js
const express = require('express')
const router = express.Router()
const {
  createOrder,
  verifyPayment,
  getOrderDetails,
  getPaymentDetails,
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getUserActiveSubscription,
  cancelSubscription,
  upgradeSubscription,
  getUserActiveSubscriptionforBanner,
  searchUsersByNumberOrEmail,
  getAllActiveSubscriptions,
  getRoyalPlanCompanies,
  getTrendingDeepSubCategories,
  getSubscriptionStatus,
  checkVerification,
  searchMerchant,
  extendSubscriptionDuration,
  getAllExtensionHistory,
  getSubscriptionByUserId,
  toggleAutoPay,
  searchUsersByNumberOrEmailForWallet
} = require('../controllers/userSubscriptionPlanController')
const { authMiddleware } = require("../middleware/authMiddleware");


router.post('/create-order', createOrder)
router.post('/verify-payment', verifyPayment)
router.get('/order/:order_id', getOrderDetails)
router.get('/payment/:payment_id', getPaymentDetails)
router.get('/subscriptions/subscription-status/:userId', getSubscriptionStatus)
// Create a new user subscription
router.post("/create-usersubscriptionplans", createSubscription);

// Get all user subscriptions (Admin only)
router.get("/fetch-all-usersubscriptionplans", getAllSubscriptions);
router.get("/fetch-merchant-by-number-or-email", searchUsersByNumberOrEmail);
router.get("/fetch-users-for-wallet", searchUsersByNumberOrEmailForWallet);

// Get a single user subscription by ID
router.get("/fetch-usersubscriptionplans-by-id/:id", getSubscriptionById);

// Update a user subscription
router.put("/update-usersubscriptionplans-by-id/:id", updateSubscription);

// Delete a user subscription
router.delete("/delete-usersubscriptionplans-by-id/:id", deleteSubscription);

router.get("/fetch-user-active-subscription/:user_id", getUserActiveSubscription);
router.get("/fetch-user-active-subscription-for-banner/:user_id", getUserActiveSubscriptionforBanner);
router.get("/active/all", getAllActiveSubscriptions);



router.post("/cancel-usersubscriptionplans/:id", cancelSubscription);

router.post("/upgrade-usersubscriptionplans", upgradeSubscription);

router.get('/royal-plan-companies', getRoyalPlanCompanies);
router.get('/trending-deep-sub-categories', getTrendingDeepSubCategories);
router.get('/verification-expire', checkVerification);
// GET /api/user-subscription-plan/search-merchant
router.get(
  '/search-merchant',
  searchMerchant
);

// PATCH /api/user-subscription-plan/extend-subscription
router.patch(
  '/extend-subscription',
  authMiddleware,
  extendSubscriptionDuration
);
router.get('/extension-history/all', getAllExtensionHistory);
router.get('/extension-history/user/:userId', getSubscriptionByUserId);
router.patch('/subscriptions/:id/toggle-autopay', authMiddleware, toggleAutoPay);

module.exports = router
