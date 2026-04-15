const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");
const { uploadImages, updateImage, deleteImage, getImage } = require("../controller/complaintController"); // Change to complaintController

// Upload a new file for a complaint
router.post("/upload-complaint-image", upload.array("files", 10), uploadImages);

// Update (replace) an existing complaint file
router.put("/update-complaint-image", upload.array("files", 10), updateImage);

// Delete a complaint file
router.delete("/delete-complaint-image", deleteImage);

// Get a complaint file (serve file)
router.get("/get-file/:entity_type/:complaint_name/:filename", getImage);

module.exports = router;
// {
//     "success": true,
//     "error": false,
//     "message": "Files uploaded successfully",
//     "files": [
//         {
//             "fileUrl": "http://localhost:8080/uploads/complaint_form/IPR_form/fdec6e1c-d4a7-49ae-bc4a-7dd6605b2141_Screenshot 2025-04-19 183950.webp"
//         },
//         {
//             "fileUrl": "http://localhost:8080/uploads/complaint_form/IPR_form/7fe3a462-f705-4c4b-95d1-252eef63b12e_Screenshot 2025-04-19 184018.webp"
//         },
//         {
//             "fileUrl": "http://localhost:8080/uploads/complaint_form/IPR_form/009e0e9e-d6e0-42bb-8346-33c20a6cbe8f_Screenshot 2025-04-19 184041.webp"
//         }
//     ]
// }