// models/SearchSuggestion.js
const mongoose = require('mongoose');

const searchSuggestionSchema = new mongoose.Schema({
  keyword: { type: String, required: true, unique: true, lowercase: true },
  display: { type: String, required: true }, 
  type: { 
    type: String, 
    enum: ['brand', 'product', 'category', 'seo', 'trending', 'company'], 
    default: 'seo' 
  },
  priority: { type: Number, default: 10 }, 
  searchCount: { type: Number, default: 0 },
  citySpecific: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SearchSuggestion', searchSuggestionSchema);