// routes/platformRoutes.js
const express = require('express');
const router = express.Router();

const {
  getPlatforms,
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
} = require('../controllers/socialMediaPlatformController');

// Public – used by frontend for dropdown & display
router.get('/', getPlatforms);

// ── Admin / full access ────────────────────────────────────────
// (add your auth middleware here in production: protect, admin, etc.)

router.get('/admin', getAllPlatforms);           // all platforms incl. inactive
router.get('/:id', getPlatformById);
router.post('/', createPlatform);
router.put('/:id', updatePlatform);
router.delete('/:id', deletePlatform);

module.exports = router;
