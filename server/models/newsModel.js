// Backend: models/news.js (Assuming MongoDB with Mongoose)
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['in-progress', 'upcoming', 'completed'],
    default: 'upcoming',
  },
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);