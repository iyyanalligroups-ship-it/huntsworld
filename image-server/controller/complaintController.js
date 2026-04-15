const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid"); // Import UUID
const { createEntityFolder, processFile } = require("../utils/FileUpload");

// ✅ Upload multiple images for a complaint
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { entity_type, complaint_name } = req.body;
    if (!entity_type || !complaint_name) {
      return res.status(400).json({ message: "Missing entity type or complaint name" });
    }

    // Replace spaces in complaint_name with underscores
    const sanitizedComplaintName = complaint_name.replace(/\s+/g, "_");

    const uploadPath = createEntityFolder(entity_type, sanitizedComplaintName);
    let fileDetails = [];

    for (let file of req.files) {
      const uniqueFileName = `${uuidv4()}_${file.originalname}`;
      const outputPath = path.join(uploadPath, uniqueFileName);

      const fileUrl = await processFile(
        file.buffer,
        file.mimetype,
        entity_type,
        sanitizedComplaintName,
        uniqueFileName
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

// ✅ Update a file (replace existing for complaint)
const updateImage = async (req, res) => {
  try {
    const { entity_type, complaint_name, old_filenames } = req.body;

    // Validation
    if (!entity_type || !complaint_name || !old_filenames) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Sanitize complaint name to avoid invalid folder names
    const sanitizedComplaintName = complaint_name.replace(/\s+/g, "_");

    // Create or resolve upload path
    const uploadPath = createEntityFolder(entity_type, sanitizedComplaintName);

    // Parse old filenames (either JSON string or array)
    const oldFiles = typeof old_filenames === "string"
      ? JSON.parse(old_filenames)
      : old_filenames;

    // Delete each old file if it exists
    const getFilenameFromUrl = (url) => decodeURIComponent(url.split("/").pop().split("?")[0]);

    oldFiles.forEach((oldFile) => {
      if (oldFile) {
        const filename = getFilenameFromUrl(oldFile);
        console.log(filename,"filename");
        
        const oldFilePath = path.join(uploadPath, filename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    });
    

    // Check for new files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No new files uploaded" });
    }

    const uploadedFiles = [];

    // Upload each file
    for (const file of req.files) {
      const uniqueFileName = `${uuidv4()}_${file.originalname}`;
      const fileUrl = await processFile(
        file.buffer,
        file.mimetype,
        entity_type,
        sanitizedComplaintName,
        uniqueFileName
      );
      uploadedFiles.push(fileUrl);
    }

    // Return success
    res.status(200).json({
      success:true,
      message: "Files updated successfully",
      files: uploadedFiles,
    });

  } catch (error) {
    console.error("File Update Error:", error);
    res.status(500).json({ success:false, message: error.message });
  }
};


// ✅ Delete a file for complaint
const deleteImage = (req, res) => {
  try {
    const { entity_type, complaint_name, filename } = req.body;
    const getFilenameFromUrl = filename?.split("/").pop();
    // Replace spaces in complaint_name with underscores
    const sanitizedComplaintName = complaint_name.replace(/\s+/g, "_");
    // const sanitizedComplaintName = complaint_name

    const filePath = path.join(
      __dirname,
      "../uploads",
      entity_type,
      sanitizedComplaintName,
      getFilenameFromUrl
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({success:true, message: "File deleted successfully" });
    } else {
      return res.status(404).json({success:false, message: "File not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get a file for a complaint (convert to WebP dynamically)
const getImage = (req, res) => {
  const { entity_type, complaint_name, filename } = req.params;

  // Sanitize the entity and complaint names
  const sanitizedEntityType = entity_type.replace(/\s+/g, "_");
  const sanitizedComplaintName = complaint_name.replace(/\s+/g, "_");
  const sanitizedFilename = filename.replace(/\s+/g, "_");

  const filePath = path.join(
    __dirname,
    "../uploads",
    sanitizedEntityType,
    sanitizedComplaintName,
    sanitizedFilename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  const fileExt = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png"].includes(fileExt)) {
    res.setHeader("Content-Type", "image/webp");
    return sharp(filePath).toFormat("webp").pipe(res);
  }

  res.sendFile(filePath);
};

module.exports = {
  uploadImages,
  updateImage,
  deleteImage,
  getImage,
};
