const express = require('express');
const router = express.Router();
const {
  createPostByRequirement,
  getAllPostByRequirements,
  getPostByRequirementById,
  updatePostByRequirement,
  deletePostByRequirement,
  getAllPostByRequirementsForChat,
  getPostsByUserId,
  getPostsByUserLocationAndSubscription
} = require('../controllers/postByRequirementController');
const { authMiddleware } = require("../middleware/authMiddleware")
// POST
router.post('/create-post-by-requirement', createPostByRequirement);
// In your routes file
router.delete("/delete-post-requirement/:id", authMiddleware, deletePostByRequirement);
// GET ALL
router.get('/fetch-all-post-requirement', getAllPostByRequirements);
router.get('/fetch-all-post-requirement-user-id/:user_id', getPostsByUserId);
router.get('/fetch-all-post-requirement-by-location/:user_id', getPostsByUserLocationAndSubscription);
router.get('/fetch-all-post-requirement-for-chat', getAllPostByRequirementsForChat);

// GET BY ID
router.get('/fetch-post-requirement-by-id/:id', getPostByRequirementById);

// PUT/UPDATE
router.put('/update-post-requirement/:id', updatePostByRequirement);

// DELETE
router.delete('/delete-post-requirement/:id', deletePostByRequirement);

module.exports = router;
