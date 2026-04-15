const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  brand_name: { type: String, required: true, trim: true },
  image_url: { type: String, required: true },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);