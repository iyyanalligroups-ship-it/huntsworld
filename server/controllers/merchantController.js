// Updated Merchant Controller: controllers/merchantController.js
// Added new function createMinimalMerchant
// Other functions remain unchanged, only appending the new one at the end

const mongoose = require("mongoose");
const Merchant = require("../models/MerchantModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Role = require("../models/roleModel");
const Product = require("../models/productModel");
const ProductAttribute = require("../models/productAttributeModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Banner = require("../models/bannerModel");
const assignFreePlan = require("../utils/assignFreePlan");
const GrocerySeller = require("../models/grocerySellerModel");
const CompanyType = require('../models/companyTypeModel');
const UserSubscription = require("../models/userSubscriptionPlanModel");
const UserActiveFeature = require("../models/UserActiveFeature");
const { checkDuplicates } = require("../utils/duplicateCheck");
const { getSyncVerificationFlags } = require("../utils/verificationSync");

async function resolveCompanyType(companyTypeInput) {
  if (!companyTypeInput) return null;

  // Handle case where frontend might send the whole object instead of just ID
  if (typeof companyTypeInput === 'object' && companyTypeInput._id) {
    companyTypeInput = companyTypeInput._id;
  }

  // If already a valid ObjectId, return it directly
  if (mongoose.Types.ObjectId.isValid(companyTypeInput)) {
    return new mongoose.Types.ObjectId(companyTypeInput);
  }

  // If it's not a string at this point (and not an object with _id), we can't trim it
  if (typeof companyTypeInput !== 'string') {
    return null; // Or throw error, but null is safer for partial updates
  }

  const CompanyType = mongoose.model("CompanyType");

  const trimmedInput = companyTypeInput.trim();

  // If frontend sends "Unknown" or empty string as a placeholder, treat it as null instead of throwing an error
  if (!trimmedInput || trimmedInput.toLowerCase() === "unknown") {
    return null;
  }

  const typeDoc = await CompanyType.findOne({
    $or: [
      { name: trimmedInput.toLowerCase() },
      { displayName: new RegExp(`^${trimmedInput}$`, "i") }
    ]
  }).select("_id");

  if (!typeDoc) {
    throw new Error(`Invalid company type: "${companyTypeInput}". Please select a valid type.`);
  }

  return typeDoc._id;
}



exports.createMerchant = async (req, res) => {
  try {
    const {
      user_id,
      address_id,
      company_email,
      company_name,
      aadhar,
      company_type,               // ← now can be string or ObjectId
      company_phone_number,
      number_of_employees,
      year_of_establishment,
      description,
      company_logo,
      company_images,
      gst_number,
      msme_certificate_number,
      pan,
      domain_name,
    } = req.body;

    // VALIDATIONS
    const user = await User.findById(user_id).populate("role");
    if (!user) return res.status(400).json({ error: "Invalid user_id" });

    if (!company_phone_number || !/^\d{10}$/.test(company_phone_number)) {
      return res.status(400).json({ error: "Invalid company_phone_number. Must be a 10-digit number." });
    }

    // GLOBAL DUPLICATE CHECK (PHONE & EMAIL)
    const duplicateStatus = await checkDuplicates({
      email: company_email,
      phone: company_phone_number,
      userId: user_id
    });

    if (duplicateStatus.exists) {
      return res.status(400).json({ error: duplicateStatus.message });
    }

    const existingMerchant = await Merchant.findOne({
      $or: [
        { aadhar },
        { msme_certificate_number },
        { gst_number },
        { pan },
        { user_id },
        { domain_name },
      ],
    });

    if (existingMerchant) {
      if (existingMerchant.user_id.toString() === user_id) {
        return res.status(400).json({ error: "User already has a merchant profile" });
      }
      if (existingMerchant.aadhar === aadhar) {
        return res.status(400).json({ error: "Aadhar number already registered" });
      }
      if (existingMerchant.gst_number === gst_number) {
        return res.status(400).json({ error: "GST number already registered" });
      }
      if (existingMerchant.pan === pan) {
        return res.status(400).json({ error: "PAN number already registered" });
      }
      if (existingMerchant.domain_name === domain_name) {
        return res.status(400).json({ error: "Domain name already registered" });
      }
      return res.status(400).json({ error: "Duplicate merchant entry detected" });
    }

    const merchantRole = await Role.findOne({ role: "MERCHANT" });
    if (!merchantRole) return res.status(500).json({ error: "MERCHANT role not found" });

    // Resolve company_type to ObjectId
    let companyTypeId = null;
    if (company_type) {
      companyTypeId = await resolveCompanyType(company_type);
    }

    const merchant = new Merchant({
      user_id,
      address_id,
      company_email,
      company_name,
      aadhar,
      company_type: companyTypeId,          // ← now ObjectId or null
      company_phone_number,
      number_of_employees,
      year_of_establishment,
      description,
      company_logo,
      company_images,
      gst_number,
      msme_certificate_number,
      pan,
      domain_name,
    });

    // Cross-model verification sync
    const verificationFlags = await getSyncVerificationFlags(user_id, company_email, company_phone_number);
    merchant.email_verified = verificationFlags.email_verified;
    merchant.number_verified = verificationFlags.number_verified;

    await merchant.save();

    // Admin notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("merchant", {
        _id: merchant._id,
        company_name: merchant.company_name,
        company_email: merchant.company_email,
        company_phone: merchant.company_phone_number,
        created_at: merchant.createdAt
      });
    }

    // Populate company_type for response
    const createdMerchant = await Merchant.findById(merchant._id)
      .populate("company_type", "name displayName");

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { role: merchantRole._id, updated_at: new Date() },
      { new: true }
    ).populate("role");

    if (!updatedUser) {
      await Merchant.findByIdAndDelete(merchant._id);
      return res.status(500).json({ error: "Failed to update user role" });
    }

    const planResult = await assignFreePlan(user_id, true);
    if (!planResult.success) {
      console.warn("Free plan not assigned:", planResult.message);
    }

    res.status(201).json({
      message: `Merchant created. Free plan assigned (expires: ${planResult.endDate || 'N/A'})`,
      merchant: createdMerchant,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
      subscription: planResult.success ? { expires_on: planResult.endDate } : null,
    });

  } catch (error) {
    console.error("Create merchant error:", error);
    res.status(500).json({ error: error.message });
  }
};


// Check Aadhar uniqueness endpoint
exports.checkAadhar = async (req, res) => {
  try {
    const { aadhar } = req.body;
    if (!aadhar || aadhar.length !== 12 || !/^\d{12}$/.test(aadhar)) {
      return res.status(400).json({ error: "Aadhar number must be a 12-digit number" });
    }
    const existingMerchant = await Merchant.findOne({ aadhar });
    res.status(200).json({ exists: !!existingMerchant });
  } catch (error) {
    console.error("Check Aadhar error:", error);
    res.status(500).json({ error: "Error checking Aadhar number" });
  }
};

// ... (other controller functions remain unchanged)
// exports.getAllMerchants = async (req, res) => {
//   try {
//     const merchants = await Merchant.find()
//       // CRITICAL: Added 'isActive' to the select string
//       .populate({ path: "user_id", select: "name email phone_number isActive" })
//       .populate({
//         path: "address_id",
//         select: "street city state country postal_code",
//       });
//     res.status(200).json(merchants);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getMerchantByEmailOrPhone = async (req, res) => {
  const { email, phone, page = 1, limit = 10 } = req.query;

  try {
    if (!email && !phone) {
      return res.status(400).json({
        message: "Either 'email' or 'phone' query parameter is required."
      });
    }

    let merchant;

    // Prefer phone if both are provided (Phone is now primary)
    if (phone) {
      // Assuming phone is stored without country code or with consistent format
      merchant = await Merchant.findOne({ company_phone_number: phone.trim() });
    }
    else if (email) {
      merchant = await Merchant.findOne({ company_email: email.trim().toLowerCase() });
    }

    if (!merchant) {
      const searchTerm = email || phone;
      return res.status(404).json({
        message: `No merchant found with ${email ? 'email' : 'phone'}: ${searchTerm}. Please verify and try again.`,
      });
    }

    const user = await User.findById(merchant.user_id).select("-password");

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalProducts = await Product.countDocuments({
      seller_id: merchant._id,
    });

    const products = await Product.find({ seller_id: merchant._id })
      .populate(
        "category_id sub_category_id super_sub_category_id deep_sub_category_id"
      )
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

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
          category_name: product.category_id?.name || null,
          sub_category_name: product.sub_category_id?.name || null,
          super_sub_category_name: product.super_sub_category_id?.name || null,
          deep_sub_category_name: product.deep_sub_category_id?.name || null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      merchant,
      user,
      products: productsWithAttributes,
      pagination: {
        totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching merchant or user:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    });
  }
};
// exports.getMerchantById = async (req, res) => {
//   try {
//     const merchant = await Merchant.findById(req.params.id)
//       .populate({ path: "user_id", select: "name email phone_number" })
//       .populate({
//         path: "address_id",
//         select: "street city state country postal_code",
//       });
//     if (!merchant)
//       return res.status(404).json({ message: "Merchant not found" });
//     res.status(200).json(merchant);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.updateMerchant = async (req, res) => {
//   try {
//     const merchant = await Merchant.findById(req.params.id);
//     if (!merchant) {
//       return res.status(404).json({ success: false, message: "Merchant not found" });
//     }

//     const updates = req.body;

//     // ──────────────────────────────────────────────────────────────
//     // PHONE NUMBER VALIDATION (only if phone is being changed)
//     // ──────────────────────────────────────────────────────────────
//     if (updates.company_phone_number) {
//       const newPhone = updates.company_phone_number.trim();

//       // Skip if same as current
//       if (newPhone === merchant.company_phone_number) {
//         // still allow update, just no extra check needed
//       } else {
//         // Validate format (assuming 10-digit Indian number)
//         if (!/^\d{10}$/.test(newPhone)) {
//           return res.status(400).json({
//             success: false,
//             message: "Please enter a valid 10-digit phone number"
//           });
//         }

//         // Check across all models
//         const [existingUser, existingMerchant, existingGrocery] = await Promise.all([
//           // User.findOne({ phone: newPhone }),
//           Merchant.findOne({ company_phone_number: newPhone }),
//           GrocerySeller.findOne({ shop_phone_number: newPhone })
//         ]);

//         // Another merchant already using this number
//         if (existingMerchant && existingMerchant._id.toString() !== merchant._id.toString()) {
//           return res.status(400).json({
//             success: false,
//             message: "This phone number is already registered with another Merchant"
//           });
//         }

//         // Used in User model
//         if (existingUser) {
//           return res.status(400).json({
//             success: false,
//             message: "This phone number is already registered as a User"
//           });
//         }

//         // Used in GrocerySeller / Base Member
//         if (existingGrocery) {
//           return res.status(400).json({
//             success: false,
//             message: "This phone number is already registered with a Grocery Seller / Base Member profile"
//           });
//         }

//         // If we reached here → phone is available → safe to update
//         merchant.company_phone_number = newPhone;
//       }
//     }
//     // ──────────────────────────────────────────────────────────────

//     // Update all other provided fields
//     Object.keys(updates).forEach((key) => {
//       // Skip phone if we already handled it above
//       if (key !== "company_phone_number") {
//         merchant[key] = updates[key];
//       }
//     });

//     // Update last activity
//     merchant.last_activity = new Date();

//     await merchant.save(); // triggers progress calculation

//     return res.status(200).json({
//       success: true,
//       message: "Merchant updated successfully",
//       data: merchant,
//     });

//   } catch (error) {
//     console.error("Error updating merchant:", error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to update merchant"
//     });
//   }
// };


exports.updateMerchant = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const updates = req.body;

    // Phone number validation
    if (updates.company_phone_number) {
      const normalizedPhone = updates.company_phone_number.trim();

      if (normalizedPhone !== merchant.company_phone_number) {
        if (!/^\d{10}$/.test(normalizedPhone)) {
          return res.status(400).json({
            success: false,
            message: "Please enter a valid 10-digit phone number",
          });
        }

        const duplicateStatus = await checkDuplicates({
          phone: normalizedPhone,
          userId: merchant.user_id,
          excludeModel: "Merchant",
          excludeId: merchant._id
        });

        if (duplicateStatus.exists) {
          return res.status(400).json({
            success: false,
            message: duplicateStatus.message,
          });
        }

        merchant.company_phone_number = normalizedPhone;
      }
    }

    // Handle company_type conversion
    if ("company_type" in updates) {
      if (updates.company_type) {
        merchant.company_type = await resolveCompanyType(updates.company_type);
      } else {
        merchant.company_type = null;
      }
    }

    // TRACK MODIFIED FIELDS & RESET STATUS
    const businessFields = [
      "company_name", "company_email", "company_phone_number", 
      "gst_number", "msme_certificate_number", "pan", "aadhar", 
      "description", "domain_name", "company_type"
    ];

    let businessDetailsChanged = false;

    Object.keys(updates).forEach((key) => {
      if (businessFields.includes(key)) {
        // Compare with existing value (handle ObjectId for company_type)
        let isDifferent = false;
        if (key === "company_type") {
          const currentId = merchant.company_type?.toString();
          const newId = updates.company_type?.toString();
          if (newId && currentId !== newId) isDifferent = true;
        } else if (merchant[key] !== updates[key]) {
          isDifferent = true;
        }

        if (isDifferent) {
          businessDetailsChanged = true;
          if (!merchant.modifiedFields.includes(key)) {
            merchant.modifiedFields.push(key);
          }
        }
      }

      // Update remaining fields
      if (key !== "company_phone_number" && key !== "company_type") {
        merchant[key] = updates[key];
      }
    });

    merchant.last_activity = new Date();

    // Enforce max 5 images restriction on backend
    if (updates.company_images && updates.company_images.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 company images allowed.",
      });
    }

    // Reset verified_status only if it is NOT being updated explicitly
    if (!Object.prototype.hasOwnProperty.call(updates, "verified_status")) {
      if (businessDetailsChanged) {
        merchant.verified_status = false;
        merchant.mark_as_read = false; 
      }
    } else if (updates.verified_status === true) {
      // If admin is verifying, clear the modified fields tracking
      merchant.modifiedFields = [];
      merchant.mark_as_read = true; // Mark as read when verified
    }

    // Cross-model verification sync on update
    const verificationFlags = await getSyncVerificationFlags(merchant.user_id, merchant.company_email, merchant.company_phone_number);
    merchant.email_verified = verificationFlags.email_verified;
    merchant.number_verified = verificationFlags.number_verified;

    await merchant.save();

    // Trigger Admin Notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && (businessDetailsChanged || updates.verified_status !== undefined)) {
      await adminHelpers.updateUnreadCount();
    }

    // Populate response
    const updatedMerchant = await Merchant.findById(merchant._id)
      .populate("company_type", "name displayName")
      .populate("address_id");

    return res.status(200).json({
      success: true,
      message: "Merchant updated successfully",
      data: updatedMerchant,
    });

  } catch (error) {
    console.error("Error updating merchant:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update merchant",
    });
  }
};



exports.deleteMerchant = async (req, res) => {
  try {
    const { user_id, id } = req.params;
    const identifier = user_id || id;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "user_id or id is required",
      });
    }

    // 1️⃣ Find merchant by user_id or _id
    let merchant = await Merchant.findOne({ user_id: identifier });

    if (!merchant && mongoose.Types.ObjectId.isValid(identifier)) {
      merchant = await Merchant.findById(identifier);
    }

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const merchantUserId = merchant.user_id;

    // 2️⃣ Get USER role
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(500).json({
        success: false,
        message: "Default USER role not found",
      });
    }

    // 3️⃣ Revert user role
    await User.findByIdAndUpdate(
      merchantUserId,
      {
        role: userRole._id,
        updated_at: new Date(),
      },
      { new: true }
    );

    // 4️⃣ Delete ALL User Subscriptions for this user
    const deletedSubscriptions = await UserSubscription.deleteMany({
      user_id: merchantUserId,
    });

    // 5️⃣ Delete ALL Active Features for this user
    const deletedActiveFeatures = await UserActiveFeature.deleteMany({
      user_id: merchantUserId,
    });

    // 6️⃣ Delete company addresses
    const deletedCompanyAddresses = await Address.deleteMany({
      user_id: merchantUserId,
      address_type: "company",
    });

    // 7️⃣ Delete merchant
    await Merchant.deleteOne({ _id: merchant._id });

    return res.status(200).json({
      success: true,
      message:
        "Merchant deactivated. Subscriptions, active features, and company addresses deleted. User role reverted to USER.",
      data: {
        deletedMerchantId: merchant._id,
        deletedSubscriptions: deletedSubscriptions.deletedCount,
        deletedActiveFeatures: deletedActiveFeatures.deletedCount,
        deletedCompanyAddresses: deletedCompanyAddresses.deletedCount,
      },
    });

  } catch (error) {
    console.error("Error deleting merchant:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete merchant",
    });
  }
};


exports.createMinimalMerchant = async (req, res) => {
  let createdMerchant = null;

  try {
    const { 
      user_id, 
      company_name, 
      company_email, 
      company_phone_number, 
      domain_name, 
      company_type,
      gst_number,
      msme_certificate_number
    } = req.body;

    if (!user_id || !company_name || !company_phone_number) {
      return res.status(400).json({ success: false, message: "Required fields missing (user_id, company_name, company_phone_number)" });
    }

    if (company_email && company_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(company_email.trim())) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
    }

    const normalizedPhone = company_phone_number.trim();
    const duplicateStatus = await checkDuplicates({
      phone: normalizedPhone,
      email: company_email,
      userId: user_id
    });

    if (duplicateStatus.exists) {
      return res.status(400).json({
        success: false,
        message: duplicateStatus.message
      });
    }

    // Optional Document Validation
    if (gst_number) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gst_number.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid GST Number format.",
        });
      }
      const existingGst = await Merchant.findOne({ gst_number: gst_number.trim() });
      if (existingGst) {
        return res.status(400).json({
          success: false,
          message: "This GST number is already registered with another Merchant.",
        });
      }
    }

    if (msme_certificate_number) {
      if (msme_certificate_number.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "MSME Certificate Number cannot be empty if provided.",
        });
      }
      const msmeRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i;
      if (!msmeRegex.test(msme_certificate_number.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid MSME format",
        });
      }
      
      const existingMsme = await Merchant.findOne({ msme_certificate_number: msme_certificate_number.trim() });
      if (existingMsme) {
        return res.status(400).json({
          success: false,
          message: "This MSME Certificate number is already registered with another Merchant.",
        });
      }
    }

    const rawName = company_name.trim();
    const normalizedName = rawName.replace(/-/g, " ").replace(/\s+/g, " ").trim();

    const existingMerchantByName = await Merchant.findOne({
      company_name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });

    if (existingMerchantByName) {
      return res.status(400).json({
        success: false,
        message: "Merchant with this company name already exists",
      });
    }

    if (domain_name) {
      const existingByDomain = await Merchant.findOne({
        domain_name: domain_name.trim().toLowerCase()
      });
      if (existingByDomain) {
        return res.status(400).json({
          success: false,
          message: "This domain name is already registered",
        });
      }
    }

    const merchantRole = await Role.findOne({ role: "MERCHANT" });
    if (!merchantRole) {
      return res.status(500).json({ success: false, message: "MERCHANT role not found" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role && user.role.toString() === merchantRole._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "User is already registered as Merchant",
      });
    }

    // Resolve company_type if provided
    let companyTypeId = null;
    if (company_type) {
      companyTypeId = await resolveCompanyType(company_type);
    }

    createdMerchant = new Merchant({
      user_id,
      company_name: normalizedName,
      company_email: company_email.trim().toLowerCase(),
      company_phone_number: normalizedPhone,
      domain_name: domain_name ? domain_name.trim().toLowerCase() : undefined,
      company_type: companyTypeId,           // ← now supports ObjectId
      gst_number: gst_number ? gst_number.trim() : undefined,
      msme_certificate_number: msme_certificate_number ? msme_certificate_number.trim() : undefined,
      slug: normalizedName.toLowerCase().replace(/\s+/g, "-").trim(),
    });

    // Cross-model verification sync for minimal creation
    const verificationFlags = await getSyncVerificationFlags(user_id, company_email, normalizedPhone);
    createdMerchant.email_verified = verificationFlags.email_verified;
    createdMerchant.number_verified = verificationFlags.number_verified;

    await createdMerchant.save();

    // Populate for response
    const savedMerchant = await Merchant.findById(createdMerchant._id)
      .populate("company_type", "name displayName");

    user.role = merchantRole._id;
    user.updated_at = new Date();
    await user.save();

    let planResult;
    try {
      planResult = await assignFreePlan(user_id, true);
    } catch (err) {
      console.error("Unexpected error in assignFreePlan:", err);
      planResult = { success: false, message: err.message || "Unknown error" };
    }

    if (!planResult.success) {
      console.warn(`⚠️ Merchant created for user ${user_id}, but FREE PLAN ASSIGNMENT FAILED:`, planResult.message);
    }

    return res.status(201).json({
      success: true,
      message: "Merchant profile created successfully",
      data: savedMerchant,
      forceLogout: true,
    });

  } catch (error) {
    if (createdMerchant) {
      await Merchant.findByIdAndDelete(createdMerchant._id).catch(() => { });
    }
    console.error("Merchant creation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating merchant profile",
    });
  }
};



exports.getMerchantByUserId = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    // Fetch merchant WITHOUT population first (safe)
    let merchant = await Merchant.findOne({ user_id: userId }).lean();

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant profile not found for this user"
      });
    }

    // ── Handle company_type safely ───────────────────────────────────────
    let resolvedCompanyType = null;

    if (mongoose.isValidObjectId(merchant.company_type)) {
      // Only try to populate if it's a valid ObjectId
      const typeDoc = await CompanyType.findById(merchant.company_type)
        .select('name displayName description')
        .lean();

      if (typeDoc) {
        resolvedCompanyType = typeDoc;
      } else {
        resolvedCompanyType = { name: "Unknown", displayName: "Unknown (type not found)" };
      }
    } else if (typeof merchant.company_type === 'string' && merchant.company_type.trim()) {
      // Legacy case: string value like "Retailer"
      resolvedCompanyType = {
        name: merchant.company_type.trim(),
        displayName: merchant.company_type.trim(),
        isLegacy: true
      };
    } else {
      resolvedCompanyType = { name: "Unknown", displayName: "Not set" };
    }

    // Replace the original field with resolved value
    merchant.company_type = resolvedCompanyType;

    return res.status(200).json({
      success: true,
      message: "Merchant details retrieved successfully",
      data: merchant
    });

  } catch (error) {
    console.error("Error in fetchMerchantByUserId:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching merchant details",
      error: error.message
    });
  }
};

exports.getAddressByCompanyName = async (req, res) => {
  try {
    let { company_name } = req.query;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "company_name query parameter is required",
      });
    }

    const normalize = (str) =>
      str?.trim().toLowerCase().replace(/-/g, "").replace(/\s+/g, "") || "";

    const normalizedInput = normalize(company_name);

    // 1. Find Merchant by normalized company_name
    const merchant = await Merchant.findOne({
      $expr: {
        $eq: [
          {
            $replaceAll: {
              input: {
                $replaceAll: {
                  input: { $toLower: "$company_name" },
                  find: "-",
                  replacement: "",
                },
              },
              find: " ",
              replacement: "",
            },
          },
          normalizedInput,
        ],
      },
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "No company found with this name",
        searched: company_name,
      });
    }

    let address = null;

    // 2. Try via address_id (preferred)
    if (merchant.address_id) {
      address = await Address.findOne({
        _id: merchant.address_id,
        address_type: { $in: ["company", "personal"] },
        entity_type: "merchant",
      }).select("address_line_1 address_line_2 city state country pincode address_type");
    }

    // 3. Fallback: direct lookup by user_id
    if (!address) {
      // Prioritize company address
      address = await Address.findOne({
        user_id: merchant.user_id,
        address_type: "company",
        entity_type: "merchant",
      }).select("address_line_1 address_line_2 city state country pincode address_type");

      if (!address) {
        address = await Address.findOne({
          user_id: merchant.user_id,
          address_type: "personal",
          entity_type: "merchant",
        }).select("address_line_1 address_line_2 city state country pincode address_type");
      }
    }

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Company found, but no company address registered",
        company_name: merchant.company_name,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address fetched successfully",
      source: "Merchant",
      data: {
        company_name: merchant.company_name,
        address_type: address.address_type,
        address: {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2 || "",
          city: address.city,
          state: address.state,
          country: address.country,
          pincode: address.pincode,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAddressByCompanyName:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.lookupUserForMerchantCreation = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    })
      .select('-password -email_otp -number_otp')
      .populate('role')
      .lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        users: [],
        message: 'No users found'
      });
    }

    const userData = users.map(user => ({
      user_id: user._id.toString(),
      name: user.name,
      email: user.email || '',
      phone_number: user.phone,
      role: user.role
    }));

    res.json({
      success: true,
      users: userData
    });
  } catch (error) {
    console.error('Merchant creation lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.createMinimalMerchantByUserId = async (req, res) => {
  try {
    const { user_id, company_name, company_email, company_phone_number } = req.body;

    // Validate required fields
    if (!user_id || !company_name || !company_phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, company_name, company_phone_number'
      });
    }

    // Validate user
    const user = await User.findById(user_id).populate('role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has USER role
    if (user.role.role !== 'USER') {
      return res.status(400).json({
        success: false,
        message: 'User must have USER role'
      });
    }

    // Check if merchant already exists for this user
    const existingMerchant = await Merchant.findOne({ user_id });
    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: 'Merchant already exists for this user'
      });
    }

    // Validate email format (only if provided)
    if (company_email && company_email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company_email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company email format'
        });
      }
    }

    // Validate phone number format (basic validation for 10 digits)
    if (!/^\d{10}$/.test(company_phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company phone number format'
      });
    }

    // Create new merchant
    const newMerchant = new Merchant({
      user_id,
      company_name,
      company_email: company_email && company_email.trim() ? company_email.trim().toLowerCase() : undefined,
      company_phone_number,
      verified_status: false,
      trustshield: false
    });

    await newMerchant.save();

    // Admin notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("merchant", {
        _id: newMerchant._id,
        company_name: newMerchant.company_name,
        company_email: newMerchant.company_email,
        company_phone: newMerchant.company_phone_number,
        created_at: newMerchant.createdAt
      });
    }

    // Update user role to MERCHANT
    const merchantRole = await Role.findOne({ role: 'MERCHANT' });
    if (!merchantRole) {
      return res.status(404).json({
        success: false,
        message: 'MERCHANT role not found'
      });
    }

    user.role = merchantRole._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Merchant created successfully and user role updated',
      data: {
        merchant_id: newMerchant._id,
        user_id: newMerchant.user_id,
        company_name: newMerchant.company_name,
        company_email: newMerchant.company_email,
        company_phone_number: newMerchant.company_phone_number
      }
    });
  } catch (error) {
    console.error('Create minimal merchant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating merchant',
      error: error.message
    });
  }
};

exports.getBusinessName = async (req, res) => {
  try {
    const { user_id } = req.body;

    // ---------- 1. Validate ----------
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
      });
    }

    // ---------- 2. Get user + role ObjectId ----------
    const user = await User.findById(user_id).select('role').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const roleId = user.role;               // <-- ObjectId
    // ---------- 3. Resolve role string ----------
    const roleDoc = await Role.findById(roleId).select('role').lean();

    if (!roleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Role not found for this user',
      });
    }

    const roleName = roleDoc.role.toUpperCase();   // e.g. "MERCHANT"
    // ---------- 4. Business logic ----------
    if (roleName === 'MERCHANT') {
      const merchant = await Merchant.findOne({ user_id })
        .select('company_name')
        .lean();

      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          role: 'MERCHANT',
          business_name: merchant.company_name,
        },
      });
    }

    if (roleName === 'SERVICE_PROVIDER') {
      const serviceProvider = await ServiceProvider.findOne({ user_id })
        .select('travels_name')
        .lean();

      if (!serviceProvider) {
        return res.status(404).json({
          success: false,
          message: 'Service provider profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          role: 'SERVICE_PROVIDER',
          business_name: serviceProvider.travels_name,
        },
      });
    }

    // ---------- 5. Unknown role ----------
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be MERCHANT or SERVICE_PROVIDER',
    });
  } catch (error) {
    console.error('Error in getBusinessName:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.checkUserBannerStatus = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // Find banner for this user
    const banner = await Banner.findOne({ user_id })
      .select('rectangle_logo role')
      .lean();

    // Default: no banner
    let hasValidBanner = false;

    if (banner && banner.rectangle_logo && banner.rectangle_logo.trim() !== "") {
      hasValidBanner = true;
    }

    return res.status(200).json({
      success: true,
      data: {
        hasValidBanner,
        role: banner?.role || null,
      },
    });
  } catch (error) {
    console.error("Error in checkUserBannerStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.getLowProgressMerchants = async (req, res) => {
  try {
    let { page = 1, limit = 10, unread_only } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = {
      merchant_progress: { $lt: 50 }
    };

    if (unread_only === "true") {
      filter.mark_as_read = false;
    }

    const total = await Merchant.countDocuments(filter);

    const merchants = await Merchant.find(filter)
      .sort({ merchant_progress: 1 })  // lowest progress first
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      current_page: page,
      total_pages: Math.ceil(total / limit),
      data: merchants,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.markMerchantAsRead = async (req, res) => {
  try {
    const { merchant_id } = req.params;

    const merchant = await Merchant.findById(merchant_id);
    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant not found" });
    }

    merchant.mark_as_read = true;
    merchant.last_activity = new Date();

    await merchant.save();

    // Also mark the associated User as read to clear global notifications
    if (merchant.user_id) {
      await User.findByIdAndUpdate(merchant.user_id, { markAsRead: true });
    }

    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({
      success: true,
      message: "Merchant marked as read",
      data: merchant,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find()
      .sort({ mark_as_read: 1, createdAt: -1 })
      .populate({
        path: "user_id",
        select: "name email phone user_code isActive",
      })
      .populate({
        path: "address_id",
        select: "street city state country postal_code",
      })
      .populate({
        path: "company_type",
        select: "name displayName",
      });

    // ✅ Step 1.1: Collect merchant user_ids for address lookup
    const userIds = merchants
      .map((m) => m.user_id?._id || m.user_id)
      .filter((id) => id);

    // ✅ Step 1.2: Fetch all company addresses in ONE query
    const companyAddresses = await Address.find({
      user_id: { $in: userIds },
      entity_type: "merchant",
      address_type: "company",
    });

    const addressMap = {};
    companyAddresses.forEach((addr) => {
      addressMap[addr.user_id.toString()] = addr;
    });

    // ✅ Step 1.3: Collect string ObjectIds for company types
    const stringIds = merchants
      .filter(
        (m) =>
          typeof m.company_type === "string" &&
          mongoose.Types.ObjectId.isValid(m.company_type)
      )
      .map((m) => m.company_type);

    // ✅ Step 2: Fetch all matching company types in ONE query
    const companyTypes = await CompanyType.find({
      _id: { $in: stringIds },
    }).select("name displayName");

    // ✅ Step 3: Create lookup map
    const companyTypeMap = {};
    companyTypes.forEach((ct) => {
      companyTypeMap[ct._id.toString()] =
        ct.displayName || ct.name || "-";
    });

    // ✅ Step 4: Normalize merchants
    const cleanedMerchants = merchants.map((merchant) => {
      const merchantObj = merchant.toObject();

      let companyTypeData = "-";

      // Case 1: populated object
      if (
        merchantObj.company_type &&
        typeof merchantObj.company_type === "object" &&
        merchantObj.company_type._id
      ) {
        companyTypeData = {
          _id: merchantObj.company_type._id,
          name: merchantObj.company_type.name || merchantObj.company_type.displayName || "-"
        };
      }

      // Case 2: string id (legacy/unpopulated)
      else if (
        typeof merchantObj.company_type === "string" &&
        companyTypeMap[merchantObj.company_type]
      ) {
        companyTypeData = {
          _id: merchantObj.company_type,
          name: companyTypeMap[merchantObj.company_type]
        };
      }

      return {
        ...merchantObj,
        company_type: companyTypeData, // returns object or "-"
        company_address: addressMap[merchantObj.user_id?._id?.toString() || merchantObj.user_id?.toString()] || null,
      };
    });

    res.status(200).json(cleanedMerchants);
  } catch (error) {
    console.error("Error fetching merchants:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMerchantById = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id)
      .populate({
        path: "user_id",
        select: "name email phone user_code isActive created_at",
      })
      .populate({
        path: "address_id",
        select: "street city state country postal_code",
      });

    // Also fetch the company address manually
    const companyAddress = await Address.findOne({
      user_id: merchant.user_id?._id || merchant.user_id,
      entity_type: "merchant",
      address_type: "company"
    });

    const merchantObj = merchant.toObject();
    merchantObj.company_address = companyAddress;

    res.status(200).json(merchantObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
