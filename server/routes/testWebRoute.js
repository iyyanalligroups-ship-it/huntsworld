// routes/testWebRoute.js
const express = require('express');
const router = express.Router();
const { createTestimonial, getAllTestimonials } = require('../controllers/testWebController');

// Routes
router.post('/', createTestimonial);
router.get('/', getAllTestimonials);

module.exports = router;
