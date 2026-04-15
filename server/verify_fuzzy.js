const mongoose = require('mongoose');
const Merchant = require('./models/MerchantModel');
const Product = require('./models/productModel');
const BuyLead = require('./models/buyLeadsModel');
const Category = require('./models/categoryModel');
const SubCategory = require('./models/subCategoryModel');
const SuperSubCategory = require('./models/superSubCategoryModel');
const DeepSubCategory = require('./models/deepSubCategoryModel');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find the Ashil merchant
        const merchant = await Merchant.findOne({ company_name: /Ashil/i });
        if (!merchant) {
            console.log("Merchant not found");
            process.exit(1);
        }

        const sellerProducts = await Product.find({ seller_id: merchant._id })
            .populate('category_id', 'category_name')
            .populate('sub_category_id', 'sub_category_name')
            .populate('super_sub_category_id', 'super_sub_category_name')
            .populate('deep_sub_category_id', 'deep_sub_category_name');

        let allKeywords = new Set();
        const extractKeywords = (str) => {
            if (!str) return [];
            return str.toLowerCase().split(/[\s,/-]+/).filter(word => word.length > 2);
        };

        sellerProducts.forEach(product => {
            extractKeywords(product.product_name).forEach(k => allKeywords.add(k));
            if (product.category_id) extractKeywords(product.category_id.category_name).forEach(k => allKeywords.add(k));
            if (product.sub_category_id) extractKeywords(product.sub_category_id.sub_category_name).forEach(k => allKeywords.add(k));
            if (product.super_sub_category_id) extractKeywords(product.super_sub_category_id.super_sub_category_name).forEach(k => allKeywords.add(k));
            if (product.deep_sub_category_id) extractKeywords(product.deep_sub_category_id.deep_sub_category_name).forEach(k => allKeywords.add(k));
        });

        // Root-word generation
        allKeywords.forEach(kw => {
            if (kw.endsWith('ed') && kw.length > 5) allKeywords.add(kw.slice(0, -2));
            if (kw.endsWith('s') && kw.length > 4) allKeywords.add(kw.slice(0, -1));
            if (kw.endsWith('ing') && kw.length > 6) allKeywords.add(kw.slice(0, -3));
        });

        const searchRegexes = Array.from(allKeywords).map(kw =>
            new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
        );

        console.log("Merchant Keywords:", Array.from(allKeywords));

        // Find relevant leads in DB
        const buyLeads = await BuyLead.find({
            searchTerm: { $in: searchRegexes }
        }).limit(5);

        console.log(`Found ${buyLeads.length} matching leads in database:`);
        buyLeads.forEach(lead => {
            console.log(`- Lead: "${lead.searchTerm}"`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
