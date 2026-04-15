

const mongoose = require('mongoose');

const ViewPointSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,  
    required: true,
    unique: true,
    ref: 'User'
  },

  view_points: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const ViewPoint = mongoose.model('ViewPoint', ViewPointSchema);

module.exports = ViewPoint;

