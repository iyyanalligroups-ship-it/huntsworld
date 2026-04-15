const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");
const {
  uploadImages,
  updateImage,
  deleteImage,
  getImage,
  uploadCompanyLogo,
  updateCompanyLogo,
  deleteCompanyLogo,
  getCompanyLogo
} = require("../controller/groceryController");

// Upload multiple company images
router.post("/upload-company-image", upload.array("files", 10), uploadImages);

// Update (replace) an existing image
router.put("/update-company-image", upload.single("file"), updateImage);

// Delete an image
router.post("/delete-company-image", deleteImage);

// Get an image (serve file)
router.get("/get-file/:entity_type/:shop_name/:filename", getImage);

// Upload a single company logo
router.post("/upload-logo", upload.single("logo"), uploadCompanyLogo);

// Update company logo
router.put("/update-logo", upload.single("logo"), updateCompanyLogo);

// Delete company logo
router.post("/delete-logo", deleteCompanyLogo);

// Get company logo
router.get("/logo/:shop_name", getCompanyLogo);

module.exports = router;
