const express = require('express');
const router = express.Router();
const { upload } = require("../utils/FileUpload");

const { uploadImages, updateImage, deleteImage, getImage } = require("../controller/userController");
// Upload a new file

router.post("/upload-profile-image", upload.single("profile_pic"), uploadImages);

// Update (replace) an existing file
router.put("/update-profile-image", upload.single("profile_pic"), updateImage);

// Delete a file
router.delete("/delete-profile-image", deleteImage);

// Get a file (serve file)
router.get("/get-file/:entity_type/:company_name/:filename", getImage);

module.exports = router;