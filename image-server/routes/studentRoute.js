const express = require("express");
const router = express.Router();
const { upload } = require("../utils/FileUpload");
const {
  uploadStudentIdCard,
  updateStudentIdCard,
  deleteStudentIdCard,
  getStudentIdCard,
  uploadRedeemLetter,
  deleteRedeemLetter
} = require("../controller/studentController");

// 📌 Upload Student ID Card
router.post("/id-card/upload", upload.single("id_card_image"), uploadStudentIdCard);

// 📌 Update Student ID Card (Pass college name in URL)
router.put("/id-card/update/:college_name", upload.single("id_card_image"), updateStudentIdCard);

// 📌 Delete Student ID Card (Pass college name in URL)
router.post("/id-card/delete", deleteStudentIdCard);

// 📌 Get Student ID Card (Pass college name in URL)
router.get("/id-card/get/:college_name", getStudentIdCard);

// 📌 Upload Redeem Letter
router.post("/redeem-letter/upload-redeem-letter", upload.single("letter_image"), uploadRedeemLetter);

// 📌 Delete Redeem Letter
router.post("/redeem-letter/delete-redeem-letter", deleteRedeemLetter);

module.exports = router;



