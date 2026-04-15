const express = require('express');
const router = express.Router();
const { upload } = require("../utils/FileUpload");
const { uploadBrandImage, updateBrandImage, deleteBrandImage, getBrandImage } = require("../controller/brandImageController");

router.post("/upload-brand-image", upload.single("brand_image"), uploadBrandImage);
router.put("/update-brand-image", upload.single("brand_image"), updateBrandImage);
router.delete("/delete-brand-image", deleteBrandImage);
router.get("/get-brand-image/:entity_type/:company_name/:filename", getBrandImage);

module.exports = router;