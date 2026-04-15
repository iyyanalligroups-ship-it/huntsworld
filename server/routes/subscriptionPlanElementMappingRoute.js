const express = require('express');
const router = express.Router();
const subscriptionPlanElementMappingController = require('../controllers/subscriptionPlanElementMappingController');
const { authMiddleware } = require("../middleware/authMiddleware");



router.post('/create-subscriptionplanelementmappings', subscriptionPlanElementMappingController.createMapping);
router.get('/fetch-all-subscriptionplanelementmappings',authMiddleware, subscriptionPlanElementMappingController.getAllMappings);
router.get('/fetch-subscriptionplanelementmappings-by-id/:id', subscriptionPlanElementMappingController.getMappingById);

router.put('/update-subscriptionplanelementmappings-by-id/:id', subscriptionPlanElementMappingController.updateMapping);
router.post('/delete-subscriptionplanelementmappings', subscriptionPlanElementMappingController.deleteMapping);

module.exports = router;
