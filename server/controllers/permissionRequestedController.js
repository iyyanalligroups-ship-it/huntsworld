// const PermissionRequest = require("../models/permissionRequestedModel");
// const Role=require('../models/roleModel');
// const PermissionRequestReadMapping=require('../models/permissionRequestReadMappingModel');
// const User =require('../models/userModel')
// // const io = require("socket.io")
// // Sub-admin creates a permission request
// // POST /api/permission-requests
// // exports.createPermissionRequest = async (req, res) => {
// //   try {
// //     const { permission_id } = req.body;
// //     const user_id = req.params.id; // Assuming user ID comes from params

// //     // Check if a pending request already exists
// //     const existingRequest = await PermissionRequest.findOne({
// //       user_id,
// //       permission_id,
// //       status: 'pending'
// //     });

// //     if (existingRequest) {
// //       return res.status(400).json({ message: 'Permission request already pending.' });
// //     }

// //     // Create new permission request
// //     const permissionRequest = new PermissionRequest({
// //       user_id,
// //       permission_id,
// //       status: 'pending'
// //     });

// //     await permissionRequest.save();

// //     // ✅ Correct: Get io from app settings
// //     const io = req.app.get('io');

// //     // Emit notification for new permission request
// //     const notification = {
// //       message: `A new permission request has been made by user ${user_id}`,
// //       requestId: permissionRequest._id,
// //       permission_id,
// //     };

// //     io.emit('newNotification', notification); // ✅ Correct

// //     res.status(201).json({
// //       message: 'Permission request created successfully.',
// //       data: permissionRequest
// //     });
// //   } catch (error) {
// //     console.error('Error creating permission request:', error);
// //     res.status(500).json({ message: 'Server error while creating permission request.' });
// //   }
// // };
// // exports.createPermissionRequest = async (req, res) => {
// //   try {
// //     const { permission_id, message } = req.body;
// //     const user_id = req.params.id;

// //     // Check for existing pending request
// //     const existingRequest = await PermissionRequest.findOne({
// //       user_id,
// //       permission_id,
// //       status: "pending",
// //     });

// //     if (existingRequest) {
// //       return res.status(400).json({
// //         message: "Permission request already pending.",
// //       });
// //     }

// //     // Create new permission request
// //     const permissionRequest = new PermissionRequest({
// //       user_id,
// //       permission_id,
// //       status: "pending",
// //       message: message,
// //     });

// //     await permissionRequest.save();
// //     const io = req.app.get("io");

// //     // Create notification object
// //     const notification = {
// //       id: permissionRequest._id.toString(), // Use MongoDB _id as notification id
// //       message: `New permission request from user ${user_id}`,
// //       type: "info", // Can be 'info', 'success', or 'warning'
// //       timestamp: new Date(),
// //       isRead: false,
// //       link: `/admin/settings`, // Link to view the permission request
// //     };

// //     // Emit the notification through Socket.IO
// //     io.emit("newNotification", notification);

// //     res.status(201).json({
// //       message: "Permission request created successfully.",
// //       data: permissionRequest,
// //     });
// //   } catch (error) {
// //     console.error("Error creating permission request:", error);
// //     res.status(500).json({
// //       message: "Server error while creating permission request.",
// //     });
// //   }
// // };
// exports.createPermissionRequest = async (req, res) => {
//   try {
//     const { permission_id, message } = req.body;
//     const user_id = req.params.id;

//     // Check for existing pending request
//     const existingRequest = await PermissionRequest.findOne({
//       user_id,
//       permission_id,
//       status: "pending",
//     });

//     if (existingRequest) {
//       return res.status(400).json({
//         message: "Permission request already pending.",
//       });
//     }

//     // Create new permission request
//     const permissionRequest = new PermissionRequest({
//       user_id,
//       permission_id,
//       status: "pending",
//       message,
//     });

//     await permissionRequest.save();

//     // ✅ Find ADMIN role ID
//     const adminRole = await Role.findOne({ role: "ADMIN" });
//     if (!adminRole) {
//       return res.status(500).json({ message: "ADMIN role not found" });
//     }

//     // ✅ Find all ADMIN users
//     const adminUsers = await User.find({ role: adminRole._id }).select('_id');

//     // ✅ Create mapping for each admin
//     const mappings = adminUsers.map(admin => ({
//       permissionRequest_id: permissionRequest._id,
//       admin_id: admin._id,
//       isRead: false,
//       readAt: null,
//     }));

//     await PermissionRequestReadMapping.insertMany(mappings);

//     // ✅ Emit socket notification
//     const io = req.app.get("io");
//     const notification = {
//       id: permissionRequest._id.toString(),
//       message: `New permission request from user ${user_id}`,
//       type: "info",
//       timestamp: new Date(),
//       isRead: false,
//       link: `/admin/settings`,
//     };

//     io.emit("newNotification", notification);

//     res.status(201).json({
//       message: "Permission request created successfully.",
//       data: permissionRequest,
//     });

//   } catch (error) {
//     console.error("Error creating permission request:", error);
//     res.status(500).json({
//       message: "Server error while creating permission request.",
//     });
//   }
// };

// // Admin approves or rejects a permission request
// // PUT /api/permission-requests/:id
// exports.updatePermissionRequestStatus = async (req, res) => {
//   try {
//     const { status, user_id } = req.body;
//     


//     // Validate status
//     if (!["approved", "rejected"].includes(status)) {
//       return res
//         .status(400)
//         .json({ message: "Invalid status. Must be approved or rejected." });
//     }

//     const permissionRequest = await PermissionRequest.findById(req.params.id);

//     if (!permissionRequest) {
//       return res.status(404).json({ message: "Permission request not found." });
//     }

//     permissionRequest.status = status;
//     permissionRequest.approved_at = new Date();
//     permissionRequest.approved_by = user_id;

//     await permissionRequest.save();

//     res.status(200).json({
//       message: `Permission request has been ${status}.`,
//       data: permissionRequest,
//     });
//   } catch (error) {
//     console.error("Error updating permission request:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while updating permission request." });
//   }
// };
// // exports.updatePermissionRequest = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { status } = req.body;

// //     const request = requests.get(id);
// //     if (!request) {
// //       return res.status(404).json({ message: 'Request not found' });
// //     }

// //     request.status = status;
// //     requests.set(id, request);

// //     // Create notification
// //     const notification = {
// //       id: `${id}_update`,
// //       message: `Permission request ${status}`,
// //       type: status === 'approved' ? 'success' : 'warning',
// //       timestamp: new Date(),
// //       isRead: false,
// //       link: `/permissions/${id}`
// //     };

// //     // Emit notification
// //     io.emit('newNotification', notification);

// //     res.json({
// //       message: 'Permission request updated successfully.',
// //       data: request
// //     });
// //   } catch (error) {
// //     console.error('Error updating permission request:', error);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // };
// // (Optional) Get all permission requests for Admin
// // GET /api/permission-requests
// exports.getAllPermissionRequests = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const filter = req.query.filter || "all";
//     const adminId = req.query.adminId;

//     if (!adminId) {
//       return res.status(400).json({ message: "adminId is required" });
//     }

//     let dateFilter = {};
//     const now = new Date();
//     const todayStart = new Date(now.setHours(0, 0, 0, 0));
//     const todayEnd = new Date(now.setHours(23, 59, 59, 999));
//     const firstDayOfWeek = new Date();
//     firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
//     const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

//     if (filter === "today") {
//       dateFilter.createdAt = { $gte: todayStart, $lt: todayEnd };
//     } else if (filter === "week") {
//       dateFilter.createdAt = {
//         $gte: firstDayOfWeek,
//         $lt: new Date(firstDayOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
//       };
//     } else if (filter === "month") {
//       dateFilter.createdAt = {
//         $gte: firstDayOfMonth,
//         $lt: firstDayOfNextMonth,
//       };
//     }

//     // Fetch paginated permission requests
//     const [requests, totalCount] = await Promise.all([
//       PermissionRequest.find(dateFilter)
//         .populate("user_id", "name email")
//         .populate("permission_id", "name")
//         .populate("approved_by", "name email")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit),
//       PermissionRequest.countDocuments(dateFilter),
//     ]);

//     // Fetch read mappings for current admin
//     const mappings = await PermissionRequestReadMapping.find({
//       admin_id: adminId,
//     }).select("permissionRequest_id isRead type");

//     const mappingMap = new Map();
//     mappings.forEach((map) => {
//       mappingMap.set(map.permissionRequest_id.toString(), {
//         isRead: map.isRead,
//         type: map.type,
//       });
//     });


//     // Attach isRead info and calculate unread count
//     let unreadCount = 0;
//     const enrichedRequests = requests.map((req) => {
//       const mapping = mappingMap.get(req._id.toString()) || { isRead: false, type: 'info' };
//       if (!mapping.isRead) unreadCount++;
//       return {
//         ...req.toObject(),
//         isRead: mapping.isRead,
//         type: mapping.type,
//       };
//     });


//     res.status(200).json({
//       message: "Permission requests fetched successfully.",
//       data: enrichedRequests,
//       unreadCount,
//       pagination: {
//         total: totalCount,
//         page,
//         limit,
//         totalPages: Math.ceil(totalCount / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching permission requests:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while fetching permission requests." });
//   }
// };

// exports.getAllPermissionRequestsMapping = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const filter = req.query.filter || "all";
//     const adminId = req.query.adminId;

//     if (!adminId) {
//       return res.status(400).json({ message: "adminId is required" });
//     }

//     let dateFilter = {};
//     const now = new Date();
//     const todayStart = new Date(now.setHours(0, 0, 0, 0));
//     const todayEnd = new Date(now.setHours(23, 59, 59, 999));
//     const firstDayOfWeek = new Date();
//     firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
//     const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

//     if (filter === "today") {
//       dateFilter.createdAt = { $gte: todayStart, $lt: todayEnd };
//     } else if (filter === "week") {
//       dateFilter.createdAt = {
//         $gte: firstDayOfWeek,
//         $lt: new Date(firstDayOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
//       };
//     } else if (filter === "month") {
//       dateFilter.createdAt = {
//         $gte: firstDayOfMonth,
//         $lt: firstDayOfNextMonth,
//       };
//     }

//     // Fetch paginated permission requests
//     const [requests, totalCount] = await Promise.all([
//       PermissionRequest.find(dateFilter)
//         .populate("user_id", "name email")
//         .populate("permission_id", "name")
//         .populate("approved_by", "name email")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit),
//       PermissionRequest.countDocuments(dateFilter),
//     ]);

//     // Fetch read mappings for the current admin, only those that are not deleted
//     const mappings = await PermissionRequestReadMapping.find({
//       admin_id: adminId,
//       isDeleted: false,  // Filter out logically deleted records
//     }).select("permissionRequest_id isRead type");

//     const mappingMap = new Map();
//     mappings.forEach((map) => {
//       mappingMap.set(map.permissionRequest_id.toString(), {
//         isRead: map.isRead,
//         type: map.type,
//       });
//     });

//     // Attach isRead info and calculate unread count
//     let unreadCount = 0;
//     const enrichedRequests = requests.map((req) => {
//       const mapping = mappingMap.get(req._id.toString()) || { isRead: false, type: 'info' };
//       if (!mapping.isRead) unreadCount++;
//       return {
//         ...req.toObject(),
//         isRead: mapping.isRead,
//         type: mapping.type,
//       };
//     });

//     res.status(200).json({
//       message: "Permission requests fetched successfully.",
//       data: enrichedRequests,
//       unreadCount,
//       pagination: {
//         total: totalCount,
//         page,
//         limit,
//         totalPages: Math.ceil(totalCount / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching permission requests:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while fetching permission requests." });
//   }
// };

// exports.deletePermissionRequest = async (req, res) => {
//   try {
//     const permissionRequest = await PermissionRequest.findById(req.params.id);

//     if (!permissionRequest) {
//       return res.status(404).json({ message: "Permission request not found." });
//     }

//     await permissionRequest.deleteOne();

//     res
//       .status(200)
//       .json({ message: "Permission request deleted successfully." });
//   } catch (error) {
//     console.error("Error deleting permission request:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while deleting permission request." });
//   }
// };

