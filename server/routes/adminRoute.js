const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/create-admin", adminController.createAdmin);
router.get("/fetch-all-admin", adminController.getAdmins);
router.get("/fetch-admin-by-id/:id", adminController.getAdminById);
router.put("/update-admin/:id", adminController.updateAdmin);
router.delete("/delete-admin/:id", adminController.deleteAdmin);

module.exports = router;
