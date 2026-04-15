const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createEntityFolder, processFile } = require("../utils/FileUpload");

const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { entity_type, shop_name } = req.body;
    if (!entity_type || !shop_name) {
      return res.status(400).json({ message: "Missing entity type or shop name" });
    }

    const sanitizedShopName = shop_name.replace(/\s+/g, "_");
    const uploadPath = createEntityFolder(entity_type, sanitizedShopName);
    let fileDetails = [];

    for (let file of req.files) {
      const originalName = file.originalname.replace(/\s+/g, "_");
      const fileName = `${Date.now()}_${originalName}`;
      const outputPath = path.join(uploadPath, fileName);

      const fileUrl = await processFile(
        file.buffer,
        file.mimetype,
        entity_type,
        sanitizedShopName,
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
    res.status(500).json({ error: true, success: false, message: error.message });
  }
};

const updateImage = async (req, res) => {
  try {
    const { entity_type, shop_name, old_filename } = req.body;

    if (!entity_type || !shop_name || !old_filename) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No new file uploaded" });
    }

    const uploadPath = createEntityFolder(entity_type, shop_name);
    const oldFilePath = path.join(uploadPath, old_filename);

    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const newFilePath = path.join(uploadPath, fileName);

    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      shop_name,
      fileName
    );

    res.status(200).json({
      message: "File updated successfully",
      fileUrl,
    });
  } catch (error) {
    console.error("File Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteImage = (req, res) => {
  try {
    // 1. We only need shop_name and filename.
    // We do NOT accept 'entity_type' from the user (Security Risk).
    const { shop_name, filename } = req.body;

    if (!shop_name || !filename) {
      return res.status(400).json({ message: "Shop name and filename are required" });
    }

    // 2. Construct the path safely
    // Adjust "../uploads/grocery-seller-images/" to match your actual server folder structure
    const baseDir = path.join(__dirname, "../uploads/grocery-seller-images");
    const filePath = path.join(baseDir, shop_name, filename);

    console.log("Attempting to delete:", filePath);

    // 3. Check and Delete
    if (fs.existsSync(filePath)) {
      // Use async unlink (better for server performance than unlinkSync)
      fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error deleting file from disk" });
        }
        return res.status(200).json({ message: "File deleted successfully" });
      });
    } else {
      // If file doesn't exist on disk, we still return 200 or 404.
      // Often returning 200 is safer so the frontend removes the broken link.
      return res.status(404).json({ message: "File not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during deletion" });
  }
};

const getImage = (req, res) => {
  const { entity_type, shop_name, filename } = req.params;
  const filePath = path.join(__dirname, "../uploads", entity_type, shop_name, filename);

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

const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No logo uploaded" });
    }

    const { shop_name } = req.body;
    if (!shop_name) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/grocery-seller/logo/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${shop_name}_logo.webp`;
    const sanitizedFileName = fileName.replace(/\s+/g, "_");
    const logoPath = path.join(uploadPath, fileName);

    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "grocery-seller",
      "logo",
      sanitizedFileName
    );

    res.status(200).json({
      message: "Shop logo uploaded successfully",
      logoUrl,
    });
  } catch (error) {
    console.error("Logo Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No new logo uploaded" });
    }

    const { shop_name } = req.body;
    if (!shop_name) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    const uploadPath = path.join(__dirname, "../uploads/grocery-seller/logo/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${shop_name}_logo.webp`;
    const logoPath = path.join(uploadPath, fileName);

    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);

    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "grocery-seller",
      "logo",
      fileName
    );

    res.status(200).json({
      message: "Shop logo updated successfully",
      logoUrl,
    });
  } catch (error) {
    console.error("Logo Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteCompanyLogo = (req, res) => {
  // 1. Extract shop_name from the request body
  const { shop_name } = req.body;


  if (!shop_name) {
    return res.status(400).json({ message: "Shop name is required" });
  }

  // 2. Construct the path EXACTLY the same way you do in 'getCompanyLogo'
  // Note: Ensure the folder structure matches your GET request logic
  const logoPath = path.join(__dirname, "../uploads/grocery-seller/logo/", `${shop_name}_logo.webp`);

  console.log("Attempting to delete:", logoPath);

  // 3. Check if file exists
  if (!fs.existsSync(logoPath)) {
    // Optional: Return 200 even if not found, to clear the frontend state
    return res.status(404).json({ message: "Logo file not found" });
  }

  // 4. Delete the file
  fs.unlink(logoPath, (err) => {
    if (err) {
      console.error("File deletion error:", err);
      return res.status(500).json({ message: "Could not delete file from server" });
    }

    return res.status(200).json({ message: "Logo deleted successfully" });
  });
};

const getCompanyLogo = (req, res) => {
  const { shop_name } = req.params;
  const logoPath = path.join(__dirname, "../uploads/grocery-seller/logo/", shop_name + "_logo.webp");

  if (!fs.existsSync(logoPath)) {
    return res.status(404).json({ message: "Shop logo not found" });
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
