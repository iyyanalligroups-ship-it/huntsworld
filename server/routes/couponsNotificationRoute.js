const express = require('express');
const router = express.Router();
const { getNotifications, getAllRedeemRequests, markNotificationAsRead,deleteNotification, markNotificationAsUnread, sendRedeemAmount,getCouponNotificationDetails ,rejectRedeemRequest} = require('../controllers/couponsNotificationController');
const {authMiddleware}=require("../middleware/authMiddleware");


router.get('/fetch-notifications-by-user/:userId', getNotifications);
router.get('/redeem-requests', getAllRedeemRequests);
router.get('/notifications/coupons/:id',authMiddleware, getCouponNotificationDetails);
router.post('/mark-as-read', markNotificationAsRead);
router.post('/mark-as-unread', markNotificationAsUnread);
router.post('/send-redeem-amount', sendRedeemAmount);
router.post("/reject-redeem", rejectRedeemRequest);
router.delete(
  '/:notificationId'
  // optional: protect middleware if you have authentication
  // authMiddleware,
  ,deleteNotification
);

module.exports = router;
