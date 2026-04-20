const Category = require("../models/categoryModel");
const TrendingPoints = require("../models/trendingPointsModel");
const Product = require("../models/productModel");
const SubCategory = require("../models/subCategoryModel");
const SuperSubCategory = require("../models/superSubCategoryModel");
const DeepSubCategory = require("../models/deepSubCategoryModel");
const Address = require("../models/addressModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Merchant = require("../models/MerchantModel");
const mongoose = require("mongoose");
const userActiveFeatures = require("../models/UserActiveFeature")

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { category_name, category_image } = req.body;
    const modifiedName = category_name
      .toLowerCase()
      .replace(/,/g, "") // Remove commas
      .replace(/&/g, "and") // Replace ampersands
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, "") // Remove special characters
      .replace(/\-\-+/g, "-") // Replace multiple hyphens with a single one
      .trim();
    // Check if category already exists
    const existingCategory = await Category.findOne({
      category_name: modifiedName,
    });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({
      category_name: modifiedName,
      category_image,
    });
    await category.save();
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Single aggregation: join subcategories + count products per category/subcategory
    // Replaces the previous nested Promise.all that fired N+M separate DB queries
    const pipeline = [
      { $match: { category_name: { $regex: search, $options: "i" } } },

      // Count products per category in one lookup
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category_id",
          as: "allCategoryProducts",
        },
      },
      {
        $addFields: {
          productCount: { $size: "$allCategoryProducts" },
        },
      },

      // Lookup subcategories with a nested pipeline to resolve subProductCounts directly
      {
        $lookup: {
          from: "subcategories",
          let: { catId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$category_id", "$$catId"] } } },
            {
              $lookup: {
                from: "products",
                let: { subId: "$_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$sub_category_id", "$$subId"] } } },
                  { $count: "count" }
                ],
                as: "subProductCounts"
              }
            },
            {
              $addFields: {
                productCount: {
                  $ifNull: [{ $arrayElemAt: ["$subProductCounts.count", 0] }, 0]
                }
              }
            },
            {
              $project: {
                subCategoryId: "$_id",
                subCategoryName: "$sub_category_name",
                subCategoryImage: "$sub_category_image",
                productCount: 1,
                _id: 0
              }
            }
          ],
          as: "subcategories",
        },
      },

      {
        $addFields: {
          categoryId: "$_id",
          categoryName: "$category_name",
          categoryImage: "$category_image",
        }
      },

      { $sort: { createdAt: -1 } },

      // Get total count before pagination
      {
        $facet: {
          metadata: [{ $count: "totalItems" }],
          data: [
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 0,
                categoryId: 1,
                categoryName: 1,
                categoryImage: 1,
                productCount: 1,
                subcategories: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await Category.aggregate(pipeline);
    const totalItems = result?.metadata?.[0]?.totalItems || 0;
    const paginatedCategories = result?.data || [];

    res.json({
      success: true,
      message: "Fetched categories with subcategories successfully",
      data: paginatedCategories,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        hasMore: pageNum < Math.ceil(totalItems / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getCategoriesByName = async (req, res) => {
  try {
    const { category_name } = req.params;
    const { page = 1 } = req.query;
    const limit = 10;

    if (!category_name || typeof category_name !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing category_name" });
    }

    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid page number" });
    }

    const pipeline = [
      {
        $match: {
          category_name: { $regex: `.*${category_name}.*`, $options: "i" },
        },
      },
      { $skip: (pageNum - 1) * limit },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: SubCategory.collection.name,
          localField: "_id",
          foreignField: "category_id",
          as: "subcategories",
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "_id",
          foreignField: "category_id",
          as: "category_products",
        },
      },
      {
        $addFields: {
          productCount: { $size: "$category_products" },
        },
      },
      {
        $unwind: {
          path: "$subcategories",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: SuperSubCategory.collection.name,
          localField: "subcategories._id",
          foreignField: "sub_category_id",
          as: "subcategories.superSubcategories",
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "subcategories._id",
          foreignField: "sub_category_id",
          as: "subcategories.subProducts",
        },
      },
      {
        $addFields: {
          "subcategories.productCount": { $size: "$subcategories.subProducts" },
        },
      },
      {
        $group: {
          _id: "$_id",
          categoryName: { $first: "$category_name" },
          categoryImage: { $first: "$category_image" },
          productCount: { $first: "$productCount" },
          subcategories: { $push: "$subcategories" },
          category_products: { $first: "$category_products" },
        },
      },
      {
        $project: {
          categoryId: "$_id",
          _id: 0,
          categoryName: 1,
          categoryImage: 1,
          productCount: 1,
          subcategories: {
            $map: {
              input: "$subcategories",
              as: "sub",
              in: {
                subCategoryId: "$$sub._id",
                subCategoryName: "$$sub.sub_category_name",
                subCategoryImage: "$$sub.sub_category_image",
                productCount: "$$sub.productCount",
                superSubcategories: {
                  $map: {
                    input: "$$sub.superSubcategories",
                    as: "superSub",
                    in: {
                      superSubCategoryId: "$$superSub._id",
                      superSubCategoryName:
                        "$$superSub.super_sub_category_name",
                      superSubCategoryImage:
                        "$$superSub.super_sub_category_image",
                      productCount: {
                        $size: {
                          $filter: {
                            input: "$category_products",
                            as: "prod",
                            cond: {
                              $eq: [
                                "$$prod.super_sub_category_id",
                                "$$superSub._id",
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const [categories, total] = await Promise.all([
      Category.aggregate(pipeline).exec(),
      Category.countDocuments({
        category_name: { $regex: `^${category_name}`, $options: "i" },
      }),
    ]);

    return res.json({
      success: true,
      message:
        "Fetched categories with subcategories and super subcategories successfully",
      data: categories,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: pageNum,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubCategoriesByName = async (req, res) => {
  try {
    const { sub_category_name } = req.params;
    const { page = 1 } = req.query;
    const limit = 10;

    if (!sub_category_name || typeof sub_category_name !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing sub_category_name' });
    }

    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ success: false, message: 'Invalid page number' });
    }

    // Aggregation pipeline (mirrors country version, but no seller/country filters)
    const pipeline = [
      // Match the subcategory by name
      {
        $match: {
          sub_category_name: { $regex: `.*${sub_category_name}.*`, $options: 'i' },
        },
      },
      { $skip: (pageNum - 1) * limit },
      { $limit: limit },
      { $sort: { createdAt: -1 } },

      // Lookup parent Category details
      {
        $lookup: {
          from: Category.collection.name,
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup SuperSubCategories for the SubCategory
      {
        $lookup: {
          from: SuperSubCategory.collection.name,
          localField: '_id',
          foreignField: 'sub_category_id',
          as: 'superSubcategories',
        },
      },

      // Lookup Products for the SubCategory (ALL products, no filter)
      {
        $lookup: {
          from: Product.collection.name,
          localField: '_id',
          foreignField: 'sub_category_id',
          as: 'subProducts',
        },
      },
      {
        $addFields: {
          productCount: { $size: '$subProducts' },
        },
      },

      // Unwind superSubcategories to lookup their DeepSubCategories
      {
        $unwind: {
          path: '$superSubcategories',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup DeepSubCategories for each SuperSubCategory
      {
        $lookup: {
          from: DeepSubCategory.collection.name,
          localField: 'superSubcategories._id',
          foreignField: 'super_sub_category_id',
          as: 'superSubcategories.deepSubcategories',
        },
      },

      // Lookup Products for each SuperSubCategory (ALL)
      {
        $lookup: {
          from: Product.collection.name,
          localField: 'superSubcategories._id',
          foreignField: 'super_sub_category_id',
          as: 'superSubcategories.superSubProducts',
        },
      },
      {
        $addFields: {
          'superSubcategories.productCount': { $size: '$superSubcategories.superSubProducts' },
        },
      },

      // Unwind deepSubcategories to lookup their products
      {
        $unwind: {
          path: '$superSubcategories.deepSubcategories',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup Products for each DeepSubCategory (ALL)
      {
        $lookup: {
          from: Product.collection.name,
          localField: 'superSubcategories.deepSubcategories._id',
          foreignField: 'deep_sub_category_id',
          as: 'superSubcategories.deepSubcategories.deepSubProducts',
        },
      },
      {
        $addFields: {
          'superSubcategories.deepSubcategories.productCount': {
            $size: '$superSubcategories.deepSubcategories.deepSubProducts',
          },
        },
      },

      // Group back DeepSubCategories under SuperSubCategories
      {
        $group: {
          _id: {
            subCategoryId: '$_id',
            superSubCategoryId: '$superSubcategories._id',
          },
          subCategoryId: { $first: '$_id' },
          subCategoryName: { $first: '$sub_category_name' },
          subCategoryImage: { $first: '$sub_category_image' },
          productCount: { $first: '$productCount' },
          category: { $first: '$category' },
          superSubcategories: { $first: '$superSubcategories' },
          deepSubcategories: { $push: '$superSubcategories.deepSubcategories' },
        },
      },
      {
        $addFields: {
          'superSubcategories.deepSubcategories': '$deepSubcategories',
        },
      },

      // Group back SuperSubCategories under SubCategory
      {
        $group: {
          _id: '$subCategoryId',
          subCategoryName: { $first: '$subCategoryName' },
          subCategoryImage: { $first: '$subCategoryImage' },
          productCount: { $first: '$productCount' },
          category: { $first: '$category' },
          superSubcategories: { $push: '$superSubcategories' },
        },
      },

      // Final projection to match the country pipeline exactly
      {
        $project: {
          subCategoryId: '$_id',
          _id: 0,
          subCategoryName: 1,
          subCategoryImage: 1,
          productCount: 1,
          category: {
            categoryId: '$category._id',
            categoryName: '$category.category_name',
            categoryImage: '$category.category_image',
          },
          superSubcategories: {
            $map: {
              input: '$superSubcategories',
              as: 'superSub',
              in: {
                superSubCategoryId: '$$superSub._id',
                superSubCategoryName: '$$superSub.super_sub_category_name',
                superSubCategoryImage: '$$superSub.super_sub_category_image',
                productCount: '$$superSub.productCount',
                deepSubcategories: {
                  $map: {
                    input: '$$superSub.deepSubcategories',
                    as: 'deepSub',
                    in: {
                      deepSubCategoryId: '$$deepSub._id',
                      deepSubCategoryName: '$$deepSub.deep_sub_category_name',
                      deepSubCategoryImage: '$$deepSub.deep_sub_category_image',
                      productCount: '$$deepSub.productCount',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const [subcategories, total] = await Promise.all([
      SubCategory.aggregate(pipeline).exec(),
      SubCategory.countDocuments({
        sub_category_name: { $regex: `.*${sub_category_name}.*`, $options: "i" },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Fetched subcategories with super subcategories and deep subcategories successfully',
      data: subcategories,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: pageNum,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




exports.getProductsByCategoryName = async (req, res) => {
  try {
    let { modelName, categoryName } = req.params;

    // 1. EXTRACT QUERY PARAMS INCLUDING LIMIT
    const { city, lat, lng, searchLocation, page = 1, type, limit } = req.query;

    if (!modelName || !categoryName || typeof categoryName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing modelName or categoryName",
      });
    }

    // 2. PAGINATION LOGIC (Default limit to 6)
    const pageNumber = parseInt(page) || 1;
    // Use the limit from query, otherwise default to 6
    const pageSize = parseInt(limit) || 6;
    const skip = (pageNumber - 1) * pageSize;

    categoryName = categoryName.trim().toLowerCase();
    let deepSubCategoryIds = [];
    let deepSubCategoryDetail = [];
    let superSubCategoryDetail = null;
    let allDeepSubCategories = [];

    /* ================= CATEGORY RESOLUTION ================= */
    if (modelName === "deep-sub-category") {
      const deepSubCategory = await DeepSubCategory.findOne({
        deep_sub_category_name: { $regex: new RegExp(`^${categoryName}$`, "i") },
      });
      if (!deepSubCategory) {
        return res.status(404).json({ success: false, message: "DeepSubCategory not found" });
      }
      deepSubCategoryIds.push(deepSubCategory._id);
      deepSubCategoryDetail = [deepSubCategory];
      superSubCategoryDetail = await SuperSubCategory.findById(deepSubCategory.super_sub_category_id);
    } else if (modelName === "super-sub-category") {
      const superSubCategory = await SuperSubCategory.findOne({
        super_sub_category_name: { $regex: new RegExp(`^${categoryName}$`, "i") },
      });
      if (!superSubCategory) {
        return res.status(404).json({ success: false, message: "SuperSubCategory not found" });
      }
      superSubCategoryDetail = superSubCategory;
      const deepSubCategories = await DeepSubCategory.find({ super_sub_category_id: superSubCategory._id });
      if (!deepSubCategories.length) {
        return res.status(404).json({ success: false, message: "No DeepSubCategories found under this SuperSubCategory" });
      }
      deepSubCategoryIds = deepSubCategories.map((ds) => ds._id);
      allDeepSubCategories = deepSubCategories;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid modelName. Use "deep-sub-category" or "super-sub-category"',
      });
    }

    /* ================= BASE PIPELINE ================= */
    const basePipeline = [
      {
        $match: {
          deep_sub_category_id: { $in: deepSubCategoryIds },
          product_verified_by_admin: true,
        },
      },
      {
        $lookup: {
          from: "deepsubcategories",
          localField: "deep_sub_category_id",
          foreignField: "_id",
          as: "deepSubCategory",
        },
      },
      { $unwind: "$deepSubCategory" },
      ...(modelName === "super-sub-category"
        ? [
          {
            $lookup: {
              from: "supersubcategories",
              localField: "deepSubCategory.super_sub_category_id",
              foreignField: "_id",
              as: "superSubCategory",
            },
          },
          { $unwind: { path: "$superSubCategory", preserveNullAndEmptyArrays: true } },
        ]
        : []),
      {
        $lookup: {
          from: "merchants",
          localField: "seller_id",
          foreignField: "_id",
          as: "merchant",
        },
      },
      {
        $lookup: {
          from: "serviceproviders",
          localField: "seller_id",
          foreignField: "_id",
          as: "serviceProvider",
        },
      },

      /* ================= 🏭 MERCHANT TYPE FILTER ================= */
      ...(type && type !== "products"
        ? [
          {
            $match: {
              "merchant.company_type": {
                $regex: new RegExp(
                  type === "manufacture" ? "Manufacturer" :
                    type === "retailer" ? "Retailer" :
                      type === "sub_dealer" ? "Sub_dealer" :
                        type === "service" ? "Service" : type,
                  "i"
                )
              }
            }
          }
        ]
        : []),

      {
        $addFields: {
          sellerUserId: {
            $cond: [
              { $eq: ["$sellerModel", "Merchant"] },
              { $arrayElemAt: ["$merchant.user_id", 0] },
              { $arrayElemAt: ["$serviceProvider.user_id", 0] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "sellerUserId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "addresses",
          localField: "sellerUserId",
          foreignField: "user_id",
          as: "addresses",
        },
      },
      { $addFields: { primaryAddress: { $arrayElemAt: ["$addresses", 0] } } },
      {
        $lookup: {
          from: "productattributes",
          localField: "_id",
          foreignField: "product_id",
          as: "attributes",
        },
      },
      {
        $lookup: {
          from: "trendingpoints",
          localField: "_id",
          foreignField: "product_id",
          as: "trending",
        },
      },
      {
        $addFields: {
          trending_points: { $ifNull: [{ $arrayElemAt: ["$trending.trending_points", 0] }, 0] },
        },
      },
    ];

    /* ================= LOCATION FILTER ================= */
    const locationMatch = {};

    if (city && city !== "all") {
      locationMatch["primaryAddress.city"] = { $regex: city, $options: "i" };
    }

    if (searchLocation) {
      if (locationMatch["primaryAddress.city"]) {
        locationMatch.$and = [
          { "primaryAddress.city": { $regex: city, $options: "i" } },
          { "primaryAddress.city": { $regex: searchLocation, $options: "i" } }
        ];
        delete locationMatch["primaryAddress.city"];
      } else {
        locationMatch["primaryAddress.city"] = { $regex: searchLocation, $options: "i" };
      }
    }

    if (Object.keys(locationMatch).length > 0) {
      basePipeline.push({ $match: locationMatch });
    }

    /* ================= PROJECTION & PAGINATION ================= */
    const finalProjection = {
      _id: 1,
      product_name: 1,
      price: 1,
      stock_quantity: 1,
      product_image: 1,
      image: 1,
      seller_id: 1,
      sellerModel: 1,
      attributes: 1,
      trending_points: 1,
      deepSubCategory: {
        _id: "$deepSubCategory._id",
        name: "$deepSubCategory.deep_sub_category_name",
        deep_sub_category_image: "$deepSubCategory.deep_sub_category_image",
      },
      user: { _id: "$user._id", name: "$user.name", email: "$user.email", mobile: "$user.mobile" },
      primaryAddress: 1,
    };

    if (modelName === "super-sub-category") {
      finalProjection.superSubCategory = {
        _id: "$superSubCategory._id",
        name: "$superSubCategory.super_sub_category_name",
      };
    }

    const paginatedPipeline = [
      ...basePipeline,
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          paginatedResults: [
            { $skip: skip },
            { $limit: pageSize }, // Uses the dynamic limit (default 6)
            { $project: finalProjection }
          ],
        },
      },
      { $unwind: { path: "$totalCount", preserveNullAndEmptyArrays: true } }, // Unwind the count array
      { $addFields: { totalCount: "$totalCount.count" } }, // Add the count field
    ];

    const result = await Product.aggregate(paginatedPipeline);

    // Safety check: ensure result[0] exists
    const response = (result && result.length > 0) ? result[0] : { totalCount: 0, paginatedResults: [] };

    return res.json({
      success: true,
      message: "Fetched products successfully",
      data: response.paginatedResults || [],
      totalCount: response.totalCount || 0,
      currentPage: pageNumber,
      totalPages: Math.ceil((response.totalCount || 0) / pageSize),
      deepSubCategoryDetail: deepSubCategoryDetail || undefined,
      superSubCategoryDetail: superSubCategoryDetail || undefined,
      deepSubCategoryList: modelName === "super-sub-category" ? allDeepSubCategories : undefined,
    });

  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopTrendingCategories = async (req, res) => {
  try {
    // 1. Fetch all Categories
    const categories = await Category.find({}).lean();

    // 2. Aggregate Trending Points per Category (so we can sort)
    const trendingPoints = await TrendingPoints.aggregate([
      {
        $group: {
          _id: "$product_id",
          totalPoints: { $sum: "$trending_points" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category_id",
          points: { $sum: "$totalPoints" },
        },
      },
    ]);
    const pointsMap = new Map(trendingPoints.map((p) => [p._id.toString(), p.points]));

    // 3. Fetch all SubCategories, SuperSubCategories, DeepSubCategories once for efficient mapping
    const [allSubCategories, allSuperSubCategories, allDeepSubCategories] = await Promise.all([
      SubCategory.find({}).select("_id category_id sub_category_name sub_category_image").lean(),
      SuperSubCategory.find({}).select("_id sub_category_id super_sub_category_name").lean(),
      DeepSubCategory.find({}).select("_id super_sub_category_id deep_sub_category_name").lean(),
    ]);

    // 4. Group data into Hierarchical Structure
    const enhancedData = categories.map((cat) => {
      const catId = cat._id.toString();
      const catSubs = allSubCategories.filter((s) => s.category_id && s.category_id.toString() === catId);

      const subCategoriesMapped = catSubs.map((sub) => {
        const subId = sub._id.toString();
        const subSupers = allSuperSubCategories.filter(
          (ss) => ss.sub_category_id && ss.sub_category_id.toString() === subId
        );

        const superSubMapped = subSupers.map((ssc) => {
          const sscId = ssc._id.toString();
          const sscDeeps = allDeepSubCategories.filter(
            (dsc) => dsc.super_sub_category_id && dsc.super_sub_category_id.toString() === sscId
          );

          return {
            superSubCategoryId: ssc._id,
            name: ssc.super_sub_category_name,
            deepSubCategories: sscDeeps.map((dsc) => ({
              deepSubCategoryId: dsc._id,
              name: dsc.deep_sub_category_name,
            })),
          };
        });

        return {
          subCategoryId: sub._id,
          subCategoryName: sub.sub_category_name,
          subCategoryImage: sub.sub_category_image,
          superSubCategories: superSubMapped,
        };
      });

      return {
        categoryId: cat._id,
        categoryName: cat.category_name,
        image: cat.category_image || "https://via.placeholder.com/600x400?text=Category+Image",
        categoryPoints: pointsMap.get(catId) || 0,
        subCategories: subCategoriesMapped,
      };
    });

    // 5. Sort by points (desc) then name (asc)
    enhancedData.sort((a, b) => b.categoryPoints - a.categoryPoints || a.categoryName.localeCompare(b.categoryName));

    res.json({
      success: true,
      message: "Fetched categories hierarchy successfully",
      data: enhancedData,
    });
  } catch (error) {
    console.error("Top categories error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// controller or route handler
exports.getTopTrendingCategoriesForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ────────────────────────────────────────────────
    // Pipeline that groups → joins → sums points by category
    // ────────────────────────────────────────────────
    const pipeline = [
      // 1. Sum trending points per product
      {
        $group: {
          _id: "$product_id",
          totalPoints: { $sum: "$trending_points" },
        },
      },
      // 2. Join with products to get category_id
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      // IMPORTANT: remove documents where product was not found
      { $match: { product: { $ne: [] } } },
      { $unwind: "$product" },

      // 3. Group by category and sum points
      {
        $group: {
          _id: "$product.category_id",
          categoryPoints: { $sum: "$totalPoints" },
        },
      },
      // 4. Sort descending (highest trending first)
      { $sort: { categoryPoints: -1 } },
    ];

    // ────────────────────────────────────────────────
    // Get total count of categories with trending points
    // ────────────────────────────────────────────────
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await TrendingPoints.aggregate(countPipeline);
    const totalTrendingCategories = countResult[0]?.total || 0;

    // ────────────────────────────────────────────────
    // Now get paginated data + category details
    // ────────────────────────────────────────────────
    const dataPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: false } },
    ];

    const trendingResults = await TrendingPoints.aggregate(dataPipeline);

    // ────────────────────────────────────────────────
    // 💡 DSA Optimization: Batch Fetching & Hash Maps (O(1) Lookups)
    // ────────────────────────────────────────────────
    const categoryIds = trendingResults.map((item) => item._id);

    // 1. Fetch ALL subcategories for these categories
    const allSubCats = await SubCategory.find({ category_id: { $in: categoryIds } }).lean();
    const subCatIds = allSubCats.map(sub => sub._id);

    // 2. Fetch ALL super-subcategories for these subcategories
    const allSuperSubCats = await SuperSubCategory.find({ sub_category_id: { $in: subCatIds } }).lean();
    const superSubCatIds = allSuperSubCats.map(ssc => ssc._id);

    // 3. Fetch ALL deep-subcategories for these super-subcategories
    const allDeepSubCats = await DeepSubCategory.find({ super_sub_category_id: { $in: superSubCatIds } }).lean();

    // 4. Build Hash Maps (O(N) CPU)
    const deepSubCatMap = {};
    allDeepSubCats.forEach(dsc => {
      const parentId = dsc.super_sub_category_id.toString();
      if (!deepSubCatMap[parentId]) deepSubCatMap[parentId] = [];
      deepSubCatMap[parentId].push({
        deepSubCategoryId: dsc._id.toString(),
        name: dsc.deep_sub_category_name,
      });
    });

    const superSubCatMap = {};
    allSuperSubCats.forEach(ssc => {
      const parentId = ssc.sub_category_id.toString();
      if (!superSubCatMap[parentId]) superSubCatMap[parentId] = [];
      superSubCatMap[parentId].push({
        superSubCategoryId: ssc._id.toString(),
        name: ssc.super_sub_category_name,
        deepSubCategories: deepSubCatMap[ssc._id.toString()] || [],
      });
    });

    const subCatMap = {};
    allSubCats.forEach(sub => {
      const parentId = sub.category_id.toString();
      if (!subCatMap[parentId]) subCatMap[parentId] = [];
      subCatMap[parentId].push({
        subCategoryId: sub._id.toString(),
        subCategoryName: sub.sub_category_name,
        subCategoryImage: sub.sub_category_image || null,
        superSubCategories: superSubCatMap[sub._id.toString()] || [],
      });
    });

    // 5. Structure Final Output (O(N) CPU Lookups)
    const enhancedData = trendingResults.map((item) => {
      return {
        categoryId: item.category._id.toString(),
        categoryName: item.category.category_name,
        image: item.category.category_image || "https://via.placeholder.com/600x400?text=No+Image",
        categoryPoints: item.categoryPoints,
        subCategories: subCatMap[item._id.toString()] || [],
      };
    });

    // ────────────────────────────────────────────────
    // Final response
    // ────────────────────────────────────────────────
    res.json({
      success: true,
      data: enhancedData,
      pagination: {
        totalItems: totalTrendingCategories,
        currentPage: page,
        totalPages: Math.ceil(totalTrendingCategories / limit),
        hasNextPage: skip + limit < totalTrendingCategories,
        hasPrevPage: page > 1,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("Error in getTopTrendingCategoriesForAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trending categories",
      error: error.message,
    });
  }
};


exports.getTopTrendingSubCategories = async (req, res) => {
  try {
    // Step 1: Aggregate trending points by subcategory_id
    const trendingSubCategories = await TrendingPoints.aggregate([
      // Group by product_id to sum trending points
      {
        $group: {
          _id: "$product_id",
          totalPoints: { $sum: "$trending_Points" },
        },
      },
      // Lookup product details to get subcategory_id
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      // Group by subcategory_id and sum points
      {
        $group: {
          _id: "$product.sub_category_id",
          subCategoryPoints: { $sum: "$totalPoints" },
        },
      },
      // Lookup subcategory details
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      { $unwind: "$subcategory" },
      // Sort by points and limit to top 20
      { $sort: { subCategoryPoints: -1 } },
      { $limit: 20 },
      // Project the final structure
      {
        $project: {
          subCategoryId: "$_id",
          subCategoryName: "$subcategory.sub_category_name",
          subCategoryImage: "$subcategory.sub_category_image",
          subCategoryPoints: 1,
          _id: 0,
        },
      },
    ]);

    // Step 2: Send the response
    res.json({
      success: true,
      message: "Top 20 trending subcategories fetched successfully",
      data: trendingSubCategories,
    });
  } catch (error) {
    console.error("Top trending subcategories error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopTrendingProducts = async (req, res) => {
  try {
    // ───────────────────────────────────────────────
    // Pagination parameters
    // ───────────────────────────────────────────────
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const now = new Date();

    // ───────────────────────────────────────────────
    // Main aggregation pipeline for products
    // ───────────────────────────────────────────────
    const products = await Product.aggregate([
      // 1. Only admin verified products
      {
        $match: {
          product_verified_by_admin: true,
        },
      },

      // 2. Lookup merchant
      {
        $lookup: {
          from: "merchants",
          localField: "seller_id",
          foreignField: "_id",
          as: "merchant",
        },
      },
      { $unwind: "$merchant" },

      // 3. Lookup user
      {
        $lookup: {
          from: "users",
          localField: "merchant.user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // Only active users
      {
        $match: {
          "user.isActive": true,
        },
      },

      // 4. Lookup trending points
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
        $match: {
          totalTrendingPoints: { $gt: 0 }
        }
      },
      // 5. Lookup product attributes
      {
        $lookup: {
          from: "productattributes",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$product_id", "$$productId"] },
              },
            },
            {
              $project: {
                _id: 0,
                key: "$attribute_key",
                value: "$attribute_value",
              },
            },
          ],
          as: "attributes",
        },
      },

      // 6. Lookup company address
      {
        $lookup: {
          from: "addresses",
          let: { userId: "$user._id" },
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

      // 7. TOP_LISTING feature check
      {
        $lookup: {
          from: "useractivefeatures",
          let: { userId: "$user._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$feature_code", "TOP_LISTING"] },
                    { $eq: ["$status", "active"] },
                    { $gt: ["$expires_at", now] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "topListingFeature",
        },
      },

      {
        $addFields: {
          isTopListing: {
            $cond: [{ $gt: [{ $size: "$topListingFeature" }, 0] }, 1, 0],
          },
          topListingExpiresAt: {
            $ifNull: [
              { $arrayElemAt: ["$topListingFeature.expires_at", 0] },
              null,
            ],
          },
        },
      },

      // 8. TrustShield lookup
      {
        $lookup: {
          from: "trustsealrequests",
          let: { userId: "$user._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$status", "verified"] },
                    { $gte: ["$expiryDate", now] },
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
        $addFields: {
          trustshield: {
            $cond: [{ $gt: [{ $size: "$trustSealData" }, 0] }, true, false],
          },
        },
      },

      // 9. Final projection
      {
        $project: {
          _id: 0,
          productId: "$_id",
          totalTrendingPoints: 1,
          isTopListing: 1,
          topListingExpiresAt: 1,
          unitOfMeasurement: 1,
          attributes: 1,

          product: {
            _id: "$_id",
            product_name: "$product_name",
            description: "$description",
            price: "$price",
            stock_quantity: "$stock_quantity",
            product_image: "$product_image",
            createdAt: "$createdAt",
          },

          sellerInfo: {
            _id: "$merchant._id",
            name: "$user.name",
            email: "$user.email",
            company_name: "$merchant.company_name",
            company_logo: "$merchant.company_logo",
            verified_status: "$merchant.verified_status",
            year_of_establishment: "$merchant.year_of_establishment",
            companyAddress: "$companyAddress",
            trustshield: "$trustshield",
          },
        },
      },

      // 10. Sorting (very important – do this before skip/limit)
      {
        $sort: {
          isTopListing: -1,
          topListingExpiresAt: -1,
          totalTrendingPoints: -1,
        },
      },

      // 11. Pagination stages
      { $skip: skip },
      { $limit: limit },
    ]);

    // ───────────────────────────────────────────────
    // Get total count for pagination metadata
    // (we count only the base verified + active condition to keep it fast)
    // ───────────────────────────────────────────────
    const total = await Product.aggregate([
      { $match: { product_verified_by_admin: true } },
      {
        $lookup: {
          from: "merchants",
          localField: "seller_id",
          foreignField: "_id",
          as: "merchant",
        },
      },
      { $unwind: "$merchant" },
      {
        $lookup: {
          from: "users",
          localField: "merchant.user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.isActive": true } },
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
      { $match: { totalTrendingPoints: { $gt: 0 } } },
      { $count: "total" },
    ]).then(result => result[0]?.total || 0);

    const hasMore = products.length === limit && (skip + products.length) < total;

    // ───────────────────────────────────────────────
    // Final response
    // ───────────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: "Top trending products fetched successfully",
      data: products,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });

  } catch (error) {
    console.error("Top trending products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top trending products",
      error: error.message,
    });
  }
};


exports.getCategoriesForSuperSubCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({
      success: true,
      message: "Fetch Category Successfully",
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { category_name, category_image } = req.body;
    const modifiedName = category_name
      .toLowerCase()
      .replace(/,/g, "") // Remove commas
      .replace(/&/g, "and") // Replace ampersands
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, "") // Remove special characters
      .replace(/\-\-+/g, "-") // Replace multiple hyphens
      .trim();
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { category_name: modifiedName, category_image },

      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Delete category
// controllers/categoryController.js
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // This will now trigger findOneAndDelete → hook runs
    await Category.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    if (error.name === 'DeletionRestrictedError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
const sanitizeCountry = (name) => {
  return name?.trim().toLowerCase().replace(/\s+/g, " "); // Collapse multiple spaces to single
};

exports.getSubCategoriesByCountryName = async (req, res) => {
  try {
    const { sub_category_name, country } = req.params;
    const { page = 1 } = req.query;
    const limit = 10;

    // Validate inputs
    if (!sub_category_name || typeof sub_category_name !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing sub_category' });
    }
    if (!country || typeof country !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing country' });
    }

    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ success: false, message: 'Invalid page number' });
    }

    // Sanitize country name
    const sanitizedCountry = sanitizeCountry(country);

    // Find addresses matching the sanitized country
    const addresses = await Address.find({
      $expr: {
        $eq: [
          {
            $replaceAll: {
              input: { $toLower: '$country' },
              find: ' ',
              replacement: '-',
            },
          },
          sanitizedCountry,
        ],
      },
      entity_type: { $in: ['merchant', 'service_provider'] },
    }).select('_id');

    const addressIds = addresses.map((addr) => addr._id);

    if (addressIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No addresses found for the specified country',
      });
    }

    // Find merchants with matching address_id
    const merchants = await Merchant.find({ address_id: { $in: addressIds } }).select('_id');
    const merchantIds = merchants.map((m) => m._id);

    // Find service providers with matching address_id
    const serviceProviders = await ServiceProvider.find({ address_id: { $in: addressIds } }).select('_id');
    const serviceProviderIds = serviceProviders.map((sp) => sp._id);

    if (merchantIds.length === 0 && serviceProviderIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sellers found for the specified country',
      });
    }

    // Aggregation pipeline
    const pipeline = [
      // Match the subcategory by name
      {
        $match: {
          sub_category_name: { $regex: `.*${sub_category_name}.*`, $options: 'i' },
        },
      },
      { $skip: (pageNum - 1) * limit },
      { $limit: limit },
      { $sort: { createdAt: -1 } },

      // Lookup parent Category details
      {
        $lookup: {
          from: Category.collection.name,
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup SuperSubCategories for the SubCategory
      {
        $lookup: {
          from: SuperSubCategory.collection.name,
          localField: '_id',
          foreignField: 'sub_category_id',
          as: 'superSubcategories',
        },
      },

      // Lookup Products for the SubCategory, filtered by country via sellers
      {
        $lookup: {
          from: Product.collection.name,
          let: { subCategoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$sub_category_id', '$$subCategoryId'] },
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ['$sellerModel', 'Merchant'] },
                            { $in: ['$seller_id', merchantIds] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ['$sellerModel', 'ServiceProvider'] },
                            { $in: ['$seller_id', serviceProviderIds] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'subProducts',
        },
      },
      {
        $addFields: {
          productCount: { $size: '$subProducts' },
        },
      },

      // Unwind superSubcategories to lookup their DeepSubCategories
      {
        $unwind: {
          path: '$superSubcategories',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup DeepSubCategories for each SuperSubCategory
      {
        $lookup: {
          from: DeepSubCategory.collection.name,
          localField: 'superSubcategories._id',
          foreignField: 'super_sub_category_id',
          as: 'superSubcategories.deepSubcategories',
        },
      },

      // Lookup Products for each SuperSubCategory, filtered by country
      {
        $lookup: {
          from: Product.collection.name,
          let: { superSubCategoryId: '$superSubcategories._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$super_sub_category_id', '$$superSubCategoryId'] },
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ['$sellerModel', 'Merchant'] },
                            { $in: ['$seller_id', merchantIds] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ['$sellerModel', 'ServiceProvider'] },
                            { $in: ['$seller_id', serviceProviderIds] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'superSubcategories.superSubProducts',
        },
      },
      {
        $addFields: {
          'superSubcategories.productCount': { $size: '$superSubcategories.superSubProducts' },
        },
      },

      // Unwind deepSubcategories to lookup their products
      {
        $unwind: {
          path: '$superSubcategories.deepSubcategories',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup Products for each DeepSubCategory, filtered by country
      {
        $lookup: {
          from: Product.collection.name,
          let: { deepSubCategoryId: '$superSubcategories.deepSubcategories._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$deep_sub_category_id', '$$deepSubCategoryId'] },
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ['$sellerModel', 'Merchant'] },
                            { $in: ['$seller_id', merchantIds] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ['$sellerModel', 'ServiceProvider'] },
                            { $in: ['$seller_id', serviceProviderIds] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'superSubcategories.deepSubcategories.deepSubProducts',
        },
      },
      {
        $addFields: {
          'superSubcategories.deepSubcategories.productCount': {
            $size: '$superSubcategories.deepSubcategories.deepSubProducts',
          },
        },
      },

      // Group back DeepSubCategories under SuperSubCategories
      {
        $group: {
          _id: {
            subCategoryId: '$_id',
            superSubCategoryId: '$superSubcategories._id',
          },
          subCategoryId: { $first: '$_id' },
          subCategoryName: { $first: '$sub_category_name' },
          subCategoryImage: { $first: '$sub_category_image' },
          productCount: { $first: '$productCount' },
          category: { $first: '$category' },
          superSubcategories: { $first: '$superSubcategories' },
          deepSubcategories: { $push: '$superSubcategories.deepSubcategories' },
        },
      },
      {
        $addFields: {
          'superSubcategories.deepSubcategories': '$deepSubcategories',
        },
      },

      // Group back SuperSubCategories under SubCategory
      {
        $group: {
          _id: '$subCategoryId',
          subCategoryName: { $first: '$subCategoryName' },
          subCategoryImage: { $first: '$subCategoryImage' },
          productCount: { $first: '$productCount' },
          category: { $first: '$category' },
          superSubcategories: { $push: '$superSubcategories' },
        },
      },

      // Final projection to match the non-country pipeline
      {
        $project: {
          subCategoryId: '$_id',
          _id: 0,
          subCategoryName: 1,
          subCategoryImage: 1,
          productCount: 1,
          category: {
            categoryId: '$category._id',
            categoryName: '$category.category_name',
            categoryImage: '$category.category_image',
          },
          superSubcategories: {
            $map: {
              input: '$superSubcategories',
              as: 'superSub',
              in: {
                superSubCategoryId: '$$superSub._id',
                superSubCategoryName: '$$superSub.super_sub_category_name',
                superSubCategoryImage: '$$superSub.super_sub_category_image',
                productCount: '$$superSub.productCount',
                deepSubcategories: {
                  $map: {
                    input: '$$superSub.deepSubcategories',
                    as: 'deepSub',
                    in: {
                      deepSubCategoryId: '$$deepSub._id',
                      deepSubCategoryName: '$$deepSub.deep_sub_category_name',
                      deepSubCategoryImage: '$$deepSub.deep_sub_category_image',
                      productCount: '$$deepSub.productCount',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    // Count pipeline
    const countPipeline = [...pipeline];
    countPipeline.splice(countPipeline.findIndex((stage) => '$skip' in stage), 3); // Remove sort, skip, limit
    countPipeline.pop(); // Remove project
    countPipeline.push({ $count: 'total' });

    const [subcategories, countResult] = await Promise.all([
      SubCategory.aggregate(pipeline).exec(),
      SubCategory.aggregate(countPipeline).exec(),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    return res.json({
      success: true,
      message: 'Fetched subcategory with super subcategories and deep subcategories successfully',
      data: subcategories,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: pageNum,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoriesByCountryName = async (req, res) => {
  try {
    const { category_name, country } = req.params;
    const { page = 1 } = req.query;
    const limit = 10;

    if (!category_name || typeof category_name !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing category_name' });
    }
    if (!country || typeof country !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing country' });
    }

    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ success: false, message: 'Invalid page number' });
    }

    // Sanitize country name
    const sanitizedCountry = sanitizeCountry(country);

    // Find addresses matching the sanitized country
    const addresses = await Address.find({
      $expr: {
        $eq: [
          {
            $replaceAll: {
              input: { $toLower: '$country' },
              find: ' ',
              replacement: '-',
            },
          },
          sanitizedCountry,
        ],
      },
      entity_type: { $in: ['merchant', 'service_provider'] },
    }).select('_id');

    const addressIds = addresses.map((addr) => addr._id);

    if (addressIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No addresses found for the specified country',
      });
    }

    // Find merchants with matching address_id
    const merchants = await Merchant.find({ address_id: { $in: addressIds } }).select('_id');
    const merchantIds = merchants.map((m) => m._id);

    // Find service providers with matching address_id
    const serviceProviders = await ServiceProvider.find({ address_id: { $in: addressIds } }).select('_id');
    const serviceProviderIds = serviceProviders.map((sp) => sp._id);

    if (merchantIds.length === 0 && serviceProviderIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sellers found for the specified country',
      });
    }

    const pipeline = [
      {
        $match: {
          category_name: { $regex: `.*${category_name}.*`, $options: 'i' },
        },
      },
      {
        $lookup: {
          from: SubCategory.collection.name,
          localField: '_id',
          foreignField: 'category_id',
          as: 'subcategories',
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: '_id',
          foreignField: 'category_id',
          as: 'category_products',
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$sellerModel', 'Merchant'] }, { $in: ['$seller_id', merchantIds] }] },
                    { $and: [{ $eq: ['$sellerModel', 'ServiceProvider'] }, { $in: ['$seller_id', serviceProviderIds] }] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          productCount: { $size: '$category_products' },
        },
      },
      {
        $unwind: {
          path: '$subcategories',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: SuperSubCategory.collection.name,
          localField: 'subcategories._id',
          foreignField: 'sub_category_id',
          as: 'subcategories.superSubcategories',
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: 'subcategories._id',
          foreignField: 'sub_category_id',
          as: 'subcategories.subProducts',
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$sellerModel', 'Merchant'] }, { $in: ['$seller_id', merchantIds] }] },
                    { $and: [{ $eq: ['$sellerModel', 'ServiceProvider'] }, { $in: ['$seller_id', serviceProviderIds] }] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          'subcategories.productCount': { $size: '$subcategories.subProducts' },
        },
      },
      {
        $unwind: {
          path: '$subcategories.superSubcategories',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: 'subcategories.superSubcategories._id',
          foreignField: 'super_sub_category_id',
          as: 'subcategories.superSubcategories.superSubProducts',
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$sellerModel', 'Merchant'] }, { $in: ['$seller_id', merchantIds] }] },
                    { $and: [{ $eq: ['$sellerModel', 'ServiceProvider'] }, { $in: ['$seller_id', serviceProviderIds] }] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          'subcategories.superSubcategories.productCount': {
            $size: '$subcategories.superSubcategories.superSubProducts',
          },
        },
      },
      {
        $group: {
          _id: {
            categoryId: '$_id',
            subCategoryId: '$subcategories._id',
          },
          categoryName: { $first: '$category_name' },
          categoryImage: { $first: '$category_image' },
          productCount: { $first: '$productCount' },
          subcategories: { $first: '$subcategories' },
          superSubcategories: { $push: '$subcategories.superSubcategories' },
          category_products: { $first: '$category_products' },
        },
      },
      {
        $addFields: {
          'subcategories.superSubcategories': '$superSubcategories',
        },
      },
      {
        $group: {
          _id: '$_id.categoryId',
          categoryName: { $first: '$categoryName' },
          categoryImage: { $first: '$categoryImage' },
          productCount: { $first: '$productCount' },
          subcategories: { $push: '$subcategories' },
          category_products: { $first: '$category_products' },
        },
      },
      {
        $addFields: {
          totalProducts: {
            $add: [
              '$productCount',
              {
                $reduce: {
                  input: '$subcategories',
                  initialValue: 0,
                  in: {
                    $add: [
                      '$$value',
                      '$$this.productCount',
                      {
                        $reduce: {
                          input: '$$this.superSubcategories',
                          initialValue: 0,
                          in: { $add: ['$$value', '$$this.productCount'] },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $match: { totalProducts: { $gt: 0 } },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (pageNum - 1) * limit },
      { $limit: limit },
      {
        $project: {
          categoryId: '$_id',
          _id: 0,
          categoryName: 1,
          categoryImage: 1,
          productCount: 1,
          subcategories: {
            $filter: {
              input: {
                $map: {
                  input: '$subcategories',
                  as: 'sub',
                  in: {
                    subCategoryId: '$$sub._id',
                    subCategoryName: '$$sub.sub_category_name',
                    subCategoryImage: '$$sub.sub_category_image',
                    productCount: '$$sub.productCount',
                    superSubcategories: {
                      $filter: {
                        input: {
                          $map: {
                            input: '$$sub.superSubcategories',
                            as: 'superSub',
                            in: {
                              superSubCategoryId: '$$superSub._id',
                              superSubCategoryName: '$$superSub.super_sub_category_name',
                              superSubCategoryImage: '$$superSub.super_sub_category_image',
                              productCount: '$$superSub.productCount',
                            },
                          },
                        },
                        as: 'superSub',
                        cond: { $gt: ['$$superSub.productCount', 0] },
                      },
                    },
                  },
                },
              },
              as: 'sub',
              cond: {
                $or: [
                  { $gt: ['$$sub.productCount', 0] },
                  { $gt: [{ $size: '$$sub.superSubcategories' }, 0] },
                ],
              },
            },
          },
        },
      },
    ];

    const [categories, countResult] = await Promise.all([
      Category.aggregate(pipeline).exec(),
      Category.aggregate([...pipeline.slice(0, pipeline.findIndex((stage) => '$skip' in stage)), { $count: 'total' }]).exec(),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    return res.json({
      success: true,
      message: 'Fetched categories with subcategories and super subcategories successfully',
      data: categories,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: pageNum,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// controllers/categoryController.js
exports.createCategoryTree = async (req, res) => {
  try {
    const { category_name, category_image, subCategories = [] } = req.body;

    if (!category_name?.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Sanitize name (same as before)
    const sanitizedCategoryName = category_name
      .toLowerCase()
      .replace(/,/g, "")
      .replace(/&/g, "and")
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .trim();

    const existingCat = await Category.findOne({ category_name: sanitizedCategoryName });
    if (existingCat) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    // Create main category
    const category = await Category.create({
      category_name: sanitizedCategoryName,
      category_image,
    });

    const categoryId = category._id;
    const createdSubCats = [];
    const createdSuperSubs = [];
    const createdDeepSubs = [];

    // Same loops as before, just without session
    for (const sub of subCategories) {
      const { sub_category_name, sub_category_image, superSubCategories = [] } = sub;
      if (!sub_category_name?.trim()) continue;

      const sanitizedSubName = sub_category_name
        .toLowerCase()
        .replace(/,/g, "")
        .replace(/&/g, "and")
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .trim();

      const subCat = await SubCategory.create({
        category_id: categoryId,
        sub_category_name: sanitizedSubName,
        sub_category_image,
      });
      createdSubCats.push(subCat);

      for (const sup of superSubCategories) {
        const { super_sub_category_name, deepSubCategories = [] } = sup;
        if (!super_sub_category_name?.trim()) continue;

        const sanitizedSuperName = super_sub_category_name
          .toLowerCase()
          .replace(/,/g, "")
          .replace(/&/g, "and")
          .replace(/\s+/g, "-")
          .replace(/[^\w\-]+/g, "")
          .replace(/\-\-+/g, "-")
          .trim();

        const superSub = await SuperSubCategory.create({
          category_id: categoryId,
          sub_category_id: subCat._id,
          super_sub_category_name: sanitizedSuperName,
        });
        createdSuperSubs.push(superSub);

        for (const deep of deepSubCategories) {
          if (!deep.deep_sub_category_name?.trim()) continue;

          const sanitizedDeepName = deep.deep_sub_category_name
            .toLowerCase()
            .replace(/,/g, "")
            .replace(/&/g, "and")
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .trim();

          const deepSub = await DeepSubCategory.create({
            category_id: categoryId,
            sub_category_id: subCat._id,
            super_sub_category_id: superSub._id,
            deep_sub_category_name: sanitizedDeepName,
            deep_sub_category_image: deep.deep_sub_category_image,
          });
          createdDeepSubs.push(deepSub);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Full category hierarchy created successfully",
      data: {
        category,
        subCategories: createdSubCats,
        superSubCategories: createdSuperSubs,
        deepSubCategories: createdDeepSubs,
      },
    });
  } catch (error) {
    console.error("Create category tree error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
