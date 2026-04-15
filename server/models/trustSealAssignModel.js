// models/trustSealAssignmentModel.js
const mongoose = require('mongoose');

const trustSealAssignmentSchema = new mongoose.Schema({
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrustSealRequest',
    required: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assigned_at: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['assigned', 'completed', 'cancelled'],
    default: 'assigned',
  },
});

module.exports = mongoose.model('TrustSealAssignment', trustSealAssignmentSchema);
