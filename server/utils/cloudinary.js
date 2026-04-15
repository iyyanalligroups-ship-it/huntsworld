
const cloudinary=require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
});

/**
 * Upload a single image to Cloudinary.
 * @param {Object} image - The image file object.
 * @param {string} folder - The folder name for storage.
 * @returns {Promise<Object>} - Uploaded image details.
 */
exports.uploadImageToCloudinary = async (image, folder) => {
    const buffer = image?.buffer || Buffer.from(await image.arrayBuffer());

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder }, (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
        }).end(buffer);
    });
};

/**
 * Upload multiple images to Cloudinary.
 * @param {Array} images - Array of image file objects.
 * @param {string} folder - The folder name for storage.
 * @returns {Promise<Array>} - Array of uploaded image details.
 */
exports.uploadMultipleImagesToCloudinary = async (images, folder) => {
    const uploadPromises = images.map((image) => uploadImageToCloudinary(image, folder));
    return Promise.all(uploadPromises);
};

/**
 * Delete an image from Cloudinary.
 * @param {string} publicId - The Cloudinary public ID of the image.
 * @returns {Promise<Object>} - Deletion result.
 */
exports.deleteImageFromCloudinary = async (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
};
