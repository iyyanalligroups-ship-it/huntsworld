// controllers/testWebController.js
const Testweb = require('../models/testWebModel');
const mongoose = require('mongoose');

// Create a new testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const { user_id, rating, message } = req.body;

    if (!user_id || !rating || !message) {
      return res.status(400).json({ message: 'User ID, rating, and message are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (rating < 0.5 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0.5 and 5' });
    }

    let testimonial = new Testweb({
      user_id,
      rating,
      message
    });

    await testimonial.save();

    // Populate user details (so name is available immediately)
    testimonial = await testimonial.populate('user_id', 'name');

    res.status(201).json({
      message: 'Testimonial created successfully',
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all testimonials
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testweb.find().populate('user_id', 'name');
    res.status(200).json({ testimonials }); // ✅ consistent key
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
