const mongoose = require('mongoose');

const askPriceRequestSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Optional if guest user
    },
    merchant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Closed'],
        default: 'Pending',
    },
    isReadByMerchant: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
// Add TTL index for 15 days (15 * 24 * 60 * 60 = 1,296,000 seconds)
askPriceRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1296000 });

const AskPriceRequest = mongoose.model('AskPriceRequest', askPriceRequestSchema);
module.exports = AskPriceRequest;
