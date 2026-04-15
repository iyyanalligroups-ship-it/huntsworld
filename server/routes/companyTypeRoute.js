const express = require("express");
const router = express.Router();
const {
  getAllCompanyTypes,
  getCompanyTypeById,
  createCompanyType,
  updateCompanyType,
  deactivateCompanyType,
  getCompanyTypeOptions,
} = require("../controllers/companyTypeController");

// Public / Frontend routes
router.get("/", getAllCompanyTypes);
router.get("/options", getCompanyTypeOptions);      // ← perfect for dropdowns
router.get("/:id", getCompanyTypeById);

// Admin / protected routes (add middleware later)
router.post("/", createCompanyType);
router.patch("/:id", updateCompanyType);
router.patch("/:id/deactivate", deactivateCompanyType);

// Optional: if you want to permanently delete (careful!)
// router.delete("/:id", deleteCompanyType);

module.exports = router;
