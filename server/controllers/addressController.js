const Address = require("../models/addressModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const Merchant = require("../models/MerchantModel");
const Product = require("../models/productModel");
const EbookPayment = require("../models/ebookPaymentModel");
const ServiceProvider = require("../models/serviceProviderModel");
const TrendingPoints = require("../models/trendingPointsModel");
const Category = require("../models/categoryModel");
const SubCategory = require("../models/subCategoryModel");
const ProductAttribute = require("../models/productAttributeModel");
const UserActiveFeature =require("../models/UserActiveFeature");
const TrustSealRequest = require("../models/trustSealRequestModel");
const { STATUS, FEATURES } = require("../constants/subscriptionConstants");

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const {
      user_id,
      entity_type,
      address_type,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      pincode,
    } = req.body;

    // Check if the user exists
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return res.status(400).json({ message: "User not found" });
    }

    const address = new Address({
      user_id,
      entity_type,
      address_type,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      pincode,
    });
    await address.save();

    res.status(201).json({ message: "Address created successfully", address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find().populate("user_id", "name email"); // Assuming User has name and email fields
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAddressesForPostByRequirement = async (req, res) => {
  try {
    // Get the role ID for MERCHANT from the Role collection
    const merchantRole = await mongoose
      .model("Role")
      .findOne({ role: "MERCHANT" });

    if (!merchantRole) {
      return res.status(404).json({ message: "MERCHANT role not found" });
    }

    // Fetch addresses where the user has the MERCHANT role
    const addresses = await Address.find().populate({
      path: "user_id",
      match: { role: merchantRole._id },
      select: "name email role",
      populate: {
        path: "role",
        select: "role",
      },
    });

    // Filter out addresses where user_id is null (non-MERCHANT users will be null due to match)
    const merchantAddresses = addresses.filter((address) => address.user_id);

    res.json(merchantAddresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get address by ID
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.find({ user_id: id }).populate(
      "user_id",
      "name email"
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update address

exports.updateAddress = async (req, res) => {
  try {
    const { userId, selectedAddressId } = req.params;
    const {
      entity_type,
      address_type,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      pincode,
    } = req.body;

    if (!userId || !selectedAddressId) {
      return res
        .status(400)
        .json({
          message: "userId and selectedAddressId are required in params",
        });
    }

    const address = await Address.findOneAndUpdate(
      { _id: selectedAddressId, user_id: userId }, // Ensure the address belongs to this user
      {
        entity_type,
        address_type,
        address_line_1,
        address_line_2,
        city,
        state,
        country,
        pincode,
      },
      { new: true, runValidators: true }
    );

    if (!address) {
      return res
        .status(404)
        .json({ message: "Address not found for this user" });
    }

    if (address && address_type === "company") {
      const merchant = await Merchant.findOne({ user_id: userId });
      if (merchant) {
        // Reset merchant verification status and mark as unread for admin
        merchant.verified_status = false;
        merchant.mark_as_read = false;
        
        // Track unique modified fields
        if (!merchant.modifiedFields.includes("address")) {
          merchant.modifiedFields.push("address");
        }
        
        await merchant.save();

        // 1. Reset Trust Seal Request if it's currently active/verified
        const activeRequest = await TrustSealRequest.findOne({
          user_id: userId,
          status: "verified",
          expiryDate: { $gt: new Date() }
        });

        if (activeRequest) {
          activeRequest.status = "pending";
          activeRequest.images = [];
          activeRequest.picked_by = null;
          await activeRequest.save();
        }

        // 2. Trigger Admin Notification
        const adminHelpers = req.app.get("adminSocketHelpers");
        if (adminHelpers) {
          await adminHelpers.updateUnreadCount();
        }
      }
    }

    res.json({
      success: true,
      error: false,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: true, message: error.message });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { user_id, selectedAddressId } = req.params;
    if (!user_id || !selectedAddressId) {
      return res
        .status(400)
        .json({ message: "User ID and Address ID are required" });
    }

    // Delete address only if it belongs to the user
    const address = await Address.findOneAndDelete({
      _id: selectedAddressId,
      user_id,
    });

    if (!address) {
      return res
        .status(404)
        .json({ message: "Address not found or does not belong to user" });
    }

    res.json({
      success: true,
      error: false,
      message: "Address deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: true, message: error.message });
  }
};

exports.getUniqueCities = async (req, res) => {
  try {
    const cities = await Address.aggregate([
      // 1️⃣ Filter merchant OR service_provider + company addresses
      {
        $match: {
          address_type: "company",
          $or: [
            { entity_type: "merchant" },
            { entity_type: "service_provider" }
          ]
        },
      },

      // 2️⃣ Normalize city to lowercase and keep full doc for return
      {
        $addFields: {
          cityLower: { $toLower: "$city" },
        },
      },

      // 3️⃣ Group by lowercase city, pick first doc as example
      {
        $group: {
          _id: "$cityLower",
          record: { $first: "$$ROOT" },
        },
      },

      // 4️⃣ Format output: city (original case from record), id, and full data
      {
        $project: {
          _id: 0,
          city: "$record.city", // Keep original case for display
          id: "$record._id",
          record: 1,
        },
      },

      // 5️⃣ Sort alphabetically
      { $sort: { city: 1 } },
    ])
      .allowDiskUse(true)

    res.status(200).json({ success: true, data: cities });
  } catch (error) {
    console.error("Error fetching unique cities:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCompetitorProducts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    // Step 1: Get user's own city (always allowed)
    let userCity = null;
    const userMerchant = await Merchant.findOne({ user_id: userId })
      .populate('address_id')
      .lean();

    if (userMerchant?.address_id?.city) {
      userCity = userMerchant.address_id.city.trim();
    } else {
      const userAddr = await Address.findOne({ user_id: userId, address_type: 'company' }).lean();
      if (userAddr?.city) userCity = userAddr.city.trim();
    }

    // Step 2: Get all selected free cities from plan quota
    const planFeature = await UserActiveFeature.findOne({
      user_id: userId,
      feature_code: FEATURES.DIGITAL_BOOK,
      status: STATUS.ACTIVE,
      $or: [
        { expires_at: { $gte: new Date() } },
        { expires_at: null }
      ]
    }).lean();

    const planSelectedCities = planFeature?.selected_plan_cities || [];

    // Step 3: Get paid extra cities
    const ebookPayments = await EbookPayment.find({
      user_id: userId,
      payment_status: STATUS.CAPTURED,
      status: STATUS.ACTIVE_CAP,
      $or: [
        { expire_at: { $gte: new Date() } },
        { expire_at: null }
      ]
    }).select("extra_cities").lean();

    const purchasedCities = [
      ...new Set(
        ebookPayments.flatMap(payment =>
          (payment.extra_cities || []).map(c => c.trim())
        )
      )
    ];

    // Step 4: Build final allowed cities (case-insensitive)
    const allowedCities = [
      ...(userCity ? [userCity] : []),
      ...planSelectedCities,
      ...purchasedCities
    ].map(c => c.trim().toLowerCase());

    const uniqueAllowedCities = [...new Set(allowedCities)].filter(Boolean);

    if (uniqueAllowedCities.length === 0) {
      return res.status(200).json({
        competitors: [],
        hasMore: false,
        message: "No cities unlocked yet"
      });
    }

    // ── Base aggregation pipeline (common part) ─────────────────────────────
    const basePipeline = [
      {
        $match: {
          city: { $in: uniqueAllowedCities },
          entity_type: "merchant",
          address_type: "company",
          user_id: { $ne: new mongoose.Types.ObjectId(userId) }
        },
      },
      {
        $lookup: {
          from: "merchants",
          localField: "user_id",
          foreignField: "user_id",
          as: "merchantDetails",
        },
      },
      { $unwind: "$merchantDetails" }, // ← this can drop documents if no match
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $lookup: {
          from: "products",
          let: { m_id: "$merchantDetails._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$seller_id", "$$m_id"] },
                    { $eq: ["$sellerModel", "Merchant"] },
                    { $eq: ["$status", STATUS.ACTIVE_CAP] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 3 }
          ],
          as: "latestProducts",
        },
      },
      {
        $project: {
          city: 1,
          merchant: {
            _id: "$merchantDetails._id",
            company_name: "$merchantDetails.company_name",
            company_email: "$merchantDetails.company_email",
            company_logo: "$merchantDetails.company_logo",
            company_images: "$merchantDetails.company_images",
            description: "$merchantDetails.description",
            company_type: "$merchantDetails.company_type",
          },
          user: {
            name: "$userDetails.name",
            email: "$userDetails.email",
            phone: "$userDetails.phone",
          },
          address: {
            address_line_1: "$address_line_1",
            city: "$city",
            pincode: "$pincode"
          },
          products: "$latestProducts.product_name",
        }
      }
    ];

    // ── Get paginated results ───────────────────────────────────────────────
    const competitors = await Address.aggregate([
      ...basePipeline,
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    ]);

    // ── Get accurate total count using SAME pipeline (without skip/limit) ───
    const countResult = await Address.aggregate([
      ...basePipeline,
      { $count: "total" }
    ]);

    const totalCount = countResult[0]?.total || 0;

    // Debug info (remove in production)
    res.status(200).json({
      competitors,
      hasMore: (Number(page) * Number(limit)) < totalCount,
      unlockedCitiesCount: uniqueAllowedCities.length,
      totalRecords: totalCount,           // optional - very useful for debugging
      currentPage: Number(page),
      debug: {
        home: userCity,
        freePlan: planSelectedCities.length,
        paid: purchasedCities.length
      }
    });

  } catch (error) {
    console.error("Competitor Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error while fetching competitors"
    });
  }
};


// Helper function to sanitize country name in JS (when filtering by query param)
const sanitizeCountry = (name) => {
  return name?.trim().toLowerCase().replace(/\s+/g, " "); // collapse multiple spaces to single
};

exports.getCountriesGrouped = async (req, res) => {
  try {
    const { country } = req.query;

    let matchStage = {};
    if (country) {
      const sanitized = sanitizeCountry(country);
      matchStage = {
        $expr: {
          $eq: [
            {
              $replaceAll: {
                input: { $trim: { input: { $toLower: "$country" } } },
                find: "  ",
                replacement: " ",
              },
            },
            sanitized,
          ],
        },
      };
    }

    const result = await Address.aggregate([
      // normalize before grouping
      {
        $group: {
          _id: {
            $replaceAll: {
              input: { $trim: { input: { $toLower: "$country" } } },
              find: "  ",
              replacement: " ",
            },
          },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          country: "$_id",
          total: 1,
        },
      },
      { $sort: { country: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error in getCountriesGrouped:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getCitiesGrouped = async (req, res) => {
  try {
    const { city } = req.query; // from query param

    // base match condition
    let matchStage = {
      address_type: "company", // ✅ only company addresses
    };

    // optional city filter
    if (city) {
      const sanitized = sanitizeCountry(city);
      matchStage.city = sanitized;
    }

    const result = await Address.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$city",
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          city: "$_id",
          total: 1,
        },
      },
      { $sort: { city: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error in getCitiesGrouped:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getCountryData = async (req, res) => {
  try {
    const { country } = req.params;
    // Validate sanitizeCountry function
    let sanitizedCountry;
    try {
      sanitizedCountry = sanitizeCountry(country);
    } catch (err) {
      console.error("Error in sanitizeCountry:", err);
      throw new Error("Failed to sanitize country input");
    }

    // Sanitize stored values at query time
    const addresses = await Address.find({
      country: { $regex: `^${sanitizedCountry}$`, $options: "i" },
    }).select("_id");
    if (!addresses.length) {
      return res
        .status(404)
        .json({ success: false, message: "No data found for this country" });
    }

    const addressIds = addresses.map((a) => a._id);
    // Find merchants and service providers in the country
    const merchants = await Merchant.find({
      address_id: { $in: addressIds },
    }).select("_id company_name company_logo description");
    const serviceProviders = await ServiceProvider.find({
      address_id: { $in: addressIds },
    }).select("_id travels_name company_logo description");
    const merchantIds = merchants.map((m) => m._id);
    const serviceProviderIds = serviceProviders.map((sp) => sp._id);
    // Find products from these sellers with product_verified_by_admin: true
    const products = await Product.find({
      $and: [
        {
          $or: [
            { sellerModel: "Merchant", seller_id: { $in: merchantIds } },
            {
              sellerModel: "ServiceProvider",
              seller_id: { $in: serviceProviderIds },
            },
          ],
        },
        { product_verified_by_admin: true }, // Added condition
      ],
    }).select(
      "_id category_id sub_category_id product_name description price stock_quantity product_image image seller_id sellerModel"
    );
    const productIds = products.map((p) => p._id);
    // Log product category IDs to verify
    const categoryIds = [
      ...new Set(products.map((p) => p.category_id.toString())),
    ];
    // Initialize trendingProductsAgg to avoid undefined error
    let trendingProductsAgg = [];
    try {
      trendingProductsAgg = await TrendingPoints.aggregate([
        { $match: { product_id: { $in: productIds } } },
        {
          $group: {
            _id: "$product_id",
            totalPoints: { $sum: "$trending_points" },
          },
        },
        { $sort: { totalPoints: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $match: {
            "product.product_verified_by_admin": true, // Added condition
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "productattributes",
            localField: "_id",
            foreignField: "product_id",
            as: "attributes",
          },
        },
        {
          $project: {
            "product.product_name": 1,
            "product.description": 1,
            "product.price": 1,
            "product.stock_quantity": 1,
            "product.product_image": 1,
            "product.image": 1,
            "product.product_verified_by_admin": 1, // Include if needed for verification
            attributes: 1,
            totalPoints: 1,
          },
        },
      ]);
    } catch (err) {
      console.error("Error in trending products aggregation:", err);
      // Continue with empty array to avoid breaking the response
      trendingProductsAgg = [];
    }

    // Find categories with subcategories
    const categoriesWithSubcategories = await Category.aggregate([
      {
        $match: {
          _id: {
            $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "category_id",
          as: "subcategories",
        },
      },
      { $match: { subcategories: { $ne: [] } } },
      {
        $project: {
          category_name: 1,
          category_image: 1,
          subcategories: { $slice: ["$subcategories", 4] },
        },
      },
    ]);
    // Fetch subcategories for each valid category
    const categoryData = await Promise.all(
      categoriesWithSubcategories.map(async (cat) => {
        const subcategories = await SubCategory.find({ category_id: cat._id })
          .limit(4)
          .select("sub_category_name sub_category_image");
        return {
          _id: cat._id,
          category_name: cat.category_name,
          category_image: cat.category_image,
          subcategories,
        };
      })
    );
    // Trending sellers aggregation
    const trendingSellersAgg = await TrendingPoints.aggregate([
      { $match: { product_id: { $in: productIds } } },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $match: {
          "product.product_verified_by_admin": true, // Added condition
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: {
            sellerId: "$product.seller_id",
            sellerModel: "$product.sellerModel",
          },
          totalPoints: { $sum: "$trending_points" },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "merchants",
          let: { sellerId: "$_id.sellerId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$sellerId"] } } },
            { $project: { company_name: 1, company_logo: 1, description: 1 } },
          ],
          as: "merchant",
        },
      },
      {
        $lookup: {
          from: "serviceproviders",
          let: { sellerId: "$_id.sellerId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$sellerId"] } } },
            { $project: { travels_name: 1, company_logo: 1, description: 1 } },
          ],
          as: "serviceProvider",
        },
      },
      {
        $project: {
          seller: { $concatArrays: ["$merchant", "$serviceProvider"] },
          totalPoints: 1,
        },
      },
      { $unwind: "$seller" },
    ]);
    res.status(200).json({
      success: true,
      trendingProducts: trendingProductsAgg,
      categories: categoryData,
      trendingSellers: trendingSellersAgg,
    });
  } catch (err) {
    console.error("Error in getCountryData:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
const sanitizeCity = (name) => {
  return name
    ?.trim()                // remove leading/trailing spaces
    .toLowerCase()          // normalize case
    .replace(/\s+/g, " ");  // collapse multiple spaces
};

exports.getSuppliersByCity = async (req, res) => {
  const { city } = req.params;
  const lowerCity = city.trim().toLowerCase();

  try {
    // Fetch all categories
    const allCategories = await Category.find({}).select('category_name category_image');

    // Fetch dynamic categories based on products
    const addresses = await Address.find({ city: lowerCity }).select('_id state');
    if (addresses.length === 0) {
      return res.status(200).json({
        allCategories,
        dynamicCategories: [],
        nearbyCities: [],
        recentCompanies: []
      });
    }

    const addressIds = addresses.map(a => a._id);

    // Nearby cities: other cities in the same state
    let nearbyCities = [];
    if (addresses.length > 0) {
      const state = addresses[0].state; // Assume all in same state, take first
      const nearbyAgg = await Address.aggregate([
        { $match: { state, city: { $ne: lowerCity } } },
        { $group: { _id: '$city' } },
        { $limit: 4 },
        { $project: { city: '$_id' } }
      ]);
      nearbyCities = nearbyAgg.map(n => n.city);
    }

    // Recent companies: merchants and service providers created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const merchants = await Merchant.find({
      address_id: { $in: addressIds },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    })
      .sort({ createdAt: -1 })
      .select('company_name company_logo description createdAt');

    const serviceProviders = await ServiceProvider.find({
      address_id: { $in: addressIds },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    })
      .sort({ createdAt: -1 })
      .select('travels_name company_logo description createdAt');

    let recentCompanies = [
      ...merchants.map(m => ({
        type: 'Merchant',
        name: m.company_name,
        logo: m.company_logo,
        description: m.description,
        createdAt: m.createdAt
      })),
      ...serviceProviders.map(sp => ({
        type: 'ServiceProvider',
        name: sp.travels_name,
        logo: sp.company_logo,
        description: sp.description,
        createdAt: sp.createdAt
      }))
    ];

    recentCompanies.sort((a, b) => b.createdAt - a.createdAt);
    recentCompanies = recentCompanies.slice(0, 6);

    // Dynamic categories
    const merchantDocs = await Merchant.find({ address_id: { $in: addressIds } }).select('_id');
    const spDocs = await ServiceProvider.find({ address_id: { $in: addressIds } }).select('_id');

    const merchantIds = merchantDocs.map(m => m._id);
    const spIds = spDocs.map(s => s._id);

    const products = await Product.find({
      $or: [
        { sellerModel: 'Merchant', seller_id: { $in: merchantIds } },
        { sellerModel: 'ServiceProvider', seller_id: { $in: spIds } }
      ]
    }).select('category_id sub_category_id');

    let dynamicCategories = [];
    if (products.length > 0) {
      const categorySubMap = {};
      products.forEach(p => {
        const catIdStr = p.category_id.toString();
        if (!categorySubMap[catIdStr]) {
          categorySubMap[catIdStr] = new Set();
        }
        if (p.sub_category_id) {
          categorySubMap[catIdStr].add(p.sub_category_id.toString());
        }
      });

      const categoryIds = Object.keys(categorySubMap).map(id => new mongoose.Types.ObjectId(id));
      const categories = await Category.find({ _id: { $in: categoryIds } });

      const allSubIds = Object.values(categorySubMap).reduce((acc, set) => {
        set.forEach(id => acc.add(id));
        return acc;
      }, new Set());
      const uniqueSubIds = Array.from(allSubIds).map(id => new mongoose.Types.ObjectId(id));

      const subcategories = await SubCategory.find({ _id: { $in: uniqueSubIds } });

      const subMap = subcategories.reduce((acc, sub) => {
        acc[sub._id.toString()] = { name: sub.sub_category_name, image: sub.sub_category_image || '' };
        return acc;
      }, {});

      dynamicCategories = categories.map(cat => {
        const catIdStr = cat._id.toString();
        const subs = Array.from(categorySubMap[catIdStr] || []).map(subId => subMap[subId]);
        return {
          category_name: cat.category_name,
          category_image: cat.category_image || '',
          subcategories: subs
        };
      });
    }

    res.status(200).json({
      allCategories,
      dynamicCategories,
      nearbyCities,
      recentCompanies
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.checkUserAddressesForPayment = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const addresses = await Address.find({ user_id }).select("address_type");

    const hasPersonal = addresses.some(
      (addr) => addr.address_type === "personal"
    );
    const hasCompany = addresses.some(
      (addr) => addr.address_type === "company"
    );

    if (!hasPersonal && !hasCompany) {
      return res.status(400).json({
        success: false,
        message:
          "Please add both Personal and Company addresses before purchasing a subscription",
      });
    }

    if (!hasPersonal) {
      return res.status(400).json({
        success: false,
        message: "Please add a Personal address before proceeding to payment",
      });
    }

    if (!hasCompany) {
      return res.status(400).json({
        success: false,
        message: "Please add a Company address before proceeding to payment",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address validation successful",
      hasAddress: true,
    });
  } catch (error) {
    console.error("Address Check Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating address",
    });
  }
};

// Helper function to escape special regex characters

exports.getGrocerySellerCities = async (req, res) => {
  try {
    const cities = await Address.distinct("city", {
      entity_type: "grocery_seller",
      address_type: "company",
      city: { $exists: true, $ne: "" },
    });

    // Basic cleanup + title case + sort
    const cleaned = [...new Set(
      cities
        .map(c => c.trim().replace(/\s+/g, " "))
        .filter(c => c.length > 1)
    )];

    const titleCased = cleaned.map(city =>
      city
        .toLowerCase()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );

    const sorted = titleCased.sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      cities: sorted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
