const express = require('express');
const router = express.Router();
const {
  createGrocerySellerRequirement,
  getAllGrocerySellerRequirements,
  // getGrocerySellerRequirementById,
  getSellerRequirementsByUserId,
  updateGrocerySellerRequirement,
  deleteGrocerySellerRequirement,
  getAllGrocerySellerRequirementsForChat,
  getGrocerySellerRequirementsByUserId,
  getGrocerySellerRequirementsByUserLocationAndSubscription
} = require('../controllers/grocerySellerRequirementController');

// POST
router.post('/create-grocery-seller-requirement', createGrocerySellerRequirement);

// GET ALL
router.get('/fetch-all-grocery-seller-requirement', getAllGrocerySellerRequirements);
router.get('/fetch-all-grocery-seller-requirement-user-id/:user_id', getGrocerySellerRequirementsByUserId);
router.get('/fetch-all-grocery-seller-requirement-by-location/:user_id', getGrocerySellerRequirementsByUserLocationAndSubscription);
router.get('/fetch-all-grocery-seller-requirement-for-chat', getAllGrocerySellerRequirementsForChat);

// GET BY ID
// router.get('/fetch-grocery-seller-requirement-by-id/:id', getGrocerySellerRequirementById);
router.get('/fetch-grocery-seller-requirement-by-user_id/:user_id', getSellerRequirementsByUserId);

// PUT/UPDATE
router.put('/update-grocery-seller-requirement/:id', updateGrocerySellerRequirement);

// DELETE
router.delete('/delete-grocery-seller-requirement/:id', deleteGrocerySellerRequirement);

module.exports = router;
