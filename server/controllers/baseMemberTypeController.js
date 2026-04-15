const BaseMemberType = require("../models/baseMemberTypeModel");
const mongoose = require("mongoose");

exports.getAllBaseMemberTypes = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = (req.query.search || '').trim();

    const skip = (page - 1) * limit;

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const totalRecords = await BaseMemberType.countDocuments(query);
    const types = await BaseMemberType.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      statusCode: 200,
      success: true,
      message: 'Base Member Types fetched successfully',
      data: types,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to fetch base member types",
    });
  }
};

exports.getBaseMemberTypeById = async (req, res) => {
  try {
    const type = await BaseMemberType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Base Member Type not found",
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      message: "Base Member Type fetched successfully",
      data: type,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to fetch base member type",
    });
  }
};

exports.createBaseMemberType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Name is required",
      });
    }

    const newType = new BaseMemberType({ name: name.trim() });
    const savedType = await newType.save();

    res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Base Member Type created successfully",
      data: savedType,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Duplicate name",
      });
    }
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to create base member type",
    });
  }
};

exports.updateBaseMemberType = async (req, res) => {
  try {
    const typeId = req.params.id;
    const updates = req.body;

    const type = await BaseMemberType.findById(typeId);
    if (!type) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Base Member Type not found",
      });
    }

    Object.keys(updates).forEach((key) => {
      type[key] = updates[key];
    });

    type.updatedAt = new Date();

    const updatedType = await type.save();

    return res.json({
      statusCode: 200,
      success: true,
      message: "Base Member Type updated successfully",
      data: updatedType,
    });
  } catch (error) {
    console.error("Update BaseMemberType error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Duplicate name",
      });
    }

    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to update base member type",
    });
  }
};

exports.deleteBaseMemberType = async (req, res) => {
  try {
    const type = await BaseMemberType.findByIdAndDelete(req.params.id);

    if (!type) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Base Member Type not found",
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      message: "Base Member Type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to delete base member type",
    });
  }
};
