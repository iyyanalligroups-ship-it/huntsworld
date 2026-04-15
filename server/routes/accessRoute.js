const express = require("express");
const router = express.Router();
const accessController = require("../controllers/accessController");
const {authMiddleware} =require("../middleware/authMiddleware");

router.post("/create-access", accessController.createAccess);
router.get("/fetch-all-access", accessController.getCategoryAccess);
router.get("/fetch-all-access-by-id/:id", accessController.getAccessById);
router.put("/update-access/:id", accessController.updateAccess);
router.put("/is-category-wise-show", authMiddleware,accessController.updateCategoryAccess);
router.delete("/delete-access/:id", accessController.deleteAccess);

module.exports = router;
