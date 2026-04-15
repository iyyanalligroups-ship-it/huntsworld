const express = require("express");
const router = express.Router();
const {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonialController");

router.post("/create-testimonial", createTestimonial);
router.get("/fetch-all-testimonial", getTestimonials);
router.get("/fetch-all-testimonial-by-id/:id", getTestimonialById);
router.put("/update-testimonial/:id", updateTestimonial);
router.delete("/delete-testimonial/:id", deleteTestimonial);

module.exports = router;
