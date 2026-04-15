const CompanyType = require("../models/companyTypeModel");

// Get all active company types (for frontend dropdowns)
exports.getAllCompanyTypes = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const filter = { isActive: true };

    const total = await CompanyType.countDocuments(filter);

    const types = await CompanyType.find(filter)
      .sort({ order: 1, displayName: 1 })
      .skip(skip)
      .limit(limit)
      .select("name displayName description order isActive")
      .lean();

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: types,
    });
  } catch (error) {
    console.error("Error fetching company types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company types",
      error: error.message,
    });
  }
};

// Get single company type by name or ID
exports.getCompanyTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const type = await CompanyType.findById(id).lean();

    if (!type) {
      return res.status(404).json({
        success: false,
        message: "Company type not found",
      });
    }

    res.status(200).json({
      success: true,
      data: type,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching company type",
      error: error.message,
    });
  }
};

// Create new company type (admin only)
exports.createCompanyType = async (req, res) => {
  try {
    const { name, displayName, description, order, isActive = true } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        message: "name and displayName are required",
      });
    }

    const existing = await CompanyType.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Company type with this name already exists",
      });
    }

    const companyType = new CompanyType({
      name: name.toLowerCase().trim(),
      displayName: displayName.trim(),
      description: description?.trim() || "",
      order: Number(order) || 0,
      isActive,
    });

    await companyType.save();

    res.status(201).json({
      success: true,
      message: "Company type created successfully",
      data: companyType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create company type",
      error: error.message,
    });
  }
};

// Update company type
exports.updateCompanyType = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.name) {
      updates.name = updates.name.toLowerCase().trim();
      const existing = await CompanyType.findOne({
        name: updates.name,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Another company type already uses this name",
        });
      }
    }

    const updatedType = await CompanyType.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedType) {
      return res.status(404).json({
        success: false,
        message: "Company type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company type updated successfully",
      data: updatedType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update company type",
      error: error.message,
    });
  }
};

// Soft delete / deactivate
exports.deactivateCompanyType = async (req, res) => {
  try {
    const { id } = req.params;

    const type = await CompanyType.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!type) {
      return res.status(404).json({
        success: false,
        message: "Company type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company type deactivated",
      data: type,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate company type",
      error: error.message,
    });
  }
};

// Optional: Get only names for dropdown (very lightweight)
exports.getCompanyTypeOptions = async (req, res) => {
  try {
    const options = await CompanyType.find({ isActive: true })
      .sort({ order: 1, displayName: 1 })
      .select("name displayName")
      .lean();

    res.status(200).json({
      success: true,
      data: options.map((t) => ({
        value: t._id,
        label: t.displayName,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
