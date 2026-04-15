const Permission = require('../models/permissionModel');

// @desc Create new permission
// @route POST /api/permissions
exports.createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({ message: 'Permission already exists' });
    }

    const permission = new Permission({ name, description });
    await permission.save();

    res.status(201).json({
        success:true,
        message:"Permission Created Successfully",
        data:permission
    });
  } catch (error) {
    console.error('Create Permission Error:', error);
    res.status(500).json({success:false, message: 'Server Error' });
  }
};

// @desc Get all permissions
// @route GET /api/permissions
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    res.json(
        {
            success:true,
            message:"Fetched Permission Successfully",
            data:permissions
        }
    );
  } catch (error) {
    console.error('Get Permissions Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Get single permission
// @route GET /api/permissions/:id
exports.getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.json(permission);
  } catch (error) {
    console.error('Get Permission By ID Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Update permission
// @route PUT /api/permissions/:id
exports.updatePermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    permission.name = name || permission.name;
    permission.description = description || permission.description;

    await permission.save();

    res.json(
        {
            success:true,
            message:"Permission Updated Successfully",
            data:permission
        }
    );
  } catch (error) {
    console.error('Update Permission Error:', error);
    res.status(500).json({success:false, message: 'Server Error' });
  }
};

// @desc Delete permission
// @route DELETE /api/permissions/:id
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await permission.deleteOne();

    res.json({ success:true, message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Delete Permission Error:', error);
    res.status(500).json({success:false, message: 'Server Error' });
  }
};
