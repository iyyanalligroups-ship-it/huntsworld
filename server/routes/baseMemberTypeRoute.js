const express = require("express");
const router = express.Router();
const baseMemberTypeController = require("../controllers/baseMemberTypeController");

router.get("/fetch-all-base-member-types", baseMemberTypeController.getAllBaseMemberTypes);
router.get("/fetch-base-member-type/:id", baseMemberTypeController.getBaseMemberTypeById);
router.post("/create-base-member-type", baseMemberTypeController.createBaseMemberType);
router.put("/update-base-member-type/:id", baseMemberTypeController.updateBaseMemberType);
router.delete("/delete-base-member-type/:id", baseMemberTypeController.deleteBaseMemberType);

module.exports = router;
