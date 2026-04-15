// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitReport,
  getAllReports,
  updateReportStatus,
  getMyReports,
  pickReport,
  closeReport
} = require("../controllers/reportFileController");


// Public (logged-in users)
router.post("/report-user", submitReport);

// Admin only
router.patch("/reports/:id", updateReportStatus);
// routes/reportRoutes.js
router.get("/all", getAllReports);
router.get("/my-reports", getMyReports);
router.put("/pick/:id", pickReport);
router.put("/close/:id", closeReport);

module.exports = router;
