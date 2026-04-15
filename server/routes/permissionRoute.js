const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');

// Create a new permission
router.post('/create-permission', permissionController.createPermission);

// Get all permissions
router.get('/fetched-all-permissions', permissionController.getPermissions);

// Get a single permission by ID
router.get('/fetched-all-permission-by-id/:id', permissionController.getPermissionById);

// Update a permission
router.put('/update-permission/:id', permissionController.updatePermission);

// Delete a permission
router.delete('/delete-permission/:id', permissionController.deletePermission);

module.exports = router;
