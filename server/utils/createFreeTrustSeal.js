// utils/trustSealUtils.js
const TrustSealRequest = require('../models/trustSealRequestModel');
const CommonSubscriptionPlan = require('../models/commonSubcriptionPlanModel');
const razorpay = require('../config/razorpay'); // your razorpay instance
const axios = require('axios');
const Merchant = require('../models/MerchantModel');
const Address = require('../models/addressModel');
const User = require('../models/userModel');
/**
 * Automatically creates a Trust Seal request (FREE) when subscription includes it
 * @param {Object} options
 * @param {String} options.user_id
 * @param {String} options.subscription_id - newly created/paid UserSubscription _id
 * @param {Date} options.paidAt
 * @param {Object} [options.req] - optional express req for logging/context
 * @returns {Promise<{success: boolean, message: string, trustSealRequest?: Object}>}
 */
async function autoCreateFreeTrustSeal({
  user_id,
  subscription_id,
  paidAt = new Date(),
  req // optional
}) {
  try {
    // 1. Get Merchant
    const merchant = await Merchant.findOne({ user_id });
    if (!merchant) {
      return { success: false, message: "Merchant profile not found" };
    }

    // 2. Already has active trust seal?
    if (merchant.trustshield === true) {
      return { success: true, message: "Trust seal already active", alreadyActive: true };
    }

    // 3. Basic required data check
    const companyAddress = await Address.findOne({
      user_id,
      address_type: "company"
    });

    if (!companyAddress || !merchant.company_name?.trim()) {
      console.warn(`[AUTO-TRUST-SEAL] Missing required merchant/address data for user ${user_id}`);
      return { success: false, message: "Incomplete business details - trust seal not auto-created" };
    }

    // 4. Free trust seal → amount = 0
    const baseAmount = 0;
    let gstPercentage = 0;
    let gstAmount = 0;

    // Optional GST lookup
    try {
      const gstPlan = await CommonSubscriptionPlan.findOne({
        name: "GST",
        category: "gst",
        durationType: "percentage",
      });

      if (gstPlan) {
        gstPercentage = gstPlan.price || 0;
        gstAmount = (baseAmount * gstPercentage) / 100;
      }
    } catch (e) {
      console.warn("Could not fetch GST plan for free trust seal", e);
    }

    // 5. Optional dummy Razorpay order
    let razorpayOrder = null;
  const receipt = `tsf_${user_id.slice(-6)}_${Date.now().toString().slice(-8)}`;

    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round((baseAmount + gstAmount) * 100), // 0
        currency: "INR",
        receipt,
        payment_capture: 1,
        notes: {
          type: "free_trust_seal",
          user_id,
          subscription_id,
          auto_created: true
        }
      });
    } catch (orderErr) {
      console.error("Failed to create dummy Razorpay order for free trust seal:", orderErr);
      // Not critical → continue
    }

    // 6. Create TrustSealRequest
    const trustSealRequest = await TrustSealRequest.create({
      user_id,
      subscription_id,
      amount: baseAmount,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,

      razorpay_order_id: razorpayOrder?.id || `FREE_${Date.now()}`,

      status: "pending",
      issueDate: paidAt,
      expiryDate: new Date(paidAt.getFullYear() + 1, paidAt.getMonth(), paidAt.getDate()), // 1 year

      isRead: false,                          // ← CHANGED AS REQUESTED: false (unread for admin)

      notes: "Auto-created free Trust Seal from subscription plan"
    });

   

    // 8. Notify admin (still send notification even if auto-approved)
    const user = await User.findById(user_id).select("name");
    const userName = user?.name || "Merchant";

    global.io?.of("/trust-seal-notifications")
      .to("trust-seal:admin")
      .emit("newTrustSealRequest", {
        _id: trustSealRequest._id,
        user_id,
        userName,
        amount: 0,
        status: "pending",
        created_at: paidAt,
        isAutoFree: true,
        isRead: false
      });


    return {
      success: true,
      message: "Free Trust Seal auto-created and activated",
      trustSealRequest
    };

  } catch (error) {
    console.error("[AUTO-TRUST-SEAL] Critical error:", error);
    return {
      success: false,
      message: "Failed to auto-create free trust seal",
      error: error.message
    };
  }
}

module.exports = { autoCreateFreeTrustSeal };
