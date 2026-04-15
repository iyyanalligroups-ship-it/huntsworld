const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads/redeem_letters directory exists
const uploadDir = path.join(__dirname, '../uploads/redeem_letters');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, uploadDir); // Store in uploads/redeem_letters
  },
  filename: (req, file, cb) => {
    const username = req.body.username || 'unknown'; // Fallback to 'unknown'
    const randomNum = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit random number
    const extension = path.extname(file.originalname); // Get file extension
    const filename = `${username}_${randomNum}${extension}`; // e.g., username_123456.jpg
    cb(null, filename);
  },
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

// Route to handle image upload
router.post('/upload-redeem-letter', upload.single('letter_image'), (req, res) => {
  console.log('Request body:', req.body); // Debug the request body
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Construct the URL for the uploaded file
    const fileUrl = `${process.env.SERVER_URL}/uploads/redeem_letters/${req.file.filename}`;
    res.status(200).json({ message: 'File uploaded successfully', url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
});

module.exports = router;
