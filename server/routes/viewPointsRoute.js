const express = require('express');
const router = express.Router();
const viewPointsController = require('../controllers/viewPointsController');

router.post('/create-viewpoints', viewPointsController.createViewPoint);
router.get('/fetch-all-viewpoints', viewPointsController.getAllViewPoints);
router.get('/fetch-viewpoints-by-id/:userId', viewPointsController.getViewPointByUserId);
router.post('/update-viewpoints-by-id', viewPointsController.updateViewPoint);
router.delete('/delete-viewpoints-by-id/:id', viewPointsController.deleteViewPoint);

module.exports = router;
