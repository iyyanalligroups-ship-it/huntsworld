const Access = require("../models/accessModel");

// Create a new access entry
exports.createAccess = async (req, res) => {
  try {
    const { user_id, is_category } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const existingAccess = await Access.findOne({ user_id });
    if (existingAccess) {
      return res.status(400).json({ message: "Access already exists for this user" });
    }

    const access = new Access({ user_id, is_category });
    await access.save();

    res.status(201).json({ message: "Access created successfully", access });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all access entries
exports.getCategoryAccess = async (req, res) => {
  try {
    // const { user_id } = req.params;
    const access = await Access.find();
    const is_category = access.length > 0 ? access[0].is_category : false;

    return res.status(200).json({
      success: true,
      message: "Access settings retrieved successfully.",
      data: { is_category },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch access settings.",
      error: error.message,
    });
  }
};

// Get access entry by ID
exports.getAccessById = async (req, res) => {
  try {
    const access = await Access.findById(req.params.id).populate("user_id", "name email");
    if (!access) {
      return res.status(404).json({ message: "Access entry not found" });
    }
    res.json(access);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update access entry
exports.updateAccess = async (req, res) => {
  try {
    const { is_category } = req.body;

    const access = await Access.findByIdAndUpdate(
      req.params.id,
      { is_category },
      { new: true, runValidators: true }
    );

    if (!access) {
      return res.status(404).json({ message: "Access entry not found" });
    }
    res.json({ message: "Access updated successfully", access });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete access entry
exports.deleteAccess = async (req, res) => {
  try {
    const access = await Access.findByIdAndDelete(req.params.id);
    if (!access) {
      return res.status(404).json({ message: "Access entry not found" });
    }
    res.json({ message: "Access entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategoryAccess = async (req, res) => {
  try {
    const { user_id, is_category } = req.body;

    // Role check (requires middleware to attach req.user)
    const currentUserRole = req.user?.role;
    if (currentUserRole !== "ADMIN" && currentUserRole !== "SUB_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access. Only admins and sub-admins can update access settings.",
      });
    }

    // Upsert access: create if doesn't exist, else update the global one
    let updatedAccess = await Access.findOne();
    if (updatedAccess) {
      updatedAccess.is_category = is_category;
      await updatedAccess.save();
    } else {
      updatedAccess = await Access.create({ user_id, is_category });
    }

    return res.status(200).json({
      success: true,
      message: "Category access updated successfully.",
      data: updatedAccess,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating access settings.",
      error: error.message,
    });
  }
};
