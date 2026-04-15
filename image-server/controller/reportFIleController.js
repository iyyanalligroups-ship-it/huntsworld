// controller/fileController.js
const { processFile } = require("../utils/FileUpload");

const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const { entity_type, user_id } = req.body;

    if (!entity_type || !user_id) {
      return res.status(400).json({ success: false, message: "entity_type and user_id are required" });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileUrl = await processFile(
        file.buffer,
        file.mimetype,
        entity_type,
        user_id,
        file.originalname
      );
      uploadedFiles.push({ fileUrl });
    }

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ success: false, message: "fileUrl required" });

    const urlPath = new URL(fileUrl).pathname; // /uploads/reports/123/1234567890_image.webp
    const filePath = path.join(__dirname, "..", urlPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: "File deleted" });
    } else {
      return res.status(404).json({ success: false, message: "File not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadFiles, deleteFile };
