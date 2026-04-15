const path = require("path");
const fs = require("fs");
const {processFile}= require("../utils/FileUpload");

// 📤 Upload Sub-Category Image
const uploadSubCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { sub_category_name } = req.body;
    if (!sub_category_name) {
      return res.status(400).json({ message: "Sub-category name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/sub_category/images/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${sub_category_name}_image.webp`.replace(/\s+/g, "_");
    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "sub_category",
      "images",
      fileName
    );

    res.status(200).json({
      message: "Sub-category image uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Sub-Category Image Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ♻️ Update Sub-Category Image
const updateSubCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No new image uploaded" });
    }

    const { sub_category_name } = req.body;
    if (!sub_category_name) {
      return res.status(400).json({ message: "Sub-category name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/sub_category/images/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${sub_category_name}_image.webp`.replace(/\s+/g, "_");
    const imagePath = path.join(uploadPath, fileName);

    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "sub_category",
      "images",
      fileName
    );

    res.status(200).json({
      message: "Sub-category image updated successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Sub-Category Image Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Sub-Category Image
const deleteSubCategoryImage = (req, res) => {
  try {
    const { sub_category_name } = req.body;
    console.log(req.body);

    if (!sub_category_name) {
      return res.status(400).json({ message: "Sub-category name is required" });
    }

    // Clean filename: remove spaces, ensure proper format
    const fileName = sub_category_name.trim().replace(/\s+/g, "_");
    const imagePath = path.join(
      __dirname,
      "../uploads/sub_category/images/",
      fileName
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      return res.status(200).json({ message: "Sub-category image deleted successfully" });
    } else {
      return res.status(404).json({ message: "Sub-category image not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📥 Get Sub-Category Image
const getSubCategoryImage = (req, res) => {
  const { sub_category_name } = req.params;

  const fileName = `${sub_category_name}_image.webp`.replace(/\s+/g, "_");
  const imagePath = path.join(
    __dirname,
    "../uploads/sub_category/images/",
    fileName
  );

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ message: "Sub-category image not found" });
  }

  res.sendFile(imagePath);
};

module.exports = {
  uploadSubCategoryImage,
  updateSubCategoryImage,
  deleteSubCategoryImage,
  getSubCategoryImage,
};
