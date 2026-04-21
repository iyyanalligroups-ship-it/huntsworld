const GrocerySeller = require("../models/grocerySellerModel");
const { checkDuplicates } = require("../utils/duplicateCheck");
const { getSyncVerificationFlags } = require("../utils/verificationSync");
const Role = require("../models/roleModel");
const User = require("../models/userModel");
const Merchant = require("../models/MerchantModel");
const mongoose = require("mongoose");
const BaseMemberType = require("../models/baseMemberTypeModel");
const Address = require("../models/addressModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const UserActiveFeature = require("../models/UserActiveFeature");
exports.getAllGrocerySellers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = (req.query.search || '').trim();

    const skip = (page - 1) * limit;

    const query = search
      ? {
        $or: [
          { shop_name: { $regex: search, $options: 'i' } },
          { shop_email: { $regex: search, $options: 'i' } },
          { shop_phone_number: { $regex: search, $options: 'i' } },
          { 'user_id.name': { $regex: search, $options: 'i' } },
        ],
      }
      : {};

    const totalRecords = await GrocerySeller.countDocuments(query);

    let sellers = await GrocerySeller.find(query)
      .populate({
        path: 'user_id',
        select: 'name isActive phone user_code' // ✅ Added phone & user_code
      })
      .populate({
        path: 'member_type',
        select: 'name' // ✅ Get member type name instead of only ObjectId
      })
      .populate('address_id')
      .sort({ markAsRead: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 🔥 Filter out records where user_id is null (user deleted)
    sellers = sellers.filter(seller => seller.user_id);

    // 🔥 Bulk Fallback for missing addresses
    const sellersToFix = sellers.filter(s => !s.address_id && s.user_id);
    if (sellersToFix.length > 0) {
      const userIdsToAddrs = sellersToFix.map(s => s.user_id._id || s.user_id);
      const fallbackAddresses = await Address.find({
        user_id: { $in: userIdsToAddrs },
        address_type: "company",
        entity_type: "grocery_seller"
      }).lean();

      // Create lookup map
      const addressMap = fallbackAddresses.reduce((acc, addr) => {
        acc[addr.user_id.toString()] = addr;
        return acc;
      }, {});

      // Assign fallback addresses to sellers in memory
      sellers.forEach(s => {
        if (!s.address_id && s.user_id) {
          const userIdStr = (s.user_id._id || s.user_id).toString();
          if (addressMap[userIdStr]) {
            s.address_id = addressMap[userIdStr];
          }
        }
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      message: 'Grocery Sellers fetched successfully',
      data: sellers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        perPage: limit,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.getGrocerySellerByUserId = async (req, res) => {
  try {
    const seller = await GrocerySeller.findOne({ user_id: req.params.id })
      .populate("user_id")
      .populate("address_id")
      .populate("member_type"); // NEW: Populate member_type

    if (!seller) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Grocery Seller not found",
      });
    }

    // Fallback: If address_id is missing, try to find a company address by user_id
    let sellerObj = seller.toObject();
    if (!sellerObj.address_id) {
      const foundAddress = await Address.findOne({
        user_id: req.params.id,
        address_type: "company",
        entity_type: "grocery_seller",
      }).lean();

      if (foundAddress) {
        sellerObj.address_id = foundAddress;
      }
    }

    res.json({
      statusCode: 200,
      success: true,
      message: "Grocery Seller fetched successfully",
      data: sellerObj,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to fetch seller",
    });
  }
};


/**
 * Get a single grocery seller by ID
 */
exports.getGrocerySellerById = async (req, res) => {
  try {
    const seller = await GrocerySeller.findById(req.params.id)
      .populate("user_id")
      .populate("address_id");

    if (!seller) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Grocery Seller not found",
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      message: "Grocery Seller fetched successfully",
      data: seller,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to fetch seller",
    });
  }
};





exports.getGrocerySellerById = async (req, res) => {
  try {
    const seller = await GrocerySeller.findById(req.params.id)
      .populate("user_id")
      .populate("address_id")
      .populate("member_type"); // NEW: Populate member_type

    if (!seller) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Grocery Seller not found",
      });
    }

    // Fallback: If address_id is missing, try to find a company address by user_id
    let sellerObj = seller.toObject();
    if (!sellerObj.address_id && sellerObj.user_id) {
      const foundAddress = await Address.findOne({
        user_id: sellerObj.user_id._id || sellerObj.user_id,
        address_type: "company",
        entity_type: "grocery_seller",
      }).lean();

      if (foundAddress) {
        sellerObj.address_id = foundAddress;
      }
    }

    res.json({
      statusCode: 200,
      success: true,
      message: "Grocery Seller fetched successfully",
      data: sellerObj,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to fetch seller",
    });
  }
};
exports.createGrocerySeller = async (req, res) => {
  try {
    const {
      user_id,
      address_id,
      store_name,
      shop_email,
      phone_number,
      verification_type,
      verification_number,
      aadhar,
      logo_url,
      company_images,
      verified_status,
      member_type, // NEW: Now expects ObjectId instead of string
    } = req.body;

    // GLOBAL DUPLICATE CHECK (PHONE & EMAIL)
    const duplicateStatus = await checkDuplicates({
      email: shop_email,
      phone: phone_number,
      userId: user_id
    });

    if (duplicateStatus.exists) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: duplicateStatus.message
      });
    }

    // NEW: Validate member_type is a valid ObjectId and exists
    if (!mongoose.Types.ObjectId.isValid(member_type)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Invalid member_type ID",
      });
    }

    const memberTypeExists = await BaseMemberType.findById(member_type);
    if (!memberTypeExists) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Member type not found",
      });
    }

    const sellerData = {
      user_id,
      address_id,
      shop_name: store_name,
      shop_email: shop_email && shop_email.trim() ? shop_email.trim().toLowerCase() : undefined,
      shop_phone_number: phone_number,
      aadhar,
      company_logo: logo_url,
      company_images,
      verified_status,
      member_type, // Save ID
    };

    // Map verification_type to appropriate field
    if (verification_type === "msme") {
      sellerData.msme_certificate_number = verification_number;
    } else if (verification_type === "gst") {
      sellerData.gst_number = verification_number;
    } else if (verification_type === "pan") {
      sellerData.pan = verification_number;
    }

    const newSeller = new GrocerySeller(sellerData);

    // Cross-model verification sync
    const verificationFlags = await getSyncVerificationFlags(user_id, sellerData.shop_email, sellerData.shop_phone_number);
    newSeller.email_verified = verificationFlags.email_verified;
    newSeller.number_verified = verificationFlags.number_verified;

    const savedSeller = await newSeller.save();

    // Admin notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("grocery", {
        _id: savedSeller._id,
        shop_name: savedSeller.shop_name,
        shop_email: savedSeller.shop_email,
        shop_phone: savedSeller.shop_phone_number,
        created_at: savedSeller.createdAt
      });
    }

    res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Seller created successfully",
      data: savedSeller,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Something went wrong",
    });
  }
};
/**
 * Create a new grocery seller
 */



/**
 * Update grocery seller details
 */


/**
 *
 *
 *
 * Delete a grocery seller
 */

exports.updateGrocerySeller = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const updates = req.body;
    // 1. Find the existing seller
    const seller = await GrocerySeller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Grocery Seller not found",
      });
    }

    // ──────────────────────────────────────────────────────────────
    // MEMBER TYPE VALIDATION & UPDATE
    // ──────────────────────────────────────────────────────────────
    if ("member_type" in updates) {
      const newMemberTypeId = updates.member_type?.trim();

      if (!newMemberTypeId) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          message: "member_type is required and cannot be empty",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(newMemberTypeId)) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          message: "Invalid member_type ID format (must be valid ObjectId)",
        });
      }

      const memberTypeExists = await BaseMemberType.findById(newMemberTypeId);
      if (!memberTypeExists) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          message: `Member type with ID ${newMemberTypeId} not found`,
        });
      }

      seller.member_type = newMemberTypeId;
    }

    // ──────────────────────────────────────────────────────────────
    // DOMAIN NAME HANDLING (new field)
    // ──────────────────────────────────────────────────────────────
    if ("domain_name" in updates) {
      let newDomain = (updates.domain_name || "").trim().toLowerCase();

      if (newDomain === "") {
        // Allow clearing the domain
        seller.domain_name = null;
      } else {
        // Validate format
        if (!/^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i.test(newDomain)) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            message: "Invalid domain format. Example: myshop.in or freshkart.co",
          });
        }

        // Check for uniqueness (exclude current seller)
        const existingDomain = await GrocerySeller.findOne({
          domain_name: newDomain,
          _id: { $ne: seller._id },
        });

        if (existingDomain) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            message: "This domain name is already taken by another shop",
          });
        }

        seller.domain_name = newDomain;
      }
    }

    // ──────────────────────────────────────────────────────────────
    // PHONE NUMBER VALIDATION & UNIQUENESS
    // ──────────────────────────────────────────────────────────────
    if ("shop_phone_number" in updates) {
      const newPhone = (updates.shop_phone_number || "").trim();

      if (newPhone !== seller.shop_phone_number) {
        // Format check (Indian mobile - 10 digits)
        if (!/^\d{10}$/.test(newPhone)) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            message: "Phone number must be exactly 10 digits (no spaces, +91, etc.)",
          });
        }

        // GLOBAL DUPLICATE CHECK
        const duplicateStatus = await checkDuplicates({
          phone: newPhone,
          userId: seller.user_id,
          excludeModel: "GrocerySeller",
          excludeId: sellerId
        });

        if (duplicateStatus.exists) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            message: duplicateStatus.message,
          });
        }

        seller.shop_phone_number = newPhone;
      }
    }

    // ──────────────────────────────────────────────────────────────
    // UPDATE ALL OTHER FIELDS SAFELY
    // ──────────────────────────────────────────────────────────────
    const allowedFields = [
      "shop_name",
      "shop_email",
      "msme_certificate_number",
      "gst_number",
      "pan",
      "aadhar",
      "company_logo",
      "company_images",
      "verified_status",
      "address_id",
      // "domain_name", "member_type", "shop_phone_number" already handled above
    ];

    allowedFields.forEach((field) => {
      if (field in updates) {
        if (field === "shop_email") {
          seller[field] = updates[field] && updates[field].trim() ? updates[field].trim().toLowerCase() : undefined;
        } else {
          seller[field] = updates[field];
        }
        if (field === 'verified_status') {
        }
      }
    });
    // Update timestamp
    seller.updatedAt = new Date();

    // Cross-model verification sync on update
    const verificationFlags = await getSyncVerificationFlags(seller.user_id, seller.shop_email, seller.shop_phone_number);
    seller.email_verified = verificationFlags.email_verified;
    seller.number_verified = verificationFlags.number_verified;

    // Save changes
    const updatedSeller = await seller.save();

    // 5. Return fresh populated document
    const refreshed = await GrocerySeller.findById(sellerId)
      .populate("user_id", "name email phone isActive")
      .populate("address_id")
      .populate("member_type", "name _id");
    return res.json({
      statusCode: 200,
      success: true,
      message: "Grocery Seller updated successfully",
      data: refreshed || updatedSeller,
    });
  } catch (error) {
    console.error("Update GrocerySeller error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Duplicate entry detected (phone, email, domain_name, gst, pan, etc.)",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to update seller",
    });
  }
};


exports.deleteGrocerySeller = async (req, res) => {
  try {
    // 1️⃣ Find the grocery seller first
    const grocerySeller = await GrocerySeller.findById(req.params.id);
    if (!grocerySeller) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Grocery Seller not found",
      });
    }

    // 2️⃣ Find the "USER" role object from Roles collection
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "User role not found in Roles collection",
      });
    }

    // 3️⃣ Update the related user's role to "USER"
    await User.findByIdAndUpdate(grocerySeller.user_id, { role: userRole._id });

    // 4️⃣ Now delete the grocery seller
    await GrocerySeller.findByIdAndDelete(req.params.id);

    // 5️⃣ Send success response
    res.json({
      statusCode: 200,
      success: true,
      message: "Grocery Seller deleted and user role updated to USER",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to delete seller",
    });
  }
};

exports.createMinimalGrocerySeller = async (req, res) => {
  try {
    const {
      shop_email,
      shop_name,
      shop_phone_number,
      user_id,
      member_type,
      domain_name,           // ← NEW: optional custom domain
    } = req.body;

    // 1. Required fields validation
    if (!shop_name?.trim() || !shop_phone_number?.trim() || !user_id || !member_type) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Missing required fields: shop_name, shop_phone_number, user_id, or member_type",
      });
    }

    const normalizedPhone = shop_phone_number.trim();

    // 2. Phone format validation (10 digits – Indian mobile style)
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // 3. Phone & Email uniqueness check across major entities
    const duplicateStatus = await checkDuplicates({
      phone: normalizedPhone,
      email: shop_email,
      userId: user_id
    });

    if (duplicateStatus.exists) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: duplicateStatus.message,
      });
    }

    // 4. Email handling (optional)
    let finalEmail = null;
    if (shop_email !== undefined) {
      const trimmed = String(shop_email).trim();
      if (trimmed.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            message: "Invalid email format",
          });
        }
        finalEmail = trimmed.toLowerCase();

        // Optional: you could also check email uniqueness here if desired
      }
    }

    // 5. Domain name handling (NEW – optional)
    let finalDomain = null;
    if (domain_name !== undefined) {
      const trimmedDomain = String(domain_name).trim().toLowerCase();

      if (trimmedDomain.length > 0) {
        // Basic domain format validation
        const domainRegex = /^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i;
        if (!domainRegex.test(trimmedDomain)) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            message: "Invalid domain format. Example: myshop.in or freshkart.co",
          });
        }

        // Check uniqueness
        const existingDomain = await GrocerySeller.findOne({ domain_name: trimmedDomain });
        if (existingDomain) {
          return res.status(400).json({
            statusCode: 400,
            success: false,
            message: "This domain name is already taken by another shop",
          });
        }

        finalDomain = trimmedDomain;
      }
    }

    // 6. Prepare seller document
    const sellerData = {
      user_id,
      shop_name: shop_name.trim(),
      shop_phone_number: normalizedPhone,
      shop_email: finalEmail,
      domain_name: finalDomain,           // ← saved only if valid & unique
      member_type: member_type || null,   // can be null or ObjectId
      verified_status: false,
    };

    // 7. Create and save
    const newSeller = new GrocerySeller(sellerData);
    const savedSeller = await newSeller.save();

    // Admin notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("grocery", {
        _id: savedSeller._id,
        shop_name: savedSeller.shop_name,
        shop_email: savedSeller.shop_email,
        shop_phone: savedSeller.shop_phone_number,
        created_at: savedSeller.createdAt
      });
    }

    // 8. Upgrade user role to GROCERY_SELLER (existing logic)
    const grocerySellerRole = await Role.findOne({ role: "GROCERY_SELLER" });
    if (!grocerySellerRole) {
      // Rollback if role missing (critical)
      await GrocerySeller.findByIdAndDelete(savedSeller._id).catch(() => { });
      return res.status(500).json({
        statusCode: 500,
        success: false,
        message: "GROCERY_SELLER role not found in system – creation rolled back",
      });
    }

    await User.findByIdAndUpdate(
      user_id,
      {
        role: grocerySellerRole._id,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // 9. Optional: return populated version
    const populatedSeller = await GrocerySeller.findById(savedSeller._id)
      .populate("user_id", "name email phone")
      .populate("member_type", "name");

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Minimal Grocery Seller / Base Member created successfully",
      data: populatedSeller || savedSeller,
    });
  } catch (error) {
    console.error("Create Minimal Grocery Seller error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Duplicate entry detected (phone, email, domain_name, or other unique field)",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to create profile",
    });
  }
};



exports.createGrocerySellerWithRoleUpdate = async (req, res) => {
  try {
    const { user_id, shop_name, shop_email, shop_phone_number, member_type } = req.body;

    // Validate required fields
    if (!user_id || !shop_name || !shop_phone_number || !member_type) {
      return res.status(400).json({
        success: false,
        error: true,
        message:
          "Missing required fields: user_id, shop_name, shop_phone_number, or member_type",
      });
    }

    const normalizedPhone = shop_phone_number.trim();

    // 1. Basic phone format validation (optional but recommended)
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // 2. Basic email format validation (only if provided)
    if (shop_email && shop_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shop_email.trim())) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Invalid shop email format",
        });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // PHONE NUMBER UNIQUENESS CHECK ACROSS ALL MAJOR MODELS
    // ──────────────────────────────────────────────────────────────
    const [existingUser, existingMerchant, existingGrocery] = await Promise.all([
      User.findOne({ phone: normalizedPhone }),
      Merchant.findOne({ company_phone_number: normalizedPhone }),
      GrocerySeller.findOne({ shop_phone_number: normalizedPhone }),
    ]);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "This phone number is already registered as a User",
      });
    }

    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "This phone number is already registered with a Merchant profile",
      });
    }

    if (existingGrocery) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "This phone number is already registered with another Grocery Seller / Base Member profile",
      });
    }
    // ──────────────────────────────────────────────────────────────

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "User not found",
      });
    }

    // Only allow upgrade from USER role
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole || user.role.toString() !== userRole._id.toString()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Only users with USER role can create Grocery Seller profile",
      });
    }

    // Check if grocery seller already exists for this user
    const existingSeller = await GrocerySeller.findOne({ user_id });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Grocery seller profile already exists for this user",
      });
    }

    // Check if shop_email is already in use (only if provided)
    if (shop_email && shop_email.trim()) {
      const existingEmail = await GrocerySeller.findOne({
        shop_email: shop_email.trim().toLowerCase()
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "This shop email is already in use",
        });
      }
    }

    // Create new grocery seller
    const newGrocerySeller = new GrocerySeller({
      user_id,
      shop_name: shop_name.trim(),
      shop_email: shop_email && shop_email.trim() ? shop_email.trim().toLowerCase() : undefined,
      shop_phone_number: normalizedPhone,
      member_type: member_type,
      verified_status: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newGrocerySeller.save();

    // Upgrade user role to GROCERY_SELLER
    const grocerySellerRole = await Role.findOne({ role: "GROCERY_SELLER" });
    if (grocerySellerRole) {
      user.role = grocerySellerRole._id;
      user.updated_at = new Date();
      await user.save();
    } else {
      console.warn("GROCERY_SELLER role not found → user role not updated");
      // Optional: you could rollback here if role upgrade is mandatory
    }

    return res.status(201).json({
      success: true,
      error: false,
      message: "Grocery Seller profile created successfully",
      data: newGrocerySeller,
    });

  } catch (error) {
    console.error("Create grocery seller error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Duplicate entry (phone/email/shop_name conflict)",
      });
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: "Error creating grocery seller profile",
      details: error.message,
    });
  }
};



function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getGrocerySellersForHomePage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    let city = req.query.city;
    if (city) {
      city = city.trim().replace(/\s+/g, " ");
    }

    // ✅ Loosened filter to show both verified and unverified sellers for now
    let sellerQuery = {}; 
    // If you want to strictly show only verified sellers later, 
    // change it to: { verified_status: true }

    // ── City Filtering ─────────────────────────
    if (city && city.length >= 2) {
      let cityAddresses = await Address.find({
        entity_type: "grocery_seller",
        address_type: "company",
        city: { $regex: new RegExp(`^${escapeRegex(city)}$`, "i") },
      })
        .select("user_id")
        .lean();

      let sellerUserIds = cityAddresses.map(
        (a) => new mongoose.Types.ObjectId(a.user_id)
      );

      if (!sellerUserIds.length) {
        cityAddresses = await Address.find({
          entity_type: "grocery_seller",
          address_type: "company",
          city: { $regex: escapeRegex(city), $options: "i" },
        })
          .select("user_id")
          .lean();

        sellerUserIds = cityAddresses.map(
          (a) => new mongoose.Types.ObjectId(a.user_id)
        );
      }

      if (!sellerUserIds.length) {
        return res.status(200).json({
          sellers: [],
          pagination: { page, limit, total: 0, hasMore: false },
        });
      }

      sellerQuery.user_id = { $in: sellerUserIds };
    }

    // ── Fetch Sellers ─────────────────────────
    const [sellers, total] = await Promise.all([
      GrocerySeller.find(sellerQuery)
        .select(
          "user_id shop_name shop_phone_number company_logo company_images member_type verified_status domain_name"
        )
        .skip(skip)
        .limit(limit)
        .lean(),
      GrocerySeller.countDocuments(sellerQuery),
    ]);

    if (!sellers.length) {
      return res.status(200).json({
        sellers: [],
        pagination: { page, limit, total: 0, hasMore: false },
      });
    }

    const currentUserIds = sellers.map((s) => s.user_id);
    const memberTypeIds = sellers
      .map((s) => s.member_type)
      .filter(Boolean);

    // ── Fetch Users, Addresses, Member Types ─────────────────────────
    const [users, addresses, memberTypes] = await Promise.all([
      User.find({ _id: { $in: currentUserIds } })
        .select("name email profile_pic phone role isVerified")
        .lean(),

      Address.find({
        user_id: { $in: currentUserIds },
        address_type: "company",
        entity_type: "grocery_seller",
      }).lean(),

      BaseMemberType.find({ _id: { $in: memberTypeIds } })
        .select("name")
        .lean(),
    ]);

    // ── Create Lookup Maps ─────────────────────
    const userMap = users.reduce((acc, u) => {
      acc[u._id.toString()] = u;
      return acc;
    }, {});

    const addressMap = addresses.reduce((acc, a) => {
      acc[a.user_id.toString()] = a;
      return acc;
    }, {});

    const memberTypeMap = memberTypes.reduce((acc, m) => {
      acc[m._id.toString()] = m.name;
      return acc;
    }, {});

    // ── Final Response Build ───────────────────
    const result = sellers
      .map((seller) => {
        const userIdStr = seller.user_id.toString();
        const user = userMap[userIdStr];
        const addr = addressMap[userIdStr];

        if (!user) return null;

        return {
          _id: seller._id,
          shop_name: seller.shop_name,
          shop_phone_number: seller.shop_phone_number,
          company_logo: seller.company_logo,
          company_images: seller.company_images,
          verified_status: seller.verified_status, // optional return
          member_type:
            memberTypeMap[seller.member_type?.toString()] || null,
          domain_name: seller.domain_name || null,
          user: { ...user },
          location: addr
            ? `${addr.address_line_1 || ""}${addr.address_line_2 ? ", " + addr.address_line_2 : ""
              }, ${addr.city}, ${addr.state} - ${addr.pincode || ""
              }`.trim()
            : "Location not set",
        };
      })
      .filter(Boolean);

    res.status(200).json({
      sellers: result,
      pagination: {
        page,
        limit,
        total,
        hasMore: sellers.length === limit,
      },
    });
  } catch (error) {
    console.error("[getGrocerySellersForHomePage] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching grocery sellers",
    });
  }
};


exports.markGroceryAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const grocery = await GrocerySeller.findByIdAndUpdate(id, { markAsRead: true }, { new: true });

    if (!grocery) {
      return res.status(404).json({ success: false, message: "Grocery seller not found" });
    }

    // Also mark the associated User as read to clear global notifications
    if (grocery.user_id) {
      await User.findByIdAndUpdate(grocery.user_id, { markAsRead: true });
    }

    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "Grocery seller marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error marking grocery seller as read", error: error.message });
  }
};

exports.deactivateGrocerySellerAccount = async (req, res) => {
  const { user_id } = req.params;

  try {
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // 1️⃣ Find and delete Grocery Seller record
    const seller = await GrocerySeller.findOneAndDelete({ user_id });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Base Member record not found",
      });
    }

    // 2️⃣ Find default USER role
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: "USER role not found in the system",
      });
    }

    // 3️⃣ Revert User role back to USER
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      {
        role: userRole._id,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4️⃣ Delete ALL User Subscriptions
    const deletedSubscriptions = await UserSubscription.deleteMany({
      user_id,
    });

    // 5️⃣ Delete ALL Active Features
    const deletedActiveFeatures = await UserActiveFeature.deleteMany({
      user_id,
    });

    // 6️⃣ Delete company addresses
    const deletedCompanyAddresses = await Address.deleteMany({
      user_id,
      address_type: "company",
    });

    return res.status(200).json({
      success: true,
      message:
        "Base Member account deactivated. Subscriptions, active features, and company addresses deleted. User reverted to regular USER.",
      data: {
        deletedSubscriptions: deletedSubscriptions.deletedCount,
        deletedActiveFeatures: deletedActiveFeatures.deletedCount,
        deletedCompanyAddresses: deletedCompanyAddresses.deletedCount,
      },
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error deactivating Base Member account:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error. Please try again later.",
    });
  }
};


const getGrocerySellerMemberType = async (userId) => {
  try {
    if (!userId) {
      return {
        isNonFarmer: false,
        member_type: null,
      };
    }

    // 🔥 Populate member_type to get name and has_full_access fields
    const seller = await GrocerySeller.findOne(
      { user_id: userId }
    )
      .populate({
        path: "member_type",
        model: "BaseMemberType",
        select: "name has_full_access",
      })
      .lean();

    if (!seller || !seller.member_type || !seller.member_type.name) {
      return {
        isNonFarmer: false,
        member_type: null,
      };
    }

    // Normalize value safely
    const normalizedMemberType = String(seller.member_type.name)
      .trim()
      .toLowerCase();

    return {
      hasFullAccess: !!seller.member_type.has_full_access,
      member_type: normalizedMemberType,
    };

  } catch (error) {
    console.error("getGrocerySellerMemberType error:", error);
    return {
      hasFullAccess: false,
      member_type: null,
    };
  }
};

exports.fetchMemberType = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await getGrocerySellerMemberType(userId);

    return res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error("fetchMemberType error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch member type",
    });
  }
};
