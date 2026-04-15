const path = require("path");
const fs = require("fs");
const { processFile ,compressAudio} = require("../utils/FileUpload");
const { v4: uuidv4 } = require("uuid");

// 🔼 Upload Chat File (any type)
const uploadChatFile = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender and Receiver IDs are required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const folderName = `${senderId}_${receiverId}`;
    const uploadPromises = req.files.map(async (file) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      const url = await processFile(file.buffer, file.mimetype, "chat", folderName, uniqueName);
      return url;
    });

    const fileUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      message: "Files uploaded successfully",
      fileUrls,
    });
  } catch (error) {
    console.error("Chat File Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📥 Get Chat File
const getChatFile = (req, res) => {
  const { folderName, fileName } = req.params;
  const filePath = path.join(__dirname, "../uploads/chat/", folderName, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.sendFile(filePath);
};

const updateChatFile = async (req, res) => {
    try {
      const { senderId, receiverId, oldFileName } = req.body;
  
      if (!senderId || !receiverId || !oldFileName) {
        return res.status(400).json({ message: "Sender ID, Receiver ID, and old file name are required" });
      }
  
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No new file uploaded" });
      }
  
      const folderName = `${senderId}_${receiverId}`;
      const folderPath = path.join(__dirname, "../uploads/chat/", folderName);
  
      // Delete old file
      const oldFilePath = path.join(folderPath, oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
  
      // Upload new file
      const file = req.files[0]; // Assume one file for update
      const ext = path.extname(file.originalname);
      const newFileName = `${uuidv4()}${ext}`;
      const url = await processFile(file.buffer, file.mimetype, "chat", folderName, newFileName);
  
      res.status(200).json({
        message: "File updated successfully",
        oldFileDeleted: oldFileName,
        newFileUrl: url,
      });
    } catch (error) {
      console.error("Chat File Update Error:", error);
      res.status(500).json({ message: error.message });
    }
  };
  
// ❌ Delete Chat File (by name)
const deleteChatFile = (req, res) => {
  const { senderId,receiverId, fileName } = req.body;

  const folderName = `${senderId}_${receiverId}`;
  const filePath = path.join(__dirname, "../uploads/chat/", folderName, fileName);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: "File deleted successfully" });
    } else {
      return res.status(404).json({ message: "File not found" });
    }
  } catch (error) {
    console.error("Chat File Delete Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadChatFile,
  getChatFile,
  deleteChatFile,
  updateChatFile
};
