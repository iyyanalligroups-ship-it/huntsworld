const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");
const { uploadImages, updateImage, deleteImage, getImage , uploadCompanyLogo,
    updateCompanyLogo,
    deleteCompanyLogo,
    getCompanyLogo} = require("../controller/merchantController");

// Upload a new file
router.post("/upload-company-image", upload.array("files", 10), uploadImages);

// Update (replace) an existing file
router.put("/update-company-image", upload.array("files", 10), updateImage);

// Delete a file
router.delete("/delete-company-image", deleteImage);

// Get a file (serve file)
router.get("/get-file/:entity_type/:company_name/:filename", getImage);



// 📌 Upload a single company logo
router.post("/upload-logo", upload.single("logo"), uploadCompanyLogo);

// 📌 Update company logo
router.put("/update-logo", upload.single("logo"), updateCompanyLogo);

// 📌 Delete company logo
router.delete("/delete-logo", deleteCompanyLogo);

// 📌 Get company logo
router.get("/logo/:company_name", getCompanyLogo);

module.exports = router;
