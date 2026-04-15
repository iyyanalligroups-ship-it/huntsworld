const SuperSubCategory = require("../models/superSubCategoryModel");
const SubCategory = require("../models/subCategoryModel");
const Category = require("../models/categoryModel");

// Create a new super sub-category
exports.createSuperSubCategory = async (req, res) => {
  try {
    const { category_id,sub_category_id, super_sub_category_name } = req.body;
      const modifiedName=  super_sub_category_name
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
    // Check if the referenced sub-category exists
    const subCategoryExists = await SubCategory.findById(sub_category_id);
    if (!subCategoryExists) {
      return res.status(400).json({ message: "Sub-category not found" });
    }

    const superSubCategory = new SuperSubCategory({category_id, sub_category_id, super_sub_category_name:modifiedName });
    await superSubCategory.save();

    res.status(201).json({ success:true, message: "Super sub-category created successfully", superSubCategory });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};

// Get all super sub-categories
exports.getSuperSubCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = 10;
    const skip = (page - 1) * limit;

    const [superSubCategories, totalCount] = await Promise.all([
      SuperSubCategory.find()
        .populate("category_id", "category_name")
        .populate("sub_category_id", "sub_category_name")
        .sort({ _id: -1 }) // ✅ descending order (latest first)
        .skip(skip)
        .limit(limit),
      SuperSubCategory.countDocuments()
    ]);

    res.json({
      data: superSubCategories,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalRecords: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllSuperSubCategoriesForDeepSubCategory = async (req, res) => {
  try {
    const { subCategory } = req.query;

    const filter = subCategory ? { sub_category_id: subCategory } : {};
    const superSubCategories = await SuperSubCategory.find(filter)
      .populate("category_id", "category_name")
      .populate("sub_category_id", "sub_category_name");

    res.json({
      success: true,
      message: "Super Sub Categories fetched successfully",
      data: superSubCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get super sub-category by ID
exports.getSuperSubCategoryById = async (req, res) => {
  try {
    const superSubCategory = await SuperSubCategory.findById(req.params.id)
      .populate("category_id", "category_name")
      .populate("sub_category_id", "sub_category_name");

    if (!superSubCategory) {
      return res.status(404).json({ message: "Super sub-category not found" });
    }

    res.json(superSubCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update super sub-category
exports.updateSuperSubCategory = async (req, res) => {
  try {
    const {category_id, sub_category_id, super_sub_category_name } = req.body;
      const modifiedName=  super_sub_category_name
  .toLowerCase()
  .replace(/,/g, '') // Remove commas
  .replace(/&/g, 'and') // Replace ampersands
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .replace(/[^\w\-]+/g, '') // Remove special characters
  .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single one
  .trim();

    const superSubCategory = await SuperSubCategory.findByIdAndUpdate(
      req.params.id,
      { category_id,sub_category_id, super_sub_category_name:modifiedName },
      { new: true, runValidators: true }
    );

    if (!superSubCategory) {
      return res.status(404).json({ message: "Super sub-category not found" });
    }
    res.json({success:true, message: "Super sub-category updated successfully", superSubCategory });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};

// Delete super sub-category
exports.deleteSuperSubCategory = async (req, res) => {
  try {
    const sup = await SuperSubCategory.findById(req.params.id);
    if (!sup) {
      return res.status(404).json({ success: false, message: "Super sub-category not found" });
    }

    // This triggers findOneAndDelete → hook runs
    await SuperSubCategory.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: "Super sub-category deleted successfully" });
  } catch (err) {
    if (err.name === "DeletionRestrictedError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error("Delete super sub-category error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};