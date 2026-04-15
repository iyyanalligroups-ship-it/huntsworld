const express = require('express');
const router = express.Router();
const {
  uploadBannerImage,
  uploadCircleLogo,
  uploadRectangleLogo,
  updateBannerImage,
  updateCircleLogo,
  updateRectangleLogo,
  deleteBannerImage,
  deleteCircleLogo,
  deleteRectangleLogo,
  getBannerImage,
} = require('../controller/bannerImageController');
const { upload } = require('../utils/FileUpload');

// Image upload routes
router.post('/upload', upload.single('banner_image'), uploadBannerImage);
// router.post('/circle-logo/upload', upload.single('circle_logo'), uploadCircleLogo);
router.post('/rectangle-logo/upload', upload.single('rectangle_logo'), uploadRectangleLogo);

// Image update routes
router.put('/update', upload.single('banner_image'), updateBannerImage);
// router.put('/circle-logo/update', upload.single('circle_logo'), updateCircleLogo);
router.put('/rectangle-logo/update', upload.single('rectangle_logo'), updateRectangleLogo);

// Image delete routes
router.delete('/delete', deleteBannerImage);
// router.delete('/circle-logo/delete', deleteCircleLogo);
router.delete('/rectangle-logo/delete', deleteRectangleLogo);

// Image get route
router.get('/banner/:company_name/:file_name', getBannerImage);

module.exports = router;