const mongoose = require('mongoose');

// const permissionRequestSchema = new mongoose.Schema({
//   user_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User', 
//     required: true
//   },
//   permission_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Permission',
//     required: true
//   },
//   message:{
//     type:String
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   requested_at: {
//     type: Date,
//     default: Date.now
//   },
//   approved_at: {
//     type: Date,
//     default: null
//   },
//   approved_by: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User', 
//     default: null
//   }
// }, {
//   timestamps: true
// });



const permissionRequestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission', required: true },
  message: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requested_at: { type: Date, default: Date.now },
  approved_at: { type: Date, default: null },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const PermissionRequest = mongoose.model('PermissionRequest', permissionRequestSchema);

module.exports = PermissionRequest;
