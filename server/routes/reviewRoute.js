const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Create a new review
router.post('/create-review', reviewController.createReview);

// Get all reviews for a product
router.get('/fetch-all-reviews-by-product/:productId', reviewController.getReviewsByProduct);

// Get a specific review by ID
router.get('/fetch-review-by-id/:id', reviewController.getReviewById);

// Update a review
router.put('/update-review-by-id/:id', reviewController.updateReview);

// Delete a review
router.delete('/delete-review-by-id/:id', reviewController.deleteReview);

module.exports = router;