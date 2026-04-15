const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

router.post('/create-banners', bannerController.createBanner);
router.get('/fetch-all-banners', bannerController.getAllBanners);
router.get('/fetch-banners-by-id/:id', bannerController.getBannerById);
router.put('/update-banners-by-id/:id', bannerController.updateBanner);
router.delete('/delete-banners-by-id/:id', bannerController.deleteBanner);

module.exports = router;
