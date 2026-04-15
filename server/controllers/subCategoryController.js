const SubCategory = require("../models/subCategoryModel");
const Category = require("../models/categoryModel");

// Create a new sub-category
exports.createSubCategory = async (req, res) => {
  try {
    const { category_id, sub_category_name, sub_category_image } = req.body;
      const modifiedName=  sub_category_name
  .toLowerCase()
  .replace(/,/g, '') // Remove commas
  .replace(/&/g, 'and') // Replace ampersands
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .replace(/[^\w\-]+/g, '') // Remove special characters
  .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single one
  .trim();
    // Check if the referenced category exists
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category not found" });
    }

    const subCategory = new SubCategory({ category_id, sub_category_name:modifiedName, sub_category_image });
    await subCategory.save();

    res.status(201).json({success:true, message: "Sub-category created successfully", data:subCategory });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};

// Get all sub-categories
// exports.getSubCategories = async (req, res) => {
//   try {
//     const subCategories = await SubCategory.find().populate("category_id", "category_name",).sort({ createdAt: -1 });
//     res.json({success:true,message:"Fetch Sub Category Successfully",data:subCategories});
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.getSubCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {
      sub_category_name: { $regex: search, $options: "i" },
    };

    const subCategories = await SubCategory.find(query)
      .populate("category_id", "category_name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await SubCategory.countDocuments(query);

    res.json({
      success: true,
      message: "Fetched subcategories",
      data: subCategories,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllSubCategoriesForSuperSubCategory = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = category ? { category_id: category } : {};
    const subCategories = await SubCategory.find(filter);

    res.json({
      success: true,
      message: "Sub Categories fetched successfully",
      data: subCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get sub-category by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id).populate("category_id", "category_name");
    if (!subCategory) {
      return res.status(404).json({success:true, message: "Sub-category not found" });
    }
    res.json({success:true,message:"Fetch Sub Category Successfully",data:subCategory});
  } catch (error) {
    res.status(500).json({ success:false,message: error.message });
  }
};

// Update sub-category
exports.updateSubCategory = async (req, res) => {
  try {
    const { category_id, sub_category_name, sub_category_image } = req.body;
      const modifiedName=  sub_category_name
  .toLowerCase()
  .replace(/,/g, '') // Remove commas
  .replace(/&/g, 'and') // Replace ampersands
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .replace(/[^\w\-]+/g, '') // Remove special characters
  .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single one
  .trim();

    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { category_id, sub_category_name:modifiedName, sub_category_image },
      { new: true, runValidators: true }
    );

    if (!subCategory) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    res.json({ success:true,message: "Sub-category updated successfully", subCategory });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};

// Delete sub-category
exports.deleteSubCategory = async (req, res) => {
  try {
    const sub = await SubCategory.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ success: false, message: "Sub-category not found" });
    }

    // <-- THIS triggers findOneAndDelete → hook runs
    await SubCategory.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: "Sub-category deleted successfully" });
  } catch (err) {
    if (err.name === "DeletionRestrictedError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error("Delete sub‑category error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};