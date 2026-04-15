const fs = require("fs");
const path = require("path");
const { createEntityFolder, processFile } = require("../utils/FileUpload");

const uploadBrandImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { entity_type, company_name } = req.body;

    if (!entity_type || !company_name) {
      return res.status(400).json({ message: "Missing entity type or company name" });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      company_name,
      fileName
    );

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: { fileUrl },
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBrandImage = async (req, res) => {
  try {
    const { entity_type, company_name, old_filename } = req.body;

    if (!entity_type || !company_name || !old_filename) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No new file uploaded" });
    }

    const uploadPath = createEntityFolder(entity_type, company_name);
    const oldFilePath = path.join(uploadPath, old_filename);

    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const newFilePath = path.join(uploadPath, fileName);

    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      company_name,
      fileName
    );

    res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: { fileUrl },
    });
  } catch (error) {
    console.error("File Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBrandImage = async (req, res) => {
  try {
    const { entity_type, company_name, filename } = req.body;

    const filePath = path.join(
      __dirname,
      "../uploads",
      entity_type,
      company_name,
      filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ success: true, message: "Image deleted successfully" });
    } else {
      return res.status(404).json({ success: false, message: "Image not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBrandImage = (req, res) => {
  const { entity_type, company_name, filename } = req.params;
  const filePath = path.join(
    __dirname,
    "../uploads",
    entity_type,
    company_name,
    filename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "Image not found" });
  }

  const fileExt = path.extname(filename).toLowerCase();
  if ([".jpg", ".png", ".jpeg"].includes(fileExt)) {
    res.setHeader("Content-Type", "image/webp");
    return sharp(filePath).toFormat("webp").pipe(res);
  }

  res.sendFile(filePath);
};

module.exports = { uploadBrandImage, updateBrandImage, deleteBrandImage, getBrandImage };