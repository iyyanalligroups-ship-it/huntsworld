const AccessRequest = require('../models/subadminAccessModel');
const User = require('../models/userModel');
const Role = require("../models/roleModel")
const axios = require('axios');




exports.requestAccess = async (req, res) => {
  try {
    const { requester_id, permissions } = req.body;

    // Validate inputs
    if (!requester_id || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ message: 'Missing or invalid required fields: requester_id or permissions.' });
    }

    // Validate permissions structure
    for (const perm of permissions) {
      if (!perm.page || !perm.actions || !Array.isArray(perm.actions) || perm.actions.length === 0) {
        return res.status(400).json({ message: 'Each permission must have a page and non-empty actions array.' });
      }
      for (const action of perm.actions) {
        if (!['edit', 'delete'].includes(action)) {
          return res.status(400).json({ message: `Invalid action: ${action}. Must be 'edit' or 'delete'.` });
        }
      }
    }

    // Check if requester exists and is a subadmin
    const requester = await User.findById(requester_id).populate("role");
    if (!requester || !requester.role || requester.role.role !== "SUB_ADMIN") {
      return res.status(404).json({ message: "Requester not found or not authorized." });
    }

    // Check for existing pending request
    const existingRequest = await AccessRequest.findOne({
      requester_id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "A pending access request already exists." });
    }

    // Create new request
    const request = new AccessRequest({
      requester_id,
      permissions,
    });

    await request.save();

    // Build message text
    const permissionMessage = permissions
      .map((p) => `${p.page} (${p.actions.join(", ")})`)
      .join(", ");

    const smsText = `User ${requester.name} has requested ${permissions
      .map((p) => p.actions.join(", "))
      .join(", ")} access on ${permissions.map((p) => p.page).join(", ")}. Please review the request. – HUNTSWORLD`;

    // Emit real-time notification to admins room
    global.io.of("/access-request-notifications").to("admins").emit("newAccessRequest", {
      _id: request._id,
      requester_id: requester_id,
      requester_name: requester.name,
      permissions,
      message: `New access request from ${requester.name} for: ${permissionMessage}.`,
      created_at: request.request_date,
      is_read: false,
    });

    // 🔔 Send SMS to all admins
    // const adminRole = await Role.findOne({ role: "ADMIN" });
    // 

    // if (adminRole) {
    //   const admins = await User.find({ role: adminRole._id });
    //   

    //   for (const admin of admins) {
    //     if (admin.phone) {
    //       try {
    //         const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${admin.phone}&text=${encodeURIComponent(
    //           smsText
    //         )}`;

    //         const response = await axios.get(smsApiUrl);
    //         
    //       } catch (err) {
    //         console.error(`❌ Failed to send SMS to ${admin.phone}`, err.message);
    //       }
    //     }
    //   }
    // }

    res.status(201).json({ message: "Access request sent and SMS notifications dispatched." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

// Approve access request with optional partial approval
exports.approveAccess = async (req, res) => {
  try {
    const { request_id, approved_permissions } = req.body;

    const request = await AccessRequest.findById(request_id).populate({
      path: 'requester_id',
      populate: { path: 'role' }
    });
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid or already processed request.' });
    }

    // Validate approved_permissions
    if (!Array.isArray(approved_permissions) || approved_permissions.length === 0) {
      return res.status(400).json({ message: 'Approved permissions must be a non-empty array.' });
    }

    // Ensure approved_permissions are a subset of requested permissions
    for (const approvedPerm of approved_permissions) {
      const requestedPerm = request.permissions.find(p => p.page === approvedPerm.page);
      if (!requestedPerm) {
        return res.status(400).json({ message: `Page ${approvedPerm.page} not in requested permissions.` });
      }
      const invalidActions = approvedPerm.actions.filter(a => !requestedPerm.actions.includes(a));
      if (invalidActions.length > 0) {
        return res.status(400).json({ message: `Invalid actions for ${approvedPerm.page}: ${invalidActions.join(', ')}.` });
      }
    }

    // Update request
    request.status = 'approved';
    request.approval_date = new Date();
    request.approved_permissions = approved_permissions;
    await request.save();

    // Update user's permissions in the User document
    await User.findByIdAndUpdate(request.requester_id._id, {
      $set: { permissions: approved_permissions }, // Replace existing permissions with approved ones
    });

    // Emit to admins room
    const approvedMessage = approved_permissions.map(p => `${p.page} (${p.actions.join(', ')})`).join(', ');
    global.io.of('/access-request-notifications').to('admins').emit('accessRequestUpdated', {
      _id: request._id,
      status: 'approved',
      approved_permissions,
      message: `Access request approved for ${request.requester_id.name} for: ${approvedMessage}.`,
    });

    res.status(200).json({ message: `Request approved for: ${approvedMessage}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Reject access request
exports.rejectAccess = async (req, res) => {
  try {
    const { request_id } = req.body;
    const request = await AccessRequest.findById(request_id).populate({
      path: 'requester_id',
      populate: { path: 'role' }
    });

    if (!request || request.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid or already processed request.' });
    }

    request.status = 'rejected';
    request.rejection_date = new Date();
    await request.save();

    // Emit to admins room
    global.io.of('/access-request-notifications').to('admins').emit('accessRequestUpdated', {
      _id: request._id,
      status: 'rejected',
      message: `Access request rejected for ${request.requester_id.name}.`,
    });

    res.status(200).json({ message: 'Request rejected.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all access requests
exports.getAccessRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'all';
    const skip = (page - 1) * limit;
    const query = {};
    if (status === 'read') {
      query.is_read = true;
    } else if (status === 'unread') {
      query.is_read = false;
    }

    const total = await AccessRequest.countDocuments(query);

    const requests = await AccessRequest.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .populate({
        path: 'requester_id',
        select: 'name role',
        populate: { path: 'role', select: 'role' },
      })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAccessRequests error:", error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { request_id } = req.body;
    const request = await AccessRequest.findById(request_id);

    if (!request) {
      return res.status(400).json({ message: 'Invalid request.' });
    }

    request.is_read = true;
    await request.save();

    // Emit to admins room
    global.io.of('/access-request-notifications').to('admins').emit('accessRequestUpdated', {
      _id: request._id,
      is_read: true,
    });

    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get user details by ID (for subadmin details)
exports.getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch user details
    const user = await User.findById(user_id)
      .select('name role')
      .populate('role', 'role');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Fetch all approved access requests for the user
    const accessRequests = await AccessRequest.find({
      requester_id: user_id,
      status: 'approved',
    });

    // Aggregate approved_permissions
    const permissionMap = new Map();
    accessRequests.forEach((request) => {
      request.approved_permissions.forEach((perm) => {
        const existing = permissionMap.get(perm.page) || new Set();
        perm.actions.forEach((action) => existing.add(action));
        permissionMap.set(perm.page, existing);
      });
    });

    // Convert to array format
    const approved_permissions = Array.from(permissionMap.entries()).map(([page, actions]) => ({
      page,
      actions: Array.from(actions),
    }));

    // Combine user data with aggregated approved_permissions
    const response = {
      _id: user._id,
      name: user.name,
      role: user.role,
      approved_permissions,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get access requests for a specific subadmin
exports.getAccessRequestsBySubadminId = async (req, res) => {
  try {
    const { subadminId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    // Validate subadmin is SUB_ADMIN
    const subadmin = await User.findById(subadminId).populate('role');
    if (!subadmin || subadmin.role.role !== 'SUB_ADMIN') {
      return res.status(404).json({ message: 'Subadmin not found or not authorized.' });
    }

    // Calculate pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch access requests for the subadmin with pagination
    const requests = await AccessRequest.find({ requester_id: subadminId })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalRequests = await AccessRequest.countDocuments({ requester_id: subadminId });
    const totalPages = Math.ceil(totalRequests / limitNum);

    res.status(200).json({
      requests,
      totalPages,
      currentPage: pageNum,
      totalRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.searchSubadmins = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required.' });
    }

    // Find SUB_ADMIN role
    const subAdminRole = await Role.findOne({ role: 'SUB_ADMIN' });
    if (!subAdminRole) {
      return res.status(404).json({ message: 'SUB_ADMIN role not found.' });
    }

    // Search users with role SUB_ADMIN by email or phone
    const subadmins = await User.find({
      role: subAdminRole._id,
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name email phone role')
      .populate('role', 'role'); // Populate role field with role name

    // Transform response to include role name directly
    const formattedSubadmins = subadmins.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role?.role || 'SUB_ADMIN', // Fallback to 'SUB_ADMIN' if role is not populated
    }));

    res.status(200).json({ subadmins: formattedSubadmins });
  } catch (error) {
    console.error('Error searching subadmins:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update an access request (edit approved_permissions)
exports.updateAccessRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { approved_permissions } = req.body;

    const request = await AccessRequest.findById(request_id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Validate approved_permissions
    if (!Array.isArray(approved_permissions) || approved_permissions.length === 0) {
      return res.status(400).json({ message: 'Approved permissions must be a non-empty array.' });
    }

    // Ensure approved_permissions are a subset of requested permissions
    for (const approvedPerm of approved_permissions) {
      const requestedPerm = request.permissions.find(p => p.page === approvedPerm.page);
      if (!requestedPerm) {
        return res.status(400).json({ message: `Page ${approvedPerm.page} not in requested permissions.` });
      }
      const invalidActions = approvedPerm.actions.filter(a => !requestedPerm.actions.includes(a));
      if (invalidActions.length > 0) {
        return res.status(400).json({ message: `Invalid actions for ${approvedPerm.page}: ${invalidActions.join(', ')}.` });
      }
    }

    // Update approved_permissions
    request.approved_permissions = approved_permissions;
    request.status = 'approved';
    request.approval_date = new Date();
    await request.save();

    // Update user's permissions
    await User.findByIdAndUpdate(request.requester_id, {
      $set: { permissions: approved_permissions },
    });

    // Emit real-time update
    const permissionMessage = approved_permissions.map(p => `${p.page} (${p.actions.join(', ')})`).join(', ');
    global.io.of('/access-request-notifications').to('admins').emit('accessRequestUpdated', {
      _id: request._id,
      status: 'approved',
      approved_permissions,
      message: `Access request updated for ${request.requester_id.name} for: ${permissionMessage}.`,
    });

    res.status(200).json({ message: 'Access request updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete an access request
exports.deleteAccessRequest = async (req, res) => {
  try {
    const { request_id } = req.params;

    const request = await AccessRequest.findByIdAndDelete(request_id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Emit real-time update
    global.io.of('/access-request-notifications').to('admins').emit('accessRequestDeleted', {
      _id: request_id,
      message: `Access request deleted for ${request.requester_id.name}.`,
    });

    res.status(200).json({ message: 'Access request deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAccessRequestDetails = async (req, res) => {
  const { id } = req.params;

  const accessRequest = await AccessRequest.findById(id)
    .populate('requester_id', 'name email')
    .lean();

  if (!accessRequest) {
    res.status(404);
    throw new Error('Access request not found');
  }

  if (!req.user?.role) {
    res.status(403);
    throw new Error('Not authorized to view this access request');
  }

  res.status(200).json({
    success: true,
    data: accessRequest,
  });
};
