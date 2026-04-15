const fs = require("fs");
const path = require("path");
const { createEntityFolder, processFile } = require("../utils/FileUpload");

// ✅ Upload Student ID Card
const uploadStudentIdCard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No logo uploaded" });
    }

    const { college_name } = req.body;
    if (!college_name) {
      return res.status(400).json({ message: "College name is required" });
    }

    // ✅ Sanitize college name (replace spaces with underscores)
    const sanitizedCollegeName = college_name.replace(/\s+/g, "_");

    // ✅ Generate random number and timestamp for unique file naming
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();

    // ✅ Construct the final file name
    const fileName = `${randomNum}_${timestamp}_${sanitizedCollegeName}_logo.webp`;

    // ✅ Ensure upload directory exists
    const uploadPath = path.join(__dirname, "../uploads/student/id_card/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // ✅ Process and store the file
    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "student",
      "id_card",
      fileName
    );

    res.status(200).json({
      message: "ID card uploaded successfully",
      logoUrl, // ✅ Return public URL
    });
  } catch (error) {
    console.error("Logo Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Student ID Card
const updateStudentIdCard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No new logo uploaded" });
    }
    console.log(req.params, "params");

    const { college_name } = req.params;

    if (!college_name) {
      return res.status(400).json({ message: "College name is required" });
    }

    // ✅ Sanitize college name
    const sanitizedCollegeName = college_name.replace(/\s+/g, "_");

    // ✅ Define upload path
    const uploadPath = path.join(__dirname, "../uploads/student/id_card/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // ✅ Find and delete old ID card (wildcard match)
    const files = fs.readdirSync(uploadPath);
    const oldFile = files.find((file) =>
      file.includes(`${sanitizedCollegeName}_logo.webp`)
    );
    if (oldFile) {
      fs.unlinkSync(path.join(uploadPath, oldFile));
    }

    // ✅ Generate new file name with random number and timestamp
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const newFileName = `${randomNum}_${timestamp}_${sanitizedCollegeName}_logo.webp`;

    // ✅ Process and store the new logo
    const logoUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "student",
      "id_card",
      newFileName
    );

    res.status(200).json({
      message: "ID card updated successfully",
      logoUrl, // ✅ Return public URL
    });
  } catch (error) {
    console.error("Logo Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Student ID Card
const deleteStudentIdCard = (req, res) => {
  try {
    const { college_name } = req.body;
    if (!college_name) {
      return res.status(400).json({ message: "College name is required" });
    }

    // ✅ Sanitize college name
    const sanitizedCollegeName = college_name.replace(/\s+/g, "_");

    // ✅ Define upload path
    const uploadPath = path.join(__dirname, "../uploads/student/id_card/");
    if (!fs.existsSync(uploadPath)) {
      return res.status(404).json({ message: "ID card image not found" });
    }

    // ✅ Find and delete the ID card (wildcard match)
    const files = fs.readdirSync(uploadPath);
    const fileToDelete = files.find((file) =>
      file.includes(`${sanitizedCollegeName}_logo.webp`)
    );

    if (fileToDelete) {
      fs.unlinkSync(path.join(uploadPath, fileToDelete));
      return res
        .status(200)
        .json({ message: "ID card image deleted successfully" });
    } else {
      return res.status(404).json({ message: "ID card image not found" });
    }
  } catch (error) {
    console.error("Logo Delete Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Student ID Card
const getStudentIdCard = (req, res) => {
  try {
    const { college_name } = req.params;
    if (!college_name) {
      return res.status(400).json({ message: "College name is required" });
    }

    // ✅ Sanitize college name
    const sanitizedCollegeName = college_name.replace(/\s+/g, "_");

    // ✅ Define upload path
    const uploadPath = path.join(__dirname, "../uploads/student/id_card/");
    if (!fs.existsSync(uploadPath)) {
      return res.status(404).json({ message: "ID card image not found" });
    }

    // ✅ Find the ID card (wildcard match)
    const files = fs.readdirSync(uploadPath);
    const foundFile = files.find((file) =>
      file.includes(`${sanitizedCollegeName}_logo.webp`)
    );

    if (!foundFile) {
      return res.status(404).json({ message: "ID card image not found" });
    }

    res.sendFile(path.join(uploadPath, foundFile));
  } catch (error) {
    console.error("Get Logo Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const uploadRedeemLetter = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { user_id } = req.body;
    console.log("Received request body:", req.body); // Debug log
    console.log("Received user_id:", user_id); // Debug log

    if (!user_id) {
      console.warn("User ID is missing or invalid. Request body:", req.body);
      return res.status(400).json({ message: "User ID is required" });
    }

    // ✅ Sanitize user_id (replace spaces with underscores, though IDs usually don't have spaces)
    const sanitizedUserId = user_id.replace(/\s+/g, "_");

    // ✅ Generate random number and timestamp for unique file naming
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const fileName = `${randomNum}_${timestamp}_${sanitizedUserId}_letter.webp`;

    // ✅ Validate file type (only images)
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      console.warn("Invalid file type:", req.file.mimetype);
      return res
        .status(400)
        .json({
          message: "Only image files (JPEG, PNG, GIF, WebP) are allowed",
        });
    }

    // ✅ Process and store the file
    const url = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "redeem_letter",
      sanitizedUserId,
      fileName
    );

    res.status(200).json({
      message: "Redeem letter uploaded successfully",
      url,
      file_name: fileName,
    });
  } catch (error) {
    console.error("Redeem Letter Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Redeem Letter
const deleteRedeemLetter = (req, res) => {
  try {
    const { user_id, file_name } = req.body;
    console.log("Delete request body:", req.body); // Debug log
    console.log("Delete user_id:", user_id, "file_name:", file_name); // Debug log

    if (!user_id || !file_name) {
      console.warn("Missing user_id or file_name in delete request:", req.body);
      return res
        .status(400)
        .json({ message: "User ID and file_name are required" });
    }

    // ✅ Sanitize user_id
    const sanitizedUserId = user_id.replace(/\s+/g, "_");

    // ✅ Define upload path
    const uploadPath = createEntityFolder("redeem_letter", sanitizedUserId);
    const filePath = path.join(uploadPath, file_name);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res
        .status(200)
        .json({ message: "Redeem letter deleted successfully" });
    } else {
      return res.status(404).json({ message: "Redeem letter not found" });
    }
  } catch (error) {
    console.error("Redeem Letter Delete Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadStudentIdCard,
  updateStudentIdCard,
  deleteStudentIdCard,
  getStudentIdCard,
  uploadRedeemLetter,
  deleteRedeemLetter,
};
