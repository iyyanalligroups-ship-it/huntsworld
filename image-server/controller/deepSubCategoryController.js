const path = require("path");
const fs = require("fs");
const {processFile} = require("../utils/FileUpload");

// 📤 Upload Deep Sub-Category Image
const uploadDeepSubCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { deep_sub_category_name } = req.body;
    if (!deep_sub_category_name) {
      return res.status(400).json({ message: "Deep Sub-category name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/deep_sub_category/images/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${deep_sub_category_name}_image.webp`.replace(/\s+/g, "_");
    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "deep_sub_category",
      "images",
      fileName
    );

    res.status(200).json({
      message: "Deep Sub-category image uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ♻️ Update Deep Sub-Category Image
const updateDeepSubCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No new image uploaded" });
    }

    const { deep_sub_category_name } = req.body;
    if (!deep_sub_category_name) {
      return res.status(400).json({ message: "Deep Sub-category name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/deep_sub_category/images/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${deep_sub_category_name}_image.webp`.replace(/\s+/g, "_");
    const imagePath = path.join(uploadPath, fileName);

    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "deep_sub_category",
      "images",
      fileName
    );

    res.status(200).json({
      message: "Deep Sub-category image updated successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Deep Sub-Category Image
const deleteDeepSubCategoryImage = (req, res) => {
  try {
    const { deep_sub_category_name } = req.body;
    if (!deep_sub_category_name) {
      return res.status(400).json({ message: "Image file name is required" });
    }

    // Ensure only filename (no path traversal)
    const safeFileName = path.basename(deep_sub_category_name).replace(/\s+/g, "_");

    const imagePath = path.join(
      __dirname,
      "../uploads/deep_sub_category/images/",
      safeFileName
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      return res.status(200).json({ message: "Image deleted successfully" });
    } else {
      return res.status(404).json({ message: "Image not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📥 Get Deep Sub-Category Image
const getDeepSubCategoryImage = (req, res) => {
  const { deep_sub_category_name } = req.params;

  const fileName = `${deep_sub_category_name}_image.webp`.replace(/\s+/g, "_");
  const imagePath = path.join(
    __dirname,
    "../uploads/deep_sub_category/images/",
    fileName
  );

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ message: "Image not found" });
  }

  res.sendFile(imagePath);
};

module.exports = {
  uploadDeepSubCategoryImage,
  updateDeepSubCategoryImage,
  deleteDeepSubCategoryImage,
  getDeepSubCategoryImage,
};
