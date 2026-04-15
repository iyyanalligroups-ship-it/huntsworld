// routes/subscriptionPlan.routes.js
const express = require('express');
const router = express.Router();
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getEbookSubscriptionPlans,
  getSubscriptionPlanByFields,
  getBannerAdAmount,
  getPlanByName
} = require('../controllers/commonSubcriptionPlanController');

// POST /api/subscription-plans
router.post('/create-common-subscription-plan', createPlan);

// GET /api/subscription-plans
router.get('/fetch-all-common-subscription', getAllPlans);

// GET /api/subscription-plans/:id
router.get('/fetch-common-plan-by-id/:id', getPlanById);

// PUT /api/subscription-plans/:id
router.put('/update-common-plan/:id', updatePlan);

// DELETE /api/subscription-plans/:id
router.delete('/delete-common-plan/:id', deletePlan);


router.get('/ebook-plans', getEbookSubscriptionPlans);
router.get('/fetch-gst-data', getSubscriptionPlanByFields);
router.get('/fetch-banner-ad-amount', getBannerAdAmount);
router.get('/fetch-by-name/:name', getPlanByName);

module.exports = router;
