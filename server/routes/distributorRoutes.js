const express = require('express');
const router = express.Router();
const distributorController = require('../controllers/distributorController');

router.get('/all-requests', distributorController.getAllRequests);
router.delete('/request/:id', distributorController.deleteRequest);

router.delete('/request/:requestId', distributorController.deleteRequestById);

module.exports = router;
// 🔍 Search for Parents (Manufacturers) or Children (Distributors/Grocery)
// Query params: ?query=abc&type=parent OR ?query=abc&type=child
router.get('/search', distributorController.searchEntities);
// Get specific role details for partnership UI
router.get('/partnership-role/:userId', distributorController.getMerchantPartnershipRole);
// ✉️ Send requests from Admin to Children
router.post('/request', distributorController.sendRequest);

// router.get('/my-requests/:userId', distributorController.getChildRequests);
router.get('/my-requests/:userId', distributorController.getMyRequests);
router.patch('/respond/:requestId', distributorController.respondToRequest);

// // ✅ Accept/Reject a request (To be used by the Merchant/Grocery Seller)
router.patch('/respond/:requestId', async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const { requestId } = req.params;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedRequest = await DistributorRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );

    res.json({ message: `Request ${status} successfully`, data: updatedRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/website-network/:merchantId', distributorController.getWebsiteNetwork);

const { authMiddleware } = require("../middleware/authMiddleware");
router.patch('/:requestId/read', authMiddleware, distributorController.markAsRead);
router.patch('/mark-all-read', authMiddleware, distributorController.markAllAsRead);

module.exports = router;
