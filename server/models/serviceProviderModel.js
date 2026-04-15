// Backend: models/ServiceProvider.js (modified to remove required: true from non-essential fields)
// const mongoose = require('mongoose');
// const ServiceProviderSchema = new mongoose.Schema({
//     user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
//     address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
//     company_email: { type: String, unique: true, required: true },
//     company_phone_number: { type: String, required: true },
//     travels_name: { type: String, required: true },
//     license_number: { type: String, unique: true },
//     verified_status: { type: Boolean, default: false },
//     trust_shield: { type: Boolean, default: false },
//     number_of_vehicles: { type: Number },
//     vehicle_type: {
//         type: String,
//         enum: ['2-wheeler', '3-wheeler', '4-wheeler', '8-wheeler', '12-wheeler'],
//     },
//     description: {
//         type: String,
//         validate: {
//           validator: function (value) {
//             if (!value) return true; // Allow empty
//             const wordCount = value.trim().split(/\s+/).length;
//             return wordCount >= 10 && wordCount <= 3000;
//           },
//           message: "Description must be between 30 and 3000 words if provided.",
//         },
//       },  
//     company_logo: { type: String },
//     company_images: [{ type: String }],
//     created_at: { type: Date, default: Date.now },
//     updated_at: { type: Date, default: Date.now },
// });

// const ServiceProvider = mongoose.model('ServiceProvider', ServiceProviderSchema);

// module.exports = ServiceProvider;



// models/ServiceProvider.js
const mongoose = require('mongoose');
const Product = require('../models/productModel'); // <-- Critical

const ServiceProviderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  company_email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  company_phone_number: { type: String, required: true },
  travels_name: { type: String, required: true },
  license_number: { type: String, unique: true },
  email_verified: { type: Boolean, default: false },
  number_verified: { type: Boolean, default: false },
  verified_status: { type: Boolean, default: false },
  trust_shield: { type: Boolean, default: false },
  number_of_vehicles: { type: Number },
  vehicle_type: {
    type: String,
    enum: ['2-wheeler', '3-wheeler', '4-wheeler', '8-wheeler', '12-wheeler'],
  },
  description: {
    type: String,
    validate: {
      validator: function (value) {
        if (!value) return true;
        const wordCount = value.trim().split(/\s+/).length;
        return wordCount >= 10 && wordCount <= 3000;
      },
      message: "Description must be between 10 and 3000 words if provided.",
    },
  },
  company_logo: { type: String },
  company_images: [{ type: String }],
}, { timestamps: true });

// ────────────────────── UNIVERSAL CASCADE DELETE (QUERY + DOCUMENT) ──────────────────────
ServiceProviderSchema.pre(['deleteOne', 'findOneAndDelete', 'deleteMany'], async function (next) {
  try {

    let providerIds = [];

    // Document-level: doc.deleteOne()
    if (this._id) {
      providerIds = [this._id];
    }
    // Query-level: Model.deleteOne(), findOneAndDelete, deleteMany
    else {
      const docs = await this.model.find(this.getQuery()).lean().select('_id');
      providerIds = docs.map(d => d._id);
    }

    if (providerIds.length === 0) return next();

    const result = await Product.deleteMany({
      seller_id: { $in: providerIds },
      sellerModel: 'ServiceProvider'   // <-- Important!
    });

    next();
  } catch (err) {
    console.error('[CASCADE ERROR] ServiceProvider → products:', err);
    next(err);
  }
});

const ServiceProvider = mongoose.model('ServiceProvider', ServiceProviderSchema);
module.exports = ServiceProvider;