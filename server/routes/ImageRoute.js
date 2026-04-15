const express = require('express');
const upload = require('../middleware/upload.js');
const { 
    uploadImagesController, 
    updateImagesController, 
    deleteImageController 
} = require('../controllers/imageController.js');

const router = express.Router();

// Upload images
router.post('/upload/:moduleType', upload.fields([
    { name: 'company_logo', maxCount: 1 },
    { name: 'company_images', maxCount: 15 },
    { name: 'identity_card_image', maxCount: 1 },
    { name: 'profile_pic', maxCount: 1 },
    { name: 'student_photo', maxCount: 1 },
    { name: 'product_images', maxCount: 15 },
    { name: 'category_image', maxCount: 1 },
    { name: 'sub_category_image', maxCount: 1 },

]), uploadImagesController);

// Update images
router.put('/update/:moduleType', upload.fields([
    { name: 'company_logo', maxCount: 1 },
    { name: 'company_images', maxCount: 15 },
    { name: 'identity_card_image', maxCount: 1 },
    { name: 'profile_pic', maxCount: 1 },
    { name: 'student_photo', maxCount: 1 },
    { name: 'product_images', maxCount: 15 },
    { name: 'category_image', maxCount: 1 },
    { name: 'sub_category_image', maxCount: 1 },
]), updateImagesController);

// Delete an image
router.delete('/delete', deleteImageController);

module.exports = router;
