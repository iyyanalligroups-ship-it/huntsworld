const express = require("express");
const router = express.Router();
const mobileNumberAccess = require("../controllers/mobileNumberAccessController");

// Create request
router.post("/", mobileNumberAccess.createPermission);

// Approve
router.put("/:id/approve", mobileNumberAccess.approvePermission);

// Deny
router.put("/:id/deny", mobileNumberAccess.denyPermission);

// Get all
router.get("/", mobileNumberAccess.getPermissions);

// Get single
router.get("/:id", mobileNumberAccess.getPermissionById);

// Delete
router.delete("/:id", mobileNumberAccess.deletePermission);

module.exports = router;
