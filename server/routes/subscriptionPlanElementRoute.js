// const express = require('express');
// const router = express.Router();
// const subscriptionPlanElementController = require('../controllers/subscriptionPlanElementController');

// router.post('/create-subscriptionplanelements', subscriptionPlanElementController.createElement);
// router.get('/fetch-all-subscriptionplanelements', subscriptionPlanElementController.getAllElements);

// router.get('/fetch-subscriptionplanelements-by-id/:id', subscriptionPlanElementController.getElementById);
// router.put('/update-subscriptionplanelements-by-id/:id', subscriptionPlanElementController.updateElement);
// router.delete('/delete-subscriptionplanelements-by-id/:id', subscriptionPlanElementController.deleteElement);

// router.get('/fetch-all-subscriptionplanelements-for-mapping', subscriptionPlanElementController.getAllElementsForMapping);
// router.get('/fetch-subscriptionplanelements-by-id/:id', subscriptionPlanElementController.getElementById);
// router.put('/update-subscriptionplanelements/:id', subscriptionPlanElementController.updateElement);
// router.delete('/delete-subscriptionplanelements/:id', subscriptionPlanElementController.deleteElement);


// module.exports = router;


// routes/subscriptionPlanElementRoutes.js
const express = require('express');
const router = express.Router();
const {
  createElement,
  getAllElements,
  getAllElementsForMapping,
  updateElement,
  deleteElement,
} = require('../controllers/subscriptionPlanElementController');

router.post('/create-subscriptionplanelements', createElement);
router.get('/fetch-all-subscriptionplanelements', getAllElements);
router.get('/fetch-all-subscriptionplanelements-for-mapping', getAllElementsForMapping);

router.put('/update-subscriptionplanelements/:id', updateElement);
router.delete('/delete-subscriptionplanelements/:id', deleteElement);

module.exports = router;
