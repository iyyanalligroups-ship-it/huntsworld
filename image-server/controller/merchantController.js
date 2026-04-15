const fs = require("fs");
const path = require("path");
const { createEntityFolder, processFile } = require("../utils/FileUpload");

const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const { entity_type, company_name } = req.body;
    if (!entity_type || !company_name) {
      return res.status(400).json({ success: false, message: "Missing entity type or company name" });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, "_");
    const uploadPath = createEntityFolder(entity_type, sanitizedCompanyName);
    let fileDetails = [];

    for (let file of req.files) {
      const originalName = file.originalname.replace(/\s+/g, "_");
      const fileName = `${Date.now()}_${originalName}`;
      const fileUrl = await processFile(
        file.buffer,
        file.mimetype,
        entity_type,
        sanitizedCompanyName,
        fileName
      );
      fileDetails.push({ fileUrl });
    }

    res.status(200).json({
      success: true,
      error: false,
      message: "Files uploaded successfully",
      files: fileDetails,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, error: true, message: error.message || "Server error" });
  }
};

const updateImage = async (req, res) => {
  try {
    const { entity_type, company_name, old_filename } = req.body;
    if (!entity_type || !company_name || !old_filename) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No new file uploaded" });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, "_");
    const uploadPath = createEntityFolder(entity_type, sanitizedCompanyName);
    const oldFilePath = path.join(uploadPath, old_filename);

    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      sanitizedCompanyName,
      fileName
    );

    res.status(200).json({
      success: true,
      message: "File updated successfully",
      fileUrl,
    });
  } catch (error) {
    console.error("File Update Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

const deleteImage = (req, res) => {
  try {
    const { entity_type, company_name, filename } = req.body;
    if (!entity_type || !company_name || !filename) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, "_");
    const filePath = path.join(
      __dirname,
      "../uploads",
      entity_type,
      sanitizedCompanyName,
      filename
    );

    console.log('Attempting to delete file:', filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ success: true, message: "File deleted successfully" });
    } else {
      return res.status(404).json({ success: false, message: "File not found" });
    }
  } catch (error) {
    console.error("Delete Image Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

const getImage = (req, res) => {
  const { entity_type, company_name, filename } = req.params;
  const sanitizedEntityType = entity_type.replace(/\s+/g, "_");
  const sanitizedCompanyName = company_name.replace(/\s+/g, "_");
  const sanitizedFilename = filename.replace(/\s+/g, "_");

  const filePath = path.join(
    __dirname,
    "../uploads",
    sanitizedEntityType,
    sanitizedCompanyName,
    sanitizedFilename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.sendFile(filePath);
};

const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No logo uploaded" });
    }

    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/merchant/logo/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${company_name.replace(/\s+/g, "_")}_logo.webp`;
    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "merchant",
      "logo",
      fileName
    );

    res.status(200).json({
      success: true,
      message: "Company logo uploaded successfully",
      logoUrl,
    });
  } catch (error) {
    console.error("Logo Upload Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

const updateCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No new logo uploaded" });
    }

    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/merchant/logo/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${company_name.replace(/\s+/g, "_")}_logo.webp`;
    const logoPath = path.join(uploadPath, fileName);

    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);

    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "merchant",
      "logo",
      fileName
    );

    res.status(200).json({
      success: true,
      message: "Company logo updated successfully",
      logoUrl,
    });
  } catch (error) {
    console.error("Logo Update Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

const deleteCompanyLogo = (req, res) => {
  try {
    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const sanitizedCompanyName = company_name.replace(/\s+/g, "_");
    const logoPath = path.join(
      __dirname,
      "../uploads/merchant/logo/",
      `${sanitizedCompanyName}_logo.webp`
    );

    console.log('Attempting to delete logo:', logoPath);

    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
      return res.status(200).json({ success: true, message: "Company logo deleted successfully" });
    } else {
      return res.status(404).json({ success: false, message: "Company logo not found" });
    }
  } catch (error) {
    console.error("Delete Logo Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

const getCompanyLogo = (req, res) => {
  const { company_name } = req.params;
  const sanitizedCompanyName = company_name.replace(/\s+/g, "_");
  const logoPath = path.join(
    __dirname,
    "../uploads/merchant/logo/",
    `${sanitizedCompanyName}_logo.webp`
  );

  if (!fs.existsSync(logoPath)) {
    return res.status(404).json({ success: false, message: "Company logo not found" });
  }

  res.sendFile(logoPath);
};

module.exports = {
  uploadImages,
  updateImage,
  deleteImage,
  getImage,
  uploadCompanyLogo,
  updateCompanyLogo,
  deleteCompanyLogo,
  getCompanyLogo,
};
