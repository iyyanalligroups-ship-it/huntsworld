const express = require('express');
const router = express.Router();
const ebookController = require('../controllers/ebookPaymentController');
const {authMiddleware} = require('../middleware/authMiddleware'); // Assume middleware for authentication

router.post('/create-order', ebookController.createEbookOrder);
router.post('/verify-payment', ebookController.verifyEbookPayment);
router.post('/upgrade', ebookController.upgradeEbook);
router.post('/cancel', ebookController.cancelEbook);
// router.get('/competitors', ebookController.getCompetitors);
router.get('/active-payment', ebookController.getProductBySellerId);
router.get("/active-ebook-payments", ebookController.getAllActiveEbookPayments);
router.get('/status',authMiddleware,  ebookController.getDigitalBookStatus);
router.post('/select-free-cities',authMiddleware,  ebookController.selectFreeCities);
router.get("/active-allonce-ebook-payments", ebookController.getAllAtOnceActiveEbookPayments);

module.exports = router;
