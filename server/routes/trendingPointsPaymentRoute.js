
const express = require('express');
const router = express.Router();
const trendingPointsPaymentController = require('../controllers/trendingPointsPaymentController');
const trendingPointsController = require('../controllers/trendingPointtoProductController');

router.post('/create-order', trendingPointsPaymentController.createTrendingPointsOrder);
router.post('/free-grant', trendingPointsPaymentController.grantFreeTrendingPoints);
router.post('/verify-payment', trendingPointsPaymentController.verifyTrendingPointsPayment);
router.post('/upgrade', trendingPointsPaymentController.upgradeTrendingPoints);
router.post('/cancel/:user_id', trendingPointsPaymentController.cancelTrendingPoints);
router.get('/config', trendingPointsPaymentController.getTrendingPointsConfig);
router.post('/add-point-product', trendingPointsController.createTrendingPoints);
router.get('/active/:userId', trendingPointsPaymentController.getActiveTrendingPoints);
router.put('/update-point-product', trendingPointsController.updateTrendingPoints);
router.delete('/delete-point-product', trendingPointsController.deleteTrendingPoints);
router.get('/search-merchants', trendingPointsPaymentController.searchMerchants);
router.get('/fetch-all-active-trending-points-users', trendingPointsPaymentController.getAllActiveTrendingPointUsers);


module.exports = router;
