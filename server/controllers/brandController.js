const Brand = require('../models/brandModel');

exports.getBrands = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const brands = await Brand.find()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Brand.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: brands,
      pagination: { currentPage: page, totalPages, totalItems: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const { brand_name, image_url, link } = req.body;

    if (!brand_name || !image_url || !link) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const brand = new Brand({ brand_name, image_url, link });
    await brand.save();

    res.status(201).json({ success: true, message: "Brand created successfully", data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_name, image_url, link } = req.body;

    if (!brand_name || !image_url || !link) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      { brand_name, image_url, link, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    res.status(200).json({ success: true, message: "Brand updated successfully", data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    res.status(200).json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBrandsForLanding = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const brands = await Brand.find().skip(skip).limit(limit);
    const total = await Brand.countDocuments();

    res.json({
      success: true,
      data: brands,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};