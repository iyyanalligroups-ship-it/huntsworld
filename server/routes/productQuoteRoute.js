const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/productQuoteController');
const {authMiddleware}=require("../middleware/authMiddleware");

// Create a new quote
router.post('/create-product-quotes', quoteController.createQuote);

// Get all quotes (optional: filter by ownerId)
router.get('/fetch-product-quotes-by-owner', quoteController.getQuotes);

// Get a single quote by id
router.get('/fetch-product-quotes-by-id/:id', quoteController.getQuoteById);

// Update a quote by id
router.put('/update-product-quotes/:id', quoteController.updateQuote);

// Delete a quote by id
router.delete('/delete-product-quotes/:id', quoteController.deleteQuote);


router.post('/respond-to-customer',authMiddleware, quoteController.respondToQuote);

module.exports = router;
