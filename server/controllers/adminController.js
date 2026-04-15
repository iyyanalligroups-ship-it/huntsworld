const Admin = require("../models/adminModel");


// Create a new admin entry
exports.createAdmin = async (req, res) => {
  try {
    const { user_id, is_admin } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const existingAdmin = await Admin.findOne({ user_id });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = new Admin({ user_id, is_admin });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all admin entries
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate("user_id", "name email"); // Assuming User model has name & email
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get admin entry by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate("user_id", "name email");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update admin entry
exports.updateAdminBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    // What frontend actually sends (based on your latest BannerFormModal)
    const updateData = {
      title: req.body.title,
      type: req.body.type,
      imageUrls: req.body.imageUrls,     // ← camelCase – very important!
      link: req.body.link,
      // is_active: req.body.is_active,  ← if you allow changing status here
      // createdBy / updatedBy etc. if you have
    };

    // Remove undefined / empty fields if you want (optional)
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedBanner = await Admin.findByIdAndUpdate(
      bannerId,
      { $set: updateData },           // safer than direct object
      {
        new: true,                    // ← VERY IMPORTANT – return updated doc
        runValidators: true,          // enforce schema rules
        context: 'query'
      }
    );

    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner
    });

  } catch (error) {
    console.error("Update banner error:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating banner",
      error: error.message
    });
  }
};
// Delete admin entry
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
