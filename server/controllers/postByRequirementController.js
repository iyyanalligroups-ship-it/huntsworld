const PostByRequirement = require("../models/postByRequirementModel");
const Address = require("../models/addressModel");
const mongoose = require("mongoose");
const Role = require("../models/roleModel");
const User = require("../models/userModel");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const axios = require("axios");
const Product = require("../models/productModel");

// CREATE
const createPostByRequirement = async (req, res) => {
  try {
    const {
      description,
      product_or_service,
      quantity,
      unit_of_measurement,
      phone_number,
      type,
      user_id,
      supplier_preference,
      selected_states,
      category_id,
      sub_category_id,
      super_sub_category_id,
      deep_sub_category_id,
    } = req.body;

    // Validate required fields
    if (
      !description ||
      !quantity ||
      !unit_of_measurement ||
      !product_or_service ||
      !phone_number ||
      !type ||
      !user_id ||
      !supplier_preference
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided." });
    }

    // Supplier preference specific validation
    if (supplier_preference === "Specific States") {
      if (!Array.isArray(selected_states) || selected_states.length === 0) {
        return res
          .status(400)
          .json({
            error:
              'Selected states are required when supplier preference is "Specific States".',
          });
      }
    }

    // Calculate is_unmatched
    let is_unmatched = false;
    try {
      const orConditions = [];
      if (category_id) orConditions.push({ category_id });
      if (sub_category_id) orConditions.push({ sub_category_id });
      if (product_or_service) {
        // As per existing logic in this controller for searching products
        orConditions.push({ product_name: new RegExp(`^${product_or_service}$`, 'i') });
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
      console.error('Error evaluating is_unmatched for PostByRequirement:', err);
    }

    // Create new post
    const newPost = new PostByRequirement({
      description,
      quantity,
      product_or_service,
      unit_of_measurement,
      phone_number,
      type,
      user_id,
      supplier_preference,
      selected_states:
        supplier_preference === "Specific States" ? selected_states : [],
      category_id: category_id || null,
      sub_category_id: sub_category_id || null,
      super_sub_category_id: super_sub_category_id || null,
      deep_sub_category_id: deep_sub_category_id || null,
      is_unmatched,
    });

    const savedPost = await newPost.save();

    // Populate user_id with name, role, and address
    const populatedPost = await PostByRequirement.findById(
      savedPost._id
    ).populate({
      path: "user_id",
      select: "-password",
      populate: { path: "role" },
    });

    // Fetch address for the user
    const address = await Address.findOne({
      user_id: populatedPost.user_id._id,
    });

    // Combine post with address
    const postWithAddress = {
      ...populatedPost.toObject(),
      user_id: {
        ...populatedPost.user_id.toObject(),
        address: address ? address.toObject() : null,
      },
    };

    // Broadcast new requirement to all sellers
    global.io
      .of("/requirements")
      .to("requirements")
      .emit("receive-requirement", postWithAddress);

    // Send SMS to all ADMINs
    const adminRole = await Role.findOne({ role: "ADMIN" });
    if (adminRole) {
      const smsAdmins = await User.find({ role: adminRole._id }).select(
        "phone name"
      );
      const user = await User.findById(user_id).select("name");
      if (user) {
        const smsText = `User ${user.name} has shown interest in the product ${description}. You may reach them at ${phone_number}. Team HUNTSWORLD`;

        for (const admin of smsAdmins) {
          if (admin.phone) {
            try {
              const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${admin.phone
                }&text=${encodeURIComponent(smsText)}`;

              const response = await axios.get(smsApiUrl);
            } catch (err) {
              console.error(
                `❌ Failed to send SMS to ${admin.phone}`,
                err.message
              );
            }
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Requirement Added Successfully",
      data: postWithAddress,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// GET ALL
const getAllPostByRequirements = async (req, res) => {
  try {
    const posts = await PostByRequirement.find().populate("user_id");
    res.status(200).json({
      success: true,
      message: "Fetched Requirement Successfully",
      data: posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// const getPostsByUserLocationAndSubscription = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     const { page = 1, limit = 10 } = req.query; // Extract from query params
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Validate user_id
//     if (!mongoose.Types.ObjectId.isValid(user_id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid user ID",
//       });
//     }

//     const objectId = new mongoose.Types.ObjectId(user_id);

//     // Step 1: Get the city of the user who requested the requirement
//     const userAddress = await Address.findOne({
//       user_id: objectId,
//     }).select('city');

//     if (!userAddress) {
//       return res.status(404).json({
//         success: false,
//         message: "User address not found",
//       });
//     }

//     const userCity = userAddress.city;

//     // Step 2: Find merchants and service providers in the same city with address_type 'company'
//     const matchingAddresses = await Address.find({
//       city: userCity,
//       address_type: 'company',
//       entity_type: { $in: ['merchant', 'service_provider'] }
//     }).select('user_id _id');

//     // Step 3: Get merchants and service providers with matching address IDs
//     const merchants = await Merchant.find({
//       address_id: { $in: matchingAddresses.map(addr => addr._id) }
//     }).select('user_id');

//     const serviceProviders = await ServiceProvider.find({
//       address_id: { $in: matchingAddresses.map(addr => addr._id) }
//     }).select('user_id');

//     const localUserIds = [
//       ...new Set([
//         ...merchants.map(m => m.user_id.toString()),
//         ...serviceProviders.map(sp => sp.user_id.toString())
//       ])
//     ].map(id => new mongoose.Types.ObjectId(id));

//     // Step 4: Find users with ROYAL plan subscription
//     const royalPlan = await SubscriptionPlan.findOne({ plan_code: 'ROYAL' }).select('_id');
//     let royalUserIds = [];

//     if (royalPlan) {
//       const royalSubscriptions = await UserSubscription.find({
//         subscription_plan_id: royalPlan._id,
//         status: 'paid'
//       }).select('user_id');

//       royalUserIds = royalSubscriptions.map(sub => sub.user_id);
//     }

//     // Step 5: Combine user IDs (local merchants/service providers + ROYAL plan users)
//     const targetUserIds = [
//       ...new Set([
//         ...localUserIds.map(_id => _id.toString()),
//         ...royalUserIds.map(_id => _id.toString())
//       ])
//     ].map(_id => new mongoose.Types.ObjectId(_id));

//     // Step 6: Compute user IDs for each supplier_preference type
//     const nearMePosterUserIds = await Address.find({
//       city: userCity
//     }).select('user_id').then(addresses => addresses.map(addr => addr.user_id));

//     const specificStatesPosts = await PostByRequirement.find({
//       supplier_preference: 'Specific States'
//     }).select('selected_states');

//     const allSelectedStates = [...new Set(specificStatesPosts.flatMap(post => post.selected_states || []))];

//     let specificStatesPosterUserIds = [];
//     if (allSelectedStates.length > 0) {
//       specificStatesPosterUserIds = await Address.find({
//         state: { $in: allSelectedStates }
//       }).select('user_id').then(addresses => addresses.map(addr => addr.user_id));
//     }

//     // Step 7: Fetch requirements with pagination
//     const matchQuery = {
//       $or: [
//         { supplier_preference: 'All India' },
//         {
//           supplier_preference: 'Near Me',
//           user_id: { $in: nearMePosterUserIds }
//         },
//         {
//           supplier_preference: 'Specific States',
//           user_id: { $in: specificStatesPosterUserIds }
//         }
//       ]
//     };

//     // Get total count for pagination
//     const totalDocs = await PostByRequirement.countDocuments(matchQuery);
//     const totalPages = Math.ceil(totalDocs / parseInt(limit));

//     const posts = await PostByRequirement.find(matchQuery)
//       .sort({ createdAt: -1 }) // Sort by newest first (matches frontend sorting)
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate('user_id');

//     if (!posts || posts.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No requirements found for matching users",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Fetched requirements successfully",
//       data: posts, // Array of posts
//       pagination: {
//         page: parseInt(page),
//         pages: totalPages,
//         total: totalDocs,
//         limit: parseInt(limit),
//         hasNext: parseInt(page) < totalPages,
//         hasPrev: parseInt(page) > 1
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching requirements",
//       error: error.message
//     });
//   }
// };

// const getPostsByUserLocationAndSubscription = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     

//     const { page = 1, limit = 10 } = req.query; // Extract from query params
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Validate user_id
//     if (!mongoose.Types.ObjectId.isValid(user_id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid user ID",
//       });
//     }

//     const objectId = new mongoose.Types.ObjectId(user_id);

//     // Step 1: Get the user's role
//     const user = await User.findById(objectId).select("role");
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const role = await Role.findById(user.role).select("role");
//     if (!role) {
//       return res.status(404).json({
//         success: false,
//         message: "User role not found",
//       });
//     }

//     const userRole = role.role; // e.g., 'MERCHANT' or 'SERVICE_PROVIDER'

//     // Step 2: Get the city of the user who requested the requirement
//     const userAddress = await Address.findOne({
//       user_id: objectId,
//     }).select("city");

//     if (!userAddress) {
//       return res.status(404).json({
//         success: false,
//         message: "User address not found",
//       });
//     }

//     const userCity = userAddress.city;

//     // Step 3: Find merchants and service providers in the same city with address_type 'company'
//     const matchingAddresses = await Address.find({
//       city: userCity,
//       address_type: "company",
//       entity_type: { $in: ["merchant", "service_provider"] },
//     }).select("user_id _id");

//     // Step 4: Get merchants and service providers with matching address IDs
//     const merchants = await Merchant.find({
//       address_id: { $in: matchingAddresses.map((addr) => addr._id) },
//     }).select("user_id");

//     const serviceProviders = await ServiceProvider.find({
//       address_id: { $in: matchingAddresses.map((addr) => addr._id) },
//     }).select("user_id");

//     const localUserIds = [
//       ...new Set([
//         ...merchants.map((m) => m.user_id.toString()),
//         ...serviceProviders.map((sp) => sp.user_id.toString()),
//       ]),
//     ].map((id) => new mongoose.Types.ObjectId(id));

//     // Step 5: Find users with ROYAL plan subscription
//     const royalPlan = await SubscriptionPlan.findOne({
//       plan_code: "ROYAL",
//     }).select("_id");
//     let royalUserIds = [];

//     if (royalPlan) {
//       const royalSubscriptions = await UserSubscription.find({
//         subscription_plan_id: royalPlan._id,
//         status: "paid",
//       }).select("user_id");

//       royalUserIds = royalSubscriptions.map((sub) => sub.user_id);
//     }

//     // Step 6: Combine user IDs (local merchants/service providers + ROYAL plan users)
//     const targetUserIds = [
//       ...new Set([
//         ...localUserIds.map((_id) => _id.toString()),
//         ...royalUserIds.map((_id) => _id.toString()),
//       ]),
//     ].map((_id) => new mongoose.Types.ObjectId(_id));

//     // Step 7: Compute user IDs for each supplier_preference type
//     const nearMePosterUserIds = await Address.find({
//       city: userCity,
//     })
//       .select("user_id")
//       .then((addresses) => addresses.map((addr) => addr.user_id));

//     const specificStatesPosts = await PostByRequirement.find({
//       supplier_preference: "Specific States",
//     }).select("selected_states");

//     const allSelectedStates = [
//       ...new Set(
//         specificStatesPosts.flatMap((post) => post.selected_states || [])
//       ),
//     ];

//     let specificStatesPosterUserIds = [];
//     if (allSelectedStates.length > 0) {
//       specificStatesPosterUserIds = await Address.find({
//         state: { $in: allSelectedStates },
//       })
//         .select("user_id")
//         .then((addresses) => addresses.map((addr) => addr.user_id));
//     }

//     // Step 8: Fetch requirements with pagination and role-based type filter
//     const matchQuery = {
//       $and: [
//         {
//           $or: [
//             { supplier_preference: "All India" },
//             {
//               supplier_preference: "Near Me",
//               user_id: { $in: nearMePosterUserIds },
//             },
//             {
//               supplier_preference: "Specific States",
//               user_id: { $in: specificStatesPosterUserIds },
//             },
//           ],
//         },
//         // Filter by type based on user role
//         {
//           type:
//             userRole === "MERCHANT"
//               ? "merchant"
//               : userRole === "SERVICE_PROVIDER"
//               ? "serviceProvider"
//               : null,
//         },
//       ],
//     };

//     // Remove null type condition if userRole is neither MERCHANT nor SERVICE_PROVIDER
//     if (!["MERCHANT", "SERVICE_PROVIDER"].includes(userRole)) {
//       matchQuery.$and.pop(); // Remove the type filter if role is invalid
//     }

//     // Get total count for pagination
//     const totalDocs = await PostByRequirement.countDocuments(matchQuery);
//     const totalPages = Math.ceil(totalDocs / parseInt(limit));

//     const posts = await PostByRequirement.find(matchQuery)
//       .sort({ createdAt: -1 }) // Sort by newest first
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate("user_id");

//     if (!posts || posts.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No requirements found for matching users",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Fetched requirements successfully",
//       data: posts, // Array of posts
//       pagination: {
//         page: parseInt(page),
//         pages: totalPages,
//         total: totalDocs,
//         limit: parseInt(limit),
//         hasNext: parseInt(page) < totalPages,
//         hasPrev: parseInt(page) > 1,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching requirements",
//       error: error.message,
//     });
//   }
// };

// DELETE - Delete a post by requirement (with ownership check)
const getPostsByUserLocationAndSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ success: false, message: "Page must be a positive integer" });
    }
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ success: false, message: "Limit must be a positive integer" });
    }

    const skip = (pageNum - 1) * limitNum;

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

    // ✅ Role-based requirement type
    let requirementType = null;
    if (userRole === 'MERCHANT') requirementType = 'product';
    else if (userRole === 'SERVICE_PROVIDER') requirementType = 'service';

    // ✅ Verify address
    const userAddress = await Address.findOne({
      user_id: objectId,
      address_type: 'company',
      entity_type: { $in: ['merchant', 'service_provider'] }
    }).select('state entity_type');

    if (!userAddress) {
      return res.status(404).json({
        success: false,
        message: "User address not found or user is not a merchant/service provider",
      });
    }

    const expectedEntityType =
      userRole === 'MERCHANT'
        ? 'merchant'
        : userRole === 'SERVICE_PROVIDER'
          ? 'service_provider'
          : null;

    if (expectedEntityType && userAddress.entity_type !== expectedEntityType) {
      return res.status(400).json({
        success: false,
        message: `User role (${userRole}) does not match address entity type (${userAddress.entity_type})`,
      });
    }

    const userState = userAddress.state;

    // ✅ Get merchant's product categories
    // First, find the merchant/service provider record
    const merchantRecord = await Merchant.findOne({ user_id: objectId }).select('_id');
    const serviceProviderRecord = await ServiceProvider.findOne({ user_id: objectId }).select('_id');
    const sellerId = merchantRecord?._id || serviceProviderRecord?._id;

    if (!sellerId) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    // Find all products owned by this seller to get their categories
    const sellerProducts = await Product.find({ seller_id: sellerId }).select('category_id sub_category_id');
    const categoryIds = [...new Set(sellerProducts.map(p => p.category_id?.toString()).filter(Boolean))];
    const subCategoryIds = [...new Set(sellerProducts.map(p => p.sub_category_id?.toString()).filter(Boolean))];

    const productRegexes = sellerProducts.map(p => new RegExp(`^${p.name}$`, 'i'));

    if (categoryIds.length === 0 && subCategoryIds.length === 0 && sellerProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No products found. Please add products to see relevant leads.',
        data: [],
        pagination: { total: 0, page: pageNum, pages: 0, limit: limitNum, hasNext: false, hasPrev: false }
      });
    }

    // ✅ Build query with category filters
    const query = {
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
            { product_or_service: { $in: productRegexes } }
          ]
        }
      ]
    };

    if (requirementType) query.type = requirementType;

    // ✅ Fetch posts
    const posts = await PostByRequirement.find(query)
      .populate({
        path: 'user_id',
        select: '-password',
        populate: { path: 'role' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    if (!posts || posts.length === 0) {
      return res.status(404).json({ success: false, message: "No requirements found" });
    }

    // ✅ Filter out posts with invalid user_id
    const validPosts = posts.filter(p => p.user_id && p.user_id._id);

    if (validPosts.length === 0) {
      return res.status(404).json({ success: false, message: "No valid user data found for posts" });
    }

    // ✅ Fetch addresses safely
    const userIds = validPosts.map(p => p.user_id._id);
    const addresses = await Address.find({ user_id: { $in: userIds } }).lean();

    // ✅ Map addresses to posts safely
    const postsWithAddress = validPosts.map(post => {
      const address = addresses.find(
        (a) => a.user_id.toString() === post.user_id._id.toString()
      );
      return {
        ...post.toObject(),
        user_id: {
          ...post.user_id.toObject(),
          address: address || null,
        },
      };
    });

    const total = await PostByRequirement.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Fetched Requirements Successfully',
      data: postsWithAddress,
      pagination: {
        total,
        page: pageNum,
        pages: totalPages,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching requirements",
      error: error.message,
    });
  }
};
const getPostsByUserId = async (req, res) => {
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
    const posts = await PostByRequirement.find({ user_id: objectId }).populate(
      "user_id"
    );

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No requirements found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fetched user requirements successfully",
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user requirements",
      error: error.message,
    });
  }
};

const getAllPostByRequirementsForChat = async (req, res) => {
  try {
    const { user_id } = req.params; // Assuming user_id is passed in params
    const { page = 1, limit = 10 } = req.query;

    // Validate query parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
    }
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive integer",
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // Validate user_id
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const objectId = new mongoose.Types.ObjectId(user_id);

    // Get the user's role
    const user = await User.findById(objectId)
      .select('role')
      .populate({
        path: 'role',
        select: 'role'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.role || !user.role.role) {
      return res.status(404).json({
        success: false,
        message: "User role not found",
      });
    }

    const userRole = user.role.role; // e.g., 'MERCHANT', 'SERVICE_PROVIDER', 'ADMIN'

    // Build query based on user role
    const query = {
      user_id: { $ne: objectId }, // Exclude the logged-in user's own posts
    };
    if (userRole === 'MERCHANT') {
      query.type = 'merchant';
    } else if (userRole === 'SERVICE_PROVIDER') {
      query.type = 'serviceProvider';
    }
    // If userRole is neither MERCHANT nor SERVICE_PROVIDER (e.g., ADMIN), fetch all posts

    // Fetch posts with pagination
    const posts = await PostByRequirement.find(query)
      .populate({
        path: 'user_id',
        select: '-password', // Exclude password
        populate: { path: 'role' } // Populate role
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limitNum);

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No requirements found",
      });
    }

    // Fetch addresses for all users in one query
    const userIds = posts.map(post => post.user_id._id);
    const addresses = await Address.find({ user_id: { $in: userIds } }).lean();

    // Map addresses to posts
    const postsWithAddress = posts.map(post => {
      const address = addresses.find(addr => addr.user_id.toString() === post.user_id._id.toString());
      return {
        ...post.toObject(),
        user_id: {
          ...post.user_id.toObject(),
          address: address || null
        }
      };
    });

    // Get total count for pagination
    const total = await PostByRequirement.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Fetched Requirements Successfully',
      data: postsWithAddress,
      pagination: {
        total,
        page: pageNum,
        pages: totalPages,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching requirements",
      error: error.message
    });
  }
};
// GET ONE
const getPostByRequirementById = async (req, res) => {
  try {
    const post = await PostByRequirement.findById(req.params.id).populate(
      "user_id"
    );
    if (!post) {
      return res.status(404).json({ message: "Requirement not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updatePostByRequirement = async (req, res) => {
  try {
    const updatedPost = await PostByRequirement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: "Requirement not found" });
    }
    res.status(200).json({
      success: true,
      message: "Requirement Updated Successfully",
      data: updatedPost,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deletePostByRequirement = async (req, res) => {
  try {
    const { id } = req.params; // requirement post ID
    const loggedInUserId = req.user?.userId || req.body.user_id; // assuming you have auth middleware setting req.user

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requirement ID",
      });
    }

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    // Find the requirement post
    const requirement = await PostByRequirement.findById(id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found",
      });
    }

    // Check ownership or admin status
    const userRole = req.user?.role;
    const isOwner = requirement.user_id.toString() === loggedInUserId.toString();
    const isAdmin = ["ADMIN", "SUB_ADMIN"].includes(userRole);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this requirement",
      });
    }

    // Perform deletion
    await PostByRequirement.findByIdAndDelete(id);

    // Optional: Emit socket event to notify others (if real-time updates needed)
    // global.io.of("/requirements").emit("requirement-deleted", id);

    res.status(200).json({
      success: true,
      message: "Requirement deleted successfully",
      data: { deletedId: id },
    });
  } catch (error) {
    console.error("Error deleting requirement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete requirement",
      error: error.message,
    });
  }
};



module.exports = {
  createPostByRequirement,
  getAllPostByRequirements,
  getPostByRequirementById,
  updatePostByRequirement,
  deletePostByRequirement,
  getAllPostByRequirementsForChat,
  getPostsByUserId,
  getPostsByUserLocationAndSubscription,
};
