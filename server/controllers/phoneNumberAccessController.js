const PhoneNumberAccessRequest = require('../models/phoneNumberAccessRequestModel');
const UserSubscription = require('../models/userSubscriptionPlanModel');
const Merchant = require('../models/MerchantModel');
const User = require('../models/userModel');
const { STATUS } = require('../constants/subscriptionConstants');
const PhoneVisibility = require('../models/phoneVisibilityModel');
// Request phone number access
exports.requestPhoneNumberAccess = async (req, res) => {
  console.error("**************************************************");
  console.error("DEBUG_CONTROLLER: Entering requestPhoneNumberAccess");
  console.error("BODY:", JSON.stringify(req.body));
  console.error("**************************************************");
  try {
    const { customer_id, seller_id, merchant_id } = req.body;

    if (!customer_id || !seller_id || !merchant_id) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Merchant details
    const merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(404).json({ message: 'Merchant not found.' });

    if (merchant._id.toString() !== seller_id) {
      return res.status(400).json({ message: 'Invalid seller_id or merchant_id.' });
    }

    // Merchant User
    const merchantUserId = merchant.user_id;
    const merchantUser = await User.findById(merchantUserId);
    if (!merchantUser) return res.status(404).json({ message: 'Merchant user not found.' });

    // -------------------------------
    // INLINE PHONE FINDING LOGIC
    // -------------------------------
    let phone = merchantUser.phone;

    if (!phone) {
      const merchantFromUser = await Merchant.findOne({ user_id: merchantUserId });
      if (merchantFromUser && merchantFromUser.company_phone_number) {
        phone = merchantFromUser.company_phone_number;
      }
    }
    // Now "phone" contains either user phone OR company phone (fallback)
    // -------------------------------

    // ⛔ Prevent Self Request
    if (customer_id.toString() === merchantUserId.toString()) {
      if (!phone) {
        return res.status(404).json({ message: "Phone number not available." });
      }

      return res.status(200).json({
        phone_number: phone,
        message: 'Self request detected. Showing phone number.',
      });
    }
    // ✅ Check subscription FIRST (must have subscription)
    const subscription = await UserSubscription.findOne({
      user_id: merchantUserId,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
      captured: true,
      end_date: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    console.error("DEBUG_CONTROLLER: Subscription found:", JSON.stringify(subscription, null, 2));

    if (!subscription) {
      // Check if they HAVE a subscription but it's just not active/paid
      const anySubscription = await UserSubscription.findOne({ user_id: merchantUserId }).sort({ createdAt: -1 });
      
      if (anySubscription) {
        if (anySubscription.plan_snapshot?.plan_code?.toUpperCase() === "FREE") {
          return res.status(403).json({
            message: "This merchant is on a FREE plan. Phone number viewing is restricted for FREE plan merchants.",
          });
        }
        
        if (anySubscription.end_date && anySubscription.end_date < new Date()) {
          return res.status(403).json({
            message: "Merchant's subscription has expired. Phone number viewing is restricted.",
          });
        }

        if (!anySubscription.captured) {
          return res.status(403).json({
            message: "Merchant's subscription payment is pending or not captured. Phone number viewing is restricted.",
          });
        }
      }

      return res.status(403).json({
        message: "No active paid subscription found for this merchant. Phone number viewing is restricted.",
      });
    }

    if (subscription.plan_snapshot?.plan_code?.toUpperCase() === "FREE") {
      console.error("DEBUG_CONTROLLER: Blocking due to FREE plan");
      return res.status(403).json({
        message: "This merchant is on a FREE plan. Phone number viewing is restricted for FREE plan merchants.",
      });
    }
    // ✅ Now check visibility (only after subscription check)
    const phoneVisibility = await PhoneVisibility.findOne({ user_id: merchantUserId });

    if (phoneVisibility && phoneVisibility.is_phone_number_view === true) {
      if (!phone) {
        return res.status(404).json({ message: "Phone number not available." });
      }

      return res.status(200).json({
        phone_number: phone,
        message: "Merchant allowed public phone visibility. No request required.",
      });
    }

    // Customer check
    const customer = await User.findById(customer_id);
    if (!customer) return res.status(404).json({ message: "Account not found." });

    // ❗ Check existing request
    const existingRequest = await PhoneNumberAccessRequest.findOne({
      customer_id,
      seller_id: merchantUserId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      if (existingRequest.status === "approved" && existingRequest.expiry_date > new Date()) {
        if (!phone) {
          return res.status(404).json({ message: "Phone number not available." });
        }

        return res.status(200).json({
          phone_number: phone,
          message: "Phone number already approved.",
        });
      }
      return res.status(400).json({ message: "A request is already pending or approved." });
    }

    // Create new request
    const request = new PhoneNumberAccessRequest({
      customer_id,
      seller_id: merchantUserId,
      merchant_id,
    });
    const savedRequest = await request.save();
    // Emit notification
    const notificationData = {
      _id: savedRequest._id,
      customer_id: { name: customer.name, email: customer.email },
      seller_id: merchantUserId,
      merchant_id,
      message: `New phone number access request from ${customer.name}.`,
      createdAt: savedRequest.createdAt, // Standard field from timestamps
      created_at: savedRequest.createdAt, // Fallback for various UI implementations
      request_date: savedRequest.request_date,
      is_read: false,
      status: "pending",
    };

    if (global.io) {
      global.io
        .of("/phone-number-access-notifications")
        .to(merchantUserId.toString())
        .emit("newPhoneNumberRequest", notificationData);
    } else {
      console.error("DEBUG_CONTROLLER: global.io NOT FOUND - Notification NOT emitted");
    }

    return res.status(201).json({
      success: true,
      message: "Phone number access request sent.",
      data: savedRequest
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

// controllers/phoneNumberAccessController.js (or wherever your controllers are)

exports.approvePhoneNumberAccess = async (req, res) => {
  try {
    const { request_id } = req.body;

    // Find and populate more fields so we can send better info to customer
    const request = await PhoneNumberAccessRequest.findById(request_id)
      .populate('seller_id', 'phone')   // User only has phone
      .populate('merchant_id', 'company_name'); // Merchant has company_name

    if (!request || request.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid or already processed request.' });
    }

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    request.status = 'approved';
    request.approval_date = new Date();
    request.expiry_date = threeMonthsFromNow;
    await request.save();

    // ────────────────────────────────────────────────────────────────
    // IMPROVED EMIT – send merchant name + phone + expiry
    // ────────────────────────────────────────────────────────────────
    const merchantName = request.merchant_id?.company_name
      || "the merchant";

    global.io
      .of("/phone-number-access-notifications")
      .to(request.customer_id.toString())           // ← send to CUSTOMER's room
      .emit("phoneNumberRequestApproved", {
        _id: request._id,
        seller_id: request.seller_id._id,
        merchant_id: request.merchant_id?._id, // Added merchant_id for frontend comparison
        merchant_name: merchantName,
        phone_number: request.seller_id.phone,
        message: `Your phone number access request has been approved by ${merchantName}.`,
        createdAt: request.createdAt,
        expiry_date: request.expiry_date.toISOString(),
        approved_at: request.approval_date.toISOString(),
        status: "approved"
      });

    res.status(200).json({
      success: true,
      message: 'Request approved.',
      expiry_date: request.expiry_date
    });

  } catch (error) {
    console.error("Error approving phone access:", error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Reject phone number access
exports.rejectPhoneNumberAccess = async (req, res) => {
  try {
    const { request_id } = req.body;

    const request = await PhoneNumberAccessRequest.findById(request_id)
      .populate('merchant_id', 'company_name');

    if (!request || request.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid or already processed request.' });
    }

    request.status = 'rejected';
    await request.save();

    // ────────────────────────────────────────────────────────────────
    // Send rejection with merchant name
    // ────────────────────────────────────────────────────────────────
    const merchantName = request.merchant_id?.company_name
      || "the merchant";

    global.io
      .of("/phone-number-access-notifications")
      .to(request.customer_id.toString())           // ← to CUSTOMER
      .emit("phoneNumberRequestRejected", {
        _id: request._id,
        seller_id: request.seller_id._id,
        merchant_id: request.merchant_id?._id, // Added merchant_id for frontend comparison
        merchant_name: merchantName,
        message: `Your phone number access request was rejected by ${merchantName}.`,
        createdAt: request.createdAt,
        rejected_at: new Date().toISOString(),
        status: "rejected"
      });

    res.status(200).json({
      success: true,
      message: 'Request rejected.'
    });

  } catch (error) {
    console.error("Error rejecting phone access:", error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all phone number access requests for a seller
exports.getPhoneNumberAccessRequests = async (req, res) => {
  const { seller_id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!seller_id || seller_id === 'undefined') {
    return res.status(400).json({ success: false, error: 'Invalid seller_id' });
  }

  try {
    const requests = await PhoneNumberAccessRequest.find({ seller_id })
      .populate({
        path: 'customer_id',
        select: 'name email role',
        populate: {
          path: 'role',
          select: 'role',
        },
      })
      .populate('merchant_id', 'company_name')
      .sort({ createdAt: -1 }) // 🔥 Latest record first
      .lean();

    const total = await PhoneNumberAccessRequest.countDocuments({ seller_id });

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + requests.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { request_id, seller_id } = req.body; // seller_id = merchant user _id

    const request = await PhoneNumberAccessRequest.findById(request_id);

    if (!request || request.seller_id.toString() !== seller_id) {
      return res.status(400).json({ message: 'Invalid request.' });
    }

    request.is_read = true;
    await request.save();

    // CORRECT: Use the phone-number-access-notifications namespace
    global.io
      .of("/phone-number-access-notifications")
      .to(seller_id)
      .emit("notificationUpdated", {
        _id: request._id,
        is_read: true,
      });

    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getPhoneNumberAccessRequestDetails = async (req, res) => {
  const { id } = req.params;

  const phoneAccessRequest = await PhoneNumberAccessRequest.findById(id)
    .populate({
      path: 'customer_id',
      select: 'name email phone role',
      populate: {
        path: 'role',
        select: 'role',
      },
    })
    .populate('merchant_id', 'company_name')
    .lean();

  if (!phoneAccessRequest) {
    res.status(404);
    throw new Error('Phone number access request not found');
  }
  if (!req.user?.role) {
    res.status(403);
    throw new Error('Not authorized to view this phone number access request');
  }

  res.status(200).json({
    success: true,
    data: phoneAccessRequest,
  });
};


// Get all phone number access requests for logged-in customer
exports.getMyPhoneNumberAccessRequests = async (req, res) => {
  try {
    // Assuming you have authentication middleware that sets req.user
    const customerId = req.user?.userId || req.user?._id; // adjust based on your auth payload

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not authenticated",
      });
    }

    // Query params - defaults for safety
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Prevent negative / invalid values
    if (page < 1 || limit < 1 || limit > 50) { // optional: cap max limit
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const skip = (page - 1) * limit;

    // Build query
    const query = { customer_id: customerId };

    // Fetch requests with population
    const requests = await PhoneNumberAccessRequest.find(query)
      .populate({
        path: "seller_id",
        select: "company_name phone", // only needed fields
      })
      .populate({
        path: "merchant_id",
        select: "company_name", // fallback name if needed
      })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .lean(); // faster, plain JS objects

    // Total count for hasMore calculation
    const total = await PhoneNumberAccessRequest.countDocuments(query);

    // Response shape matches your frontend expectation
    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + requests.length < total,
      },
    });
  } catch (error) {
    console.error("[getMyPhoneNumberAccessRequests] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching your requests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete phone number access request (Customer only)
exports.deletePhoneNumberAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const request = await PhoneNumberAccessRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found."
      });
    }

    // 🔒 Security Check
    if (request.customer_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this request."
      });
    }

    // Optional: allow delete only if pending
    // if (request.status !== "pending") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Only pending requests can be deleted."
    //   });
    // }

    await request.deleteOne();

    res.status(200).json({
      success: true,
      message: "Request deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// controllers/phoneNumberAccessController.js

/**
 * Delete Phone Number Access Request - Merchant only
 * Merchant (seller) can delete ANY request (pending, approved, rejected, expired)
 * No restrictions applied for merchant
 */
exports.deletePhoneNumberAccessRequestByMerchant = async (req, res) => {
  try {
    const { id } = req.params; // request ID
    const merchantUserId = req.user.userId || req.user._id; // logged-in merchant's user ID

    if (!merchantUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const request = await PhoneNumberAccessRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Phone number access request not found",
      });
    }

    // Only allow the merchant who owns this request (seller_id)
    if (request.seller_id.toString() !== merchantUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this request",
      });
    }

    // ───────────────────────────────────────────────────────────────
    // MERCHANT CAN DELETE ANY STATUS - NO RESTRICTION
    // ───────────────────────────────────────────────────────────────

    const deletedRequest = await PhoneNumberAccessRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete request",
      });
    }

    // Optional: Notify customer that merchant deleted the request
    if (global.io) {
      global.io
        .of("/phone-number-access-notifications")
        .to(request.customer_id.toString())
        .emit("phoneRequestDeletedByMerchant", {
          requestId: id,
          statusWas: deletedRequest.status,
          message: "The merchant has removed your phone number access request",
          deletedAt: new Date().toISOString(),
        });
    }

    return res.status(200).json({
      success: true,
      message: "Phone number access request deleted successfully",
      deletedRequestId: id,
    });

  } catch (error) {
    console.error("Merchant delete phone request error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting request",
      error: error.message,
    });
  }
};
