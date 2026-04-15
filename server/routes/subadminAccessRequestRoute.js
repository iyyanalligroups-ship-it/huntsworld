const express = require('express');
const router = express.Router();
const accessRequestController = require('../controllers/subadminAccessRequestController');
const {authMiddleware}=require("../middleware/authMiddleware");
router.post('/request', accessRequestController.requestAccess);
router.post('/approve', accessRequestController.approveAccess);
router.post('/reject', accessRequestController.rejectAccess);
router.get('/fetch-request', accessRequestController.getAccessRequests);
router.post('/mark-read', accessRequestController.markNotificationAsRead);
router.get('/user/:user_id', accessRequestController.getUserById);
//admin page

// Search subadmins by email or phone
router.get('/search', accessRequestController.searchSubadmins);
// Get access requests for a specific subadmin
router.get('/requests/:subadminId', accessRequestController.getAccessRequestsBySubadminId);
router.get('/notifications/access-requests/:id',authMiddleware, accessRequestController.getAccessRequestDetails);
// Update an access request
router.put('/requests/:request_id', accessRequestController.updateAccessRequest);
// Delete an access request
router.delete('/requests/:request_id', accessRequestController.deleteAccessRequest);

module.exports = router;