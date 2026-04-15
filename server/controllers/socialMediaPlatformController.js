// controllers/platformController.js
const Platform = require('../models/socialMediaPlatformModel');

// @desc    Get all platforms (active ones by default for public use)
// @route   GET /api/platforms
const getPlatforms = async (req, res) => {
  try {
    const platforms = await Platform.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: platforms.length,
      data: platforms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching platforms',
      error: error.message,
    });
  }
};

// @desc    Get ALL platforms (including inactive) – for admin
// @route   GET /api/platforms/admin
const getAllPlatforms = async (req, res) => {
  try {
    const platforms = await Platform.find()
      .sort({ order: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: platforms.length,
      data: platforms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single platform
// @route   GET /api/platforms/:id
const getPlatformById = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found',
      });
    }

    res.status(200).json({
      success: true,
      data: platform,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create new platform
// @route   POST /api/platforms
const createPlatform = async (req, res) => {
  try {
    const { name, iconName, isActive, order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Platform name is required',
      });
    }

    // Check for duplicate name (case-insensitive)
    const existing = await Platform.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Platform with this name already exists',
      });
    }

    const platform = await Platform.create({
      name,
      iconName: iconName || 'link',
      isActive: isActive !== undefined ? isActive : true,
      order: order || 999,
    });

    res.status(201).json({
      success: true,
      message: 'Platform created successfully',
      data: platform,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create platform',
      error: error.message,
    });
  }
};

// @desc    Update platform
// @route   PUT /api/platforms/:id
const updatePlatform = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found',
      });
    }

    const { name, iconName, isActive, order } = req.body;

    // If name is being changed → check for conflict
    if (name && name.toLowerCase() !== platform.name.toLowerCase()) {
      const conflict = await Platform.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: platform._id },
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Another platform with this name already exists',
        });
      }

      platform.name = name;
    }

    if (iconName !== undefined) platform.iconName = iconName;
    if (isActive !== undefined) platform.isActive = isActive;
    if (order !== undefined) platform.order = order;

    const updated = await platform.save();

    res.status(200).json({
      success: true,
      message: 'Platform updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update platform',
      error: error.message,
    });
  }
};

// @desc    Delete platform
// @route   DELETE /api/platforms/:id
const deletePlatform = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found',
      });
    }

    // Optional: check if any social link is using this platform
    const SocialMedia = require('../models/socialMediaModel');
    const used = await SocialMedia.findOne({ platform: platform._id });

    if (used) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete platform because it is being used by a social media link. Delete or reassign the link first.',
      });
    }

    await platform.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Platform deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete platform',
      error: error.message,
    });
  }
};

module.exports = {
  getPlatforms,
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
};
