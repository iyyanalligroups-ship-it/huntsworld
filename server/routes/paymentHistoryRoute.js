// routes/adminPaymentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllPaymentHistory,
  getPaymentHistoryById,
  updatePaymentHistory,
  createManualPayment,
  getUserPaymentHistory,
} = require('../controllers/paymentHistoryController');

// Add your admin middleware here
// const { isAdmin } = require('../middleware/auth');

router.get('/fetch-all-payment-history', /* isAdmin, */ getAllPaymentHistory);
router.get('/payment-history/:user_id', getUserPaymentHistory);
router.get('/fetch-payment-history/:id', /* isAdmin, */ getPaymentHistoryById);
router.put('/update-payment-history/:id', /* isAdmin, */ updatePaymentHistory);
router.post('/create/manual', /* isAdmin, */ createManualPayment);

module.exports = router;
