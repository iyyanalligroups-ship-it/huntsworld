const MobileNumberAccess = require("../models/mobileNumberAccessModel");

// Create a new permission request
exports.createPermission = async (req, res) => {
  try {
    const { sellerId, user_id, notes } = req.body;

    if (!sellerId || !user_id) {
      return res.status(400).json({ message: "Seller ID and User ID are required" });
    }

    const permission = new MobileNumberAccess({
      sellerId,
      user_id,
      notes,
      status: "pending",
      requestedAt: new Date(),
    });

    await permission.save();
    res.status(201).json({ message: "Permission request created", permission });
  } catch (error) {
    res.status(500).json({ message: "Error creating permission", error: error.message });
  }
};

// Approve a permission request
exports.approvePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await MobileNumberAccess.findById(id);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    permission.status = "approved";
    permission.approvedAt = new Date();
    permission.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months
    permission.deniedAt = null;

    await permission.save();
    res.status(200).json({ message: "Permission approved", permission });
  } catch (error) {
    res.status(500).json({ message: "Error approving permission", error: error.message });
  }
};

// Deny a permission request
exports.denyPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const permission = await MobileNumberAccess.findById(id);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    permission.status = "denied";
    permission.deniedAt = new Date();
    permission.approvedAt = null;
    permission.expiresAt = null;
    permission.notes = notes || "";

    await permission.save();
    res.status(200).json({ message: "Permission denied", permission });
  } catch (error) {
    res.status(500).json({ message: "Error denying permission", error: error.message });
  }
};

// Get all permissions
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await MobileNumberAccess.find()
      .populate("sellerId", "name email")
      .populate("user_id", "name email")
      .sort({ requestedAt: -1 });

    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching permissions", error: error.message });
  }
};

// Get single permission
exports.getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await MobileNumberAccess.findById(id)
      .populate("sellerId", "name email")
      .populate("user_id", "name email");

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    res.status(200).json(permission);
  } catch (error) {
    res.status(500).json({ message: "Error fetching permission", error: error.message });
  }
};

// Delete permission
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await MobileNumberAccess.findByIdAndDelete(id);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    res.status(200).json({ message: "Permission deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting permission", error: error.message });
  }
};
