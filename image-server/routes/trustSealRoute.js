const express = require('express');
const router = express.Router();
const { upload } = require('../utils/FileUpload');
const {
  uploadVerificationImages,
} = require('../controller/trustSealController');


// Upload verification images (image server route)
router.post('/upload-images', upload.array('images', 10), uploadVerificationImages);


module.exports = router;