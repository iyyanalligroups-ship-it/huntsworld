const path = require("path");
const fs = require("fs");
const {processFile} = require("../utils/FileUpload"); // make sure this handles image upload logic

// 📤 Upload Category Image
const uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/category/images/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${category_name}_image.webp`.replace(/\s+/g, "_");
    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "category",
      "images",
      fileName
    );

    res.status(200).json({
      message: "Category image uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Category Image Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ♻️ Update Category Image
const updateCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No new image uploaded" });
    }

    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/category/images/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${category_name}_image.webp`.replace(/\s+/g, "_");
    const imagePath = path.join(uploadPath, fileName);

    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "category",
      "images",
      fileName
    );

    res.status(200).json({
      message: "Category image updated successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Category Image Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Category Image
const deleteCategoryImage = (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const fileName = category_name.replace(/\s+/g, "_"); // ✅ don't append anything
    const imagePath = path.join(
      __dirname,
      "../uploads/category/images/",
      fileName
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      return res.status(200).json({ message: "Category image deleted successfully" });
    } else {
      return res.status(404).json({ message: "Category image not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📥 Get Category Image
const getCategoryImage = (req, res) => {
  const { category_name } = req.params;

  const fileName = `${category_name}_image.webp`.replace(/\s+/g, "_");
  const imagePath = path.join(
    __dirname,
    "../uploads/category/images/",
    fileName
  );

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ message: "Category image not found" });
  }

  res.sendFile(imagePath);
};

module.exports = {
  uploadCategoryImage,
  updateCategoryImage,
  deleteCategoryImage,
  getCategoryImage
};
