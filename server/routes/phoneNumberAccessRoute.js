const express = require('express');
const router = express.Router();
const phoneNumberAccessController = require('../controllers/phoneNumberAccessController');
const { authMiddleware } = require("../middleware/authMiddleware");

// Request phone number access
router.post('/request', (req, res, next) => {
  console.error("DEBUG_ROUTE: Hit /api/v1/phone-number-access/request");
  next();
}, phoneNumberAccessController.requestPhoneNumberAccess);

// Approve phone number access
router.post('/approve', phoneNumberAccessController.approvePhoneNumberAccess);

// Reject phone number access
router.post('/reject', phoneNumberAccessController.rejectPhoneNumberAccess);

// Get all phone number access requests for a seller
router.get('/seller/:seller_id', phoneNumberAccessController.getPhoneNumberAccessRequests);

// Mark notification as read
router.post('/mark-read', phoneNumberAccessController.markNotificationAsRead);


router.get('/phone-number-request-detail/:id', authMiddleware, phoneNumberAccessController.getPhoneNumberAccessRequestDetails);

router.get(
  "/my-phone-requests",
  authMiddleware,
  phoneNumberAccessController.getMyPhoneNumberAccessRequests
);

router.delete(
  "/phone-request/:id",
  authMiddleware,
  phoneNumberAccessController.deletePhoneNumberAccessRequest
);
router.delete(
  "/merchant-delete-request/:id",                    // checks token & sets req.user
  authMiddleware,            // optional: extra check that user is merchant
  phoneNumberAccessController.deletePhoneNumberAccessRequestByMerchant
);

module.exports = router;
