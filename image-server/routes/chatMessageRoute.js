const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadChatFile,
  getChatFile,
  deleteChatFile,
  updateChatFile
} = require("../controller/chatMessageController");

// Multer setup (store file in memory to process and save manually)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📤 Upload Chat File (image, video, pdf, audio, etc.)
router.post("/upload-chat-images", upload.array("files"), uploadChatFile);

// 📥 Get Chat File by file_name, senderId and receiverId
router.get("/fetch-all-images/:senderId/:receiverId/:file_name", getChatFile);

// ❌ Delete Chat File by file_name
router.delete("/delete-images", deleteChatFile);

// ♻️ Update/Replace a Chat File
router.put("/update-images", upload.array("files"), updateChatFile);

module.exports = router;
