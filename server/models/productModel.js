const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sellerModel',
  },
  sellerModel: {
    type: String,
    required: true,
    enum: ['Merchant', 'ServiceProvider'],
  },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  sub_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', default: null },
  super_sub_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperSubCategory', default: null },
  deep_sub_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DeepSubCategory', default: null },
  product_name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: mongoose.Types.Decimal128, required: false, min: 0 },
  askPrice: { type: Boolean, default: false },
  stock_quantity: { type: Number },
  product_image: { type: [String], default: [] },
  image: { type: String, default: '' },
  video_url: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  product_verified_by_admin: { type: Boolean, default: false },
  product_verified_at: { type: Date, default: null },
  markAsRead: { type: Boolean, default: false },
  unitOfMeasurement: { type: String, required: true, trim: true, default: '' },
  // Add this field to your existing schema
  search_tags: {
    type: [String],
    default: [],
    trim: true,
    lowercase: true, // for consistent searching
  },
}, { timestamps: true });

// Text index for fast autocomplete
productSchema.index({ product_name: 'text' });
productSchema.index({ category_id: 1, status: 1 });
productSchema.index({ seller_id: 1, sellerModel: 1 });
productSchema.index({ deep_sub_category_id: 1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
