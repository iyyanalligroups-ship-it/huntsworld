const mongoose = require("mongoose");

const socialMediaSchema = mongoose.Schema(
  {
    platform: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Platform",
      required: true,
      unique: true, // still enforce one link per platform
    },
    url: {
      type: String,
      required: [true, "Please enter the profile URL"],
      trim: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Optional: populate platform automatically in queries
socialMediaSchema.pre(/^find/, function (next) {
  this.populate({
    path: "platform",
    select: "name iconName",
  });
  next();
});

module.exports = mongoose.model("SocialMedia", socialMediaSchema);
