const express = require("express");
const {
  getAllSubDealers,
  getSubDealerById,
  createSubDealer,
  updateSubDealer,
  deleteSubDealer,
} = require("../controllers/subdealerController");
const { authenticate } = require("../middleware/subdealerValidation");

const router = express.Router();

router.get("/fetch-all-subdealers", authenticate, getAllSubDealers);
router.get("/fetch-subdealers-by-id/:id", authenticate, getSubDealerById);
router.post("/create-subdealers", authenticate, createSubDealer);
router.put("/update-subdealers-by-id/:id", authenticate, updateSubDealer);
router.delete("/delete-subdealers-by-id/:id", authenticate, deleteSubDealer);

module.exports = router;
