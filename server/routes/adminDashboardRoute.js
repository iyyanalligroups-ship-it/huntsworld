const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controllers/adminDashboardController");
const adminUnmatchedLeadsController = require("../controllers/adminUnmatchedLeadsController");

router.get("/fetch-admin-dashboard-data", adminDashboardController.getDashboardData);
router.get("/unmatched-leads", adminUnmatchedLeadsController.getUnmatchedLeads);

module.exports = router;
