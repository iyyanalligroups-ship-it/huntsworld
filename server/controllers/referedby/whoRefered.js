const User = require("../../models/userModel");
const Merchant = require("../../models/MerchantModel");
const Student = require("../../models/studentModel");
const GrocerySeller = require("../../models/grocerySellerModel");
const ServiceProvider = require("../../models/serviceProviderModel");
const Address = require("../../models/addressModel");

/**
 * GET /users/who-referred-me
 * Auth: authMiddleware (token required)
 *
 * Returns full profile of the user who referred the currently logged-in user.
 * A user can have MULTIPLE addresses (different entity_type / address_type),
 * so we fetch ALL of them and return as an array.
 */
exports.whoReferredMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ── Step 1: Get current user → referred_by ────────────────────────────────
    const currentUser = await User.findById(userId).select("referred_by").lean();
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!currentUser.referred_by) {
      return res.status(200).json({
        success: true,
        referred: false,
        message: "You were not referred by anyone.",
        data: null,
      });
    }

    // ── Step 2: Get the referrer user with role populated ─────────────────────
    const referrer = await User.findById(currentUser.referred_by)
      .select("name email phone referral_code role created_at")
      .populate("role", "role")
      .lean();

    if (!referrer) {
      return res.status(404).json({ success: false, message: "Referrer not found" });
    }

    const roleName = referrer.role?.role?.trim().toUpperCase();

    // ── Step 3: Fetch role-specific profile data ──────────────────────────────
    let profileData = null;

    if (roleName === "MERCHANT") {
      profileData = await Merchant.findOne({ user_id: referrer._id })
        .select("company_name company_email company_phone_number company_logo description verified_status merchant_code")
        .lean();

    } else if (roleName === "STUDENT") {
      profileData = await Student.findOne({ user_id: referrer._id })
        .select("college_name university_name college_email id_card verified student_code")
        .lean();

    } else if (roleName === "GROCERY_SELLER" || roleName === "BASE_MEMBER") {
      profileData = await GrocerySeller.findOne({ user_id: referrer._id })
        .select("shop_name shop_email shop_phone_number company_logo verified_status grocery_code member_type")
        .populate("member_type", "name")
        .lean();

    } else if (roleName === "SERVICE_PROVIDER") {
      profileData = await ServiceProvider.findOne({ user_id: referrer._id })
        .select("travels_name company_email company_phone_number company_logo verified_status")
        .lean();
    }

    // ── Step 4: Fetch ALL addresses for the referrer user ────────────────────
    // A single user can have multiple addresses with different entity_type
    // (user, merchant, student, grocery_seller, service_provider, etc.)
    // and address_type (personal, company).
    // We fetch ALL and let the frontend display each one clearly.
    const allAddresses = await Address.find({ user_id: referrer._id })
      .select("address_line_1 address_line_2 city state country pincode entity_type address_type")
      .sort({ entity_type: 1, address_type: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      referred: true,
      data: {
        user: {
          _id: referrer._id,
          name: referrer.name,
          email: referrer.email,
          phone: referrer.phone,
          referral_code: referrer.referral_code,
          role: referrer.role?.role,
          joined: referrer.created_at,
        },
        profile: profileData || null,
        // Array of all addresses — may include personal, company, merchant, etc.
        addresses: allAddresses,
      },
    });

  } catch (error) {
    console.error("whoReferredMe Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch referrer details",
      error: error.message,
    });
  }
};

/**
 * GET /users/search-referrer?q=...
 * Search for users by email, phone, or referral_code.
 */
exports.searchReferrer = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(400).json({ success: false, message: "Search query must be at least 3 characters." });
    }

    const queryStr = q.trim();

    const users = await User.find({
      $or: [
        { email: new RegExp(`^${queryStr}$`, "i") },
        { phone: new RegExp(`^${queryStr}$`, "i") },
        { referral_code: new RegExp(`^${queryStr}$`, "i") }
      ]
    })
      .select("name email phone referral_code role")
      .populate("role", "role")
      .limit(10)
      .lean();

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("searchReferrer error:", error);
    return res.status(500).json({ success: false, message: "Server error during search." });
  }
};

/**
 * PUT /users/update-referrer
 * Body: { referrer_id: "..." }
 * Update the logged-in user's referred_by field.
 */
exports.updateReferrer = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { referrer_id } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!referrer_id) return res.status(400).json({ success: false, message: "Referrer ID is required." });

    if (userId.toString() === referrer_id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot refer yourself." });
    }

    // Verify referrer exists
    const referrerExists = await User.findById(referrer_id).select("_id").lean();
    if (!referrerExists) {
      return res.status(404).json({ success: false, message: "Selected user not found." });
    }

    // Update current user
    await User.findByIdAndUpdate(userId, { referred_by: referrer_id });

    return res.status(200).json({ success: true, message: "Referrer updated successfully!" });
  } catch (error) {
    console.error("updateReferrer error:", error);
    return res.status(500).json({ success: false, message: "Server error while updating referrer." });
  }
};

/**
 * DELETE /users/delete-referrer
 * Remove the logged-in user's referred_by field.
 */
exports.deleteReferrer = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Update current user to remove the referred_by field
    await User.findByIdAndUpdate(userId, { $unset: { referred_by: 1 } });

    return res.status(200).json({ success: true, message: "Referrer removed successfully!" });
  } catch (error) {
    console.error("deleteReferrer error:", error);
    return res.status(500).json({ success: false, message: "Server error while removing referrer." });
  }
};
