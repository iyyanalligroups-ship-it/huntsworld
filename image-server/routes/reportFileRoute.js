// routes/fileRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadFiles, deleteFile } = require("../controller/reportFIleController");

// Multer: store in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// Upload multiple files (used by report, chat, posts, etc.)
router.post("/upload", upload.array("attachments", 10), uploadFiles);

// Delete a file by URL (optional, for cleanup)
router.delete("/delete", deleteFile);

module.exports = router;
