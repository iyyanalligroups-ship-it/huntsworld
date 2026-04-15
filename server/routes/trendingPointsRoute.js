const express = require('express');
const router = express.Router();
const trendingPointsController = require('../controllers/trendingPointsController');

router.post('/create-trending-points', trendingPointsController.createTrendingPoint);
router.post('/create-trending-points-for-favorite', trendingPointsController.createTrendingPointForFavorite);
router.get('/fetch-byId-trending-points', trendingPointsController.getAllTrendingPoints);
router.get('/fetch-all-trending-points/:id', trendingPointsController.getTrendingPointById);
router.put('/update-trending-points/:id', trendingPointsController.updateTrendingPoint);
router.delete('/delete-trending-points/:id', trendingPointsController.deleteTrendingPoint);


// custom trend point add
router.post("/add-custom-trend-points", trendingPointsController.addTrendingPoints);
router.put("/update-custom-trend-points",trendingPointsController.customUpdatePoints);
router.delete("/delete-custom-trend-points",trendingPointsController.customDeletePoints);
router.get('/get-products/:user_id', trendingPointsController.getTrendingPointsWithProductByUser);
module.exports = router;
