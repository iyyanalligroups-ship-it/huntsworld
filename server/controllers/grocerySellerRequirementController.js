const GrocerySellerRequirement = require('../models/grocerySellerRequirementModel');
const Address = require('../models/addressModel');
const mongoose = require('mongoose');
const Role = require("../models/roleModel");
const User = require("../models/userModel");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const axios = require('axios');
const GrocerySeller = require("../models/grocerySellerModel");


// CREATE
// const createGrocerySellerRequirement = async (req, res) => {
//   try {
//     const {
//       product_or_service,
//       quantity,
//       unit_of_measurement,
//       phone_number,
//       user_id,
//       supplier_preference,
//       selected_states
//     } = req.body;

//     // Validate required fields
//     if (!product_or_service || !quantity || !unit_of_measurement || !phone_number || !user_id || !supplier_preference) {
//       return res.status(400).json({ error: 'All required fields must be provided.' });
//     }

//     // Supplier preference specific validation
//     if (supplier_preference === 'Specific States') {
//       if (!Array.isArray(selected_states) || selected_states.length === 0) {
//         return res.status(400).json({ error: 'Selected states are required when supplier preference is "Specific States".' });
//       }
//     }

//     // Create new post
//     const newPost = new GrocerySellerRequirement({
//       product_or_service,
//       quantity,
//       unit_of_measurement,
//       phone_number,
//       user_id,
//       supplier_preference,
//       selected_states: supplier_preference === 'Specific States' ? selected_states : []
//     });

//     const savedPost = await newPost.save();

//     // Populate user_id with name, role, and address
//     const populatedPost = await GrocerySellerRequirement.findById(savedPost._id)
//       .populate({
//         path: 'user_id',
//         select: '-password', // Exclude password
//         populate: { path: 'role' } // Populate role
//       });

//     // Fetch address for the user
//     const address = await Address.findOne({ user_id: populatedPost.user_id._id });

//     // Combine post with address
//     const postWithAddress = {
//       ...populatedPost.toObject(),
//       user_id: {
//         ...populatedPost.user_id.toObject(),
//         address: address ? address.toObject() : null
//       }
//     };

//     // Broadcast new requirement to all sellers
//     global.io.of('/requirements').to('requirements').emit('receive-requirement', postWithAddress);

//     // Send SMS to all ADMINs
//     const adminRole = await Role.findOne({ role: "ADMIN" });
//     if (adminRole) {
//       const smsAdmins = await User.find({ role: adminRole._id }).select("phone name");
//       // Fetch user details for SMS
//       const user = await User.findById(user_id).select("name");
//       if (user) {
//         const smsText = `User ${user.name} has shown interest in the product ${product_or_service}. You may reach them at ${phone_number}. Team HUNTSWORLD`;

//         for (const admin of smsAdmins) {
//           if (admin.phone) {
//             try {
//               const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${
//                 admin.phone
//               }&text=${encodeURIComponent(smsText)}`;

//               const response = await axios.get(smsApiUrl);
//               
//             } catch (err) {
//               console.error(
//                 `❌ Failed to send SMS to ${admin.phone}`,
//                 err.message
//               );
//             }
//           }
//         }
//       }
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Requirement Added Successfully',
//       data: postWithAddress
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// GET ALL
// const getAllGrocerySellerRequirements = async (req, res) => {
//   try {
//     const posts = await GrocerySellerRequirement.find().populate('user_id');
//     res.status(200).json({
//       success: true,
//       message: "Fetched Requirement Successfully",
//       data: posts
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

const getGrocerySellerRequirementsByUserLocationAndSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const objectId = new mongoose.Types.ObjectId(user_id);

    // ✅ Get user role
    const user = await User.findById(objectId)
      .select('role')
      .populate({ path: 'role', select: 'role' });

    if (!user || !user.role || !user.role.role) {
      return res.status(404).json({ success: false, message: "User or user role not found" });
    }

    const userRole = user.role.role;
    let requirementType = null;
    if (userRole === 'MERCHANT') requirementType = 'product';
    else if (userRole === 'SERVICE_PROVIDER') requirementType = 'service';

    // ✅ Verify address and check entity type
    const userAddress = await Address.findOne({
      user_id: objectId,
      address_type: 'company',
      entity_type: { $in: ['merchant', 'service_provider'] }
    }).select('state city entity_type');

    if (!userAddress) {
      return res.status(404).json({ success: false, message: "User address not found or user is not a merchant/service provider" });
    }
    const userCity = userAddress.city;
    const userState = userAddress.state;

    // ✅ Get merchant's product categories and names
    const merchantRecord = await Merchant.findOne({ user_id: objectId }).select('_id');
    const serviceProviderRecord = await ServiceProvider.findOne({ user_id: objectId }).select('_id');
    const sellerId = merchantRecord?._id || serviceProviderRecord?._id;

    if (!sellerId) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    const Product = require('../models/productModel');
    const sellerProducts = await Product.find({ seller_id: sellerId }).select('name category_id sub_category_id');
    const categoryIds = [...new Set(sellerProducts.map(p => p.category_id?.toString()).filter(Boolean))];
    const subCategoryIds = [...new Set(sellerProducts.map(p => p.sub_category_id?.toString()).filter(Boolean))];

    // Exact product name matches (case-insensitive regex for flexibility)
    const productRegexes = sellerProducts.map(p => new RegExp(`^${p.name}$`, 'i'));

    if (categoryIds.length === 0 && subCategoryIds.length === 0 && sellerProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No products found. Please add products to see relevant leads.',
        data: [],
        pagination: { total: 0, page: parseInt(page), pages: 0, limit: parseInt(limit), hasNext: false, hasPrev: false }
      });
    }

    // (Deleted redundant finding of matching addresses since we rely on product categories)

    // Removed finding nearby matching merchants since we filter by exact products/categories

    // ✅ Supplier preference filters
    const nearMePosterUserIds = await Address.find({ city: userCity })
      .select('user_id')
      .then((addresses) => addresses.map((addr) => addr.user_id));

    const specificStatesPosts = await GrocerySellerRequirement.find({
      supplier_preference: 'Specific States',
    }).select('selected_states');

    const allSelectedStates = [
      ...new Set(specificStatesPosts.flatMap((post) => post.selected_states || [])),
    ];

    let specificStatesPosterUserIds = [];
    if (allSelectedStates.length > 0) {
      specificStatesPosterUserIds = await Address.find({
        state: { $in: allSelectedStates },
      })
        .select('user_id')
        .then((addresses) => addresses.map((addr) => addr.user_id));
    }

    // ✅ Build query with product matching
    const matchQuery = {
      user_id: { $ne: objectId },
      $and: [
        {
          $or: [
            { supplier_preference: 'All India', selected_states: [] },
            { supplier_preference: 'Specific States', selected_states: userState },
          ],
        },
        {
          $or: [
            { category_id: { $in: categoryIds } },
            { sub_category_id: { $in: subCategoryIds } },
            { product_name: { $in: productRegexes } }
          ]
        }
      ]
    };

    if (requirementType) matchQuery.type = requirementType;

    // ✅ Fetch paginated results
    const totalDocs = await GrocerySellerRequirement.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    const posts = await GrocerySellerRequirement.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user_id');

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No requirements found for matching users",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fetched requirements successfully",
      data: posts,
      pagination: {
        page: parseInt(page),
        pages: totalPages,
        total: totalDocs,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching requirements",
      error: error.message,
    });
  }
};


const getGrocerySellerRequirementsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate and convert user_id to ObjectId
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(user_id);
    const posts = await GrocerySellerRequirement.find({ user_id: objectId }).populate('user_id');

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No requirements found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fetched user requirements successfully",
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user requirements",
      error: error.message
    });
  }
};
const getAllGrocerySellerRequirementsForChat = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await GrocerySellerRequirement.find()
      .populate({
        path: 'user_id',
        select: '-password', // exclude password
        populate: { path: 'role' } // populate role
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get address data for each user and attach to user object
    const postsWithAddress = await Promise.all(
      posts.map(async (post) => {
        const user = post.user_id;
        const address = await Address.findOne({ user_id: user._id });
        return {
          ...post.toObject(),
          user_id: {
            ...user.toObject(),
            address: address ? address.toObject() : null
          }
        };
      })
    );

    const total = await GrocerySellerRequirement.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Fetched Requirements Successfully',
      data: postsWithAddress,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ONE
const getGrocerySellerRequirementById = async (req, res) => {
  try {
    const post = await GrocerySellerRequirement.findById(req.params.id).populate('user_id');
    if (!post) {
      return res.status(404).json({ message: 'Requirement not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateGrocerySellerRequirement = async (req, res) => {
  try {
    const updatedPost = await GrocerySellerRequirement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: 'Requirement not found' });
    }
    res.status(200).json({
      success: true,
      message: "Requirement Updated Successfully",
      data: updatedPost
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE
const deleteGrocerySellerRequirement = async (req, res) => {
  try {
    const deletedPost = await GrocerySellerRequirement.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: 'Requirement not found' });
    }
    res.status(200).json({ success: true, message: 'Requirement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//new implement

const createGrocerySellerRequirement = async (req, res) => {
  try {
    const {
      requirement_type,     // 'buy' or 'sell'
      product_name,
      quantity,
      unit_of_measurement,
      phone_number,
      description,
      type,
      user_id,
      supplier_preference,
      selected_states
    } = req.body;

    // Validation
    if (!requirement_type || !['buy', 'sell'].includes(requirement_type)) {
      return res.status(400).json({ error: 'requirement_type must be "buy" or "sell"' });
    }

    if (!product_name || !quantity || !unit_of_measurement || !phone_number || !description || !type || !user_id || !supplier_preference) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    if (!['product', 'service'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "product" or "service".' });
    }

    if (supplier_preference === 'Specific States' && (!selected_states || selected_states.length === 0)) {
      return res.status(400).json({ error: 'Selected states are required for Specific States.' });
    }

    // Calculate is_unmatched
    let is_unmatched = false;
    try {
      const Product = require('../models/productModel');
      const orConditions = [];
      if (req.body.category_id) orConditions.push({ category_id: req.body.category_id });
      if (req.body.sub_category_id) orConditions.push({ sub_category_id: req.body.sub_category_id });
      if (product_name) {
        orConditions.push({ product_name: new RegExp(`^${product_name}$`, 'i') });
      }

      if (orConditions.length > 0) {
        const matchCount = await Product.countDocuments({ $or: orConditions });
        if (matchCount === 0) {
          is_unmatched = true;
        }
      } else {
        is_unmatched = true;
      }
    } catch (err) {
      console.error('Error evaluating is_unmatched for GrocerySellerRequirement:', err);
    }

    const newPost = new GrocerySellerRequirement({
      requirement_type,
      product_name,
      quantity,
      unit_of_measurement,
      phone_number,
      description,
      type,
      user_id,
      supplier_preference,
      selected_states: supplier_preference === 'Specific States' ? selected_states : [],
      category_id: req.body.category_id || null,
      sub_category_id: req.body.sub_category_id || null,
      is_unmatched,
    });

    const savedPost = await newPost.save();

    // Populate user
    const populatedPost = await GrocerySellerRequirement.findById(savedPost._id)
      .populate({
        path: 'user_id',
        select: '-password',
        populate: { path: 'role' }
      });

    const address = await Address.findOne({ user_id: populatedPost.user_id._id });
    const postWithAddress = {
      ...populatedPost.toObject(),
      user_id: {
        ...populatedPost.user_id.toObject(),
        address: address ? address.toObject() : null
      }
    };

    // Emit to socket
    global.io.of('/requirements').to('requirements').emit('receive-requirement', postWithAddress);

    // SMS to Admins
    const adminRole = await Role.findOne({ role: "ADMIN" });
    if (adminRole) {
      const smsAdmins = await User.find({ role: adminRole._id }).select("phone name");
      const user = await User.findById(user_id).select("name");
      if (user) {
        const action = requirement_type === 'buy' ? 'needs' : 'is selling';
        const smsText = `User ${user.name} has shown interest in the product ${product_name}. You may reach them at ${phone_number}. Team HUNTSWORLD`;

        for (const admin of smsAdmins) {
          if (admin.phone) {
            try {
              const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?...&text=${encodeURIComponent(smsText)}`;
              await axios.get(smsApiUrl);
            } catch (err) {
              console.error(`SMS failed to ${admin.phone}`);
            }
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: requirement_type === 'buy' ? 'Buy Requirement Posted!' : 'Sell Requirement Posted!',
      data: postWithAddress
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const getAllGrocerySellerRequirements = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const currentDate = new Date();
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    // ==========================================================
    // 1️⃣ GET VALID UNIQUE USER IDs (Verified Grocery Sellers Only)
    // ==========================================================
    const userIdsAggregation = await GrocerySellerRequirement.aggregate([
      { $match: { expiresAt: { $gte: currentDate } } },

      {
        $lookup: {
          from: "grocerysellers",
          let: { userId: "$user_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$verified_status", true] }
                  ]
                }
              }
            }
          ],
          as: "sellerData"
        }
      },

      { $match: { sellerData: { $ne: [] } } },

      { $group: { _id: "$user_id" } },

      { $sort: { _id: 1 } },
      { $skip: (parsedPage - 1) * parsedLimit },
      { $limit: parsedLimit }
    ]);

    const userIds = userIdsAggregation.map(item => item._id);

    if (!userIds.length) {
      return res.status(200).json({
        success: true,
        message: "No active requirements found",
        data: [],
        pagination: {
          currentPage: parsedPage,
          totalPages: 0,
          totalSellers: 0,
          hasMore: false
        }
      });
    }

    // ==========================================================
    // 2️⃣ FETCH REQUIREMENTS WITH POPULATED USER
    // ==========================================================
    const requirements = await GrocerySellerRequirement.find({
      user_id: { $in: userIds },
      expiresAt: { $gte: currentDate }
    })
      .populate({
        path: "user_id",
        select: "-password",
        populate: { path: "role" }
      })
      .lean();

    // ==========================================================
    // 3️⃣ FETCH VERIFIED GROCERY SELLERS
    // ==========================================================
    const grocerySellers = await GrocerySeller.find({
      user_id: { $in: userIds },
      verified_status: true
    })
      .select("user_id shop_name company_logo")
      .lean();

    // 🔥 Create Map using correct key
    const groceryMap = {};
    grocerySellers.forEach(seller => {
      groceryMap[seller.user_id.toString()] = seller;
    });

    // ==========================================================
    // 4️⃣ GET TOTAL SELLER COUNT
    // ==========================================================
    const totalSellersAggregation = await GrocerySellerRequirement.aggregate([
      { $match: { expiresAt: { $gte: currentDate } } },

      {
        $lookup: {
          from: "grocerysellers",
          let: { userId: "$user_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$verified_status", true] }
                  ]
                }
              }
            }
          ],
          as: "sellerData"
        }
      },

      { $match: { sellerData: { $ne: [] } } },

      { $group: { _id: "$user_id" } },
      { $count: "total" }
    ]);

    const totalSellers = totalSellersAggregation[0]?.total || 0;

    // ==========================================================
    // 5️⃣ GROUP REQUIREMENTS BY SELLER (FIXED)
    // ==========================================================
    const groupedBySeller = {};

    for (const requirement of requirements) {
      if (!requirement.user_id || !requirement.user_id._id) continue;

      const userId = requirement.user_id._id.toString(); // ✅ Correct ID

      const grocerySeller = groceryMap[userId];
      if (!grocerySeller) continue;

      if (!groupedBySeller[userId]) {
        groupedBySeller[userId] = {
          user: {
            ...requirement.user_id,
            shop_name: grocerySeller.shop_name || "Unknown Store",
            company_logo: grocerySeller.company_logo || null
          },
          requirements: []
        };
      }

      groupedBySeller[userId].requirements.push(requirement);
    }

    const result = Object.values(groupedBySeller);

    // ==========================================================
    // 6️⃣ FINAL RESPONSE
    // ==========================================================
    res.status(200).json({
      success: true,
      message: "Fetched Requirements Successfully",
      data: result,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalSellers / parsedLimit),
        totalSellers,
        hasMore: parsedPage * parsedLimit < totalSellers
      }
    });

  } catch (error) {
    console.error("Error fetching requirements:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


const getSellerRequirementsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user_id",
      });
    }

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const currentDate = new Date();

    // Count active requirements
    const totalRequirements = await GrocerySellerRequirement.countDocuments({
      user_id,
      expiresAt: { $gte: currentDate },
    });

    // Fetch paginated active requirements
    const requirements = await GrocerySellerRequirement.find({
      user_id,
      expiresAt: { $gte: currentDate },
    })
      .populate({
        path: "user_id",
        select: "-password",
        populate: { path: "role" },
      })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    if (!requirements.length) {
      return res.status(404).json({
        success: false,
        error: "No active requirements found for this seller",
      });
    }

    // 🔥 Fetch grocery seller with member_type populated
    const grocerySeller = await GrocerySeller.findOne({ user_id })
      .select("shop_name company_logo member_type")
      .populate({
        path: "member_type",
        model: "BaseMemberType", // Make sure this matches your model name
        select: "name",
      });

    const user = requirements[0].user_id;

    const response = {
      user: {
        ...user.toObject(),
        shop_name: grocerySeller?.shop_name || "Unknown Store",
        company_logo: grocerySeller?.company_logo || null,
        member_type: grocerySeller?.member_type?.name || null, // ✅ return name instead of ObjectId
      },
      requirements,
    };

    res.status(200).json({
      success: true,
      message: "Fetched Seller Requirements Successfully",
      data: response,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalRequirements / parsedLimit),
        totalRequirements,
        hasMore: parsedPage * parsedLimit < totalRequirements,
      },
    });
  } catch (error) {
    console.error("Error fetching seller requirements:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


module.exports = {
  createGrocerySellerRequirement,
  getAllGrocerySellerRequirements,
  getGrocerySellerRequirementById,
  getSellerRequirementsByUserId,
  updateGrocerySellerRequirement,
  deleteGrocerySellerRequirement,
  getAllGrocerySellerRequirementsForChat,
  getGrocerySellerRequirementsByUserId,
  getGrocerySellerRequirementsByUserLocationAndSubscription
};
