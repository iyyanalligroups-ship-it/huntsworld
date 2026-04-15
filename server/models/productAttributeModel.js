const mongoose= require('mongoose');


const ProductAttributeSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    attribute_key: {
        type: String,
        required: true,
    },
    attribute_value: {
        type: String,
        required: true,
    },
},{
    timestamps: true,
});

module.exports = mongoose.model('ProductAttribute', ProductAttributeSchema);