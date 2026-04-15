const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { processFile } = require("../utils/FileUpload");

/**
 * 📤 Upload Banner Images (Multiple)
 */
exports.uploadBannerImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const imageUrls = await Promise.all(
      req.files.map((file) => {
        const filename = `banner_${uuidv4()}.webp`;
        return processFile(
          file.buffer,
          file.mimetype,
          "admin-banner",
          "global",
          filename
        );
      })
    );

    res.status(200).json({
      success: true,
      message: "Banner images uploaded successfully",
      imageUrls,
    });
  } catch (error) {
    console.error("Upload Banner Image Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ♻️ Replace Banner Images (Delete old + upload new)
 */
exports.updateBannerImages = async (req, res) => {
  try {
    const { old_images = [] } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No new images uploaded" });
    }

    // Delete old images
    if (Array.isArray(old_images)) {
      old_images.forEach((url) => {
        const filePath = path.join(
          __dirname,
          "..",
          url.replace(process.env.SERVER_URL, "")
        );
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    const imageUrls = await Promise.all(
      req.files.map((file) => {
        const filename = `banner_${uuidv4()}.webp`;
        return processFile(
          file.buffer,
          file.mimetype,
          "admin-banner",
          "global",
          filename
        );
      })
    );

    res.status(200).json({
      success: true,
      message: "Banner images updated successfully",
      imageUrls,
    });
  } catch (error) {
    console.error("Update Banner Image Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ❌ Delete Banner Images (single / multiple)
 */
exports.deleteBannerImages = async (req, res) => {
  try {
    const { image_urls } = req.body;

    if (!Array.isArray(image_urls) || image_urls.length === 0) {
      return res.status(400).json({ message: "image_urls array required" });
    }

    const deleted = [];

    image_urls.forEach((url) => {
      const filePath = path.join(
        __dirname,
        "..",
        url.replace(process.env.SERVER_URL, "")
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted.push(url);
      }
    });

    res.status(200).json({
      success: true,
      message: "Banner images deleted successfully",
      deleted,
    });
  } catch (error) {
    console.error("Delete Banner Image Error:", error);
    res.status(500).json({ message: error.message });
  }
};
