const DeepSubCategory = require("../models/deepSubCategoryModel");
const SuperSubCategory = require("../models/superSubCategoryModel");

// Create a new deep sub-category
exports.createDeepSubCategory = async (req, res) => {
  try {
    const {
      category_id,
      sub_category_id,
      super_sub_category_id,
      deep_sub_category_name,
      deep_sub_category_image,
    } = req.body;
      const modifiedName=  deep_sub_category_name
  .toLowerCase()
  .replace(/,/g, '') // Remove commas
  .replace(/&/g, 'and') // Replace ampersands
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .replace(/[^\w\-]+/g, '') // Remove special characters
  .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single one
  .trim();
    // Check if the referenced super sub-category exists
    const superSubCategoryExists = await SuperSubCategory.findById(
      super_sub_category_id
    );
    if (!superSubCategoryExists) {
      return res.status(400).json({ message: "Super sub-category not found" });
    }

    const deepSubCategory = new DeepSubCategory({
      category_id,
      sub_category_id,
      super_sub_category_id,
      deep_sub_category_name:modifiedName,
      deep_sub_category_image,
    });
    await deepSubCategory.save();

    res.status(201).json({
      success:true,
      message: "Deep sub-category created successfully",
      deepSubCategory,
    });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};

// Get all deep sub-categories
exports.getDeepSubCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      deep_sub_category_name: { $regex: search, $options: "i" }, // case-insensitive search
    };

    const [deepSubCategories, totalCount] = await Promise.all([
      DeepSubCategory.find(query)
        .populate("super_sub_category_id", "super_sub_category_name")
        .populate("sub_category_id", "sub_category_name")
        .populate("category_id", "category_name")
        .sort({ _id: -1 }) // ✅ descending order (latest first)
        .skip(skip)
        .limit(limit),
      DeepSubCategory.countDocuments(query),
    ]);

    res.json({
      data: deepSubCategories,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalRecords: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getAllDeepSubCategoriesForProduct = async (req, res) => {
  try {
    const { superSubCategory } = req.query;

    const filter = superSubCategory ? { super_sub_category_id: superSubCategory } : {};
    const deepSubCategories = await DeepSubCategory.find(filter)
      .populate("category_id", "category_name")
      .populate("sub_category_id", "sub_category_name")
      .populate("super_sub_category_id", "super_sub_category_name");

    res.json({
      success: true,
      message: "Deep Sub Categories fetched successfully",
      data: deepSubCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Get deep sub-category by ID
exports.getDeepSubCategoryById = async (req, res) => {
  try {
    const deepSubCategory = await DeepSubCategory.findById(req.params.id)
      .populate("super_sub_category_id", "super_sub_category_name")
      .populate("sub_category_id", "sub_category_name")
      .populate("category_id", "category_name");
    if (!deepSubCategory) {
      return res.status(404).json({ message: "Deep sub-category not found" });
    }
    res.json(deepSubCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update deep sub-category
exports.updateDeepSubCategory = async (req, res) => {
  try {
    const {
      category_id,
      sub_category_id,
      super_sub_category_id,
      deep_sub_category_name,
      deep_sub_category_image,
    } = req.body;
  const modifiedName=  deep_sub_category_name
  .toLowerCase()
  .replace(/,/g, '') // Remove commas
  .replace(/&/g, 'and') // Replace ampersands
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .replace(/[^\w\-]+/g, '') // Remove special characters
  .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single one
  .trim();
    const deepSubCategory = await DeepSubCategory.findByIdAndUpdate(
      req.params.id,
      {
        category_id,
        sub_category_id,
        super_sub_category_id,
        deep_sub_category_name:modifiedName,
        deep_sub_category_image,
      },
      { new: true, runValidators: true }
    );

    if (!deepSubCategory) {
      return res.status(404).json({ message: "Deep sub-category not found" });
    }
    res.json({
      success:true,
      message: "Deep sub-category updated successfully",
      deepSubCategory,
    });
  } catch (error) {
    res.status(500).json({ success:false, message: error.message });
  }
};

// Delete deep sub-category
exports.deleteDeepSubCategory = async (req, res) => {
  try {
    const deepSubCategory = await DeepSubCategory.findByIdAndDelete(
      req.params.id
    );
    if (!deepSubCategory) {
      return res.status(404).json({ message: "Deep sub-category not found" });
    }
    res.json({success:true, message: "Deep sub-category deleted successfully" });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};
