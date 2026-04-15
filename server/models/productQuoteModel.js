const mongoose = require('mongoose');

const productQuoteSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  matchQuotes: {
    type: Boolean,
    default: true,
  },
  respondedAt: {
    type: Date,
    default: null,
  },
  processed: {
    type: Boolean,
    default: false,
  },
  pointsGiven: {
  type: Boolean,
  default: false,
}

}, { timestamps: true });

const ProductQuote = mongoose.model('ProductQuote', productQuoteSchema);
module.exports = ProductQuote;