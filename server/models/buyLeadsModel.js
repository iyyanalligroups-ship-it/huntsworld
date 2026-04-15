const mongoose = require('mongoose');

const BuyLeadSchema = new mongoose.Schema(
  {
    searchTerm: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['product', 'manufacture', 'sub_dealer', 'retailer', 'supplier', 'base_member', 'service'],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    city: {
      type: String, // Or you can reference City model if you have one
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
    },
    is_unmatched: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
BuyLeadSchema.index({ user_id: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('BuyLead', BuyLeadSchema);