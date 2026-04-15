const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    feedbackType: {
      type: String,
      enum: [
        "suggestions",
        "applications",
        "bug_error_report",
        "purchase_requirement",
        "complaint",
        "intrested_in_services",
        "others",
      ],
      required: true,
    },
    comments: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
