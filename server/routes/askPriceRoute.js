const express = require('express');
const router = express.Router();
const askPriceController = require('../controllers/askPriceController');

const { authMiddleware } = require("../middleware/authMiddleware");

router.post('/submit', askPriceController.createAskPriceRequest);
router.get('/merchant', authMiddleware, askPriceController.getMerchantAskPriceRequests);
router.patch('/:id/status', authMiddleware, askPriceController.updateAskPriceStatus);
router.patch('/:id/read', authMiddleware, askPriceController.markAsRead);
router.patch('/mark-all-read', authMiddleware, askPriceController.markAllAsRead);
router.delete('/:id', authMiddleware, askPriceController.deleteAskPriceRequest);

module.exports = router;
