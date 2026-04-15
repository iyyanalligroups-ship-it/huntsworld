const express = require("express");
const router = express.Router();
const {
  updateImage,
  uploadImages,
  deleteImage,
  getImage,
  uploadCompanyLogo,
  updateCompanyLogo,
  deleteCompanyLogo,
  getCompanyLogo,
} = require("../controller/serviceProvider");
const { upload } = require("../utils/FileUpload");
// Upload a new file
router.post("/upload-company-image", upload.array("files", 10), uploadImages);

// Update (replace) an existing file
router.put("/update-company-image", upload.array("files", 10), updateImage);

// Delete a file
router.delete("/delete-company-image", deleteImage);

// Get a file (serve file)
router.get("/get-company-images/:entity_type/:company_name/:filename", getImage);

// company logo

// 📌 Upload a single company logo
router.post("/upload-logo", upload.single("logo"), uploadCompanyLogo);

// 📌 Update company logo
router.put("/update-logo", upload.single("logo"), updateCompanyLogo);

// 📌 Delete company logo
router.delete("/delete-logo", deleteCompanyLogo);

// 📌 Get company logo
router.get("/get-company-logo/:company_name", getCompanyLogo);

module.exports = router;
