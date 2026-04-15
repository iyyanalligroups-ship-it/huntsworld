// models/FaqTopic.js
const mongoose = require('mongoose');

const FaqTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'general','student','baseMember'],
    default: 'buyer',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isVisible: {
    type: Boolean,
    default: true,
  },

},{
  timestamps:true
});

module.exports = mongoose.model('FaqTopic', FaqTopicSchema);
