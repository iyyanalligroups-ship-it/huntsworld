const express = require("express");
const router = express.Router();
const controller = require("../controllers/topListingPlanController");

/**
 * TOP LISTING PLAN – ADMIN ROUTES
 */

// ✅ Create a new plan
router.post("/create", controller.createPlan);

// ✅ Get all plans (optional filters)
router.get("/list", controller.getAllPlans);

// ✅ Get single plan by ID
router.get("/details/:id", controller.getPlanById);

// ✅ Update plan
router.put("/update/:id", controller.updatePlan);

// Use .delete() method and change path from /deactivate to /delete
router.delete("/delete/:id", controller.deletePlan);
module.exports = router;
