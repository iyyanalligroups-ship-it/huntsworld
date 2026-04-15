const Testimonial = require("../models/testimonialModel");

// Create a testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const { feedbackType, comments, rating, user_id } = req.body;

    const testimonial = await Testimonial.create({
      feedbackType,
      comments,
      rating,
      user_id,
    });

    res.status(201).json({ success: true,message:"Testimonial Created Successfully", data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all testimonials
exports.getTestimonials = async (req, res) => {
    try {
      const { page = 1, limit = 10, feedbackType = '' } = req.query; // Get query parameters (with default values)
      
      // Adjust filter logic for 'all' case
      let filter = {};
      if (feedbackType && feedbackType !== 'all') {
        filter.feedbackType = feedbackType; // Only apply filter if feedbackType is provided and not 'all'
      }
  
      // Convert page and limit to integers
      const skip = (page - 1) * limit;
      
      // Fetch testimonials based on the filter
      const testimonials = await Testimonial.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .populate("user_id", "name email");
  
      // Count total testimonials based on filter
      const totalTestimonials = await Testimonial.countDocuments(filter);
    
      const totalPages = Math.ceil(totalTestimonials / limit); // Calculate total pages based on count
    
      res.status(200).json({
        success: true,
        message: "Fetched Testimonial Successfully",
        data: testimonials,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalTestimonials,
          limit: Number(limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  

// Get a testimonial by ID
exports.getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id).populate("user_id", "name email");

    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({ success: true,message:"Fetched Testimonial  Successfully", data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({ success: true,message:"Testimonial Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const deleted = await Testimonial.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({ success: true,message:"Testimonial Deleted Successfully", });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
