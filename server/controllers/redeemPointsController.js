const RedeemPoints = require("../models/redeemPointsModel");
const Merchant = require("../models/MerchantModel");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const ViewPoint = require("../models/viewPointsModel");
const Notification = require("../models/couponsNotificationModel");
const { getIo } = require("../socket/mainIndex");
const Role = require("../models/roleModel");
const axios = require("axios");
const Point = require("../models/pointsModel");
const CouponName = require("../models/couponModel");

exports.createRedeemPoint = async (req, res) => {
  try {
    const {
      user_id,
      coupon_id,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
    } = req.body;
    const redeemPoint = await RedeemPoints.create({
      user_id,
      coupon_id,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
    });
    res.status(201).json(redeemPoint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




exports.redeemPointsForStudent = async (req, res) => {
  try {
    const {
      user_id,
      coupon_id,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
    } = req.body;

    // Validate required fields
    if (!user_id || !coupon_id || !redeem_point || !reason) {
      return res.status(400).json({
        message: "User ID, Coupon ID, points, and reason are required",
      });
    }

    // Create a new redeem points entry
    const newRedeemPoint = new RedeemPoints({
      user_id,
      coupon_id,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
    });

    await newRedeemPoint.save();
    res
      .status(201)
      .json({ message: "Points redeemed successfully", data: newRedeemPoint });
  } catch (error) {
    console.error("Error redeeming points:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to redeem points" });
  }
};

// Get all Redeem Points
exports.getAllRedeemPoints = async (req, res) => {
  try {
    const redeemPoints = await RedeemPoints.find();
    res.json(redeemPoints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific Redeem Point by ID
exports.getRedeemPointById = async (req, res) => {
  try {
    const redeemPoint = await RedeemPoints.findById(req.params.id);
    if (!redeemPoint)
      return res.status(404).json({ message: "Redeem Point not found" });
    res.json(redeemPoint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a Redeem Point entry
exports.updateRedeemPoint = async (req, res) => {
  try {
    const {
      user_id,
      coupon_id,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
    } = req.body;
    const redeemPoint = await RedeemPoints.findById(req.params.id);
    if (!redeemPoint)
      return res.status(404).json({ message: "Redeem Point not found" });

    await redeemPoint.updateOne({
      user_id,
      coupon_id,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
    });
    res.json(redeemPoint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a Redeem Point entry
exports.deleteRedeemPoint = async (req, res) => {
  try {
    const redeemPoint = await RedeemPoints.findById(req.params.id);
    if (!redeemPoint)
      return res.status(404).json({ message: "Redeem Point not found" });

    await redeemPoint.deleteOne();
    res.json({ message: "Redeem Point deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.redeemPoints = async (req, res) => {
  try {
    const {
      user_id,
      coupon_id,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
      redemption_type
    } = req.body;
    // === BASIC VALIDATION ===
    if (!user_id || !redeem_point || !coupon_code || !reason) {
      return res.status(400).json({
        message: "All required fields (user_id, redeem_point, coupon_code, reason) must be provided",
      });
    }

    // === FETCH USER & ROLE SAFELY ===
    const user = await User.findById(user_id).select("name phone").populate({ path: "role", select: "role" });
    if (!user || !user.role || !user.role.role) {
      return res.status(400).json({ success: false, message: "Invalid user or role" });
    }
    const userRoleName = user.role.role.trim();

    // === ROLE-BASED FIXED REDEEM AMOUNTS ===
    const RESTRICTED_ROLES = ["USER", "MERCHANT", "SERVICE_PROVIDER", "GROCERY_SELLER", "SUB_DEALER"];
    const ALLOWED_REDEEM_POINTS = [2500, 5000, 7500, 10000];

    if (RESTRICTED_ROLES.includes(userRoleName)) {
      if (!ALLOWED_REDEEM_POINTS.includes(Number(redeem_point))) {
        return res.status(400).json({
          success: false,
          message: `Only 2500, 5000, 7500 or 10000 points allowed for ${userRoleName}`,
          allowed_amounts: ALLOWED_REDEEM_POINTS
        });
      }
    }

    // === FETCH POINTS & USER NAME ===
    const viewPoint = await ViewPoint.findOne({ user_id }).populate("user_id", "name email");
    if (!viewPoint) {
      return res.status(404).json({ message: "User points not found" });
    }

    // === BLOCK PENDING REQUEST ===
    const existingPending = await RedeemPoints.findOne({ user_id, status: "pending" });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending redemption request. Please wait until it's approved or rejected.",
        pending_request: {
          coupon_code: existingPending.coupon_code,
          points: existingPending.redeem_point,
          requested_on: existingPending.created_at,
        },
      });
    }

    // === ELIGIBILITY ===
    if (viewPoint.view_points < 2500) {
      return res.status(400).json({ message: "User must have at least 2500 points to be eligible for redemption" });
    }
    if (redeem_point < 500) {
      return res.status(400).json({ message: "Minimum redeem points should be 500" });
    }
    if (viewPoint.view_points < redeem_point) {
      return res.status(400).json({ message: "Insufficient view points" });
    }

    // === COUPON VALIDATION ===
    let validatedCouponId = null;
    if (coupon_id) {
      const coupon = await CouponName.findById(coupon_id);
      if (!coupon) return res.status(404).json({ message: "Coupon not found" });
      validatedCouponId = coupon_id;
    }

    // === CALCULATE INR ===
    const redeemPointConfig = await Point.findOne({ point_name: "Redeem_Point" });
    if (!redeemPointConfig) {
      return res.status(500).json({ message: "Redemption configuration not found" });
    }
    const amount_in_inr = Math.round(redeem_point * (redeemPointConfig.point_amount / 100));

    // === CREATE REDEMPTION ===
    const redemption = new RedeemPoints({
      user_id,
      coupon_id: validatedCouponId,
      redeem_point,
      coupon_code,
      reason,
      letter_image_url,
      redemption_type, // Save the type
      status: "pending",
      amount_in_inr,
    });
    await redemption.save();

    // === NOTIFICATION (Improved with INR) ===
    const notificationMessage = `User ${viewPoint.user_id.name} requested to redeem ${redeem_point} points (₹${amount_in_inr} INR) (Coupon: ${coupon_code})`;

    const adminUsers = await User.find().populate({
      path: "role",
      match: { role: { $in: ["ADMIN", "SUB_ADMIN"] } },
    }).then(users => users.filter(u => u.role));

    const adminIds = adminUsers.map(a => a._id);

    const notification = new Notification({
      message: notificationMessage,
      recipient: adminIds,
      redeemPointsId: redemption._id,
      amount_sent: false,
    });
    await notification.save();

    // === SOCKET + SMS (OLD SMS FORMAT PRESERVED) ===
    if (adminIds.length > 0) {
      const populatedNotif = await Notification.findById(notification._id).populate({
        path: "redeemPointsId",
        populate: [
          { path: "user_id", select: "name" },
          { path: "coupon_id", select: "coupon_name" },
        ],
      });

      const io = getIo();
      if (io) {
        const ns = io.of("/coupons");
        adminIds.forEach(id => {
          ns.to(id.toString()).emit("newRedemption", {
            _id: notification._id,
            message: notificationMessage,
            created_at: notification.created_at,
            redeemPointsId: redemption._id,
            amount_sent: false,
            isRead: false,
            merchantName: populatedNotif.redeemPointsId?.user_id?.name || "Unknown",
            couponName: populatedNotif.redeemPointsId?.coupon_id?.coupon_name || "N/A",
            points: redeem_point,
            amount_in_inr,
          });
        });
      }

      // === SMS TO USER: REQUEST RECEIVED ===
      try {
        if (user.phone) {
          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const smsText = `Dear ${user.name}, your redeem request for Rs. ${amount_in_inr} submitted on ${currentDate} has been received and is under review. – HUNTSWORLD`;

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=${encodeURIComponent(smsText)}`;
          await axios.get(smsApiUrl);
        }
      } catch (err) {
        console.error(`SMS failed for user`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Redemption request submitted successfully",
      redemption: {
        id: redemption._id,
        coupon_code: redemption.coupon_code,
        points: redemption.redeem_point,
        amount_in_inr: redemption.amount_in_inr,
        status: redemption.status,
      },
    });

  } catch (error) {
    console.error("Redeem points error:", error);
    return res.status(500).json({
      message: "Error processing redemption request",
      error: error.message,
    });
  }
};

exports.getRedeemHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const history = await RedeemPoints.find({
      $or: [
        { status: { $in: ["approved", "rejected"] } },
        { amount_sent: true }           // completed cash transfers
      ]
    })
      .populate("user_id", "name email role")
      .populate("coupon_id", "coupon_name")
      .sort({ updatedAt: -1 })          // most recent first
      .skip(skip)
      .limit(Number(limit));

    const total = await RedeemPoints.countDocuments({
      $or: [
        { status: { $in: ["approved", "rejected"] } },
        { amount_sent: true }
      ]
    });

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error("Get redeem history error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markRedeemPointAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RedeemPoints.findByIdAndUpdate(
      id,
      { markAsRead: true },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "Request marked as read", request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
