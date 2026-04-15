// controllers/phoneVisibilityController.js
const PhoneVisibility = require("../models/phoneVisibilityModel");

// Get current phone visibility setting for the logged-in user
exports.getPhoneVisibility = async (req, res) => {
  try {
    // Make sure user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const settings = await PhoneVisibility.findOne(
      { user_id: req.user.userId }
    ).lean();

    // If no document exists for this user → return default
    const isPhoneVisible = settings ? settings.is_phone_number_view : true;

    res.status(200).json({
      success: true,
      data: { is_phone_number_view: isPhoneVisible },
    });
  } catch (error) {
    console.error("Get phone visibility error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch phone visibility setting",
      error: error.message,
    });
  }
};

// Update phone visibility (Merchant/Seller only)
exports.updatePhoneVisibility = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "MERCHANT") {
      return res.status(403).json({
        success: false,
        message: "Only Seller can modify this setting",
      });
    }

    const { is_phone_number_view } = req.body;

    if (typeof is_phone_number_view !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_phone_number_view must be a boolean value",
      });
    }

    const updated = await PhoneVisibility.findOneAndUpdate(
      { user_id: req.user.userId },
      { is_phone_number_view },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Phone visibility updated successfully",
      data: {
        is_phone_number_view: updated.is_phone_number_view,
        // optional: you can return more fields if needed
      },
    });
  } catch (error) {
    console.error("Update phone visibility error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating phone visibility",
      error: error.message,
    });
  }
};
