const mongoose = require('mongoose');

const PermissionRequestReadMappingSchema = new mongoose.Schema({
  permissionRequest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PermissionRequest' },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  type: { type: String, default: 'info' },
  isDeleted: { type: Boolean, default: false }, // Logical delete flag
  deletedAt: { type: Date }, // Date of logical deletion
});

const PermissionRequestReadMapping = mongoose.model('PermissionRequestReadMapping', PermissionRequestReadMappingSchema);

module.exports = PermissionRequestReadMapping;
