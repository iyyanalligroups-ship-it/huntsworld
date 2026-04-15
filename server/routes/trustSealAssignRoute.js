const express = require('express');
const router = express.Router();
const TrustSealAssignmentController = require('../controllers/trustSealAssignController');

// No authMiddleware - open for now (you can add later if needed)
// POST /api/trust-seal-assignment/assign
router.post('/assign', TrustSealAssignmentController.assign);

// GET /api/trust-seal-assignment
router.get('/', TrustSealAssignmentController.getAllAssignments);

// GET /api/trust-seal-assignment/request/:request_id
router.get('/request/:request_id', TrustSealAssignmentController.getByRequest);

// PUT /api/trust-seal-assignment/reassign
router.post('/reassign', TrustSealAssignmentController.reassign);

// DELETE /api/trust-seal-assignment/unassign/:request_id
router.delete('/unassign/:request_id', TrustSealAssignmentController.unassign);

module.exports = router;
