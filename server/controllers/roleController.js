// controllers/roleController.js
const Role = require('../models/roleModel');

// Create a new role
exports.createRole = async (req, res) => {
    try {
        const { id, role } = req.body;
        const newRole = new Role({ id, role });
        await newRole.save();
        res.status(201).json({ message: 'Role created successfully', data: newRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all roles
exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json({ data: roles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a role by ID
exports.getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findOne({ id });
        if (!role) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json({ data: role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a role
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedRole = await Role.findOneAndUpdate({ id }, updates, { new: true });
        if (!updatedRole) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json({ message: 'Role updated successfully', data: updatedRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a role
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRole = await Role.findOneAndDelete({ id });
        if (!deletedRole) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
