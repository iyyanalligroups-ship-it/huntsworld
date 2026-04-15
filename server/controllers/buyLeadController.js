const BuyLead = require('../models/buyLeadsModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const { FEATURES, STATUS } = require('../constants/subscriptionConstants');
const UserSubscription = require('../models/userSubscriptionPlanModel'); // Adjust path
const UserActiveFeature = require('../models/UserActiveFeature'); // Adjust path
const Merchant = require('../models/MerchantModel');
const ServiceProvider = require('../models/serviceProviderModel');


// Insert a BuyLead
exports.createBuyLead = async (req, res) => {
  try {
    const { searchTerm, type, city, user_id, category_id, sub_category_id } = req.body;

    // Validate inputs
    if (!searchTerm || !type || !user_id) {
      return res.status(400).json({ error: 'searchTerm, type, and user_id are required' });
    }

    if (!['product', 'manufacture', 'sub_dealer', 'retailer', 'supplier', 'base_member', 'service'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Calculate is_unmatched
    let is_unmatched = false;
    try {
      const orConditions = [];
      if (category_id) orConditions.push({ category_id });
      if (sub_category_id) orConditions.push({ sub_category_id });

      if (searchTerm) {
        const keywords = searchTerm.toLowerCase().split(/[\s,/-]+/).filter(word => word.length > 2);
        const processedKeywords = new Set();
        keywords.forEach(kw => {
          processedKeywords.add(kw);
          if (kw.endsWith('ed') && kw.length > 5) processedKeywords.add(kw.slice(0, -2));
          if (kw.endsWith('s') && kw.length > 4) processedKeywords.add(kw.slice(0, -1));
          if (kw.endsWith('ing') && kw.length > 6) processedKeywords.add(kw.slice(0, -3));
        });
        const searchRegexes = Array.from(processedKeywords).map(kw =>
          new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
        );
        if (searchRegexes.length > 0) {
          orConditions.push({ product_name: { $in: searchRegexes } });
        }
      }

      if (orConditions.length > 0) {
        const matchCount = await Product.countDocuments({ $or: orConditions });
        if (matchCount === 0) {
          is_unmatched = true;
        }
      } else {
        is_unmatched = true; // No search terms or categories to match
      }
    } catch (err) {
      console.error('Error evaluating is_unmatched for BuyLead:', err);
    }

    // Create new BuyLead
    const buyLead = new BuyLead({
      searchTerm,
      type,
      user_id,
      city: city || '',
      category_id: category_id || null, // Will only be set if clicked from suggestion
      sub_category_id: sub_category_id || null,
      is_unmatched,
    });

    await buyLead.save();

    res.status(201).json({ success: true, data: buyLead });
  } catch (err) {
    console.error('Create BuyLead error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// exports.getBuyLeads = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const skip = (page - 1) * limit;

//     // Fetch BuyLeads and populate user details
//     const buyLeads = await BuyLead.find()
//       .skip(skip)
//       .limit(parseInt(limit))
//       .sort({ createdAt: -1 }) // Newest first
//       .populate({
//         path: 'user_id',
//         select: 'name phone', // Select only name and phone from User model
//       })
//       .lean();

//     // Log fetched data for debugging
//     

//     const totalCount = await BuyLead.countDocuments();

//     res.json({
//       success: true,
//       data: buyLeads,
//       totalPages: Math.ceil(totalCount / limit),
//       totalCount,
//     });
//   } catch (err) {
//     console.error('Get BuyLeads error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };



exports.getBuyLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Use req.user.user._id as you confirmed this is working
    const authenticatedUserId = req.user?.userId;
    const now = new Date();
     
    if (!authenticatedUserId) {
      // This log will show you exactly what the middleware is passing
      return res.status(401).json({ success: false, error: "Unauthorized access" });
    }

    // STEP 1: Get the latest active 'paid' subscription for this user
    // We sort by createdAt: -1 to ensure we check their most recent purchase
    const latestSub = await UserSubscription.findOne({
      user_id: authenticatedUserId,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      $or: [
        { end_date: { $gt: now } },
        { end_date: null }
      ]
    }).sort({ createdAt: -1 });

    if (!latestSub) {
      return res.status(403).json({
        success: false,
        error: 'No active subscription found. Please upgrade your plan.'
      });
    }

    // STEP 2: Verify "Buy Leads" exists and is enabled in the plan's snapshot
    // 💡 Backward compatibility: Fallback to feature_name if feature_code is missing (for older subscriptions)
    const buyLeadInSnapshot = latestSub.features_snapshot.find(
      (f) => (f.feature_code === FEATURES.BUY_LEADS) || (!f.feature_code && f.feature_name === "Buy Leads")
    );

    if (!buyLeadInSnapshot || !buyLeadInSnapshot.is_enabled) {
      return res.status(403).json({
        success: false,
        error: 'Your existing plan does not have the "Buy Leads" feature.'
      });
    }

    // Confirm the feature is currently 'active' in UserActiveFeature
    // 💡 Backward compatibility: Query by feature_code OR feature_id (from snapshot) to handle old records
    const activeFeature = await UserActiveFeature.findOne({
      user_id: authenticatedUserId,
      user_subscription_id: latestSub._id,
      $or: [
        { feature_code: FEATURES.BUY_LEADS },
        { feature_id: buyLeadInSnapshot.feature_id }
      ],
      status: STATUS.ACTIVE,
      $or: [
        { expires_at: { $gt: now } },
        { expires_at: { $exists: false } },
        { expires_at: null }
      ]
    });

    if (!activeFeature) {
      return res.status(403).json({
        success: false,
        error: 'The "Buy Leads" feature is currently inactive or has expired.'
      });
    }

    // STEP 4: Get merchant's products and categories to map to search terms
    const merchantRecord = await Merchant.findOne({ user_id: authenticatedUserId }).select('_id');
    const serviceProviderRecord = await ServiceProvider.findOne({ user_id: authenticatedUserId }).select('_id');
    const sellerId = merchantRecord?._id || serviceProviderRecord?._id;

    if (!sellerId) {
      return res.status(404).json({ success: false, error: "Seller profile not found. Cannot filter leads." });
    }

    // Populate category and sub_category names to generate valid search terms
    const sellerProducts = await Product.find({ seller_id: sellerId })
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .populate('super_sub_category_id', 'super_sub_category_name')
      .populate('deep_sub_category_id', 'deep_sub_category_name')
      .select('product_name category_id sub_category_id super_sub_category_id deep_sub_category_id');

    let allKeywords = new Set();
    let validCategoryIds = new Set();
    let validSubCategoryIds = new Set();

    sellerProducts.forEach(product => {
      // Helper to extract keywords from a string
      const extractKeywords = (str) => {
        if (!str) return [];
        return str.toLowerCase().split(/[\s,/-]+/).filter(word => word.length > 2);
      };

      // Extract from product name
      extractKeywords(product.product_name).forEach(k => allKeywords.add(k));

      // Extract from Category
      if (product.category_id) {
        validCategoryIds.add(product.category_id._id.toString());
        extractKeywords(product.category_id.category_name).forEach(k => allKeywords.add(k));
      }

      // Extract from Sub Category
      if (product.sub_category_id) {
        validSubCategoryIds.add(product.sub_category_id._id.toString());
        extractKeywords(product.sub_category_id.sub_category_name).forEach(k => allKeywords.add(k));
      }

      // Extract from Super Sub Category
      if (product.super_sub_category_id) {
        extractKeywords(product.super_sub_category_id.super_sub_category_name).forEach(k => allKeywords.add(k));
      }

      // Extract from Deep Sub Category
      if (product.deep_sub_category_id) {
        extractKeywords(product.deep_sub_category_id.deep_sub_category_name).forEach(k => allKeywords.add(k));
      }
    });

    // Root-word generation (e.g., "powdered" -> "powder")
    allKeywords.forEach(kw => {
      if (kw.endsWith('ed') && kw.length > 5) allKeywords.add(kw.slice(0, -2));
      if (kw.endsWith('s') && kw.length > 4) allKeywords.add(kw.slice(0, -1));
      if (kw.endsWith('ing') && kw.length > 6) allKeywords.add(kw.slice(0, -3));
    });

    const searchRegexes = Array.from(allKeywords).map(kw =>
      new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
    );

    if (searchRegexes.length === 0 && validCategoryIds.size === 0) {
      return res.status(200).json({
        success: true,
        message: 'No products or categories found. Please add products to see relevant buy leads.',
        data: [],
        totalPages: 0,
        totalCount: 0
      });
    }

    // STEP 5: Fetch Leads with Pagination and term matching
    const skip = (page - 1) * limit;

    const matchQuery = {
      user_id: { $ne: authenticatedUserId }, // Exclude their own requests
      $or: [
        { category_id: { $in: Array.from(validCategoryIds) } },
        { sub_category_id: { $in: Array.from(validSubCategoryIds) } },
        { searchTerm: { $in: searchRegexes } }
      ]
    };

    // Using Promise.all for faster execution of count and find
    const [buyLeads, totalCount] = await Promise.all([
      BuyLead.find(matchQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate({
          path: 'user_id',
          select: 'name phone', // Only pull necessary buyer info
        })
        .lean(),
      BuyLead.countDocuments()
    ]);

    res.json({
      success: true,
      data: buyLeads,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });

  } catch (err) {
    console.error('Buy Leads Controller Error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
