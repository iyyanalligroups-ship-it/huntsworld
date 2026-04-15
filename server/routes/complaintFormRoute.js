const express = require('express');
const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getUserComplaints,
  getComplaintsBySupplierNumberAndType,
  getMerchantByUserId,
  markComplaintAsRead,
  getComplaintNotifications,
  getComplaintNotificationDetail,
  deleteComplaintNotification,
  updateComplaintStatus
} = require('../controllers/complaintFormController');

const router = express.Router();

// Make sure all routes have a `/` before the path
router.post('/create-complaint', createComplaint); // Create
router.get('/fetch-all-complaint', getAllComplaints); // Get All
router.get('/fetch-complaint-by-id/:id', getComplaintById); // Get One
router.put('/update-complaint/:id', updateComplaint); // Update
router.delete('/delete-complaint/:id', deleteComplaint); // Delete


router.get('/fetch-user-complaints', getUserComplaints); // get the loggedin persons complaint
router.get('/fetch-complaints-by-supplier-and-type', getComplaintsBySupplierNumberAndType);
router.get('/fetch-merchant-by-user-id', getMerchantByUserId);

router.get("/notifications", getComplaintNotifications);

// GET    /api/complaints/notifications/:id
router.get("/notifications/:id", getComplaintNotificationDetail);

// PATCH  /api/complaints/notifications/:notificationId/read
router.patch("/notifications/:notificationId/read", markComplaintAsRead);
router.delete("/notifications/:notificationId", deleteComplaintNotification);
router.patch('/:id', updateComplaintStatus);
module.exports = router;
