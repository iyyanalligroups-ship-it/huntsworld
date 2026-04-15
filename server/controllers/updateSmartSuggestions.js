// scripts/updateSmartSuggestions.js
const SearchSuggestion = require('../models/SearchSuggestion');
const BuyLead = require('../models/buyLeadsModel');
const Product = require('../models/productModel');
const Merchant = require('../models/MerchantModel');

const updateSmartSuggestions = async () => {
  // 1. Get top 500 searched terms from last 90 days
  const topSearches = await BuyLead.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 90*24*60*60*1000) } } },
    { $group: { _id: { $toLower: "$searchTerm" }, count: { $sum: 1 } } },
    { $match: { count: { $gte: 5 } } },
    { $sort: { count: -1 } },
    { $limit: 500 }
  ]);

  const suggestionsToInsert = [];

  for (const item of topSearches) {
    const term = item._id.trim();
    if (term.length < 2) continue;

    const termCap = term.charAt(0).toUpperCase() + term.slice(1);

    // 1. SEO Variations (This is 80% of ExportersIndia magic)
    const seoTemplates = [
      `${termCap} Manufacturers`,
      `${termCap} Suppliers`,
      `${termCap} Wholesalers`,
      `${termCap} Dealers`,
      `${termCap} Factory`,
      `${termCap} Company`,
      `${termCap} Price`,
      `${termCap} Wholesale`,
      `${termCap} Distributors`,
      `${termCap} Near Me`,
      `${termCap} in India`,
      `${termCap} Raw Material`,
      `${termCap} Best Price`,
      `${termCap} Contact Number`,
    ];

    seoTemplates.forEach((phrase, index) => {
      suggestionsToInsert.push({
        keyword: term,
        display: phrase,
        type: 'seo',
        priority: 5 + index,
        searchCount: item.count,
        citySpecific: phrase.includes('Near Me') || phrase.includes('in India')
      });
    });

    // 2. Real Brands (if exist)
    const brandProducts = await Product.find({
      product_name: { $regex: term, $options: 'i' },
      brand_name: { $exists: true, $ne: null }
    }).limit(10);

    brandProducts.forEach(p => {
      if (p.brand_name) {
        suggestionsToInsert.push({
          keyword: term,
          display: `${p.brand_name} ${termCap}`,
          type: 'brand',
          priority: 1,
          searchCount: item.count * 2 // brands rank highest
        });
      }
    });

    // 3. Popular Categories
    const categoryProducts = await Product.find({
      $or: [
        { category: { $regex: term, $options: 'i' } },
        { sub_category: { $regex: term, $options: 'i' } }
      ]
    }).limit(5);

    categoryProducts.forEach(p => {
      const cat = p.category || p.sub_category;
      if (cat) {
        suggestionsToInsert.push({
          keyword: term,
          display: cat,
          type: 'category',
          priority: 3,
          searchCount: item.count
        });
      }
    });
  }

  // Clear old & insert new
  await SearchSuggestion.deleteMany({});
  await SearchSuggestion.insertMany(suggestionsToInsert);
};

// Run daily at 3 AM
const cron = require('node-cron');
cron.schedule('0 3 * * *', updateSmartSuggestions);

// Run once now
updateSmartSuggestions();