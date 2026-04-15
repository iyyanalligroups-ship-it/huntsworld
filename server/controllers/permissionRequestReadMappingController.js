// const PermissionRequestReadMapping = require('../models/permissionRequestReadMappingModel');

// // Mark a single permission request as read
// exports.markAsRead = async (req, res) => {
//   try {
//     const { permissionRequestId, adminId } = req.body;
//     


//     if (!permissionRequestId || !adminId) {
//       return res.status(400).json({ success: false, message: 'permissionRequestId and adminId are required' });
//     }

//     const updated = await PermissionRequestReadMapping.findOneAndUpdate(
//         { permissionRequest_id: permissionRequestId, admin_id: adminId },
//         {
//           isRead: true,
//           readAt: new Date(),
//           type: "success", // ✅ this is part of the update
//         },
//         {
//           upsert: true,
//           new: true,
//         }
//       );


//     res.status(200).json({ success: true, data: updated });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Mark all permission requests as read
// exports.markAllAsRead = async (req, res) => {
//   try {
//     const { adminId } = req.body;

//     if (!adminId) {
//       return res.status(400).json({ success: false, message: 'adminId is required' });
//     }
//     await PermissionRequestReadMapping.updateMany(
//         { admin_id: adminId },
//         {
//           isRead: true,
//           readAt: new Date(),
//           type: "success", // ✅ this is part of the update
//         }
//       );


//     res.status(200).json({ success: true, message: 'All permission requests marked as read' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// exports.deleteReadMapping = async (req, res) => {
//     try {
//       const { permissionRequestId, adminId } = req.params;
//         

//       if (!permissionRequestId || !adminId) {
//         return res.status(400).json({ success: false, message: 'permissionRequestId and adminId are required' });
//       }

//       // Find the read mapping and update it to mark as deleted
//       const deletedMapping = await PermissionRequestReadMapping.findOneAndUpdate(
//         { permissionRequest_id: permissionRequestId, admin_id: adminId, isDeleted: false }, // Ensure we're not trying to delete already deleted records
//         {
//           isDeleted: true,          // Mark it as deleted
//           deletedAt: new Date(),   // Record the deletion time
//         },
//         { new: true }
//       );

//       if (!deletedMapping) {
//         return res.status(404).json({ success: false, message: 'Read mapping not found or already deleted' });
//       }

//       res.status(200).json({ success: true, message: 'Read mapping logically deleted' });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   };
  