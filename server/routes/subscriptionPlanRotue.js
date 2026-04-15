// const express = require("express");
// const {
//   createPlan,

//   getAllPlansForMapping,
// getAllPlansWithDetails,
//   getAllPlans,
//   getPlanById,
//   updatePlan,
//   deletePlan,
// } = require("../controllers/subscriptionPlanController");


// const router = express.Router();

// // Create a new subscription plan

// router.post("/create-subscriptionplans", createPlan);


// // Get all subscription plans
// router.get("/fetch-all-subscriptionplans", getAllPlans);

// router.get("/fetch-all-subscriptionplans-with-details", getAllPlansWithDetails);


// router.get("/fetch-all-subscriptionplans-for-mapping", getAllPlansForMapping);


// // Get a single subscription plan by ID
// router.get("/fetch-subscriptionplans-by-id/:id", getPlanById);


// router.put("/update-subscriptionplans/:id", updatePlan);

// // Delete a subscription plan
// router.delete("/delete-subscriptionsplans/:id", deletePlan);


// module.exports = router;


// routes/subscriptionPlanRoutes.js
const express = require("express");
const {
  createPlan,
  getAllPlans,
  getAllPlansWithDetails,
  getAllPlansForMapping,
  updatePlan,
  deletePlan,
  syncWithRazorpay,
} = require("../controllers/subscriptionPlanController");

const router = express.Router();

// Create a new subscription plan
router.post("/create-subscriptionplans", createPlan);

// Sync plan with Razorpay (auto-generate razorpay_plan_id)
router.post("/sync-razorpay", syncWithRazorpay);

// Get all plans (basic list)
router.get("/fetch-all-subscriptionplans", getAllPlans);

// Get plans with feature mappings (for detailed view)
router.get("/fetch-all-subscriptionplans-with-details", getAllPlansWithDetails);

// Get all plans (for dropdown in mapping form)
router.get("/fetch-all-subscriptionplans-for-mapping", getAllPlansForMapping);

// Update plan
router.put("/update-subscriptionplans/:id", updatePlan);

// Delete plan
router.delete("/delete-subscriptionsplans/:id", deletePlan);

module.exports = router;
