const Product = require("../models/productModel");
const ProductAttribute = require("../models/productAttributeModel");
const mongoose = require("mongoose");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const User = require("../models/userModel");
const { STATUS, FEATURES } = require("../constants/subscriptionConstants");
const Address = require("../models/addressModel");
const Role = require("../models/roleModel");
const Category = require("../models/categoryModel");
const SubCategory = require("../models/subCategoryModel");
const SuperSubCategory = require("../models/superSubCategoryModel");
const DeepSubCategory = require("../models/deepSubCategoryModel");
const BuyLead = require("../models/buyLeadsModel");
const GrocerySeller = require("../models/grocerySellerModel");
const GrocerySellerRequirement = require("../models/grocerySellerRequirementModel");
const SearchSuggestion = require("../models/SearchSuggestion");// ... existing imports
const TrendingPoints = require("../models/trendingPointsModel");
const UserActiveFeature = require("../models/UserActiveFeature");
const UserSubscription = require("../models/userSubscriptionPlanModel")
const CompanyType = require("../models/companyTypeModel");
const BaseMemberType = require("../models/baseMemberTypeModel");
const sellerModels = {
  Merchant,
  ServiceProvider,
};

const loadSeller = async (sellerModel, sellerId) => {
  const Model = sellerModels[sellerModel];
  if (!Model) throw new Error(`Invalid seller model: ${sellerModel}`);

  const seller = await Model.findById(sellerId);
  if (!seller) throw new Error(`Seller not found for model ${sellerModel}`);
  return seller;
};

exports.getAllProductsPaginated = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const products = await Product.aggregate([
      {
        $match: {
          product_verified_by_admin: true,
        },
      },
      {
        $lookup: {
          from: "merchants",
          localField: "seller_id",
          foreignField: "_id",
          as: "merchantCheck",
        },
      },
      {
        $unwind: {
          path: "$merchantCheck",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "merchantCheck.user_id",
          foreignField: "_id",
          as: "userCheck",
        },
      },
      {
        $unwind: {
          path: "$userCheck",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "userCheck.isActive": true,
        },
      },
      {
        $lookup: {
          from: "productattributes",
          localField: "_id",
          foreignField: "product_id",
          as: "attributesRaw",
        },
      },
      {
        $addFields: {
          attributes: {
            $map: {
              input: "$attributesRaw",
              as: "attr",
              in: {
                key: "$$attr.attribute_key",
                value: "$$attr.attribute_value"
              }
            }
          }
        }
      },
      { $unset: "attributesRaw" },
      {
        $lookup: {
          from: "trendingpoints",
          localField: "_id",
          foreignField: "product_id",
          as: "trendingData",
        },
      },
      {
        $addFields: {
          totalTrendingPoints: {
            $ifNull: [{ $sum: "$trendingData.trending_points" }, 0],
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
          totalTrendingPoints: -1,
          _id: -1,
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "merchants",
          localField: "seller_id",
          foreignField: "_id",
          as: "merchantInfo",
        },
      },
      { $unwind: { path: "$merchantInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "merchantInfo.user_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "trustsealrequests",
          let: { userId: "$userInfo._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$status", "verified"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "trustSealData",
        },
      },
      {
        $lookup: {
          from: "addresses",
          let: { userId: "$userInfo._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$address_type", "company"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "companyAddress",
        },
      },
      {
        $unwind: {
          path: "$companyAddress",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          product_name: 1,
          description: 1,
          unitOfMeasurement: 1,
          price: 1,
          stock_quantity: 1,
          product_image: 1,
          video_url: 1,
          createdAt: 1,
          totalTrendingPoints: 1,
          attributes: 1,
          search_tags: 1,
          // ──────────────────────────────────────────────────────────────
          // SELLER INFO - Including User details for the Certificate
          // ──────────────────────────────────────────────────────────────
          sellerInfo: {
            _id: "$merchantInfo._id",
            user_id: {
              _id: "$userInfo._id",
              name: "$userInfo.name",    // This is the "Director Name"
              phone: "$userInfo.phone",  // Backup Contact
              email: "$userInfo.email"   // Backup Email
            },
            company_name: "$merchantInfo.company_name",
            company_email: "$merchantInfo.company_email",
            company_phone_number: "$merchantInfo.company_phone_number",
            company_logo: "$merchantInfo.company_logo",
            gst_number: "$merchantInfo.gst_number",
            trustshield: { $gt: [{ $size: "$trustSealData" }, 0] },
            verified_status: "$merchantInfo.verified_status",
            plan_expiry: "$merchantInfo.last_activity", // or your actual plan field
            companyAddress: "$companyAddress",
          },
        },
      },
    ]);

    const totalCountQuery = await Product.aggregate([
      {
        $match: {
          product_verified_by_admin: true,
        },
      },
      {
        $lookup: {
          from: "merchants",
          localField: "seller_id",
          foreignField: "_id",
          as: "merchantCheck",
        },
      },
      {
        $unwind: {
          path: "$merchantCheck",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "merchantCheck.user_id",
          foreignField: "_id",
          as: "userCheck",
        },
      },
      {
        $unwind: {
          path: "$userCheck",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "userCheck.isActive": true,
        },
      },
      { $count: "total" }
    ]);

    const total = totalCountQuery[0]?.total || 0;
    const hasMore = (skip + limit) < total;

    res.status(200).json({
      success: true,
      message: "Verified & active-merchant products fetched successfully",
      data: products,
      pagination: {
        skip,
        limit,
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

exports.getProductsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    // === STEP 1: Validate user_id ===
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // === STEP 2: Resolve seller reference (Merchant OR ServiceProvider) ===
    let sellerRef = null;

    // Check Merchant first
    const merchant = await Merchant.findOne({ user_id }).select("_id").lean();
    if (merchant) {
      sellerRef = merchant._id;
    }
    // If not Merchant, check ServiceProvider
    else {
      const serviceProvider = await ServiceProvider.findOne({ user_id }).select("_id").lean();
      if (serviceProvider) {
        sellerRef = serviceProvider._id;
      }
    }

    if (!sellerRef) {
      return res.status(200).json({
        products: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: false,
        message: "No seller profile found for this user",
      });
    }

    // === STEP 3: Pagination settings ===
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // safety cap
    const skip = (pageNum - 1) * limitNum;

    // === STEP 4: Fetch paginated products ===
    const products = await Product.find(
      { seller_id: sellerRef },
      { _id: 1, product_name: 1, video_url: 1 }
    )
      .sort({ createdAt: -1 })           // newest first
      .skip(skip)
      .limit(limitNum)
      .lean();

    // === STEP 5: Get total count for pagination metadata ===
    const total = await Product.countDocuments({ seller_id: sellerRef });

    // === STEP 6: Send response ===
    res.status(200).json({
      products,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: products.length === limitNum,   // true = more pages available
    });

  } catch (error) {
    console.error("Error in getProductsByUserId:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    // 1️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // 2️⃣ Find verified product
    const product = await Product.findOne({
      _id: productId,
      product_verified_by_admin: true,
    }).populate(
      "category_id sub_category_id super_sub_category_id deep_sub_category_id"
    );

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or not verified" });
    }

    // 3️⃣ Load seller, product attributes and related products in parallel
    let seller;
    try {
      seller = await loadSeller(product.sellerModel, product.seller_id);
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }

    if (!seller || !seller.user_id) {
      return res.status(404).json({
        message: "Seller user not found. Product unavailable.",
      });
    }

    // Populate company_type on seller if set
    if (seller?.company_type) {
      await seller.populate({
        path: "company_type",
        model: "CompanyType",
        select: "name displayName",
      });
    }

    // 4️⃣ Fetch user, address, attributes, and related products in parallel
    const [user, address, productAttributes, relatedProductsRaw] = await Promise.all([
      User.findById(seller.user_id),
      Address.findOne({ user_id: seller.user_id }),
      ProductAttribute.find({ product_id: product._id }),
      Product.find({
        deep_sub_category_id: product.deep_sub_category_id,
        _id: { $ne: product._id },
        status: STATUS.ACTIVE_CAP,
        product_verified_by_admin: true,
      }).limit(10),
    ]);

    if (!user) {
      return res.status(404).json({
        message: "User not found for the seller. Product unavailable.",
      });
    }

    // 5️⃣ Validate related product sellers in parallel (was a serial for-loop)
    const relatedSellerChecks = await Promise.all(
      relatedProductsRaw.map(async (relProduct) => {
        try {
          const relSeller = await loadSeller(relProduct.sellerModel, relProduct.seller_id);
          return relSeller && relSeller.user_id ? relProduct : null;
        } catch {
          return null;
        }
      })
    );
    const relatedProducts = relatedSellerChecks.filter(Boolean);

    // 6️⃣ Success response
    return res.status(200).json({
      product,
      seller,
      user,
      address,
      productAttributes,
      relatedProducts,
    });
  } catch (error) {
    console.error("getProductById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




exports.createProduct = async (req, res) => {
  try {
    const {
      seller_id,
      sellerModel = "Merchant",
      category_id,
      sub_category_id,
      super_sub_category_id,
      deep_sub_category_id,
      product_name,
      description,
      price,
      product_image,
      video_url,
      attributes,
      stock_quantity,
      unitOfMeasurement,
      askPrice,
      search_tags = [],
    } = req.body;

    if (!product_name || (!askPrice && !price) || !unitOfMeasurement || !stock_quantity) {
      return res.status(400).json({
        success: false,
        message:
          "Product name, stock_quantity, unit and either price or askPrice are required",
      });
    }

    /* FORMAT */
    const formattedProductName = product_name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    const parsedImages =
      typeof product_image === "string"
        ? JSON.parse(product_image)
        : product_image || [];

    const imageCount = Array.isArray(parsedImages)
      ? parsedImages.length
      : 0;
    const cleanTags = Array.isArray(search_tags)
      ? search_tags
        .map((tag) => tag.toString().trim().toLowerCase())
        .filter(Boolean)
      : [];

    /* GET MERCHANT */
    const merchant = await Merchant.findById(seller_id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const realUserId = merchant.user_id;
    const now = new Date();

    /* PRODUCT FEATURE CHECK */
    const productFeature = await UserActiveFeature.findOne({
      user_id: realUserId,
      feature_code: FEATURES.PRODUCT_LIMIT,
      status: STATUS.ACTIVE,
      $or: [
        { expires_at: { $gt: now } },
        { expires_at: null }
      ],
    });

    if (!productFeature) {
      return res.status(403).json({
        success: false,
        message: "Your plan does not allow adding products",
      });
    }

    /* 🖼️ PRODUCT PHOTO LIMIT CHECK (PER PRODUCT) */
    const productPhotoFeature = await UserActiveFeature.findOne({
      user_id: realUserId,
      feature_code: FEATURES.PRODUCT_PHOTOS,
      status: STATUS.ACTIVE,
      $or: [
        { expires_at: { $gt: now } },
        { expires_at: null }
      ],
    });

    if (!productPhotoFeature) {
      return res.status(403).json({
        success: false,
        message: "Your plan does not allow product photos",
      });
    }

    const planLimit = productPhotoFeature.product_photo_limit;
    if (
      !planLimit.is_unlimited &&
      imageCount > planLimit.total
    ) {
      return res.status(403).json({
        success: false,
        message: `You can upload only ${planLimit.total} image(s) per product.`,
      });
    }

    /* SAVE PRODUCT */
    const product = new Product({
      seller_id,
      sellerModel,
      category_id,
      sub_category_id: sub_category_id || null,
      super_sub_category_id: super_sub_category_id || null,
      deep_sub_category_id: deep_sub_category_id || null,
      product_name: formattedProductName,
      description: description || "",
      price: askPrice ? mongoose.Types.Decimal128.fromString("0") : mongoose.Types.Decimal128.fromString(price.toString()),
      askPrice: askPrice || false,
      product_image: parsedImages,
      image: Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : "",
      video_url: video_url || "",
      unitOfMeasurement,
      stock_quantity,
      search_tags: cleanTags,
    });

    await product.save();

    /* SAVE ATTRIBUTES */
    if (attributes && Array.isArray(attributes)) {
      const attributeDocs = attributes
        .filter((a) => a.key?.trim() && a.value?.trim())
        .map((a) => ({
          product_id: product._id,
          attribute_key: a.key.trim(),
          attribute_value: a.value.trim(),
        }));

      if (attributeDocs.length) {
        await ProductAttribute.insertMany(attributeDocs);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("Error creating product:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const skip = (page - 1) * limit;

    let filterQuery = { product_verified_by_admin: true };

    // Apply date filters
    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfDay };
    } else if (filter === "last_week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfWeek };
      
    } else if (filter === "last_month") {
      const startOfMonth = new Date();
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      startOfMonth.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfMonth };
    }

    if (search) {
      filterQuery.product_name = { $regex: search, $options: "i" };
    }

    // Base product query with category population
    let products = await Product.find(filterQuery)
      .populate("category_id sub_category_id super_sub_category_id deep_sub_category_id")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ product_verified_at: -1, createdAt: -1 })
      .lean(); // Important: use .lean() for performance when modifying docs

    // 💡 DSA Optimization: Batch Fetching & Hash Maps (O(1) Lookups)
    const productIds = products.map(p => p._id);
    const merchantSellerIds = products
      .filter(p => p.sellerModel === "Merchant" && p.seller_id)
      .map(p => p.seller_id);

    // 1. Fetch all attributes in one query (O(1) iteration)
    const allAttributes = await ProductAttribute.find({
      product_id: { $in: productIds }
    }).lean();

    // 1b. Build Attribute Hash Map (O(N) CPU time)
    const attributeMap = {};
    allAttributes.forEach(attr => {
      if (!attributeMap[attr.product_id]) {
        attributeMap[attr.product_id] = [];
      }
      attributeMap[attr.product_id].push(attr);
    });

    // 2. Fetch all merchants in one query
    const merchants = await Merchant.find({ _id: { $in: merchantSellerIds } })
      .populate("address_id")
      .lean();

    // 2b. Fetch corresponding users in one query
    const userIds = merchants.map(m => m.user_id).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .populate("role")
      .select("name email phone role")
      .lean();

    // 2c. Build Merchant and User Hash Maps
    const userMap = {};
    users.forEach(u => userMap[u._id] = u);

    const merchantMap = {};
    for (const m of merchants) {
      const user = userMap[m.user_id];
      
      // Attempt to find company address if direct address_id is missing or incomplete
      let addressData = m.address_id;
      if (!addressData && user?._id) {
        addressData = await Address.findOne({
          user_id: user._id,
          address_type: "company",
        }).lean();
      }

      merchantMap[m._id] = {
        ...m,
        company_name: m.business_name || m.company_name,
        address_id: addressData,
        user_name: user?.name || "Unknown User",
        user_email: user?.email || null,
        user_phone: user?.phone || null,
        role: user?.role?.role || "MERCHANT",
      };
    };

    // 3. O(N) Loop to attach data from Hash Maps instantly without hitting DB logic
    const productsWithDetails = products.map(product => {
      let sellerInfo = null;
      if (product.sellerModel === "Merchant" && product.seller_id) {
        sellerInfo = merchantMap[product.seller_id];
      }

      return {
        ...product,
        attributes: attributeMap[product._id] || [],
        seller: sellerInfo || { company_name: "Direct Seller", user_name: "Individual" },
      };
    });

    const totalProducts = await Product.countDocuments(filterQuery);

    res.status(200).json({
      success: true,
      products: productsWithDetails,
      pagination: {
        totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};




exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_image,
      attributes = [],
      video_url,
      search_tags = [],
      price,
      askPrice,
      product_name,
      ...rest
    } = req.body;

    /* 1️⃣ GET PRODUCT */
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* 2️⃣ GET USER */
    const merchant = await Merchant.findById(product.seller_id);
    if (!merchant || !merchant.user_id) {
      return res.status(400).json({
        success: false,
        message: "Merchant user not found",
      });
    }

    const realUserId = merchant.user_id;
    const now = new Date();
    const updatedFields = { ...rest };

    let isModified = false; // 👈 track changes

    /* 3️⃣ IMAGE LIMIT CHECK (PER PRODUCT) */
    if (product_image !== undefined) {

      const images =
        typeof product_image === "string"
          ? JSON.parse(product_image)
          : product_image;

      const updatedImages = Array.isArray(images) ? images : [];

      const oldImagesStr = JSON.stringify(product.product_image || []);
      const newImagesStr = JSON.stringify(updatedImages);

      if (oldImagesStr !== newImagesStr) {
        isModified = true;

        const productPhotoFeature = await UserActiveFeature.findOne({
          user_id: realUserId,
          feature_code: FEATURES.PRODUCT_PHOTOS,
          status: STATUS.ACTIVE,
          expires_at: { $gt: now },
        });

        if (!productPhotoFeature) {
          // If no feature, allow only removing images (all updated images must already exist in old images)
          const oldImages = product.product_image || [];
          const isAddingNew = updatedImages.some(img => !oldImages.includes(img));

          if (isAddingNew) {
            return res.status(403).json({
              success: false,
              message: "Product photo feature not available. Please upgrade your plan.",
            });
          }
        } else {
          const planLimit = productPhotoFeature.product_photo_limit;

          if (
            !planLimit.is_unlimited &&
            updatedImages.length > planLimit.total
          ) {
            return res.status(403).json({
              success: false,
              message: `You can upload only ${planLimit.total} image(s) per product.`,
            });
          }
        }
      }

      updatedFields.product_image = updatedImages;
      updatedFields.image = updatedImages.length > 0 ? updatedImages[0] : "";
    }

    /* VIDEO */
    if (video_url !== undefined) {
      if (product.video_url !== video_url) {
        isModified = true;
      }
      updatedFields.video_url = video_url;
    }

    /* SEARCH TAGS */
    if (search_tags !== undefined) {
      const formattedTags = Array.isArray(search_tags)
        ? search_tags
          .map((t) => t.toString().trim().toLowerCase())
          .filter(Boolean)
        : [];

      if (JSON.stringify(product.search_tags) !== JSON.stringify(formattedTags)) {
        isModified = true;
      }

      updatedFields.search_tags = formattedTags;
    }

    /* PRICE */
    if (askPrice !== undefined) {
      if (product.askPrice !== askPrice) {
        isModified = true;
      }
      updatedFields.askPrice = askPrice;
      if (askPrice) {
        updatedFields.price = mongoose.Types.Decimal128.fromString("0");
      }
    }

    if (price !== undefined && !askPrice && !updatedFields.askPrice) {
      const newPrice = mongoose.Types.Decimal128.fromString(price.toString());

      if (product.price?.toString() !== newPrice.toString()) {
        isModified = true;
      }

      updatedFields.price = newPrice;
    }

    /* PRODUCT NAME */
    if (product_name) {
      const formattedName = product_name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      if (product.product_name !== formattedName) {
        isModified = true;
      }

      updatedFields.product_name = formattedName;
    }

    /* CHECK OTHER FIELDS */
    for (const key in rest) {
      if (product[key]?.toString() !== rest[key]?.toString()) {
        isModified = true;
      }
    }

    /* 👇 IF ANY CHANGE → RESET ADMIN VERIFICATION */
    if (isModified) {
      updatedFields.product_verified_by_admin = false;
    }

    /* UPDATE PRODUCT */
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    /* ===========================
       SYNC ATTRIBUTES
       Delete all existing and re-insert from request body
    =========================== */
    if (Array.isArray(attributes)) {
      // Remove all old attributes for this product
      await ProductAttribute.deleteMany({ product_id: id });

      // Insert new ones (filter out empty key/value pairs)
      const validAttributes = attributes.filter(
        (a) => a.key?.trim() && a.value?.trim()
      );

      if (validAttributes.length > 0) {
        const attributeDocs = validAttributes.map((a) => ({
          product_id: id,
          attribute_key: a.key.trim(),
          attribute_value: a.value.trim(),
        }));
        await ProductAttribute.insertMany(attributeDocs);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });

  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProductBySellerId = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const userId = req.params.userId; // Get userId from request parameters

    const skip = (page - 1) * limit;

    let filterQuery = { product_verified_by_admin: true };

    let merchant = null; // Will hold merchant details

    if (userId) {
      merchant = await Merchant.findOne({ user_id: userId });
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: "Merchant not found for this user",
        });
      }
      filterQuery.seller_id = merchant._id;
    }

    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfDay };
    } else if (filter === "last_week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfWeek };
    } else if (filter === "last_month") {
      const startOfMonth = new Date();
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      startOfMonth.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfMonth };
    }

    if (search) {
      filterQuery.product_name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filterQuery)
      .populate(
        "category_id sub_category_id super_sub_category_id deep_sub_category_id"
      )
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const productsWithAttributes = await Promise.all(
      products.map(async (product) => {
        const attributes = await ProductAttribute.find({
          product_id: product._id,
        });
        return { ...product.toObject(), attributes };
      })
    );

    const totalProducts = await Product.countDocuments(filterQuery);

    res.status(200).json({
      success: true,
      merchant: merchant ? {
        id: merchant._id,
        company_name: merchant.company_name,
        company_email: merchant.company_email,
        company_phone: merchant.company_phone,
        company_address: merchant.company_address,
        gst_number: merchant.gst_number,
        business_type: merchant.business_type,
        logo: merchant.logo,
        banner: merchant.banner,
        // Add any other merchant fields you want
        ...merchant.toObject()
      } : null,
      products: productsWithAttributes,
      pagination: {
        totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMerchantByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // Find merchant based on schema's user_id field
    const merchant = await Merchant.findOne({ user_id: userId }).populate(
      "user_id address_id"
    ); // Populate related docs

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found for this user",
      });
    }

    const products = await Product.find({
      seller_id: merchant._id,
      product_verified_by_admin: true,
    })
      .populate(
        "category_id sub_category_id super_sub_category_id deep_sub_category_id"
      )
      .sort({ createdAt: -1 });

    const productsWithAttributes = await Promise.all(
      products.map(async (product) => {
        const attributes = await ProductAttribute.find({
          product_id: product._id,
        });
        return { ...product.toObject(), attributes };
      })
    );

    res.status(200).json({
      success: true,
      merchant,
      products: productsWithAttributes,
    });
  } catch (error) {
    console.error("Error fetching merchant:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.verifyProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the product and populate seller_id if needed
    const product = await Product.findById(id).select(
      "seller_id product_verified_by_admin"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Prevent double verification
    if (product.product_verified_by_admin) {
      return res.status(400).json({
        success: false,
        message: "Product is already verified",
      });
    }

    const sellerId = product.seller_id;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Product has no seller assigned",
      });
    }

    // 2. Check Merchant first
    const merchant = await Merchant.findById(sellerId).select(
      "verified_status company_name"
    );

    if (merchant) {
      if (!merchant.verified_status) {
        return res.status(403).json({
          success: false,
          message: `Merchant not verified. Verify merchant first.`,
        });
      }

      // Merchant is verified → Allow product verification
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          product_verified_by_admin: true,
          product_verified_at: new Date(),
        },
        { new: true, runValidators: true }
      ).populate("seller_id", "company_name");

      // 🔥 Real-time notification update
      const adminHelpers = req.app.get("adminSocketHelpers");
      if (adminHelpers && adminHelpers.updateUnreadCount) {
        await adminHelpers.updateUnreadCount();
      }

      return res.json({
        success: true,
        message: "Product verified successfully",
        product: updatedProduct,
      });
    }

    // 3. If not Merchant, check ServiceProvider
    const serviceProvider = await ServiceProvider.findById(sellerId).select(
      "verified_status travels_name"
    );

    if (serviceProvider) {
      if (!serviceProvider.verified_status) {
        return res.status(403).json({
          success: false,
          message: `Verification failed: Service Provider "${serviceProvider.travels_name || "This seller"
            }" is not verified yet. KYC required.`,
        });
      }

      // Service Provider is verified → Allow
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          product_verified_by_admin: true,
          product_verified_at: new Date(),
        },
        { new: true, runValidators: true }
      ).populate("seller_id", "travels_name");

      // 🔥 Real-time notification update
      const adminHelpers = req.app.get("adminSocketHelpers");
      if (adminHelpers && adminHelpers.updateUnreadCount) {
        await adminHelpers.updateUnreadCount();
      }

      return res.json({
        success: true,
        message: "Product verified successfully",
        product: updatedProduct,
      });
    }

    // 4. Seller not found in either model
    return res.status(404).json({
      success: false,
      message: "Seller not found. Cannot verify product.",
    });
  } catch (error) {
    console.error("Error in verifyProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
exports.unverifyProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the product
    const product = await Product.findById(id).select(
      "seller_id product_verified_by_admin"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Prevent double unverification
    if (!product.product_verified_by_admin) {
      return res.status(400).json({
        success: false,
        message: "Product is already unverified (not verified)",
      });
    }

    const sellerId = product.seller_id;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Product has no seller assigned",
      });
    }

    // Optional: You can still show seller name in message even when unverifying
    let sellerName = "Unknown Seller";

    const merchant = await Merchant.findById(sellerId).select("company_name");
    if (merchant) {
      sellerName = merchant.company_name || "Merchant";
    } else {
      const serviceProvider = await ServiceProvider.findById(sellerId).select(
        "travels_name"
      );
      if (serviceProvider) {
        sellerName = serviceProvider.travels_name || "Service Provider";
      }
    }

    // Perform unverification
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        product_verified_by_admin: false,
        product_verified_at: null,
      },
      { new: true, runValidators: true }
    ).populate("seller_id");

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    return res.json({
      success: true,
      message: `Product verification revoked for "${sellerName}"`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error in unverifyProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// Helper: Escape special regex characters
const escapeRegex = (string) =>
  string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");





exports.searchProducts = async (req, res) => {
  try {
    let {
      term = "",
      page = 1,
      limit = 10,
      city = "",
      type = "products",
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const rawTerm = term.trim();
    const fuzzyRegex = rawTerm
      ? new RegExp(rawTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : null;

    // 🔥 HELPER: Intersect two arrays of IDs
    // If currentList is null, it means no filter applied yet, so take newList.
    // If currentList has data, keep only IDs that exist in BOTH.
    const intersect = (currentList, newList) => {
      const stringNewList = newList.map((id) => id.toString());
      if (currentList === null) return stringNewList;
      return currentList.filter((id) => stringNewList.includes(id.toString()));
    };

    // We start with NULL (meaning "All Sellers allowed")
    let allowedSellerIds = null;

    // ================= 1️⃣ Type Filter =================
    if (type !== "products") {
      const merchantTypeMap = {
        manufacture: "Manufacturer",
        retailer: "Retailer",
        sub_dealer: "Sub_dealer",
        service: "Service",
      };

      const targetType = merchantTypeMap[type];
      if (targetType) {
        const typeMerchants = await Merchant.find({
          company_type: targetType,
        }).select("_id");

        allowedSellerIds = intersect(allowedSellerIds, typeMerchants.map(m => m._id));
      }
    }

    // ================= 2️⃣ City Filter =================
    if (city && city !== "all") {
      // Find addresses in this city
      const cityAddresses = await Address.find({
        city: new RegExp(`^${city}$`, "i"),
        address_type: "company",
      }).select("user_id");

      // Find merchants belonging to those users
      const cityMerchants = await Merchant.find({
        user_id: { $in: cityAddresses.map((a) => a.user_id) },
      }).select("_id");

      allowedSellerIds = intersect(allowedSellerIds, cityMerchants.map(m => m._id));
    }

    // ================= 3️⃣ Active Users Filter (ALWAYS ON) =================
    const activeUsers = await User.find({ isActive: true }).select("_id");
    const activeMerchants = await Merchant.find({
      user_id: { $in: activeUsers.map((u) => u._id) },
    }).select("_id");

    allowedSellerIds = intersect(allowedSellerIds, activeMerchants.map(m => m._id));

    // ================= 4️⃣ Build Final Query =================
    const query = {
      product_verified_by_admin: true,
    };

    // If allowedSellerIds turned into an empty array (meaning intersection failed),
    // we should return 0 results immediately to prevent fetching everything.
    if (allowedSellerIds !== null && allowedSellerIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    // Apply the intersected Seller IDs
    if (allowedSellerIds !== null) {
      query.seller_id = { $in: allowedSellerIds };
    }

    // ================= 5️⃣ Search Term Logic =================
    if (fuzzyRegex) {
      const [cats, subs, supers, deeps] = await Promise.all([
        Category.find({ category_name: fuzzyRegex }).select("_id"),
        SubCategory.find({ sub_category_name: fuzzyRegex }).select("_id"),
        SuperSubCategory.find({ super_sub_category_name: fuzzyRegex }).select("_id"),
        DeepSubCategory.find({ deep_sub_category_name: fuzzyRegex }).select("_id"),
      ]);

      query.$or = [
        { product_name: fuzzyRegex },
        { description: fuzzyRegex },
        { search_tags: { $in: [fuzzyRegex] } },
        { category_id: { $in: cats.map((c) => c._id) } },
        { sub_category_id: { $in: subs.map((s) => s._id) } },
        { super_sub_category_id: { $in: supers.map((s) => s._id) } },
        { deep_sub_category_id: { $in: deeps.map((d) => d._id) } },
      ];
    }

    // ================= 6️⃣ Fetch Products & Populate =================
    const products = await Product.find(query)
      .populate("seller_id")
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Product.countDocuments(query);

    const results = await Promise.all(
      products.map(async (p) => {
        // Trending
        const trending = await TrendingPoints.aggregate([
          { $match: { product_id: p._id } },
          { $group: { _id: null, total: { $sum: "$trending_points" } } },
        ]);

        // Address
        const address = p.seller_id?.user_id
          ? await Address.findOne({
            user_id: p.seller_id.user_id,
            address_type: "company",
          }).lean()
          : null;

        // Attributes
        const attributesRaw = await ProductAttribute.find({
          product_id: p._id,
        }).select("attribute_key attribute_value -_id");

        const attributes = attributesRaw.map((a) => ({
          key: a.attribute_key,
          value: a.attribute_value,
        }));

        return {
          ...p,
          attributes,
          totalTrendingPoints: trending[0]?.total || 0,
          primaryAddress: address || {},
        };
      })
    );

    // Sort by Verified At Date (Latest First), then by Trending
    results.sort((a, b) => {
      const dateA = a.product_verified_at ? new Date(a.product_verified_at) : 0;
      const dateB = b.product_verified_at ? new Date(b.product_verified_at) : 0;

      if (dateB - dateA !== 0) {
        return dateB - dateA;
      }
      return (b.totalTrendingPoints || 0) - (a.totalTrendingPoints || 0);
    });

    res.json({
      success: true,
      data: results,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("searchProducts Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.searchCompanies = async (req, res) => {
  try {
    let { type, term = "", page = 1, limit = 12, city = "" } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    const cleanTerm = term.trim().toLowerCase();

    const fuzzyRegex =
      cleanTerm && cleanTerm !== "all"
        ? new RegExp(cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
        : null;

    const isGenericSearch =
      !cleanTerm ||
      cleanTerm === "all" ||
      cleanTerm.includes(type.replace("_", ""));

    /* ==================================================
       🔥 STEP 0: ACTIVE USERS ONLY
    ================================================== */
    const activeUsers = await User.find({ isActive: true }).select("_id");
    const activeUserIds = activeUsers.map(u => u._id);

    /* ==================================================
       1️⃣ BASE MEMBER (GrocerySeller)
    ================================================== */
    // Instead of hardcoded map, we use dynamic BaseMemberType names.
    // If type starts with 'base_member' or matches a BaseMemberType name after normalization.
    
    let isBaseMemberType = false;
    let matchedBaseMemberType = null;
    
    if (type && type !== "all" && type !== "products") {
       // Normalize type to match BaseMemberType storage format (Title_Case_With_Underscores)
       const normalizedType = type
         .split(/[_\s]+/)
         .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
         .join("_");
       
       matchedBaseMemberType = await BaseMemberType.findOne({ name: normalizedType }).select("_id");
       if (matchedBaseMemberType) {
         isBaseMemberType = true;
       } else if (type.toLowerCase() === "base_member") {
         isBaseMemberType = true; // Generic base member search
       }
    }

    if (isBaseMemberType) {
      const query = {
        user_id: { $in: activeUserIds }, // ✅ ACTIVE USERS FILTER
        verified_status: true,          // ✅ ONLY VERIFIED RECORDS
      };

      if (matchedBaseMemberType) {
        query.member_type = matchedBaseMemberType._id;
      }

      // 🔍 Name search (only if not generic)
      if (fuzzyRegex && !isGenericSearch) {
        query.shop_name = fuzzyRegex;
      }

      // 🌆 City filter
      if (city && city !== "all") {
        const addresses = await Address.find({
          city: new RegExp(`^${city}$`, "i"),
        }).select("_id");

        query.address_id = { $in: addresses.map(a => a._id) };
      }

      const totalCount = await GrocerySeller.countDocuments(query);

      const data = await GrocerySeller.find(query)
        .populate("address_id")
        .populate("user_id", "name profile_pic email phone")
        .populate("member_type", "name")
        .skip(skip)
        .limit(limit)
        .lean();

      // 🔥 Robust Address Fetching (Fallback for missing address_id)
      const dataWithAddresses = await Promise.all(
        data.map(async (d) => {
          let address = d.address_id;
          if (!address || !address.city) {
            // Find address by user_id and typical types
            address = await Address.findOne({
              user_id: d.user_id?._id || d.user_id,
              $or: [
                { address_type: "company" },
                { entity_type: "grocery_seller" }
              ]
            }).lean();
          }
          return { ...d, address_id: address || {} };
        })
      );

      return res.json({
        success: true,
        data: dataWithAddresses.map(d => ({
          _id: d._id,
          user_id: d.user_id,
          grocerySeller: {
            ...d,
            address_id: d.address_id,
          },
          latestRequirement: null,
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    }

    /* ==================================================
       2️⃣ MERCHANT / COMPANY
    ================================================== */
    const query = {
      user_id: { $in: activeUserIds }, // ✅ ACTIVE USERS FILTER
      verified_status: true,          // ✅ ONLY VERIFIED RECORDS
    };

    // Dynamically match type against CompanyType name or displayName
    if (type && type !== "all") {
      const typeRegex = new RegExp(`^${type.replace(/_/g, " ")}$`, "i");
      const matchedCompanyType = await CompanyType.findOne({
        $or: [{ name: typeRegex }, { displayName: typeRegex }]
      }).select("_id");
      
      if (matchedCompanyType) {
        query.company_type = matchedCompanyType._id;
      } else {
        // If type refers to a specific merchant category that doesn't exist,
        // force a query that matches nothing, so it doesn't accidentally search ALL merchants.
        if (type.toLowerCase() !== "all") {
          query.company_type = new mongoose.Types.ObjectId();
        }
      }
    }

    // 🔍 Search (only if not generic)
    if (fuzzyRegex && !isGenericSearch) {
      query.$or = [
        { company_name: fuzzyRegex },
        { description: fuzzyRegex },
        { business_category: fuzzyRegex },
      ];
    }

    // 🌆 City filter
    if (city && city !== "all") {
      const addresses = await Address.find({
        city: new RegExp(`^${city}$`, "i"),
        address_type: "company",
      }).select("_id");

      query.address_id = { $in: addresses.map(a => a._id) };
    }

    const totalCount = await Merchant.countDocuments(query);

    const data = await Merchant.find(query)
      .populate("address_id")
      .populate("user_id", "name profile_pic email phone")
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: data.map(d => ({
        ...d,
        address_id: d.address_id || {},
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });

  } catch (err) {
    console.error("searchCompanies Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};





exports.getSuggestions = async (req, res) => {
  try {
    const { term = "", category = "products", city = "" } = req.query;

    const rawTerm = term.trim();
    const hasTerm = rawTerm.length > 0;

    const fuzzyRegex = hasTerm
      ? new RegExp(rawTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : null;

    if (!hasTerm && !city) {
      return res.json({ suggestions: [], message: null });
    }

    // =====================================================
    // 🔥 STEP 1: CALCULATE VALID USERS (Active + City)
    // =====================================================

    // 1. Get ALL Active Users
    const activeUsers = await User.find({ isActive: true }).select("_id");
    let validUserIds = activeUsers.map((u) => u._id.toString());

    // 2. Filter by CITY (if selected)
    if (city && city !== "all") {
      const cityAddresses = await Address.find({
        city: new RegExp(`^${city}$`, "i"),
      }).select("user_id");

      const cityUserIds = new Set(cityAddresses.map((a) => a.user_id.toString()));

      // INTERSECTION: Keep only users who are Active AND in the City
      validUserIds = validUserIds.filter((id) => cityUserIds.has(id));
    }

    // 3. Get Merchant IDs for these Valid Users
    const validMerchants = await Merchant.find({
      user_id: { $in: validUserIds },
    }).select("_id");

    const validMerchantIds = validMerchants.map((m) => m._id);

    const suggestions = [];
    const seen = new Set();

    const addUnique = (item) => {
      const key = `${item.type}-${item.name.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        suggestions.push(item);
      }
    };

    // =====================================================
    // 1️⃣ PRODUCT SUGGESTIONS (Now filtered by City!)
    // =====================================================
    if (category === "products" && fuzzyRegex) {
      const products = await Product.find({
        product_verified_by_admin: true,
        seller_id: { $in: validMerchantIds }, // ✅ Uses City+Active Filter
        $or: [
          { product_name: fuzzyRegex },
          { search_tags: { $in: [fuzzyRegex] } },
        ],
      })
        .select("product_name product_image category_id sub_category_id")
        .limit(8)
        .lean();

      products.forEach((p) =>
        addUnique({
          id: p._id,
          name: p.product_name,
          type: "product",
          image: p.product_image?.[0] || null,
          description: "Product",
          category_id: p.category_id,
          sub_category_id: p.sub_category_id,
        })
      );

      // Categories (No city filter needed for generic categories, usually)
      const [categories, subCategories] = await Promise.all([
        Category.find({ category_name: fuzzyRegex }).select("category_name").limit(3),
        SubCategory.find({ sub_category_name: fuzzyRegex }).select("sub_category_name").limit(3),
      ]);

      categories.forEach((c) =>
        addUnique({ id: c._id, name: c.category_name, type: "category", description: "Category", category_id: c._id })
      );
      subCategories.forEach((s) =>
        addUnique({ id: s._id, name: s.sub_category_name, type: "subcategory", description: "Sub Category", sub_category_id: s._id })
      );
    }

    // =====================================================
    // 2️⃣ COMPANY / MERCHANT SUGGESTIONS
    // =====================================================
    if (category && category !== "products" && category !== "base_member" && fuzzyRegex) {
      // Find the appropriate CompanyType document dynamically
      const catRegex = new RegExp(`^${category.replace(/_/g, " ")}$`, "i");
      const matchedCat = await CompanyType.findOne({
        $or: [{ name: catRegex }, { displayName: catRegex }]
      }).select("_id displayName");

      if (matchedCat) {
        const companies = await Merchant.find({
          company_type: matchedCat._id,
          _id: { $in: validMerchantIds }, // ✅ Uses City+Active Filter
          $or: [
            { company_name: fuzzyRegex },
            { business_category: fuzzyRegex },
          ],
        })
          .select("company_name company_logo company_type")
          .limit(8)
          .lean();

        companies.forEach((c) =>
          addUnique({
            id: c._id,
            name: c.company_name,
            type: "company",
            image: c.company_logo || null,
            description: matchedCat.displayName || "Company",
          })
        );
      }
    }

    // =====================================================
    // 3️⃣ BASE MEMBER SUGGESTIONS
    // =====================================================
    if (category === "base_member" && fuzzyRegex) {
      const baseMembers = await GrocerySeller.find({
        shop_name: fuzzyRegex,
        user_id: { $in: validUserIds }, // ✅ Uses City+Active Filter
      })
        .select("shop_name company_logo member_type")
        .populate("member_type", "name")
        .limit(8)
        .lean();

      baseMembers.forEach((b) =>
        addUnique({
          id: b._id,
          name: b.shop_name,
          type: "base_member",
          image: b.company_logo || null,
          description: b.member_type?.name?.replace(/_/g, " ") || "Base Member",
        })
      );
    }

    return res.json({
      suggestions: suggestions.slice(0, 15),
      message: null,
    });
  } catch (error) {
    console.error("getSuggestions Error:", error);
    return res.status(500).json({ suggestions: [], message: "Internal server error" });
  }
};

exports.getAllProductsBySellerId = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const userId = req.params.userId;
    const skip = (page - 1) * limit;

    let filterQuery = {};

    if (userId) {
      const merchant = await Merchant.findOne({ user_id: userId });
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: "Merchant not found for this user",
        });
      }
      filterQuery.seller_id = merchant._id;
    }

    // Handle verification filter
    if (filter === "verified") {
      filterQuery.product_verified_by_admin = true;
    } else if (filter === "not_verified") {
      filterQuery.product_verified_by_admin = false;
    }

    if (search) {
      filterQuery.product_name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filterQuery)
      .populate(
        "category_id sub_category_id super_sub_category_id deep_sub_category_id"
      )
      .skip(skip)
      .limit(limit)
      .sort({ product_verified_at: -1, createdAt: -1 });

    const productsWithAttributes = await Promise.all(
      products.map(async (product) => {
        const attributes = await ProductAttribute.find({
          product_id: product._id,
        });
        return { ...product.toObject(), attributes };
      })
    );

    const totalProducts = await Product.countDocuments(filterQuery);

    res.status(200).json({
      success: true,
      products: productsWithAttributes,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.fetchAllProductsByServiceProviderUserId = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, filter = "", search = "" } = req.query;

  try {
    const serviceProvider = await ServiceProvider.findOne({ user_id: userId });
    if (!serviceProvider) {
      return res
        .status(404)
        .json({ message: "Service provider not found for this user" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {
      seller_id: serviceProvider._id,
      sellerModel: "ServiceProvider",
    };

    // Apply filter for product verification status
    if (filter === "verified") {
      query.product_verified_by_admin = true;
    } else if (filter === "not-verified") {
      query.product_verified_by_admin = false;
    } // If filter is "all" or empty, no verification filter is applied

    if (search) {
      query.product_name = { $regex: search, $options: "i" };
    }

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate(
        "category_id sub_category_id super_sub_category_id deep_sub_category_id"
      );

    const productsWithAttributes = await Promise.all(
      products.map(async (product) => {
        const attributes = await ProductAttribute.find({
          product_id: product._id,
        });
        return {
          ...product.toObject(),
          attributes: attributes.map((attr) => ({
            attribute_key: attr.attribute_key,
            attribute_value: attr.attribute_value,
          })),
        };
      })
    );

    res.status(200).json({
      success: true, // Add success field for consistency
      products: productsWithAttributes,
      pagination: {
        totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products for service provider:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.fetchProductsByIds = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: "productIds array is required",
      });
    }

    const products = await Product.find(
      { _id: { $in: productIds } },
      { _id: 1, product_name: 1 } // only return _id and product_name
    );

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching products by IDs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by IDs",
      error: error.message,
    });
  }
};

exports.getNotVerifiedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const skip = (page - 1) * limit;

    let filterQuery = { product_verified_by_admin: false };

    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfDay };
    } else if (filter === "last_week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfWeek };
    } else if (filter === "last_month") {
      const startOfMonth = new Date();
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      startOfMonth.setHours(0, 0, 0, 0);
      filterQuery.createdAt = { $gte: startOfMonth };
    }

    if (search) {
      filterQuery.product_name = { $regex: search, $options: "i" };
    }

    let products = await Product.find(filterQuery)
      .populate("category_id sub_category_id super_sub_category_id deep_sub_category_id")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ markAsRead: 1, createdAt: -1 })
      .lean();

    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const attributes = await ProductAttribute.find({
          product_id: product._id,
        }).lean();

        let sellerInfo = null;

        if (product.sellerModel === "Merchant" && product.seller_id) {
          const merchant = await Merchant.findById(product.seller_id)
            .populate({
              path: "user_id",
              select: "name email phone role",
              populate: {
                path: "role",
                select: "role",
              },
            })
            .populate("address_id")
            .lean();

          if (merchant) {
            const addressInfo = await Address.findOne({
              user_id: merchant.user_id._id,
              address_type: "company",
            }).lean();

            sellerInfo = {
              ...merchant,
              address_id: addressInfo || merchant.address_id,
              user_name: merchant.user_id?.name || "Unknown User",
              user_email: merchant.user_id?.email || null,
              user_phone: merchant.user_id?.phone || null,
              role: merchant.user_id?.role?.role || "MERCHANT",
            };
          }
        }

        return {
          ...product,
          attributes: attributes || [],
          seller: sellerInfo || { company_name: "Direct Seller", user_name: "Individual" },
        };
      })
    );

    const totalProducts = await Product.countDocuments(filterQuery);

    res.status(200).json({
      success: true,
      products: productsWithDetails,
      pagination: {
        totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// In productController.js
exports.getProductsBySellerId = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const userId = req.params.userId;
    const query = { seller_id: userId };
    if (search) query.product_name = { $regex: search, $options: "i" };
    if (filter) query.product_verified_by_admin = filter === "verified";

    const products = await Product.find(query)
      .populate("category_id", "category_name")
      .populate("sub_category_id", "sub_category_name")
      .populate("super_sub_category_id", "super_sub_category_name")
      .populate("deep_sub_category_id", "deep_sub_category_name")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    // Transform the response to match frontend expectations
    const transformedProducts = products.map((product) => ({
      ...product._doc,
      category_id: product.category_id
        ? {
          _id: product.category_id._id,
          name: product.category_id.category_name,
        }
        : null,
      sub_category_id: product.sub_category_id
        ? {
          _id: product.sub_category_id._id,
          name: product.sub_category_id.sub_category_name,
        }
        : null,
      super_sub_category_id: product.super_sub_category_id
        ? {
          _id: product.super_sub_category_id._id,
          name: product.super_sub_category_id.super_sub_category_name,
        }
        : null,
      deep_sub_category_id: product.deep_sub_category_id
        ? {
          _id: product.deep_sub_category_id._id,
          name: product.deep_sub_category_id.deep_sub_category_name,
        }
        : null,
    }));

    res.json({
      success: true,
      products: transformedProducts,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markProductAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { markAsRead: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "Product marked as read", product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.fetchProductsByServiceProviderId = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, filter = "", search = "" } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {
      seller_id: providerId,
      sellerModel: "ServiceProvider",
    };

    if (filter === "verified") {
      query.product_verified_by_admin = true;
    } else if (filter === "not-verified") {
      query.product_verified_by_admin = false;
    }

    if (search) {
      query.product_name = { $regex: search, $options: "i" };
    }

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate(
        "category_id sub_category_id super_sub_category_id deep_sub_category_id"
      );

    const productsWithAttributes = await Promise.all(
      products.map(async (product) => {
        const attributes = await ProductAttribute.find({
          product_id: product._id,
        });
        return {
          ...product.toObject(),
          attributes: attributes.map((attr) => ({
            attribute_key: attr.attribute_key,
            attribute_value: attr.attribute_value,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      products: productsWithAttributes,
      pagination: {
        totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products for service provider:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



exports.suggestProductNames = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 3) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = q.trim();
    const escaped = escapeRegex(searchTerm);

    // Match ANYWHERE in product_name (case-insensitive)
    const regex = new RegExp(escaped, "i");

    const products = await Product.find({
      product_name: { $regex: regex },
      status: STATUS.ACTIVE_CAP,
    })
      .select("product_name category_id sub_category_id super_sub_category_id deep_sub_category_id")
      .sort({ product_name: 1 })
      .limit(10)
      .lean();

    const suggestions = products.map((p) => ({
      name: p.product_name,
      category_id: p.category_id,
      sub_category_id: p.sub_category_id,
      super_sub_category_id: p.super_sub_category_id,
      deep_sub_category_id: p.deep_sub_category_id,
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error("Suggestion error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Add this to your existing productController.js

exports.getProductForEdit = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category_id", "category_name")
      .populate("sub_category_id", "sub_category_name")
      .populate("super_sub_category_id", "super_sub_category_name")
      .populate("deep_sub_category_id", "deep_sub_category_name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Fetch actual attributes from ProductAttribute model
    const attributes = await ProductAttribute.find({ product_id: product._id });

    const formattedAttributes = attributes.map(attr => ({
      key: attr.attribute_key?.trim() || "",
      value: attr.attribute_value?.trim() || "",
    }));

    // Send full product with populated categories + real attributes
    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        attributes: formattedAttributes.length > 0
          ? formattedAttributes
          : [{ key: "", value: "" }], // ensure at least one empty row
      },
    });

  } catch (error) {
    console.error("Error fetching product for edit:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


exports.getAllOthersProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find "Others" IDs
    const [cat, sub, ssub, dsub] = await Promise.all([
      Category.findOne({ category_name: { $regex: /^others$/i } }).select("_id").lean(),
      SubCategory.findOne({ sub_category_name: { $regex: /^others$/i } }).select("_id").lean(),
      SuperSubCategory.findOne({ super_sub_category_name: { $regex: /^others$/i } }).select("_id").lean(),
      DeepSubCategory.findOne({ deep_sub_category_name: { $regex: /^others$/i } }).select("_id").lean(),
    ]);

    const othersIds = [cat?._id, sub?._id, ssub?._id, dsub?._id].filter(Boolean);

    if (othersIds.length === 0) {
      return res.json({
        success: true,
        message: "No 'Others' categories found.",
        pagination: { total: 0, page: 1, pages: 0, limit, hasNext: false, hasPrev: false },
        data: [],
      });
    }

    const filter = {
      $or: [
        { category_id: { $in: othersIds } },
        { sub_category_id: { $in: othersIds } },
        { super_sub_category_id: { $in: othersIds } },
        { deep_sub_category_id: { $in: othersIds } },
      ],
      status: STATUS.ACTIVE_CAP,
    };

    // Get total count
    const total = await Product.countDocuments(filter);

    // Get paginated data
    const products = await Product.find(filter)
      .populate("category_id", "category_name category_image")
      .populate("sub_category_id", "sub_category_name sub_category_image")
      .populate("super_sub_category_id", "super_sub_category_name")
      .populate("deep_sub_category_id", "deep_sub_category_name deep_sub_category_image")
      .sort({ product_verified_at: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        let sellerInfo = null;

        // Try to fetch detailed merchant/seller info if it exists
        if (product.sellerModel === "Merchant" && product.seller_id) {
          const merchant = await Merchant.findById(product.seller_id)
            .populate({
              path: "user_id",
              select: "name email phone role",
              populate: {
                path: "role",
                select: "role",
              },
            })
            .populate("address_id")
            .lean();

          if (merchant) {
            const addressInfo = await Address.findOne({
              user_id: merchant.user_id?._id,
              address_type: "company",
            }).lean();

            sellerInfo = {
              ...merchant,
              address_id: addressInfo || merchant.address_id,
              user_name: merchant.user_id?.name || "Unknown User",
              user_email: merchant.user_id?.email || null,
              user_phone: merchant.user_id?.phone || null,
              role: merchant.user_id?.role?.role || "MERCHANT",
            };
          }
        } else if (product.seller_id) {
            // Fallback for other seller models or legacy data
            const sellerData = await mongoose.model(product.sellerModel || "Merchant").findById(product.seller_id).lean();
            sellerInfo = {
                ...sellerData,
                company_name: sellerData?.business_name || sellerData?.company_name || "Individual",
                user_name: "Individual",
            };
        }

        const attributes = await ProductAttribute.find({
          product_id: product._id,
        }).lean();

        return {
          ...product,
          attributes: attributes || [],
          seller: sellerInfo || { company_name: "Direct Seller", user_name: "Individual" },
        };
      })
    );

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: "Others products fetched successfully",
      pagination: {
        total,
        page,
        pages,
        limit,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      data: productsWithDetails,
    });
  } catch (error) {
    console.error("Error in getAllOthersProducts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET PRODUCT PHOTO LIMIT FOR USER
exports.getProductPhotoLimit = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    /* =========================
       1️⃣ GET LATEST ACTIVE SUBSCRIPTION
    ========================= */
    const latestSubscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
    })
      .sort({ createdAt: -1 })
      .select("_id");

    if (!latestSubscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    /* =========================
       2️⃣ GET PRODUCT_PHOTOS FEATURE
    ========================= */
    const productPhotoFeature = await UserActiveFeature.findOne({
      user_id,
      user_subscription_id: latestSubscription._id,
      feature_code: FEATURES.PRODUCT_PHOTOS,
      status: STATUS.ACTIVE,
    })
      .sort({ createdAt: -1 })
      .select("product_photo_limit");

    if (!productPhotoFeature) {
      return res.status(404).json({
        success: false,
        message: "Product photo feature not available",
      });
    }

    const limitData = productPhotoFeature.product_photo_limit;

    // If unlimited
    if (limitData.is_unlimited) {
      return res.status(200).json({
        success: true,
        product_photo_limit: {
          is_unlimited: true,
          total: "Unlimited",
          used: 0,
          remaining: "Unlimited",
        },
      });
    }

    const totalLimit = limitData.total || 0;

    /* =========================
       3️⃣ CALCULATE USED IMAGES
    ========================= */

    const result = await Product.aggregate([
      {
        $match: {
          seller_id: new mongoose.Types.ObjectId(user_id),
        },
      },
      {
        $project: {
          imageCount: {
            $size: {
              $ifNull: ["$product_image", []],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalUsed: { $sum: "$imageCount" },
        },
      },
    ]);

    const used = result.length > 0 ? result[0].totalUsed : 0;

    const remaining = Math.max(totalLimit - used, 0);

    /* =========================
       4️⃣ RETURN FINAL DATA
    ========================= */
    return res.status(200).json({
      success: true,
      product_photo_limit: {
        is_unlimited: false,
        total: totalLimit,
        used,
        remaining,
      },
    });

  } catch (error) {
    console.error("getProductPhotoLimit error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product photo limit",
      error: error.message,
    });
  }
};

exports.getProductVideoAccess = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        product_video: false,
        message: "user_id is required",
      });
    }

    const now = new Date();

    /* =========================
       1️⃣ GET LATEST PAID SUBSCRIPTION
    ========================= */
    const latestSubscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
    })
      .sort({ createdAt: -1 })
      .select("_id");

    if (!latestSubscription) {
      return res.status(200).json({
        success: true,
        product_video: false,
      });
    }

    /* =========================
       2️⃣ CHECK PRODUCT VIDEO FEATURE
    ========================= */
    const hasProductVideo = await UserActiveFeature.exists({
      user_id,
      user_subscription_id: latestSubscription._id,
      feature_code: FEATURES.PRODUCTS_VIDEO,
      status: STATUS.ACTIVE,
      expires_at: { $gt: now },
    });

    /* =========================
       3️⃣ RETURN BOOLEAN ONLY
    ========================= */
    return res.status(200).json({
      success: true,
      product_video: !!hasProductVideo,
    });

  } catch (error) {
    console.error("getProductVideoAccess error:", error);
    return res.status(500).json({
      success: false,
      product_video: false,
      message: "Failed to fetch product video access",
    });
  }
};
exports.getCompanyVideoAccess = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        company_video: false,
        message: "user_id is required",
      });
    }

    const now = new Date();

    /* =========================
       1️⃣ GET LATEST PAID SUBSCRIPTION
    ========================= */
    const latestSubscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
    })
      .sort({ createdAt: -1 })
      .select("_id");

    if (!latestSubscription) {
      return res.status(200).json({
        success: true,
        company_video: false,
      });
    }

    /* =========================
       2️⃣ CHECK PRODUCT VIDEO FEATURE
    ========================= */
    const hasProductVideo = await UserActiveFeature.exists({
      user_id,
      user_subscription_id: latestSubscription._id,
      feature_code: FEATURES.COMPANY_VIDEO,
      status: STATUS.ACTIVE,
      expires_at: { $gt: now },
    });

    /* =========================
       3️⃣ RETURN BOOLEAN ONLY
    ========================= */
    return res.status(200).json({
      success: true,
      company_video: !!hasProductVideo,
    });

  } catch (error) {
    console.error("getProductVideoAccess error:", error);
    return res.status(500).json({
      success: false,
      company_video: false,
      message: "Failed to fetch product video access",
    });
  }
};
