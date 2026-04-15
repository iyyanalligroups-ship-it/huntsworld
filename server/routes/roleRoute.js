// routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Create a new role
router.post('/create-role', roleController.createRole);

// Get all roles
router.get('/fetch-all-role', roleController.getRoles);

// Get a role by ID
router.get('/fetch-role-by-id/:id', roleController.getRoleById);

// Update a role
router.put('/update-role-by-id/:id', roleController.updateRole);

// Delete a role
router.delete('/delete-role-by-id/:id', roleController.deleteRole);

module.exports = router;
