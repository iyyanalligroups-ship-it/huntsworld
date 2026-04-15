const TrendingPoints = require("../models/trendingPointsModel");
const { STATUS } = require("../constants/subscriptionConstants");
const TrendingPointsPayment = require("../models/userTrendingPointPaymentModel");
const mongoose = require("mongoose");
const Product = require("../models/productModel");
const Point = require("../models/pointsModel");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getEndOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

exports.createTrendingPoint = async (req, res) => {
  try {
    let { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    user_id = new mongoose.Types.ObjectId(user_id);
    product_id = new mongoose.Types.ObjectId(product_id);

    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();

    // 🔥 Fetch dynamic trending point amount
    const trendingPoint = await Point.findOne({
      point_name: "Product_Trend_Point",
    });

    if (!trendingPoint) {
      return res.status(500).json({
        success: false,
        message: "Trending point config missing",
      });
    }

    const trendingPointAmount = trendingPoint.point_amount;

    // 🔥 Check if user already gave trend point TODAY (Click)
    const alreadyTrendingToday = await TrendingPoints.findOne({
      user_id,
      product_id,
      last_trending_date: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    if (alreadyTrendingToday) {
      return res.json({
        success: true,
        message: "Trending point already added today",
        pointsAdded: 0,
      });
    }

    // 🔥 Check if record exists (any previous day)
    const existing = await TrendingPoints.findOne({
      user_id,
      product_id,
    });

    if (existing) {
      existing.trending_points += trendingPointAmount;
      existing.last_trending_date = new Date();
      existing.last_updated_date = new Date();
      existing.last_added_value = trendingPointAmount;

      await existing.save();

      return res.json({
        success: true,
        message: "Trending point updated",
        pointsAdded: trendingPointAmount,
      });
    }

    // 🔵 First time create
    await TrendingPoints.create({
      user_id,
      product_id,
      trending_points: trendingPointAmount,
      last_trending_date: new Date(),
      last_updated_date: new Date(),
      last_added_value: trendingPointAmount,
    });

    return res.json({
      success: true,
      message: "Trending point created",
      pointsAdded: trendingPointAmount,
    });
  } catch (err) {
    console.error("Trending Point Error:", err);

    if (err.code === 11000) {
      return res.json({
        success: true,
        message: "Trending point already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.createTrendingPointForFavorite = async (req, res) => {
  try {
    let { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id or product_id",
      });
    }

    user_id = new mongoose.Types.ObjectId(user_id);
    product_id = new mongoose.Types.ObjectId(product_id);

    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();

    const favoritePoint = await Point.findOne({
      point_name: "Favorite_point",
    });

    if (!favoritePoint) {
      return res.status(500).json({
        success: false,
        message: "Favorite_point configuration not found",
      });
    }

    const favoritePointAmount = favoritePoint.point_amount;
    const now = new Date();

    // 🔥 Check if user already gave favorite point TODAY
    const alreadyFavoriteToday = await TrendingPoints.findOne({
      user_id,
      product_id,
      last_favorite_date: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    if (alreadyFavoriteToday) {
      return res.json({
        success: true,
        message: "Trending point already given for this product today",
        pointsAdded: 0,
      });
    }

    // 🔥 Find existing record (any day)
    const trendingRecord = await TrendingPoints.findOne({
      user_id,
      product_id,
    });

    if (trendingRecord) {
      trendingRecord.trending_points += favoritePointAmount;
      trendingRecord.last_added_value = favoritePointAmount;
      trendingRecord.favorite_point_given = true;
      trendingRecord.last_favorite_date = now;
      trendingRecord.last_updated_date = now;

      await trendingRecord.save();

      return res.json({
        success: true,
        message: "Favorite point added",
        pointsAdded: favoritePointAmount,
      });
    }

    // 🔵 First-time record
    await TrendingPoints.create({
      user_id,
      product_id,
      trending_points: favoritePointAmount,
      last_added_value: favoritePointAmount,
      favorite_point_given: true,
      last_favorite_date: now,
      last_updated_date: now,
    });

    return res.json({
      success: true,
      message: "Favorite point created",
      pointsAdded: favoritePointAmount,
    });
  } catch (err) {
    console.error("Favorite Trending Error:", err);

    if (err.code === 11000) {
      return res.json({
        success: true,
        message: "Favorite point already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// 📌 Get all trending points
exports.getAllTrendingPoints = async (req, res) => {
  try {
    const trendingPoints = await TrendingPoints.find();
    res.json(trendingPoints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 📌 Get trending point by ID
exports.getTrendingPointById = async (req, res) => {
  try {
    const trendingPoint = await TrendingPoints.findById(req.params.id);
    if (!trendingPoint) {
      return res.status(404).json({ message: "Trending Point not found" });
    }
    res.json(trendingPoint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Update trending point by ID
// exports.updateTrendingPoint = async (req, res) => {
//   try {
//     const { user_id, product_id, trending_Points, date } = req.body;

//     const trendingPoint = await TrendingPoints.findById(req.params.id);
//     if (!trendingPoint) {
//       return res.status(404).json({ message: "Trending Point not found" });
//     }

//     trendingPoint.user_id = user_id ?? trendingPoint.user_id;
//     trendingPoint.product_id = product_id ?? trendingPoint.product_id;
//     trendingPoint.trending_Points = trending_Points ?? trendingPoint.trending_Points;
//     trendingPoint.date = date ?? trendingPoint.date;

//     await trendingPoint.save();
//     res.json(trendingPoint);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.updateTrendingPoint = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();

    if (!user_id || !product_id) return res.end();

    const existing = await TrendingPoints.findOne({
      user_id,
      product_id,
      last_updated_date: {
        $gte: startOfToday,
        $lte: endOfToday,
      }
    });

    if (!existing) {
      return res.end(); // Cannot update if not added today
    }

    // Subtract only today's point
    if (existing.trending_points > 0) {
      existing.trending_points -= 1;
      existing.last_updated_date = new Date(0); // reset or set to old date to allow re-add logic if needed
      await existing.save();
    }

    res.end();
  } catch (err) {
    console.error("Update Error:", err);
    res.end();
  }
};

// 📌 Delete trending point by ID
// exports.deleteTrendingPoint = async (req, res) => {
//   try {
//     const trendingPoint = await TrendingPoints.findByIdAndDelete(req.params.id);
//     if (!trendingPoint) {
//       return res.status(404).json({ message: "Trending Point not found" });
//     }
//     res.json({ message: "Trending Point deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.deleteTrendingPoint = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) return res.end();

    await TrendingPoints.findOneAndDelete({ user_id, product_id });

    res.end();
  } catch (err) {
    console.error("Delete Error:", err);
    res.end();
  }
};

// 📌 Add Trending Points
exports.addTrendingPoints = async (req, res) => {
  try {
    const { user_id, product_id, trending_points } = req.body;

    if (!user_id || !product_id || !trending_points) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const now = new Date();
    const mongoose = require("mongoose");

    const wallet = await TrendingPointsPayment
      .findOne({
        user_id: new mongoose.Types.ObjectId(user_id),
        payment_status: STATUS.PAID,
        status: STATUS.ACTIVE_CAP,
      })
      .sort({ createdAt: -1 });

    if (!wallet || wallet.points < trending_points) {
      return res.status(400).json({ message: "Insufficient wallet points" });
    }

    let productTrend = await TrendingPoints.findOne({
      user_id,
      product_id,
    });

    if (productTrend) {
      productTrend.trending_points += trending_points;
      productTrend.last_added_value = trending_points;
      productTrend.last_updated_date = now;
      await productTrend.save();
    } else {
      await TrendingPoints.create({
        user_id,
        product_id,
        trending_points,
        last_added_value: trending_points,
        last_updated_date: now,
      });
    }

    wallet.points -= trending_points;
    await wallet.save();

    res.status(200).json({ message: "Trending points added successfully" });
  } catch (err) {
    console.error("Add Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// 📌 Update Trending Points

exports.customUpdatePoints = async (req, res) => {
  try {
    const { user_id, product_id, trending_points } = req.body;

    if (!user_id || !product_id || trending_points == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const now = new Date();
    const productTrend = await TrendingPoints.findOne({ user_id, product_id });
    const wallet = await TrendingPointsPayment.findOne({ user_id });

    if (!productTrend || !wallet) {
      return res.status(404).json({ message: "Data not found" });
    }

    const oldPoints = productTrend.trending_points;
    const diff = trending_points - oldPoints;

    // Update wallet based on difference
    if (diff > 0) {
      // Deduct from wallet
      if (wallet.points < diff) {
        return res.status(400).json({ message: "Insufficient wallet points" });
      }
      wallet.points -= diff;
    } else if (diff < 0) {
      // Add back to wallet
      wallet.points += Math.abs(diff);
    }

    // Update product trending points
    productTrend.trending_points = trending_points;
    productTrend.last_added_value = trending_points;
    productTrend.last_updated_date = now;

    await productTrend.save();
    await wallet.save();

    res.status(200).json({ message: "Trending points updated successfully" });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Delete Trending Points (undo last added)
exports.customDeletePoints = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const now = new Date();

    const productTrend = await TrendingPoints.findOne({ user_id, product_id });
    const wallet = await TrendingPointsPayment.findOne({ user_id });

    if (!productTrend || !wallet) {
      return res.status(404).json({ message: "Data not found" });
    }

    const refundPoints = productTrend.last_added_value;

    productTrend.trending_points -= refundPoints;
    productTrend.last_added_value = 0;
    productTrend.last_updated_date = now;
    await productTrend.save();

    wallet.points += refundPoints;
    await wallet.save();

    res.status(200).json({ message: "Trending points deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTrendingPointsWithProductByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    let { page = 1, limit = 10, search = '', filter = 'all' } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // 1. Resolve seller reference (_id of Merchant or ServiceProvider)
    let sellerRef = null;
    let merchant = await Merchant.findOne({ user_id }).select('_id').lean();
    if (merchant) {
      sellerRef = merchant._id;
    } else {
      let sp = await ServiceProvider.findOne({ user_id }).select('_id').lean();
      if (sp) sellerRef = sp._id;
    }

    if (!sellerRef) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        page,
        limit,
      });
    }

    // 2. Date range filter
    const matchDate = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (filter === 'today') {
      matchDate.updatedAt = { $gte: now };   // assuming you store date in updatedAt
    } else if (filter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      matchDate.updatedAt = { $gte: yesterday, $lt: now };
    } else if (filter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      matchDate.updatedAt = { $gte: weekStart };
    } else if (filter === 'month') {
      matchDate.updatedAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }

    // 3. Main aggregation pipeline
    const pipeline = [
      // Base match
      { $match: { user_id: new mongoose.Types.ObjectId(user_id), ...matchDate } },

      // Join with product
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product'
        }
      },

      // Unwind → only keep documents that HAVE a product
      { $unwind: '$product' },

      // Only verified products from this seller
      {
        $match: {
          'product.seller_id': sellerRef,
          'product.product_verified_by_admin': true
        }
      },

      // Optional product name search
      ...(search.trim()
        ? [{ $match: { 'product.product_name': { $regex: search.trim(), $options: 'i' } } }]
        : []
      ),

      // Sort (most recent first)
      { $sort: { updatedAt: -1 } },

      // Pagination + count in one go
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          docs: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                trending_points: 1,
                product_id: 1,
                last_updated_date: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
                product: {
                  product_name: 1,
                  // price: 1,
                  // images: { $slice: ['$product.images', 1] }, // optional: first image only
                }
              }
            }
          ]
        }
      }
    ];

    const result = await TrendingPoints.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total ?? 0;
    const data = result[0]?.docs ?? [];

    return res.status(200).json({
      success: true,
      data,
      total,
      page,
      limit,
      // optional: hasMore: data.length === limit
    });

  } catch (error) {
    console.error('getTrendingPointsWithProductByUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// exports.getTrendingPointsWithProductByUser = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     const { page = 1, limit = 10, search = "", filter = "all" } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(user_id)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // === STEP 1: Find the actual seller document (_id) using user_id ===
//     let sellerRef = null;  // This is the _id from Merchant or ServiceProvider

//     // First: Check Merchant
//     const merchant = await Merchant.findOne({ user_id }).select("_id");
//     if (merchant) {
//       sellerRef = merchant._id;
//     }
//     // If not in Merchant → Check ServiceProvider
//     else {
//       const serviceProvider = await ServiceProvider.findOne({ user_id }).select("_id");
//       if (serviceProvider) {
//         sellerRef = serviceProvider._id;
//       }
//     }

//     if (!sellerRef) {
//       return res.status(200).json({
//         success: true,
//         data: [],
//         total: 0,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         message: "No seller profile found for this user",
//       });
//     }

//     // === STEP 2: Date Filter ===
//     const dateFilter = {};
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (filter === "today") {
//       dateFilter.date = { $gte: today };
//     } else if (filter === "yesterday") {
//       const yesterday = new Date(today);
//       yesterday.setDate(today.getDate() - 1);
//       dateFilter.date = { $gte: yesterday, $lt: today };
//     } else if (filter === "week") {
//       const weekStart = new Date(today);
//       weekStart.setDate(today.getDate() - today.getDay());
//       weekStart.setHours(0, 0, 0, 0);
//       dateFilter.date = { $gte: weekStart };
//     } else if (filter === "month") {
//       const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
//       dateFilter.date = { $gte: monthStart };
//     }

//     // === STEP 3: Get TrendingPoints for this user ===
//     const trendingQuery = { user_id, ...dateFilter };

//     const trendingPoints = await TrendingPoints.find(trendingQuery)
//       .sort({ updatedAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .lean();

//     const totalCount = await TrendingPoints.countDocuments(trendingQuery);

//     if (trendingPoints.length === 0) {
//       return res.status(200).json({
//         success: true,
//         data: [],
//         total: 0,
//         page: parseInt(page),
//         limit: parseInt(limit),
//       });
//     }

//     const productIds = trendingPoints.map(tp => tp.product_id);

//     // === STEP 4: Find ONLY products where seller_id === Merchant/ServiceProvider _id AND verified ===
//     const productQuery = {
//       _id: { $in: productIds },
//       seller_id: sellerRef,                    // ← CORRECT: Use the document _id
//       product_verified_by_admin: true
//     };

//     if (search) {
//       productQuery.product_name = { $regex: new RegExp(search, "i") };
//     }

//     const products = await Product.find(productQuery)
//       .select("product_name images price discount selling_price")
//       .lean();

//     // === STEP 5: Final mapping — only valid products ===
//     const result = trendingPoints
//       .map((tp) => {
//         const product = products.find(p => p._id.toString() === tp.product_id.toString());
//         if (!product) return null;

//         return {
//           ...tp,
//           product,
//         };
//       })
//       .filter(Boolean);

//     res.status(200).json({
//       success: true,
//       data: result,
//       total: totalCount,
//       page: parseInt(page),
//       limit: parseInt(limit),
//       hasMore: result.length === parseInt(limit),
//     });

//   } catch (error) {
//     console.error("Error in getTrendingPointsWithProductByUser:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };
// 📌 Delete Trending Points (undo last added)
exports.customDeletePoints = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const today = getTodayDate();

    const productTrend = await TrendingPoints.findOne({ user_id, product_id });
    const wallet = await TrendingPointsPayment.findOne({ user_id });

    if (!productTrend || !wallet) {
      return res.status(404).json({ message: "Data not found" });
    }

    const refundPoints = productTrend.last_added_value;

    productTrend.trending_points -= refundPoints;
    productTrend.last_added_value = 0;
    productTrend.last_updated_date = today;
    await productTrend.save();

    wallet.points += refundPoints;
    await wallet.save();

    res.status(200).json({ message: "Trending points deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.getTrendingPointsWithProductByUser = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     const { page = 1, limit = 10, search = "", filter = "all" } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(user_id)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Prepare date filter
//     const dateFilter = {};
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (filter === "today") {
//       dateFilter.date = { $gte: today };
//     } else if (filter === "yesterday") {
//       const yesterday = new Date(today);
//       yesterday.setDate(today.getDate() - 1);
//       dateFilter.date = {
//         $gte: yesterday,
//         $lt: today,
//       };
//     } else if (filter === "week") {
//       const weekStart = new Date(today);
//       weekStart.setDate(today.getDate() - today.getDay());
//       dateFilter.date = { $gte: weekStart };
//     } else if (filter === "month") {
//       const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
//       dateFilter.date = { $gte: monthStart };
//     }

//     // Step 1: Get all matching trending points for user
//     const baseQuery = {
//       user_id,
//       ...dateFilter,
//     };

//     const trendingPoints = await TrendingPoints.find(baseQuery)
//       .sort({ updatedAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const totalCount = await TrendingPoints.countDocuments(baseQuery);

//     const productIds = trendingPoints.map((tp) => tp.product_id);

//     const products = await Product.find({
//       _id: { $in: productIds },
//       ...(search && {
//         product_name: { $regex: new RegExp(search, "i") },
//       }),
//     });

//     const result = trendingPoints
//       .map((tp) => {
//         const productDetail = products.find(
//           (p) => p._id.toString() === tp.product_id.toString()
//         );
//         if (!productDetail) return null;
//         return {
//           ...tp._doc,
//           product: productDetail,
//         };
//       })
//       .filter(Boolean); // Remove nulls

//     res.status(200).json({
//       success: true,
//       data: result,
//       total: totalCount,
//       page: parseInt(page),
//       limit: parseInt(limit),
//     });
//   } catch (error) {
//     console.error("Error in getTrendingPointsWithProductByUser:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
