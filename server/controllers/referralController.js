const User = require("../models/userModel");
const ReferralCommission = require("../models/referralCommissionModel");
const PaymentAccount = require("../models/paymentAccountModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");

// 1. Get Referral List & Stats for logged-in user
exports.getReferralData = async (req, res) => {
  try {
    const referrerId = req.user.userId;

    // Get all users referred by this person who are verified
    const referrals = await User.find({
      referred_by: referrerId,
      $or: [{ email_verified: true }, { number_verified: true }]
    }).select("name email phone created_at role").populate('role');

    // Calculate Stats
    const commissions = await ReferralCommission.find({ referrer_id: referrerId });

    const stats = {
      total_earned: commissions.reduce((sum, c) => sum + c.commission_amount, 0),
      claimed_amount: commissions.filter(c => c.status === "PAID").reduce((sum, c) => sum + c.commission_amount, 0),
      request_pending_amount: commissions.filter(c => c.status === "CLAIM_REQUESTED").reduce((sum, c) => sum + c.commission_amount, 0),
      available_to_claim: commissions.filter(c => c.status === "EARNED").reduce((sum, c) => sum + c.commission_amount, 0),
    };

    res.status(200).json({ success: true, referrals, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Initiate Claim Request
exports.requestClaim = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user has a payment account
    const account = await PaymentAccount.findOne({ user_id: userId, is_active: true });
    // controller logic
    if (!account) {
      return res.status(400).json({
        success: false, // Ensure this is here
        message: "Please add your Bank or UPI details in 'Payment Accounts' before claiming."
      });
    }

    // Update all EARNED commissions to CLAIM_REQUESTED
    const result = await ReferralCommission.updateMany(
      { referrer_id: userId, status: "EARNED" },
      { $set: { status: "CLAIM_REQUESTED", claim_request_date: new Date(), markAsRead: false } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "No earnings available to claim." });
    }

    // 🔥 Real-time notification to admin
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
      // Also send a specific event for the toast
      if (adminHelpers.notifyNewRegistration) {
          await adminHelpers.notifyNewRegistration("referral-claim", { 
              userId, 
              count: result.modifiedCount 
          });
      }
    }

    res.status(200).json({ success: true, message: "Claim request submitted to admin." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Admin: View All Claim Requests (Paginated)
exports.adminGetAllClaims = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalClaims = await ReferralCommission.countDocuments({ status: "CLAIM_REQUESTED" });
    
    const claims = await ReferralCommission.find({ status: "CLAIM_REQUESTED" })
      .populate("referrer_id", "name email phone")
      .populate("referred_user_id", "name")
      .sort({ claim_request_date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out claims where user accounts have been deleted
    const validClaims = claims.filter(c => c.referrer_id && c.referred_user_id);

    res.status(200).json({ 
      success: true, 
      claims: validClaims,
      total: totalClaims,
      totalPages: Math.ceil(totalClaims / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Admin: Mark as Paid
exports.adminMarkAsPaid = async (req, res) => {
  try {
    const { commissionIds, remarks } = req.body;
    await ReferralCommission.updateMany(
      { _id: { $in: commissionIds } },
      { $set: { status: "PAID", paid_at: new Date(), admin_remarks: remarks, markAsRead: true } }
    );

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "Commissions marked as paid." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getUserPaymentAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const account = await PaymentAccount.findOne({
      user_id: userId,
      is_active: true
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No active payment account found for this user."
      });
    }

    res.status(200).json({ success: true, account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReferralData = async (req, res) => {
  try {
    const referrerId = req.user.userId;

    // 1. Get verified referrals
    const referrals = await User.find({
      referred_by: referrerId,
      $or: [{ email_verified: true }, { number_verified: true }]
    }).select("name email phone created_at role").populate('role');

    // 2. Get detailed commission history (sorted by newest first)
    const commissionHistory = await ReferralCommission.find({ referrer_id: referrerId })
      .populate("referred_user_id", "name") // So we see who bought the plan
      .sort({ createdAt: -1 });

    // 3. Calculate Stats
    const stats = {
      total_earned: commissionHistory.reduce((sum, c) => sum + c.commission_amount, 0),
      claimed_amount: commissionHistory.filter(c => c.status === "PAID").reduce((sum, c) => sum + c.commission_amount, 0),
      request_pending_amount: commissionHistory.filter(c => c.status === "CLAIM_REQUESTED").reduce((sum, c) => sum + c.commission_amount, 0),
      available_to_claim: commissionHistory.filter(c => c.status === "EARNED").reduce((sum, c) => sum + c.commission_amount, 0),
    };

    res.status(200).json({
      success: true,
      referrals,
      commissionHistory, // New field
      stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all settled/paid commissions for Admin History (Paginated)
exports.adminGetPayoutHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalHistory = await ReferralCommission.countDocuments({ status: "PAID" });

    const history = await ReferralCommission.find({ status: "PAID" })
      .populate("referrer_id", "name email phone user_code")
      .populate("referred_user_id", "name")
      .sort({ paid_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out records for deleted users
    const validHistory = history.filter(h => h.referrer_id && h.referred_user_id);

    res.status(200).json({ 
      success: true, 
      history: validHistory,
      total: totalHistory,
      totalPages: Math.ceil(totalHistory / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------
// Mark Referral as Read
// --------------------------------------------------
exports.markReferralAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const referral = await ReferralCommission.findByIdAndUpdate(
      id,
      { markAsRead: true },
      { new: true }
    );

    if (!referral) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "Referral marked as read", data: referral });
  } catch (error) {
    console.error("markReferralAsRead error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
