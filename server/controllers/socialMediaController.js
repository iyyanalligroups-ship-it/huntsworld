// File: controllers/socialMediaController.js

const SocialMedia = require("../models/socialMediaModel");
const Platform = require("../models/socialMediaPlatformModel"); // if needed for extra validation
const mongoose=require('mongoose');
// @desc    Get all active social media links (public / frontend use)
// @route   GET /api/social-media
exports.getSocialMedia = async (req, res) => {
  try {
    const socials = await SocialMedia
      .find({ isEnabled: true })
      .populate("platform", "name iconName") // automatically populated thanks to pre-hook, but explicit for clarity
      .select("platform url") // only send what's needed
      .lean();

    // Optional: sort by platform.order if you want ordered display
    // socials.sort((a, b) => (a.platform?.order || 999) - (b.platform?.order || 999));

    res.status(200).json({
      success: true,
      message: "Social media links retrieved successfully",
      data: socials,
    });
  } catch (error) {
    console.error("getSocialMedia error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching social media links",
      error: error.message,
    });
  }
};

// @desc    Create a new social media link
// @route   POST /api/social-media
// @body    { platform: "platform_id", url: "https://..." }
exports.createSocialMedia = async (req, res) => {
  try {
    const { platform, url } = req.body;

    if (!platform || !mongoose.isValidObjectId(platform)) {
      return res.status(400).json({
        success: false,
        message: "Valid platform ID is required",
      });
    }

    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // Check if this platform already has a link
    const existing = await SocialMedia.findOne({ platform });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A social media link for this platform already exists. Please update the existing one.",
      });
    }

    // Optional: verify platform exists and is active
    const platformDoc = await Platform.findById(platform);
    if (!platformDoc || !platformDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected platform is invalid or not active",
      });
    }

    const socialLink = await SocialMedia.create({
      platform,
      url: url.trim(),
    });

    // Populate before sending response
    await socialLink.populate("platform", "name iconName");

    res.status(201).json({
      success: true,
      message: "Social media link created successfully",
      data: socialLink,
    });
  } catch (error) {
    console.error("createSocialMedia error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create social media link",
      error: error.message,
    });
  }
};

// @desc    Update an existing social media link
// @route   PUT /api/social-media/:id
// @body    { url?: "...", platform?: "new_platform_id" }
exports.updateSocialMedia = async (req, res) => {
  try {
    const { url, platform } = req.body;

    const socialLink = await SocialMedia.findById(req.params.id);
    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social media link not found",
      });
    }

    // Update fields only if provided
    if (url !== undefined && url.trim()) {
      socialLink.url = url.trim();
    }

    // Allow changing platform only if not creating duplicate
    if (platform && platform !== socialLink.platform.toString()) {
      if (!mongoose.isValidObjectId(platform)) {
        return res.status(400).json({
          success: false,
          message: "Invalid platform ID",
        });
      }

      const exists = await SocialMedia.findOne({ platform });
      if (exists && exists._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: "This platform already has a linked social media account",
        });
      }

      // Optional: check if new platform exists and is active
      const platformDoc = await Platform.findById(platform);
      if (!platformDoc || !platformDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected platform is invalid or not active",
        });
      }

      socialLink.platform = platform;
    }

    const updatedLink = await socialLink.save();

    // Populate before response
    await updatedLink.populate("platform", "name iconName");

    res.status(200).json({
      success: true,
      message: "Social media link updated successfully",
      data: updatedLink,
    });
  } catch (error) {
    console.error("updateSocialMedia error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update social media link",
      error: error.message,
    });
  }
};

// @desc    Delete a social media link
// @route   DELETE /api/social-media/:id
exports.deleteSocialMedia = async (req, res) => {
  try {
    const socialLink = await SocialMedia.findById(req.params.id);
    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social media link not found",
      });
    }

    await socialLink.deleteOne();

    res.status(200).json({
      success: true,
      message: "Social media link deleted successfully",
    });
  } catch (error) {
    console.error("deleteSocialMedia error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete social media link",
      error: error.message,
    });
  }
};
