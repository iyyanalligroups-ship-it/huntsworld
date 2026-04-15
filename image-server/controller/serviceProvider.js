const fs = require("fs");
const path = require("path");
const { createEntityFolder, processFile } = require("../utils/FileUpload");

// 📌 Upload multiple files with compression
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { entity_type, company_name } = req.body;
    if (!entity_type || !company_name) {
      return res
        .status(400)
        .json({ message: "Missing entity type or company name" });
    }

    // ✅ Sanitize company name by replacing spaces with underscores
    const sanitizedCompanyName = company_name.replace(/\s+/g, "_");

    const uploadPath = createEntityFolder(entity_type, sanitizedCompanyName);
    let fileDetails = [];

    for (let file of req.files) {
      const sanitizedOriginalName = file.originalname.replace(/\s+/g, "_");
      const fileName = `${Date.now()}_${sanitizedOriginalName}`;
      const outputPath = path.join(uploadPath, fileName);

      // ✅ Use sanitizedCompanyName while processing the file
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
    res.status(500).json({
      error: true,
      success: false,
      message: error.message,
    });
  }
};


// ✅ Update a file (replace existing)
const updateImage = async (req, res) => {
  try {
    const { entity_type, company_name, old_filename } = req.body;

    if (!entity_type || !company_name || !old_filename) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No new file uploaded" });
    }

    // ✅ Create entity folder if it doesn't exist
    const uploadPath = createEntityFolder(entity_type, company_name);

    const oldFilePath = path.join(uploadPath, old_filename);

    // ✅ Delete old file if it exists
    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const newFilePath = path.join(uploadPath, fileName);

    // ✅ Process & store the new file
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      company_name,
      fileName
    );

    res.status(200).json({
      message: "File updated successfully",
      fileUrl, // ✅ Return public URL instead of local path
    });
  } catch (error) {
    console.error("File Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a file
const deleteImage = (req, res) => {
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
      return res.status(200).json({ message: "File deleted successfully" });
    } else {
      return res.status(404).json({ message: "File not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get a file (Convert images to WebP dynamically)
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
    return res.status(404).json({ message: "File not found" });
  }

  const fileExt = path.extname(filename).toLowerCase();
  if ([".jpg", ".png", ".jpeg"].includes(fileExt)) {
    res.setHeader("Content-Type", "image/webp");
    return sharp(filePath).toFormat("webp").pipe(res);
  }

  res.sendFile(filePath);
};

//company logo

const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No logo uploaded" });
    }

    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/merchant/logo/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${company_name}_logo.webp`; 
    const sanitizedFileName = fileName.replace(/\s+/g, "_");
    const logoPath = path.join(uploadPath, fileName);

    // ✅ Pass correct arguments to processFile()
    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "service_provider",
      "logo",
      sanitizedFileName
    );

    res.status(200).json({
      message: "Company logo uploaded successfully",
      logoUrl, // ✅ Return public URL instead of local path
    });
  } catch (error) {
    console.error("Logo Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Company Logo
const updateCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No new logo uploaded" });
    }

    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/merchant/logo/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${company_name}_logo.webp`;
    const logoPath = path.join(uploadPath, fileName);

    // ✅ Delete old logo if it exists
    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);

    // ✅ Process and store the new logo
    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "service_provider",
      "logo",
      fileName
    );

    res.status(200).json({
      message: "Company logo updated successfully",
      logoUrl, // ✅ Return public URL instead of local path
    });
  } catch (error) {
    console.error("Logo Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Company Logo
const deleteCompanyLogo = (req, res) => {
  try {
    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const logoPath = path.join(
      __dirname,
      "../uploads/service_provider/logo/",
      company_name + "_logo.webp"
    );

    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
      return res
        .status(200)
        .json({ message: "Company logo deleted successfully" });
    } else {
      return res.status(404).json({ message: "Company logo not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get Company Logo
const getCompanyLogo = (req, res) => {
  const { company_name } = req.params;
  const sanitizedCompanyName = company_name.replace(/\s+/g, "_");
  const logoPath = path.join(
    __dirname,
    "../uploads/service_provider/logo/",
    sanitizedCompanyName + "_logo.webp"
  );

  if (!fs.existsSync(logoPath)) {
    return res.status(404).json({ message: "Company logo not found" });
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