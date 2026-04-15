const { uploadMultipleImagesToCloudinary, deleteImageFromCloudinary } = require('../utils/cloudinary');

/**
 * Valid image fields per module type.
 */
const imageFields = {
    'service-provider': ['company_logo', 'company_images'],
    'merchant': ['company_logo', 'company_images'],
    'student': ['identity_card_image', 'student_photo'],
    'grocery-seller': ['company_logo', 'company_images'],
    'users': ['profile_pic'],
    'products': ['product_images'],
    'category': ['category_image'],
    'sub-category':['sub_category_image'],

};

/**
 * Upload images to Cloudinary based on the module type.
 * @param {Object} req - Request object containing files.
 * @param {Object} res - Response object.
 */
exports.uploadImagesController = async (req, res) => {
    try {
        const { moduleType } = req.params;
        const files = req.files;

        if (!imageFields[moduleType]) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                message: 'Invalid module type'
            });
        }

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                message: 'No files uploaded'
            });
        }

        let uploadedImages = {};

        for (const field of imageFields[moduleType]) {
            if (files[field]) {
                const uploadedUrls = await uploadMultipleImagesToCloudinary(files[field], moduleType);
                uploadedImages[field] = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls;
            }
        }

        res.json({
            statusCode: 200,
            success: true,
            message: 'Images uploaded successfully',
            data: uploadedImages
        });

    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            success: false,
            message: error.message || 'Image upload failed'
        });
    }
};

/**
 * Update images: Delete old images and upload new ones.
 * @param {Object} req - Request object containing files and old image URLs.
 * @param {Object} res - Response object.
 */
exports.updateImagesController = async (req, res) => {
    try {
        const { moduleType } = req.params;
        const { oldImages } = req.body;
        const newFiles = req.files;

        if (!imageFields[moduleType]) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                message: 'Invalid module type'
            });
        }

        if (!newFiles || Object.keys(newFiles).length === 0) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                message: 'No new images uploaded'
            });
        }

        let uploadedImages = {};

        // Delete old images before uploading new ones
        for (const field of imageFields[moduleType]) {
            if (oldImages?.[field]) {
                await Promise.all(oldImages[field].map(img => deleteImageFromCloudinary(img)));
            }

            if (newFiles[field]) {
                const uploadedUrls = await uploadMultipleImagesToCloudinary(newFiles[field], moduleType);
                uploadedImages[field] = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls;
            }
        }

        res.json({
            statusCode: 200,
            success: true,
            message: 'Images updated successfully',
            data: uploadedImages
        });

    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            success: false,
            message: error.message || 'Image update failed'
        });
    }
};

/**
 * Delete an image from Cloudinary.
 * @param {Object} req - Request object containing publicId.
 * @param {Object} res - Response object.
 */
exports.deleteImageController = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                message: 'No publicId provided'
            });
        }

        await deleteImageFromCloudinary(publicId);

        res.json({
            statusCode: 200,
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            success: false,
            message: error.message || 'Image deletion failed'
        });
    }
};
