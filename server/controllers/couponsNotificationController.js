const mongoose = require("mongoose");
const Notification = require("../models/couponsNotificationModel");
const ViewPoint = require("../models/viewPointsModel");
const RedeemPoints = require("../models/redeemPointsModel");
const Role = require("../models/roleModel");
const CouponName = require("../models/couponModel");
const User = require("../models/userModel");
const Merchant = require("../models/MerchantModel");
const GrocerySeller = require("../models/grocerySellerModel");
const axios = require("axios");

// const io = getIo();

// exports.getNotifications = async (req, res) => {
//   try {
//     const userId = req.params.userId?.toString();
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;
//     const skip = (page - 1) * limit;

//     

//     // Count only notifications that have a valid redeemPointsId
//     const total = await Notification.countDocuments({
//       recipient: userId,
//       redeemPointsId: { $exists: true, $ne: null },
//     });

//     const notifications = await Notification.find({
//       recipient: userId,
//       redeemPointsId: { $exists: true, $ne: null },
//     })
//       .populate("recipient", "name email")
//       .populate({
//         path: "redeemPointsId",
//         populate: [
//           {
//             path: "user_id",
//             model: "User",
//             select: "name email role company_name company_phone_number",
//           },
//           {
//             path: "coupon_id",
//             select: "coupon_name",
//           },
//         ],
//       })
//       .populate({
//         path: "readBy.userId",
//         model: "User",
//         select: "name email role",
//       })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     // Extra safety: filter out null redeemPointsId just in case
//     const validNotifications = notifications.filter(
//       (n) => n.redeemPointsId !== null
//     );

//     const notificationsWithStatus = validNotifications.map((notification) => {
//       const isRead = notification.readBy?.some((read) => {
//         const readUserId = read.userId?._id?.toString() || read.userId?.toString();
//         return readUserId === userId;
//       });

//       const redeem = notification.redeemPointsId;

//       return {
//         ...notification,
//         isRead: !!isRead,
//         redeemedBy: {
//           name: redeem?.user_id?.name || "N/A",
//           email: redeem?.user_id?.email || "N/A",
//         },
//         couponName: redeem?.coupon_id?.coupon_name || "N/A",
//         readBy: (notification.readBy || []).map((r) => ({
//           userId: r.userId?._id?.toString() || r.userId?.toString(),
//           name: r.userId?.name || "Unknown",
//           readAt: r.readAt,
//         })),
//       };
//     });

//     res.status(200).json({
//       success: true,
//       notifications: notificationsWithStatus,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("getNotifications error:", error);
//     res.status(500).json({
//       message: "Error fetching notifications",
//       error: error.message,
//     });
//   }
// };


exports.getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId?.toString();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'all';
    const skip = (page - 1) * limit;
    const query = {
      recipient: userId,
      redeemPointsId: { $exists: true, $ne: null },
      $or: [{ amount_sent: false }, { amount_sent: { $exists: false } }],
    };

    if (status === 'read') {
      query['readBy.userId'] = userId;
    } else if (status === 'unread') {
      query['readBy.userId'] = { $ne: userId };
    }

    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .populate("recipient", "name email")
      .populate({
        path: "redeemPointsId",
        select: "user_id coupon_id redeem_point coupon_code reason letter_image_url amount_in_inr",
        populate: [
          {
            path: "user_id",
            model: "User",
            select: "name email company_name company_phone_number role",
            populate: {
              path: "role", // This is the key!
              model: "Role", // Make sure model name is correct (usually "Role")
              select: "role slug", // e.g., { _id: "...", name: "merchant", slug: "merchant" }
            },
          },
          {
            path: "coupon_id",
            model: "CouponName",
            select: "coupon_name",
          },
        ],
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const validNotifications = notifications.filter((n) => n.redeemPointsId !== null);

    const notificationsWithStatus = validNotifications.map((notification) => {
      const redeem = notification.redeemPointsId;
      const user = redeem?.user_id;

      const isRead = notification.readBy?.some((read) => {
        const readUserId = read.userId?._id?.toString() || read.userId?.toString();
        return readUserId === userId;
      });

      return {
        ...notification,
        isRead: !!isRead,
        redeemedBy: {
          name: user?.name || "N/A",
          email: user?.email || "N/A",
        },
        role: user?.role?.name || "unknown", // Now you get "merchant", "admin", etc.
        roleSlug: user?.role?.slug || null,
        couponName: redeem?.coupon_id?.coupon_name || "N/A",
        merchantName: user?.company_name || user?.name || "N/A",
        amount_in_inr: redeem?.amount_in_inr || 0,
        letterImageUrl: redeem?.letter_image_url || null,
        readBy: (notification.readBy || []).map((r) => ({
          userId: r.userId?._id?.toString() || r.userId?.toString(),
          name: r.userId?.name || "Unknown",
          readAt: r.readAt,
        })),
      };
    });

    res.status(200).json({
      success: true,
      notifications: notificationsWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};
exports.getAllRedeemRequests = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate({
        path: "redeemPointsId",
        populate: [
          { path: "user_id", select: "name email" },
          { path: "coupon_id", select: "coupon_name" },
        ],
      })
      .lean();

    const notificationsWithStatus = notifications.map((notification) => {
      const isRead = notification.readBy.some(
        (read) => read.userId.toString() === req.query.userId
      );
      return {
        ...notification,
        isRead,
        merchantName: notification.redeemPointsId?.user_id?.name,
        couponName: notification.redeemPointsId?.coupon_id?.coupon_name,
      };
    });

    res.status(200).json({
      success: true,
      notifications: notificationsWithStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching redeem requests",
      error: error.message,
    });
  }
};


exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId, userId } = req.body;
     // Debug log

    if (!notificationId || !userId) {
      return res.status(400).json({ message: "Notification ID and User ID are required" });
    }

    const notification = await Notification.findById(notificationId).populate({
      path: "redeemPointsId",
      populate: [
        { path: "user_id", select: "name email" },
        { path: "coupon_id", select: "coupon_name" },
      ],
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notification.recipient.some((r) => r.toString() === userId.toString())) {
      return res.status(403).json({ message: "User is not a recipient of this notification" });
    }

    if (!notification.readBy.some((read) => read.userId.toString() === userId)) {
      notification.readBy.push({ userId, readAt: new Date() });
      await notification.save();
    }

    // Get Socket.IO instance
    const io = req.app.get("io") || global.io;
    if (!io) {
      console.error("Socket.IO instance not found");
      return res.status(200).json({
        message: "Notification marked as read, but failed to emit socket update",
      });
    }

    // Emit to all recipients
    notification.recipient.forEach((recipientId) => {
      io.to(recipientId.toString()).emit("notificationUpdated", {
        _id: notification._id,
        message: notification.message,
        created_at: notification.created_at,
        redeemPointsId: notification.redeemPointsId?._id,
        amount_sent: notification.amount_sent,
        notes: notification.notes,
        isRead: notification.readBy.some(
          (read) => read.userId.toString() === recipientId.toString()
        ),
        merchantName: notification.redeemPointsId?.user_id?.name,
        couponName: notification.redeemPointsId?.coupon_id?.coupon_name,
      });
    });

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

exports.markNotificationAsUnread = async (req, res) => {
  try {
    const { notificationId, userId } = req.body;

    if (!notificationId || !userId) {
      return res
        .status(400)
        .json({ message: "Notification ID and User ID are required" });
    }

    const notification = await Notification.findById(notificationId).populate({
      path: "redeemPointsId",
      populate: [
        { path: "user_id", select: "name email" },
        { path: "coupon_id", select: "coupon_name" },
      ],
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notification.recipient.some((r) => r.toString() === userId.toString())) {
      return res
        .status(403)
        .json({ message: "User is not a recipient of this notification" });
    }

    notification.readBy = notification.readBy.filter(
      (read) => read.userId.toString() !== userId
    );
    await notification.save();

    // Get Socket.IO instance
    const io = req.app.get("io") || global.io;
    if (!io) {
      console.error("Socket.IO instance not found");
      return res.status(200).json({
        message: "Notification marked as unread, but failed to emit socket update",
      });
    }

    // Emit to all recipients
    notification.recipient.forEach((recipientId) => {
      io.to(recipientId.toString()).emit("notificationUpdated", {
        _id: notification._id,
        message: notification.message,
        created_at: notification.created_at,
        redeemPointsId: notification.redeemPointsId?._id,
        amount_sent: notification.amount_sent,
        notes: notification.notes,
        isRead: notification.readBy.some(
          (read) => read.userId.toString() === recipientId.toString()
        ),
        merchantName: notification.redeemPointsId?.user_id?.name,
        couponName: notification.redeemPointsId?.coupon_id?.coupon_name,
      });
    });

    res.status(200).json({ message: "Notification marked as unread" });
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    res.status(500).json({
      message: "Error marking notification as unread",
      error: error.message,
    });
  }
};

exports.sendRedeemAmount = async (req, res) => {
  try {
    const { notificationId, receiverId, adminId } = req.body;

    if (!notificationId || !receiverId) {
      return res.status(400).json({ message: "Notification ID and Receiver ID are required" });
    }

    const notification = await Notification.findById(notificationId)
      .populate({
        path: "redeemPointsId",
        populate: [
          { path: "user_id", select: "name email" },
          { path: "coupon_id", select: "coupon_name" }
        ]
      });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const redemption = notification.redeemPointsId;
    if (!redemption) {
      return res.status(404).json({ message: "Redemption not found" });
    }

    if (!redemption.user_id?._id || redemption.user_id._id.toString() !== receiverId) {
      return res.status(404).json({ message: "Invalid receiver for this redemption" });
    }

    if (redemption.status === 'approved') {
      return res.status(400).json({ message: "This redemption has already been approved" });
    }

    const viewPoint = await ViewPoint.findOne({ user_id: receiverId });
    if (!viewPoint) {
      return res.status(404).json({ message: "ViewPoint not found for receiver" });
    }

    if (viewPoint.view_points < redemption.redeem_point) {
      return res.status(400).json({ message: "Insufficient view points" });
    }

    // 🔹 Deduct points
    viewPoint.view_points -= redemption.redeem_point;
    await viewPoint.save();

    // 🔹 Update redeem status
    await RedeemPoints.findByIdAndUpdate(
      redemption._id,
      { status: 'approved' },
      { new: true }
    );

    // 🔹 Update notification
    notification.amount_sent = true;
    if (adminId && !notification.readBy.some(r => r.userId.toString() === adminId)) {
      notification.readBy.push({ userId: adminId, readAt: new Date() });
    }
    await notification.save();

    // 🔹 Emit socket
    const io = req.app.get("io") || global.io;
    if (io) {
      notification.recipient.forEach(recipientId => {
        io.to(recipientId.toString()).emit("notificationUpdated", {
          _id: notification._id,
          message: notification.message,
          created_at: notification.created_at,
          redeemPointsId: redemption._id,
          amount_sent: true,
          notes: notification.notes,
          isRead: notification.readBy.some(r => r.userId.toString() === recipientId.toString()),
          merchantName: redemption.user_id?.name,
          couponName: redemption.coupon_id?.coupon_name,
        });
      });

      io.to(receiverId.toString()).emit("pointsUpdated", {
        view_points: viewPoint.view_points
      });
    }

    // =========================================================
    // 🔥 SMS SECTION (User.phone FIRST)
    // =========================================================
    try {
      let phoneNumber = null;

      // 🔹 1️⃣ Get user directly
      const user = await User.findById(receiverId)
        .select("name phone role");

      if (user) {

        // 🔹 FIRST PRIORITY → User.phone
        if (user.phone && user.phone.trim() !== "") {
          phoneNumber = user.phone;
        }

        // 🔹 SECOND → Merchant model
        if (!phoneNumber) {
          const merchant = await Merchant.findOne({ user_id: receiverId })
            .select("company_phone_number");

          if (merchant?.company_phone_number) {
            phoneNumber = merchant.company_phone_number;
          }
        }

        // 🔹 THIRD → GrocerySeller model
        if (!phoneNumber) {
          const grocery = await GrocerySeller.findOne({ user_id: receiverId })
            .select("shop_phone_number");

          if (grocery?.shop_phone_number) {
            phoneNumber = grocery.shop_phone_number;
          }
        }

        // 🔹 Send SMS if number found
        if (phoneNumber) {

          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const smsText = `Dear ${user.name}, your redeem request for Rs. ${redemption.amount_in_inr} submitted on ${currentDate} has been approved. The coupon code has been sent to your registered email. – HUNTSWORLD`;

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${phoneNumber}&text=${encodeURIComponent(smsText)}`;

          await axios.get(smsApiUrl);
        } else {
        }
      }

    } catch (smsError) {
      console.error("SMS sending failed:", smsError.message);
    }
    // =========================================================
    // =========================================================

    res.status(200).json({
      success: true,
      message: "Amount sent and redemption approved successfully",
      status: "approved"
    });

  } catch (error) {
    console.error("Error sending redeem amount:", error);
    res.status(500).json({
      message: "Error sending redeem amount",
      error: error.message
    });
  }
};
exports.rejectRedeemRequest = async (req, res) => {
  try {
    const { notificationId, adminId, reason } = req.body; // reason is optional

    if (!notificationId) {
      return res.status(400).json({ message: "notificationId is required" });
    }

    // Get notification + populate redemption
    const notification = await Notification.findById(notificationId)
      .populate({
        path: "redeemPointsId",
        populate: { path: "user_id", select: "name email" }
      });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const redemption = notification.redeemPointsId;
    if (!redemption) {
      return res.status(404).json({ message: "Redemption record not found" });
    }

    // Prevent rejecting already processed request
    if (redemption.status === 'approved') {
      return res.status(400).json({ message: "This request has already been approved" });
    }
    if (redemption.status === 'rejected') {
      return res.status(400).json({ message: "This request has already been rejected" });
    }

    // UPDATE STATUS TO 'rejected'
    await RedeemPoints.findByIdAndUpdate(
      redemption._id,
      {
        status: 'rejected',
        reject_reason: reason || "Not eligible" // optional field
      },
      { new: true }
    );

    // Mark notification as processed
    notification.amount_sent = true;
    if (adminId && !notification.readBy.some(r => r.userId.toString() === adminId)) {
      notification.readBy.push({ userId: adminId, readAt: new Date() });
    }
    await notification.save();

    // Emit real-time update
    const io = req.app.get("io") || global.io;
    if (io) {
      const userId = redemption.user_id._id.toString();

      // Notify admins
      notification.recipient.forEach(id => {
        io.to(id.toString()).emit("notificationUpdated", {
          _id: notification._id,
          amount_sent: true,
          status: 'rejected',
          message: notification.message,
        });
      });

      // Notify user
      io.to(userId).emit("redemptionRejected", {
        message: "Your redemption request was rejected",
        reason: reason || "Not eligible",
        coupon_code: redemption.coupon_code,
        points: redemption.redeem_point
      });

      // 🔥 REJECTION SMS
      try {
        const user = await User.findById(userId)
          .select("name phone");

        if (user && user.phone) {
          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const smsText = `Dear ${user.name}, your redeem request for Rs. ${redemption.amount_in_inr} submitted on ${currentDate} has been rejected. Kindly contact admin/support for assistance. – HUNTSWORLD`;

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=${encodeURIComponent(smsText)}`;

          await axios.get(smsApiUrl);
        }
      } catch (smsError) {
        console.error("Redeem rejection SMS failed:", smsError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Redemption request rejected successfully",
      status: "rejected"
    });

  } catch (error) {
    console.error("Error rejecting redemption:", error);
    return res.status(500).json({
      message: "Failed to reject redemption",
      error: error.message
    });
  }
};

exports.getCouponNotificationDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // Use userId from req.user
   // Debugging

  const notification = await Notification.findById(id)
    .populate('recipient', 'name email')
    .populate({
      path: 'redeemPointsId',
      populate: [
        { path: 'user_id', select: 'name phone email' },
        { path: 'coupon_id', select: 'coupon_name' }, // Assuming CouponName model has a 'name' field
      ],
    })
    .lean();

  if (!notification) {
    res.status(404);
    throw new Error('Coupon notification not found');
  }

  // Check if the user is a recipient or admin
  const isRecipient = notification.recipient.some((recipient) =>
    recipient._id.equals(userId)
  );
  if (!isRecipient && req.user.role.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Not authorized to view this notification');
  }

  const isRead = notification.readBy.some((read) =>
    read.userId.equals(userId)
  );

  res.status(200).json({
    success: true,
    data: {
      ...notification,
      isRead,
      merchantName: notification.redeemPointsId?.user_id?.name || 'Unknown',
      couponName: notification.redeemPointsId?.coupon_id?.coupon_name || 'Unknown',
      redeemPoints: notification.redeemPointsId?.redeem_point || 0,
      reason: notification.redeemPointsId?.reason || '',
      couponCode: notification.redeemPointsId?.coupon_code || 'N/A',
      letterImageUrl: notification.redeemPointsId?.letter_image_url || null,
    },
  });
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params; // or req.body — choose one
    const { userId } = req.body;           // we'll verify the user is allowed to delete

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required"
      });
    }

    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Authorization check - only allow the recipient (or admin) to delete
    // Adjust logic based on your app rules
    const isRecipient = notification.recipient.some(
      (rec) => rec.toString() === userId?.toString()
    );

    // Optional: allow admins to delete any notification
    // const isAdmin = req.user?.role === 'admin'; // if you have auth middleware

    if (!isRecipient /* && !isAdmin */) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this notification"
      });
    }

    // Optional: only allow deletion if it's already processed (amount_sent = true)
    // if (!notification.amount_sent) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cannot delete pending redemption notifications"
    //   });
    // }

    // Perform the deletion
    await Notification.findByIdAndDelete(notificationId);

    // Optional: emit socket event to update UI in real-time
    const io = req.app.get("io") || global.io;
    if (io) {
      // Notify all recipients that this notification was deleted
      notification.recipient.forEach((recipientId) => {
        io.to(recipientId.toString()).emit("notificationDeleted", {
          notificationId: notification._id.toString(),
        });
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      deletedId: notificationId,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};
