const UserSubscription = require("../models/userSubscriptionPlanModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const {
  PLAN_TYPES,
  PLAN_CODES,
  FEATURES,
  STATUS
} = require('../constants/subscriptionConstants');
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const SubscriptionPlanElementMapping = require("../models/subscriptionPlanElementMappingModel");
const User = require("../models/userModel");
const EbookPayment = require("../models/ebookPaymentModel");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const TrendingPoints = require("../models/trendingPointsModel");
const subscriptionPlanSendEmail = require("../utils/subscriptionPlanSendEmail");
const ViewPoint = require("../models/viewPointsModel");
const SubscriptionPlanElement = require("../models/subscriptionPlanElementModel");
const CommonSubscriptionPlan = require("../models/commonSubcriptionPlanModel");
const Role = require("../models/roleModel");
const cron = require('node-cron');
const Address = require("../models/addressModel");
const PaymentHistory = require("../models/paymentHistoryModel");
const TrendingPointsPayment = require("../models/userTrendingPointPaymentModel");
const TopListingPayment = require("../models/topListingPaymentModel");
const TrustSealRequest = require("../models/trustSealRequestModel");
const UserActiveFeature = require("../models/UserActiveFeature");
const BannerPayment = require("../models/bannerPaymentModel");

// Helper function to calculate expiration dates etc
const mongoose = require("mongoose");
const { autoCreateFreeTrustSeal } = require('../utils/createFreeTrustSeal');
const { calculateFeatureExpiry } = require("../utils/CalculateExpiry");
const SubscriptionExtensionLog = require("../models/subscriptionExtensionLog");
const assignFreePlan = require("../utils/assignFreePlan");

function parseDuration(valueObj) {
  if (!valueObj) throw new Error('Duration value is missing');

  let rawValue;

  // Handle new universal value structure: { type, data, unit }
  if (typeof valueObj === 'object' && valueObj !== null) {
    if (valueObj.data === undefined || valueObj.data === null) {
      throw new Error('Duration data is missing in value object');
    }
    rawValue = String(valueObj.data).trim();
  }
  // Backward compatibility: if somehow value is still a plain string
  else if (typeof valueObj === 'string') {
    rawValue = valueObj.trim();
  } else {
    throw new Error('Invalid duration value format');
  }

  if (!rawValue) throw new Error('Duration value is empty after trimming');

  const parts = rawValue.split(/\s+/);
  let num = 0;
  let unit = 'month';

  if (parts.length === 1) {
    // Only number provided, e.g., "6"
    num = parseFloat(parts[0]);
  } else {
    // Number + unit, e.g., "6 months"
    num = parseFloat(parts[0]);
    unit = parts.slice(1).join(' ').toLowerCase();
  }

  if (isNaN(num) || num <= 0) throw new Error('Invalid duration number');

  let totalMonths = 0;

  if (unit.startsWith('year')) {
    totalMonths = Math.round(num * 12);
  } else if (unit.startsWith('month')) {
    totalMonths = Math.round(num);
  } else if (unit.startsWith('week')) {
    totalMonths = Math.round(num * 7 / 30); // ~4.345 weeks per month
  } else if (unit.startsWith('day')) {
    totalMonths = Math.round(num / 30);
  } else {
    throw new Error(`Unsupported duration unit: ${unit}`);
  }

  return totalMonths;
}

/**
 * COMPREHENSIVE CLEANUP: Deletes all subscriptions and associated feature data for a user, 
 * EXCEPT for the specified current/active subscription ID.
 */
async function cleanupOldSubscriptions(user_id, activeSubscriptionId) {
  try {
    const oldSubscriptions = await UserSubscription.find({
      user_id,
      _id: { $ne: activeSubscriptionId }
    });

    for (const oldSub of oldSubscriptions) {
      // 1. Delete general active features
      await UserActiveFeature.deleteMany({ user_subscription_id: oldSub._id });

      // 2. Specific feature cleanup based on the snapshot
      if (oldSub.features_snapshot) {
        for (const feature of oldSub.features_snapshot) {
          if (feature.is_enabled) {
            const code = feature.feature_code;

            if (code === FEATURES.TREND_POINT) {
              await TrendingPointsPayment.deleteMany({ subscription_id: oldSub._id });
            }
            else if (code === FEATURES.TOP_LISTING) {
              await TopListingPayment.deleteMany({ subscription_id: oldSub._id });
            }
            else if (code === FEATURES.TRUST_SEAL) {
              await TrustSealRequest.deleteMany({ subscription_id: oldSub._id });
            }
            else if (code === FEATURES.DIGITAL_BOOK) {
              await EbookPayment.deleteMany({ subscription_id: oldSub._id });
            }
          }
        }
      }

      // 3. Delete the subscription itself
      await UserSubscription.findByIdAndDelete(oldSub._id);
    }
  } catch (error) {
    console.error(`[CLEANUP] Error during aggressive purge for user ${user_id}:`, error.message);
  }
}

function parseVideoDuration(value) {
  if (!value || !value.type || value.data == null) {
    return null;
  }

  /* =========================
     TEXT TYPE (Enable / Disable)
  ========================= */
  if (value.type === "TEXT") {
    const text = String(value.data).toLowerCase().trim();

    if (["enable", "enabled", "yes", "true"].includes(text)) {
      return {
        enabled: true,
        unlimited: true,
        total_seconds: null,
        original_value: null,
        original_unit: null,
      };
    }

    return null;
  }

  /* =========================
     NUMBER TYPE (Duration)
  ========================= */
  if (value.type !== "NUMBER" || !value.unit) return null;

  const amount = Number(value.data);
  const unit = String(value.unit).toLowerCase().trim();

  if (isNaN(amount) || amount <= 0) return null;

  if (unit.startsWith("sec")) {
    return {
      enabled: true,
      unlimited: false,
      total_seconds: amount,
      original_value: amount,
      original_unit: "seconds",
    };
  }

  if (unit.startsWith("min")) {
    return {
      enabled: true,
      unlimited: false,
      total_seconds: amount * 60,
      original_value: amount,
      original_unit: "minutes",
    };
  }

  if (unit.startsWith("hour") || unit.startsWith("hr")) {
    return {
      enabled: true,
      unlimited: false,
      total_seconds: amount * 3600,
      original_value: amount,
      original_unit: "hours",
    };
  }

  return null;
}


function parseQuotaValue(value) {
  if (!value || value.data == null) return null;

  const dataStr = String(value.data).trim().toLowerCase();
  const unitStr = value.unit ? String(value.unit).trim().toLowerCase() : null;

  // ✅ UNLIMITED CASE
  if (dataStr === "unlimited") {
    return {
      is_unlimited: true,
      total: 0,
      used: 0,
      remaining: 0
    };
  }

  // ✅ NUMERIC CASE (e.g. "5", "50")
  const count = parseInt(dataStr, 10);
  if (!isNaN(count) && count >= 0) {
    return {
      is_unlimited: false,
      total: count,
      used: 0,
      remaining: count
    };
  }

  return null;
}


/**
 * Calculate end date with support for:
 *   - Plain numeric strings: "1", "12" (with explicit unit on value.unit)
 *   - Combined strings: "1 year", "3 months", "28 days", "2weeks"
 *   - Decimal values: "1.5 year", "0.5 month"
 *
 * Examples:
 *   { data: "1 year", unit: "" }   → startDate + 1 year
 *   { data: "1.5", unit: "year" }   → startDate + 1.5 years (1 year + 6 months)
 *   { data: "28 days", unit: "" }   → startDate + 28 days
 *   { data: "28", unit: "days" }    → startDate + 28 days
 *
 * @param {Date|string} startDate
 * @param {{ data: string|number, unit: string }} value
 * @returns {Date}
 */
const calculateEndDate = (startDate, value) => {

  // 1. Guard: return original date if disabled/empty
  const rawData = String(value?.data ?? '').trim();
  const disabledValues = ['no', 'none', 'free', 'disable', 'disabled', ''];
  if (!value || disabledValues.includes(rawData.toLowerCase())) {
    console.warn(`[DATE_CALC] Disabled or empty value "${rawData}", returning start date.`);
    return new Date(startDate);
  }

  // 2. Parse quantity and unit using regex (handles "1year", "1 year", "28days", etc.)
  //    Pattern: optional leading number, then optional whitespace, then optional unit text
  const DURATION_REGEX = /^([\d.]+)\s*([a-zA-Z]*)$/;
  const match = rawData.match(DURATION_REGEX);

  let qty = 0;
  let unit = String(value.unit || '').toLowerCase().trim();

  if (match) {
    qty = parseFloat(match[1]);
    // If data has an embedded unit string, it takes priority over a missing value.unit
    const embeddedUnit = match[2].toLowerCase().trim();
    if (embeddedUnit && !unit) {
      unit = embeddedUnit;
    } else if (embeddedUnit && unit && embeddedUnit !== unit) {
      // If both exist and differ, prefer the embedded one (more specific)
      unit = embeddedUnit;
    }
  } else {
    // Try splitting on whitespace as fallback (for strings like "2 years 3 months")
    const parts = rawData.split(/\s+/);
    qty = parseFloat(parts[0]);
    if (!unit && parts.length > 1) {
      unit = parts.slice(1).join(' ').toLowerCase();
    }
  }

  // 3. Normalize unit: strip trailing 's', handle week/weeks etc.
  const normalizeUnit = (u) => {
    if (!u) return '';
    u = u.toLowerCase().trim();
    if (u.startsWith('year'))  return 'year';
    if (u.startsWith('month')) return 'month';
    if (u.startsWith('week'))  return 'week';
    if (u.startsWith('day'))   return 'day';
    return u;
  };
  unit = normalizeUnit(unit);

  // 4. Validate
  if (isNaN(qty) || qty <= 0) {
    console.warn(`[DATE_CALC] Invalid quantity parsed from "${rawData}". Returning start date.`);
    return new Date(startDate);
  }
  if (!unit) {
    console.warn(`[DATE_CALC] Could not determine unit from data="${rawData}" / unit="${value.unit}". Returning start date.`);
    return new Date(startDate);
  }


  const date = new Date(startDate);
  const wholeQty = Math.floor(qty);
  const fraction = qty - wholeQty;

  // 5. Apply whole units
  if (unit === 'year') {
    date.setFullYear(date.getFullYear() + wholeQty);
  } else if (unit === 'month') {
    date.setMonth(date.getMonth() + wholeQty);
  } else if (unit === 'week') {
    date.setDate(date.getDate() + wholeQty * 7);
  } else if (unit === 'day') {
    date.setDate(date.getDate() + wholeQty);
  } else {
    console.warn(`[DATE_CALC] Unsupported unit "${unit}". Returning start date.`);
    return new Date(startDate);
  }

  // 6. Apply fractional remainder
  if (fraction > 0) {
    if (unit === 'year') {
      date.setMonth(date.getMonth() + Math.round(fraction * 12));
    } else if (unit === 'month') {
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(date.getDate() + Math.round(fraction * daysInMonth));
    } else if (unit === 'week') {
      date.setDate(date.getDate() + Math.round(fraction * 7));
    } else if (unit === 'day') {
      date.setDate(date.getDate() + Math.round(fraction));
    }
  }

  return date;
};

exports.createSubscription = async (req, res) => {
  try {
    const {
      user_id,
      subscription_plan_id,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validate required fields
    if (!user_id || !subscription_plan_id || !razorpay_order_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if subscription plan exists
    const plan = await SubscriptionPlan.findById(subscription_plan_id);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // Handle free plan case
    if (plan.plan_code === "FREE") {
      // Validate no payment details are provided for free plan
      if (razorpay_payment_id || razorpay_signature || amount > 0) {
        return res
          .status(400)
          .json({
            message: "Free plan does not require payment details or amount",
          });
      }

      // Fetch duration for free plan
      const durationElement = await SubscriptionPlanElement.findOne({
        $expr: {
          $eq: [
            { $toLower: { $trim: { input: "$feature_name" } } },
            "subscription duration",
          ],
        },
      });

      if (!durationElement) {
        return res
          .status(404)
          .json({ message: "Subscription Duration element not found" });
      }

      const mapping = await SubscriptionPlanElementMapping.findOne({
        subscription_plan_id,
        feature_id: durationElement._id,
      });
      if (!mapping || !mapping.value) {
        return res
          .status(404)
          .json({ message: "Subscription Duration mapping not found" });
      }

      const totalMonths = parseDuration(mapping.value);
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + totalMonths);

      // Create subscription for free plan with hardcoded dummy values
      const subscription = new UserSubscription({
        user_id,
        subscription_plan_id,
        razorpay_order_id: `free_order_${user_id}`,
        amount: 0,
        gst_percentage: 0,
        gst_amount: 0,
        end_date: endDate,
        status: STATUS.PAID,
        captured: true,
        paid_at: new Date(),
        created_at: new Date(),
        currency: "INR",
      });

      await subscription.save();

      // Mark any existing free subscription as expired
      const existingFreeSubscription = await UserSubscription.findOne({
        user_id,
        subscription_plan_id: plan._id,
        end_date: { $gt: now },
        status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
      });
      if (existingFreeSubscription) {
        existingFreeSubscription.status = "expired";
        existingFreeSubscription.end_date = new Date();
        await existingFreeSubscription.save();
      }

      // === NEW: Add PaymentHistory for FREE plan ===
      await PaymentHistory.create({
        user_id,
        subscription_plan_id,
        user_subscription_id: subscription._id,
        razorpay_order_id: subscription.razorpay_order_id,
        amount: 0,
        gst_percentage: 0,
        gst_amount: 0,
        total_amount: 0,
        currency: "INR",
        receipt: `free_receipt_${user_id}`,
        status: STATUS.PAID,
        captured: true,
        paid_at: new Date(),
        notes: "Free plan assigned manually",
        is_manual_entry: true,
      });
      // === End of PaymentHistory addition ===

      return res.status(201).json({
        message: "Free plan assigned successfully",
        subscription,
      });
    }

    // For paid plans, validate payment details
    if (!amount || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ message: "Missing payment details for paid plan" });
    }

    // Fetch GST plan
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: "GST",
      category: "gst",
      durationType: "percentage",
    });
    if (!gstPlan) {
      return res.status(404).json({ message: "GST plan not found" });
    }

    const gstPercentage = gstPlan.price;
    const baseAmount = amount;
    const gstAmount = (baseAmount * gstPercentage) / 100;

    // Find Subscription Duration element
    const durationElement = await SubscriptionPlanElement.findOne({
      feature_code: FEATURES.DURATION,
    });
    if (!durationElement) {
      return res
        .status(404)
        .json({ message: "Subscription Duration element not found" });
    }

    // Find mapping for this plan + element
    const mapping = await SubscriptionPlanElementMapping.findOne({
      subscription_plan_id,
      feature_id: durationElement._id,
    });
    if (!mapping || !mapping.value) {
      return res
        .status(404)
        .json({ message: "Subscription Duration mapping not found" });
    }

    const newPlanMonths = parseDuration(mapping.value);

    // Check if user is on free plan and within 3 months of registration
    const freePlan = await SubscriptionPlan.findOne({ business_type: PLAN_TYPES.FREE });
    let freePlanMonths = 0;
    let additionalMonths = 0;
    const now = new Date();
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const registrationDate = new Date(user.created_at);
    const diffInMs = now - registrationDate;
    const diffInMonths = diffInMs / (1000 * 60 * 60 * 24 * 30);

    const activeFreeSubscription = await UserSubscription.findOne({
      user_id,
      subscription_plan_id: freePlan._id,
      end_date: { $gt: now },
      status: STATUS.PAID,
    });

    if (activeFreeSubscription && diffInMonths <= 3) {
      const freePlanDurationMapping =
        await SubscriptionPlanElementMapping.findOne({
          subscription_plan_id: freePlan._id,
          feature_id: durationElement._id,
        });
      if (freePlanDurationMapping?.value) {
        freePlanMonths = parseDuration(freePlanDurationMapping.value);
      }
      additionalMonths = 6;
    }

    const totalDurationMonths =
      freePlanMonths + newPlanMonths + additionalMonths;
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + totalDurationMonths);

    // Create new subscription record
    const subscription = new UserSubscription({
      user_id,
      subscription_plan_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: baseAmount * 100,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount * 100,
      end_date: endDate,
      status: STATUS.PAID,
      captured: true,
      paid_at: new Date(),
      created_at: new Date(),
      currency: "INR",
    });

    await subscription.save();

    // Mark old free subscription as expired
    if (activeFreeSubscription) {
      activeFreeSubscription.status = "expired";
      activeFreeSubscription.end_date = new Date();
      await activeFreeSubscription.save();
    }

    // === NEW: Add PaymentHistory for PAID plan ===
    await PaymentHistory.create({
      user_id,
      subscription_plan_id,
      user_subscription_id: subscription._id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: baseAmount * 100,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount * 100,
      total_amount: (baseAmount + gstAmount) * 100,
      currency: "INR",
      receipt: razorpay_order_id,
      status: STATUS.PAID,
      captured: true,
      paid_at: new Date(),
      notes: "Manual/direct paid subscription creation",
      is_manual_entry: true,
    });
    // === End of PaymentHistory addition ===

    return res.status(201).json({
      message: "User subscribed successfully",
      subscription,
    });
  } catch (error) {
    console.error("Create Subscription Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all user subscriptions (Admin)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await UserSubscription.find().populate(
      "user_id subscription_plan_id"
    );
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a user subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await UserSubscription.findById(
      req.params.id
    ).populate("user_id subscription_plan_id");
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user subscription
exports.updateSubscription = async (req, res) => {
  try {
    const { end_date, status } = req.body;

    let subscription = await UserSubscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Update fields
    subscription.end_date = end_date || subscription.end_date;
    subscription.status = status || subscription.status;

    await subscription.save();
    res.status(200).json({ message: "Subscription updated", subscription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a user subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await UserSubscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    await subscription.deleteOne();
    res.status(200).json({ message: "Subscription deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// exports.createOrder = async (req, res) => {
//   try {
//     const { user_id, subscription_plan_id, amount, is_upgrade = false } = req.body;

//     if (!user_id || !subscription_plan_id || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     /* =========================
//        🔒 BLOCK MULTIPLE PAID PLANS
//     ========================= */
//     if (!is_upgrade) {
//       const existingSubscription = await UserSubscription.findOne({
//         user_id,
//         status: STATUS.PAID,
//         captured: true,
//         end_date: { $gt: new Date() },
//       }).populate("subscription_plan_id");

//       if (existingSubscription) {
//         const currentPlan = existingSubscription.subscription_plan_id;

//         const isFreePlan =
//           currentPlan?.plan_code === "FREE" ||
//           String(currentPlan?.plan_name).toUpperCase() === "FREE" ||
//           currentPlan?.price <= 1;

//         // REMOVED THE BLOCKING LOGIC
//         // Users can now purchase/upgrade to any plan even if they have an active paid plan
//         // if (!isFreePlan) { ... } ← This entire block is removed
//       }
//     }

//     /* =========================
//        🔹 GST CALCULATION
//     ========================= */
//     const gstPlan = await CommonSubscriptionPlan.findOne({
//       name: "GST",
//       category: "gst",
//       durationType: "percentage",
//     });

//     if (!gstPlan) {
//       return res.status(404).json({
//         success: false,
//         message: "GST configuration missing",
//       });
//     }

//     const gstPercentage = gstPlan.price;
//     const gstAmount = (amount * gstPercentage) / 100;
//     const totalAmount = amount + gstAmount;

//     const receipt = `receipt_${Date.now()}`;

//     /* =========================
//        🔹 CREATE RAZORPAY ORDER
//     ========================= */
//     const razorpayOrder = await razorpay.orders.create({
//       amount: Math.round(totalAmount * 100),
//       currency: "INR",
//       receipt,
//       payment_capture: 1,
//     });

//     // ★★★ Fetch CURRENT features mapping (at the exact moment of purchase)
//     const currentMappings = await SubscriptionPlanElementMapping.find({
//       subscription_plan_id: subscription_plan_id,
//     })
//       .populate({
//         path: "feature_id",
//         select: "feature_name"  // we only need the name from SubscriptionPlanElement
//       })
//       .lean();

//     // Build clean snapshot array
//     const featuresSnapshot = currentMappings.map((mapping) => ({
//       feature_id: mapping.feature_id?._id,                    // ObjectId
//       feature_name: mapping.feature_id?.feature_name || "Unknown Feature",
//       is_enabled: mapping.is_enabled,
//       value: mapping.value ? {                                // only include if exists
//         type: mapping.value.type,
//         data: mapping.value.data,
//         unit: mapping.value.unit
//       } : undefined
//     })).filter(f => f.feature_id); // remove any invalid entries

//     /* =========================
//        🔹 CREATE PENDING SUBSCRIPTION + FEATURES SNAPSHOT
//     ========================= */
//     const subscription = await UserSubscription.create({
//       user_id,
//       subscription_plan_id,
//       razorpay_order_id: razorpayOrder.id,
//       amount: Math.round(amount * 100),
//       gst_percentage: gstPercentage,
//       gst_amount: Math.round(gstAmount * 100),
//       total_amount: Math.round(totalAmount * 100),
//       currency: "INR",
//       receipt,
//       status: "created",
//       captured: false,
//       is_upgrade,

//       // ★★★ This is the critical addition that solves your problem
//       features_snapshot: featuresSnapshot.length > 0 ? featuresSnapshot : []
//     });
//     /* =========================
//        🧾 PAYMENT HISTORY (DYNAMIC)
//     ========================= */
//     await PaymentHistory.create({
//       user_id,
//       payment_type: "subscription",

//       subscription_plan_id,
//       user_subscription_id: subscription._id,

//       razorpay_order_id: razorpayOrder.id,

//       amount: Math.round(amount * 100),
//       gst_percentage: gstPercentage,
//       gst_amount: Math.round(gstAmount * 100),
//       total_amount: Math.round(totalAmount * 100),

//       currency: "INR",
//       receipt,

//       status: "created",
//       captured: false,

//       notes: "Subscription order created, awaiting payment",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       order: razorpayOrder,
//     });

//   } catch (error) {
//     console.error("CreateOrder Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create order",
//       error: error.message,
//     });
//   }
// };


// exports.createOrder = async (req, res) => {
//   try {
//     const {
//       user_id,
//       subscription_plan_id,
//       amount,
//       is_upgrade = false,
//       auto_off = true,
//       auto_renew = false   // ← NEW: user choice for auto-pay / auto-renew
//     } = req.body;

//     if (!user_id || !subscription_plan_id || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     /* =========================
//        🔒 BLOCK MULTIPLE PAID PLANS (commented – allowing multiple now)
//     ========================= */
//     if (!is_upgrade) {
//       const existingSubscription = await UserSubscription.findOne({
//         user_id,
//         status: STATUS.PAID,
//         captured: true,
//         end_date: { $gt: new Date() },
//       }).populate("subscription_plan_id");

//       if (existingSubscription) {
//         const currentPlan = existingSubscription.subscription_plan_id;
//         const isFreePlan =
//           currentPlan?.plan_code === "FREE" ||
//           String(currentPlan?.plan_name).toUpperCase() === "FREE" ||
//           currentPlan?.price <= 1;

//         // REMOVED THE BLOCKING LOGIC
//         // Users can now purchase/upgrade even with active paid plan
//       }
//     }

//     /* =========================
//        🔹 GST CALCULATION
//     ========================= */
//     const gstPlan = await CommonSubscriptionPlan.findOne({
//       name: "GST",
//       category: "gst",
//       durationType: "percentage",
//     });

//     if (!gstPlan) {
//       return res.status(404).json({
//         success: false,
//         message: "GST configuration missing",
//       });
//     }

//     const gstPercentage = gstPlan.price;
//     const gstAmount = (amount * gstPercentage) / 100;
//     const totalAmount = amount + gstAmount;

//     const receipt = `receipt_${Date.now()}`;

//     // ────────────────────────────────────────────────────────
//     //                PLAN SNAPSHOT + VALIDATION
//     // ────────────────────────────────────────────────────────
//     const currentPlan = await SubscriptionPlan.findById(subscription_plan_id);
//     if (!currentPlan) {
//       return res.status(404).json({
//         success: false,
//         message: "Subscription plan not found",
//       });
//     }

//     if (currentPlan.price !== amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Price mismatch – invalid request",
//       });
//     }
//     // ────────────────────────────────────────────────────────

//     // ★★★ Fetch CURRENT features mapping (snapshot at purchase moment)
//     const currentMappings = await SubscriptionPlanElementMapping.find({
//       subscription_plan_id: subscription_plan_id,
//     })
//       .populate({
//         path: "feature_id",
//         select: "feature_name"
//       })
//       .lean();

//     const featuresSnapshot = currentMappings.map((mapping) => ({
//       feature_id: mapping.feature_id?._id,
//       feature_name: mapping.feature_id?.feature_name || "Unknown Feature",
//       is_enabled: mapping.is_enabled,
//       value: mapping.value ? {
//         type: mapping.value.type,
//         data: mapping.value.data,
//         unit: mapping.value.unit
//       } : undefined
//     })).filter(f => f.feature_id);

//     // Extract duration for plan_snapshot
//     const durationFeature = featuresSnapshot.find(
//       f => f.feature_name.toLowerCase().trim() === "subscription duration"
//     );

//     const duration_value = durationFeature?.value?.data ? Number(durationFeature.value.data) : null;
//     const duration_unit = durationFeature?.value?.unit || null;

//     /* =========================
//        🔹 CREATE PENDING SUBSCRIPTION + SNAPSHOTS
//     ========================= */
//     const subscription = await UserSubscription.create({
//       user_id,
//       subscription_plan_id,

//       plan_snapshot: {
//         plan_name: currentPlan.plan_name,
//         plan_code: currentPlan.plan_code || null,
//         price: currentPlan.price,
//         currency: currentPlan.currency || "INR",
//         duration_value: duration_value,
//         duration_unit: duration_unit,
//       },

//       razorpay_order_id: null, // temporary — will update after order creation
//       amount: Math.round(amount * 100),
//       gst_percentage: gstPercentage,
//       gst_amount: Math.round(gstAmount * 100),
//       total_amount: Math.round(totalAmount * 100),
//       currency: "INR",
//       receipt,
//       status: "created",
//       captured: false,
//       is_upgrade,

//       auto_off: Boolean(auto_off),
//       auto_renew: Boolean(auto_renew),

//       features_snapshot: featuresSnapshot.length > 0 ? featuresSnapshot : []
//     });

//     let razorpayData;

//     if (auto_renew) {
//       // 🔁 AUTO-RENEW → CREATE RAZORPAY SUBSCRIPTION
//       razorpayData = await razorpay.subscriptions.create({
//         plan_id: currentPlan.razorpay_plan_id, // MUST exist in SubscriptionPlan
//         customer_notify: 1,
//         total_count: 12, // or null for infinite
//       });

//       subscription.razorpay_plan_id = currentPlan.razorpay_plan_id;
//       subscription.razorpay_subscription_id = razorpayData.id;
//       subscription.razorpay_subscription_status = razorpayData.status;
//       subscription.status = "active_renewal";
//     } else {
//       // 💳 ONE-TIME PAYMENT → CREATE ORDER
//       razorpayData = await razorpay.orders.create({
//         amount: Math.round(totalAmount * 100),
//         currency: "INR",
//         receipt,
//         payment_capture: 1,
//       });

//       subscription.razorpay_order_id = razorpayData.id;
//     }

//     await subscription.save();


//     /* =========================
//        🧾 PAYMENT HISTORY (DYNAMIC) — MOVED HERE so razorpay_order_id is available
//     ========================= */
//     await PaymentHistory.create({
//       user_id,
//       payment_type: "subscription",
//       subscription_plan_id,
//       user_subscription_id: subscription._id,
//       razorpay_order_id: auto_renew ? null : razorpayData.id,

//       amount: Math.round(amount * 100),
//       gst_percentage: gstPercentage,
//       gst_amount: Math.round(gstAmount * 100),
//       total_amount: Math.round(totalAmount * 100),
//       currency: "INR",
//       receipt,
//       status: "created",
//       captured: false,
//       notes: auto_renew ? "Recurring subscription requested - awaiting first payment" : "One-time order created, awaiting payment",
//     });

//     return res.status(201).json({
//       success: true,
//       message: auto_renew
//         ? "Subscription created successfully"
//         : "Order created successfully",

//       razorpayData,          // 🔑 order OR subscription
//       subscription_id: subscription._id,
//       auto_renew: auto_renew
//     });


//   } catch (error) {
//     console.error("CreateOrder Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create order",
//       error: error.message,
//     });
//   }
// };


exports.createOrder = async (req, res) => {
  try {
    const {
      user_id,
      subscription_plan_id,
      amount,
      is_upgrade = false,
      auto_off = true,
      auto_renew = false
    } = req.body;

    // Hardened boolean check (handles strings like 'true' or 'false' from forms)
    const isAutoRenew = auto_renew === true || String(auto_renew).toLowerCase() === 'true';


    if (!user_id || !subscription_plan_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* =========================
       🔒 BLOCK MULTIPLE PAID PLANS (commented – allowing multiple now)
    ========================= */
    if (!is_upgrade) {
      const existingSubscription = await UserSubscription.findOne({
        user_id,
        status: STATUS.PAID,
        captured: true,
        end_date: { $gt: new Date() },
      }).populate("subscription_plan_id");

      if (existingSubscription) {
        const currentPlan = existingSubscription.subscription_plan_id;
        const isFreePlan =
          currentPlan?.plan_code === "FREE" ||
          String(currentPlan?.plan_name).toUpperCase() === "FREE" ||
          currentPlan?.price <= 1;

        // REMOVED THE BLOCKING LOGIC
        // Users can now purchase/upgrade even with active paid plan
      }
    }

    /* =========================
       🔹 APPLY ₹1 DISCOUNT DYNAMICALLY
    ========================= */
    let finalBaseAmount = Number(amount);

    // Subtract ₹1 from base amount (Applied to both ONE-TIME and AUTO-RENEW orders)
    // This ensures consistency between visually displayed prices (99) and the actual amount charged.
    if (finalBaseAmount > 1) {
      finalBaseAmount -= 1;
    }

    /* =========================
       🔹 GST CALCULATION (on discounted amount)
    ========================= */
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: "GST",
      category: "gst",
      durationType: "percentage",
    });

    if (!gstPlan) {
      return res.status(404).json({
        success: false,
        message: "GST configuration missing",
      });
    }

    const gstPercentage = gstPlan.price !== undefined ? gstPlan.price : 18;
    const gstAmount = (finalBaseAmount * gstPercentage) / 100;
    const totalAmount = finalBaseAmount + gstAmount;

    const receipt = `receipt_${Date.now()}`;

    // ────────────────────────────────────────────────────────
    //                PLAN SNAPSHOT + VALIDATION
    // ────────────────────────────────────────────────────────
    const currentPlan = await SubscriptionPlan.findById(subscription_plan_id);
    if (!currentPlan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    if (currentPlan.price !== amount) {
      console.warn(
        `Price mismatch – DB: ${currentPlan.price}, requested: ${amount}. Proceeding with discounted amount: ${finalBaseAmount}`
      );
    }

    // ★★★ Fetch ALL system features to build a complete snapshot
    const allFeaturesList = await SubscriptionPlanElement.find({ is_active: true }).lean();

    // ★★★ Fetch CURRENT features mapping (snapshot at purchase moment)
    const currentMappings = await SubscriptionPlanElementMapping.find({
      subscription_plan_id: subscription_plan_id,
    }).lean();

    const featuresSnapshot = allFeaturesList.map((feat) => {
      const mapping = currentMappings.find(m => m.feature_id?.toString() === feat._id.toString());

      return {
        feature_id: feat._id,
        feature_name: feat.feature_name || "Unknown",
        feature_code: feat.feature_code || "UNKNOWN",
        is_enabled: mapping ? mapping.is_enabled : false,
        value: mapping && mapping.value ? {
          type: mapping.value.type,
          data: mapping.value.data,
          unit: mapping.value.unit
        } : undefined
      };
    });

    // Extract duration for plan_snapshot — handle combined strings like "2 year" or separate { data:"2", unit:"year" }
    const durationFeature = featuresSnapshot.find(f => f.feature_code === FEATURES.DURATION);
    const durationRawData  = String(durationFeature?.value?.data || '').trim();
    const durationRawUnit  = String(durationFeature?.value?.unit || '').trim();
    const DURATION_REGEX_SNAP = /^([\d.]+)\s*([a-zA-Z]*)$/;
    const snapMatch = durationRawData.match(DURATION_REGEX_SNAP);

    let duration_value = null;
    let duration_unit  = durationRawUnit || null;

    if (snapMatch) {
      duration_value = parseFloat(snapMatch[1]) || null;
      // If data has embedded unit (e.g. "2 year") and no separate unit provided, extract it
      const embeddedSnapUnit = snapMatch[2]?.toLowerCase().trim();
      if (embeddedSnapUnit && !duration_unit) {
        duration_unit = embeddedSnapUnit;
      }
    }


    /* =========================
       🔹 CREATE PENDING SUBSCRIPTION + SNAPSHOTS
    ========================= */
    const subscriptionData = {
      user_id,
      subscription_plan_id,

      plan_snapshot: {
        plan_name: currentPlan.plan_name,
        plan_code: currentPlan.plan_code || null,
        price: finalBaseAmount,           // ← save discounted price
        currency: currentPlan.currency || "INR",
        duration_value: duration_value,
        duration_unit: duration_unit,
      },

      razorpay_order_id: null,
      amount: Math.round(finalBaseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt,
      status: STATUS.CREATED,
      captured: false,
      is_upgrade,

      auto_off: Boolean(auto_off),
      auto_renew: Boolean(auto_renew),

      features_snapshot: featuresSnapshot.length > 0 ? featuresSnapshot : []
    };


    // 🔁 Validation: If user wants auto-renew, the plan MUST have a Razorpay Plan ID for the current mode
    const isRazorpayLive = razorpay.key_id?.startsWith("rzp_live");
    const activeRazorpayPlanId = isRazorpayLive
      ? currentPlan.razorpay_plan_id_live
      : currentPlan.razorpay_plan_id_test;

    if (isAutoRenew) {
      if (!activeRazorpayPlanId) {
        console.error(
          `[SUBSCRIPTION_ERROR] Plan '${currentPlan.plan_name}' (${
            currentPlan.plan_code
          }) MISSING razorpay_plan_id_${
            isRazorpayLive ? "live" : "test"
          } for auto-renewal.`
        );
        return res.status(400).json({
          success: false,
          message: `The selected plan '${currentPlan.plan_name}' does not currently support auto-renewal in ${
            isRazorpayLive ? "Live" : "Test"
          } mode. Please select a different plan or proceed without auto-renewal.`,
        });
      }
      subscriptionData.razorpay_plan_id = activeRazorpayPlanId;
    }

    const subscription = await UserSubscription.create({
      ...subscriptionData,
      auto_renew: isAutoRenew
    });

    let razorpayData;

    if (isAutoRenew) {
      // 🔁 AUTO-RENEW → CREATE RAZORPAY SUBSCRIPTION
      razorpayData = await razorpay.subscriptions.create({
        plan_id: activeRazorpayPlanId,
        customer_notify: 1,
        total_count: 30, // Maximum allowed for UPI recurring payments (30 years)
      });

      subscription.razorpay_subscription_id = razorpayData.id;
      subscription.razorpay_subscription_status = razorpayData.status;

    } else {
      // 💳 ONE-TIME PAYMENT → CREATE ORDER
      razorpayData = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt,
        payment_capture: 1,
      });

      subscription.razorpay_order_id = razorpayData.id;
    }

    await subscription.save();

    /* =========================
       🧾 PAYMENT HISTORY (DYNAMIC)
    ========================= */
    await PaymentHistory.create({
      user_id,
      payment_type: "subscription",
      subscription_plan_id,
      user_subscription_id: subscription._id,
      razorpay_order_id: isAutoRenew ? null : razorpayData.id,
      razorpay_subscription_id: isAutoRenew ? razorpayData.id : null,

      amount: Math.round(finalBaseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt,
      status: STATUS.CREATED,
      captured: false,
      notes: isAutoRenew
        ? "Recurring subscription requested - awaiting first payment"
        : "One-time order created, awaiting payment",
    });

    return res.status(201).json({
      success: true,
      message: isAutoRenew
        ? "Subscription created successfully"
        : "Order created successfully",

      razorpayData,
      subscription_id: subscription._id,
      auto_renew: isAutoRenew,
      // Optional – helps frontend show correct amount
      chargedBaseAmount: finalBaseAmount,
      chargedTotalAmount: totalAmount
    });

  } catch (error) {
    console.error("CreateOrder Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};


// exports.verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       user_id,
//       subscription_plan_id,
//       amount,  // ← this is usually the original amount (1000) from frontend
//     } = req.body;

//     if (
//       !razorpay_payment_id ||
//       !razorpay_signature ||
//       (!razorpay_order_id && !req.body.razorpay_subscription_id)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing Razorpay fields",
//       });
//     }

//     /* =========================
//      🔐 VERIFY RAZORPAY SIGNATURE (ORDER + SUBSCRIPTION)
//     ========================= */
//     const signaturePayload = razorpay_order_id
//       ? `${razorpay_order_id}|${razorpay_payment_id}`
//       : `${req.body.razorpay_subscription_id}|${razorpay_payment_id}`;

//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(signaturePayload)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment signature",
//       });
//     }

//     /* =========================
//        🔹 APPLY SAME ₹1 DISCOUNT AS IN createOrder
//     ========================= */
//     let finalAmount = Number(amount || 0);

//     // Apply the same discount rule as createOrder
//     if (finalAmount === 1000) {
//       finalAmount = 999;
//       console.log(
//         `[VERIFY] Corrected amount from ${amount} → ${finalAmount} for user ${user_id}`
//       );
//     }

//     // Re-calculate GST on the corrected amount (to be consistent)
//     const gstPlan = await CommonSubscriptionPlan.findOne({
//       name: "GST",
//       category: "gst",
//       durationType: "percentage",
//     });

//     const gstPercentage = gstPlan?.price || 18; // fallback to 18 if not found
//     const gstAmount = (finalAmount * gstPercentage) / 100;
//     const expectedTotal = finalAmount + gstAmount;
//     const expectedPaise = Math.round(expectedTotal * 100);

//     /* =========================
//        🔹 FETCH PENDING SUBSCRIPTION
//     ========================= */
//     const subscription = await UserSubscription.findOne(
//       razorpay_order_id
//         ? { razorpay_order_id }
//         : { razorpay_subscription_id: req.body.razorpay_subscription_id }
//     );

//     if (!subscription) {
//       return res.status(404).json({
//         success: false,
//         message: "Subscription order not found",
//       });
//     }

//     const now = new Date();

//     /* =========================
//        🔹 EXPIRE OLD ACTIVE SUBSCRIPTIONS
//     ========================= */
//     await UserSubscription.updateMany(
//       {
//         user_id,
//         status: STATUS.PAID,
//         end_date: { $gt: now },
//       },
//       {
//         status: "expired",
//         end_date: now,
//       }
//     );

//     /* =========================
//        🔹 DEACTIVATE ALL OLD FEATURES (For upgrade/switch)
//     ========================= */
//     await UserActiveFeature.updateMany(
//       {
//         user_id,
//         status: "active",
//       },
//       {
//         status: "upgraded_away",
//       }
//     );

//     // ───────────────────────────────────────────────────────────────
//     // REMOVED: Re-fetching current mappings and overwriting snapshot
//     // → We now ALWAYS use the features_snapshot saved at purchase time
//     // ───────────────────────────────────────────────────────────────

//     /* =========================
//        🔹 SUBSCRIPTION BASE DURATION
//     ========================= */
//     const durationElement = await SubscriptionPlanElement.findOne({
//       $expr: {
//         $eq: [
//           { $toLower: { $trim: { input: "$feature_name" } } },
//           "subscription duration",
//         ],
//       },
//     });

//     if (!durationElement) {
//       return res.status(400).json({
//         success: false,
//         message: "Subscription Duration feature not found",
//       });
//     }

//     const durationMapping = await SubscriptionPlanElementMapping.findOne({
//       subscription_plan_id,
//       feature_id: durationElement._id,
//       is_enabled: true,
//     });

//     if (!durationMapping?.value) {
//       return res.status(400).json({
//         success: false,
//         message: "Subscription duration not configured for this plan",
//       });
//     }

//     let endDate = calculateEndDate(now, durationMapping.value);

//     /* =========================
//        🔐 MERCHANT VERIFICATION (Plan-based)
//     ========================= */
//     try {
//       const verificationElement = await SubscriptionPlanElement.findOne({
//         $expr: {
//           $eq: [
//             { $toLower: { $trim: { input: "$feature_name" } } },
//             "verification",
//           ],
//         },
//       });

//       let shouldVerifyMerchant = false;

//       if (verificationElement) {
//         const verificationMapping = await SubscriptionPlanElementMapping.findOne({
//           subscription_plan_id,
//           feature_id: verificationElement._id,
//           is_enabled: true,
//         });

//         if (verificationMapping?.value) {
//           const valueStr = String(verificationMapping.value.data || "")
//             .toLowerCase()
//             .trim();

//           if (valueStr === "free" || valueStr === "enable") {
//             shouldVerifyMerchant = true;
//           }
//         }
//       }

//       await Merchant.updateOne(
//         { user_id },
//         { $set: { verified_status: shouldVerifyMerchant } }
//       );

//       console.log(`Merchant verification status updated → ${shouldVerifyMerchant}`);
//     } catch (verifyErr) {
//       console.error("Merchant verification update failed:", verifyErr.message);
//     }

//     /* =========================
//        💬 CHAT SYSTEM ACTIVATION
//     ========================= */
//     try {
//       const chatElement = await SubscriptionPlanElement.findOne({
//         $expr: {
//           $eq: [
//             { $toLower: { $trim: { input: "$feature_name" } } },
//             "chat system",
//           ],
//         },
//       });

//       if (!chatElement) {
//         console.log("Chat System feature not found in master");
//       } else {
//         const chatMapping = await SubscriptionPlanElementMapping.findOne({
//           subscription_plan_id,
//           feature_id: chatElement._id,
//           is_enabled: true,
//         });

//         if (!chatMapping || !chatMapping.value) {
//           console.log("Chat System not enabled in this plan");
//         } else {
//           let chatExpiry = null;
//           let shouldEnableChat = false;

//           const value = chatMapping.value;
//           const dataStr = String(value.data || "").toLowerCase().trim();

//           if (dataStr === "free" || dataStr === "enable") {
//             shouldEnableChat = true;
//             chatExpiry = subscription.end_date || endDate;
//           } else if (
//             value.type === "NUMBER" &&
//             value.unit &&
//             value.unit.toLowerCase().includes("day")
//           ) {
//             const days = parseInt(value.data, 10);
//             if (!isNaN(days) && days > 0) {
//               shouldEnableChat = true;
//               chatExpiry = new Date(now);
//               chatExpiry.setDate(chatExpiry.getDate() + days);
//             }
//           }

//           if (shouldEnableChat) {
//             await UserActiveFeature.findOneAndUpdate(
//               { user_id, feature_code: "CHAT_SYSTEM" },
//               {
//                 user_id,
//                 user_subscription_id: subscription._id,
//                 feature_id: chatElement._id,
//                 feature_code: FEATURES.CHAT_SYSTEM,
//                 activated_at: now,
//                 expires_at: chatExpiry,
//                 status: "active",
//               },
//               { upsert: true, new: true }
//             );

//             console.log(
//               `💬 Chat System activated → expires on ${chatExpiry ? chatExpiry.toISOString().split("T")[0] : "Unlimited"}`
//             );
//           }
//         }
//       }
//     } catch (chatErr) {
//       console.error("Chat System activation failed:", chatErr.message);
//     }

//     /* =========================
//        🟢 NEW USER EXTRA DURATION (≤ 3 MONTHS)
//     ========================= */
//     const merchant = await Merchant.findOne({ user_id });

//     if (merchant) {
//       const diffInDays = (now - new Date(merchant.createdAt)) / (1000 * 60 * 60 * 24);

//       if (diffInDays <= 90) {
//         const newUserElement = await SubscriptionPlanElement.findOne({
//           $expr: {
//             $eq: [
//               { $toLower: { $trim: { input: "$feature_name" } } },
//               "new user",
//             ],
//           },
//         });

//         if (newUserElement) {
//           const newUserMapping = await SubscriptionPlanElementMapping.findOne({
//             subscription_plan_id,
//             feature_id: newUserElement._id,
//             is_enabled: true,
//           });

//           if (newUserMapping?.value) {
//             endDate = calculateEndDate(endDate, newUserMapping.value);
//           }
//         }
//       }
//     }

//     /* =========================
//        🔹 TRUST SEAL ACTIVATION + AUTO CREATE
//     ========================= */
//     const trustSealElement = await SubscriptionPlanElement.findOne({
//       $expr: {
//         $eq: [
//           { $toLower: { $trim: { input: "$feature_name" } } },
//           "trust seal",
//         ],
//       },
//     });

//     let shouldEnableTrustSeal = false;

//     if (trustSealElement) {
//       const trustSealMapping = await SubscriptionPlanElementMapping.findOne({
//         subscription_plan_id,
//         feature_id: trustSealElement._id,
//         is_enabled: true,
//       });

//       if (trustSealMapping?.value) {
//         const valueStr = String(trustSealMapping.value.data || "").toLowerCase().trim();
//         if (valueStr === "free" || valueStr === "enable") {
//           shouldEnableTrustSeal = true;
//         }
//       }
//     }

//     let trustSealAutoResult = null;
//     if (shouldEnableTrustSeal) {
//       trustSealAutoResult = await autoCreateFreeTrustSeal({
//         user_id,
//         subscription_id: subscription._id,
//         paidAt: now,
//       });

//       if (trustSealAutoResult?.success) {
//         console.log("Free Trust Seal auto-creation → SUCCESS");
//       } else {
//         console.warn("Free Trust Seal auto-creation → FAILED", trustSealAutoResult?.message);
//       }
//     }

//     /* =========================
//        🔹 ACTIVATE SUBSCRIPTION
//     ========================= */
//     subscription.razorpay_payment_id = razorpay_payment_id;
//     subscription.razorpay_signature = razorpay_signature;
//     subscription.status = subscription.auto_renew ? STATUS.ACTIVE_RENEWAL : STATUS.PAID;
//     subscription.razorpay_subscription_status = subscription.auto_renew
//       ? "active"
//       : undefined;

//     subscription.captured = true;
//     subscription.paid_at = now;
//     subscription.end_date = endDate;

//     // Use corrected amount (999 instead of 1000)
//     subscription.amount = Math.round(finalAmount * 100);

//     subscription.last_renewed_at = now;

//     if (subscription.auto_renew) {
//       subscription.next_renewal_at = endDate;
//     }

//     await subscription.save();

//     /* =========================
//        🔹 ACTIVATE NEW PLAN FEATURES USING SNAPSHOT
//     ========================= */
//     console.log(`Activating ${subscription.features_snapshot.length} features for user ${user_id}`);

//     for (const featureSnap of subscription.features_snapshot) {
//       const featureCode = featureSnap.feature_name
//         .trim()
//         .toUpperCase()
//         .replace(/[^A-Z0-9\s]/g, "")
//         .replace(/\s+/g, "_");

//       if (featureCode === "CHAT_SYSTEM") continue; // already handled above

//       if (!featureSnap.is_enabled) continue;

//       const value = featureSnap.value;
//       if (!value) continue;

//       /* =========================
//          🎥 PRODUCT VIDEO
//       ========================= */
//       if (featureCode === "PRODUCTS_VIDEO") {
//         const duration = parseVideoDuration(value); // use snapshot value
//         if (!duration) continue;

//         await UserActiveFeature.create({
//           user_id,
//           user_subscription_id: subscription._id,
//           feature_id: featureSnap.feature_id,
//           feature_code: "PRODUCTS_VIDEO",
//           activated_at: now,
//           expires_at: subscription.end_date,
//           status: "active",
//           product_video_duration: duration,
//         });
//         continue;
//       }

//       /* =========================
//          🎥 COMPANY VIDEO
//       ========================= */
//       if (featureCode === "COMPANY_VIDEO") {
//         const duration = parseVideoDuration(value);
//         if (!duration) continue;

//         await UserActiveFeature.create({
//           user_id,
//           user_subscription_id: subscription._id,
//           feature_id: featureSnap.feature_id,
//           feature_code: "COMPANY_VIDEO",
//           activated_at: now,
//           expires_at: subscription.end_date,
//           status: "active",
//           company_video_duration: duration,
//         });
//         continue;
//       }

//       /* =========================
//          🖼️ PRODUCT PHOTOS
//       ========================= */
//       if (featureCode === "PRODUCT_PHOTOS") {
//         const limit = parseQuotaValue(value);
//         if (!limit) continue;

//         await UserActiveFeature.create({
//           user_id,
//           user_subscription_id: subscription._id,
//           feature_id: featureSnap.feature_id,
//           feature_code: "PRODUCT_PHOTOS",
//           activated_at: now,
//           expires_at: subscription.end_date,
//           status: "active",
//           product_photo_limit: limit,
//         });
//         continue;
//       }

//       /* =========================
//          📘 DIGITAL BOOK
//       ========================= */
//       if (featureCode === "DIGITAL_BOOK") {
//         await UserActiveFeature.deleteMany({
//           user_id,
//           feature_code: "DIGITAL_BOOK",
//         });

//         let cityCount = 0;

//         if (
//           value.type === "NUMBER" &&
//           value.unit &&
//           /city|cities/i.test(value.unit.trim())
//         ) {
//           cityCount = parseInt(value.data, 10) || 0;
//         } else if (
//           value.type === "TEXT" &&
//           String(value.data).toLowerCase().trim() === "free"
//         ) {
//           cityCount = 0;
//         }

//         if (cityCount === null) continue;

//         const featureExpiry = calculateFeatureExpiry(now, value, endDate);

//         await UserActiveFeature.create({
//           user_id,
//           user_subscription_id: subscription._id,
//           feature_id: featureSnap.feature_id,
//           feature_code: "DIGITAL_BOOK",
//           activated_at: now,
//           expires_at: featureExpiry,
//           status: "active",
//           initial_plan_city_count: cityCount,
//           remaining_plan_city_count: cityCount,
//           selected_plan_cities: [],
//         });

//         console.log(
//           `📘 Digital Book activated → ${cityCount === 0 ? "Own city only (Free)" : `${cityCount} cities`}`
//         );
//         continue;
//       }

//       /* =========================
//          📦 PRODUCT COUNT
//       ========================= */
//       if (featureCode === "PRODUCT") {
//         const limit = parseQuotaValue(value);
//         if (!limit) continue;

//         await UserActiveFeature.create({
//           user_id,
//           user_subscription_id: subscription._id,
//           feature_id: featureSnap.feature_id,
//           feature_code: "PRODUCT",
//           activated_at: now,
//           expires_at: subscription.end_date,
//           status: "active",
//           product_limit: limit,
//         });
//         continue;
//       }

//       /* =========================
//          🔹 GENERIC FEATURES
//       ========================= */
//       const featureExpiry = calculateFeatureExpiry(now, value, endDate);

//       if (featureExpiry === null && String(value.data).toLowerCase() !== "unlimited") {
//         continue;
//       }

//       await UserActiveFeature.create({
//         user_id,
//         user_subscription_id: subscription._id,
//         feature_id: featureSnap.feature_id,
//         feature_code: featureCode,
//         activated_at: now,
//         expires_at: featureExpiry,
//         status: "active",
//       });
//     }

//     /* =========================
//        🔵 TREND POINTS ALLOCATION
//     ========================= */
//     const trendElement = await SubscriptionPlanElement.findOne({
//       $expr: {
//         $eq: [
//           { $toLower: { $trim: { input: "$feature_name" } } },
//           "trend point",
//         ],
//       },
//     });

//     if (trendElement) {
//       const trendMapping = await SubscriptionPlanElementMapping.findOne({
//         subscription_plan_id,
//         feature_id: trendElement._id,
//         is_enabled: true,
//       });

//       if (trendMapping?.value?.unit?.toLowerCase().includes("point")) {
//         const points = Number(trendMapping.value.data);

//         if (points > 0) {
//           const existingPoints = await TrendingPointsPayment.findOne({ user_id });

//           if (existingPoints) {
//             existingPoints.points += points;
//             existingPoints.amount += finalAmount;  // ← use corrected amount
//             existingPoints.payment_status = "paid";
//             existingPoints.subscription_id = subscription._id;
//             await existingPoints.save();
//           } else {
//             await TrendingPointsPayment.create({
//               user_id,
//               subscription_id: subscription._id,
//               points,
//               amount: finalAmount,  // ← corrected
//               razorpay_order_id,
//               payment_status: STATUS.PAID,
//               status: "Active",
//             });
//           }
//         }
//       }
//     }

//     /* =========================
//        🧾 UPDATE PAYMENT HISTORY
//     ========================= */
//     await PaymentHistory.findOneAndUpdate(
//       { razorpay_order_id },
//       {
//         user_id,
//         payment_type: "subscription",
//         subscription_plan_id,
//         user_subscription_id: subscription._id,
//         razorpay_payment_id,
//         razorpay_signature,
//         amount: Math.round(finalAmount * 100),                    // ← corrected (99900)
//         total_amount: expectedPaise,                               // ← corrected total
//         status: STATUS.PAID,
//         captured: true,
//         paid_at: now,
//         notes: "Subscription payment verified & features activated (discounted amount applied)",
//       },
//       { new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified and all features activated successfully",
//       subscription,
//     });
//   } catch (error) {
//     console.error("VerifyPayment Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Payment verification failed",
//       error: error.message || error.toString(),
//     });
//   }
// };

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      subscription_plan_id,
      amount, // ← this is usually the original amount (1000) from frontend
    } = req.body;

    if (
      !razorpay_payment_id ||
      !razorpay_signature ||
      (!razorpay_order_id && !req.body.razorpay_subscription_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay fields",
      });
    }

    /* =========================
     🔐 VERIFY RAZORPAY SIGNATURE (ORDER + SUBSCRIPTION)
    ========================= */
    const signaturePayload = razorpay_order_id
      ? `${razorpay_order_id}|${razorpay_payment_id}`
      : `${razorpay_payment_id}|${req.body.razorpay_subscription_id}`;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signaturePayload)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    /* =========================
       🔹 APPLY SAME ₹1 DISCOUNT AS IN createOrder
    ========================= */
    let finalAmount = Number(amount || 0);

    if (finalAmount > 1) {
      finalAmount -= 1;
    }

    // Re-calculate GST on the corrected amount (to be consistent)
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: "GST",
      category: "gst",
      durationType: "percentage",
    });

    const gstPercentage = gstPlan?.price || 18; // fallback to 18 if not found
    const gstAmount = (finalAmount * gstPercentage) / 100;
    const expectedTotal = finalAmount + gstAmount;
    const expectedPaise = Math.round(expectedTotal * 100);

    /* =========================
       🔹 FETCH PENDING SUBSCRIPTION
    ========================= */
    const subscription = await UserSubscription.findOne(
      razorpay_order_id
        ? { razorpay_order_id }
        : { razorpay_subscription_id: req.body.razorpay_subscription_id }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription order not found",
      });
    }

    const now = new Date();

    /* =========================
       🔹 AGGRESSIVE CLEANUP: DELETE ALL OLD SUBSCRIPTIONS & FEATURES
    ========================= */
    await cleanupOldSubscriptions(user_id, subscription._id);


    /* =========================
       🔹 SUBSCRIPTION BASE DURATION
    ========================= */
    const durationElement = await SubscriptionPlanElement.findOne({
      $or: [
        { feature_code: FEATURES.DURATION },
        { feature_name: { $regex: /^subscription duration$/i } },
      ],
    });

    if (!durationElement) {
      return res.status(400).json({
        success: false,
        message: "Subscription Duration feature not found",
      });
    }

    const durationMapping = await SubscriptionPlanElementMapping.findOne({
      subscription_plan_id,
      feature_id: durationElement._id,
      is_enabled: true,
    });

    if (!durationMapping?.value) {
      return res.status(400).json({
        success: false,
        message: "Subscription duration not configured for this plan",
      });
    }

    // Deserialize Mongoose subdocument to plain JS object first (avoids Mongoose 'type' key conflicts on spread)
    const rawDurationValue = durationMapping.value?.toObject
      ? durationMapping.value.toObject()
      : { type: durationMapping.value?.type, data: durationMapping.value?.data, unit: durationMapping.value?.unit };


    // Build clean, mutable copy
    const liveDurationValue = {
      type: rawDurationValue.type,
      data: rawDurationValue.data,
      unit: rawDurationValue.unit,
    };

    if (!liveDurationValue.unit || String(liveDurationValue.unit).trim() === '') {
      const snap = subscription.plan_snapshot;

      // Fallback 1: unit saved in plan_snapshot at createOrder time
      if (snap?.duration_unit) {
        liveDurationValue.unit = snap.duration_unit;
      } else {
        // Fallback 2: unit embedded in data string e.g. "1 year", "28 days"
        const EMBEDDED_UNIT_RE = /^[\d.]+\s*([a-zA-Z]+)$/;
        const embeddedMatch = String(liveDurationValue.data || '').match(EMBEDDED_UNIT_RE);
        if (embeddedMatch) {
          liveDurationValue.unit = embeddedMatch[1];
        } else {
          // Fallback 3: read from features_snapshot inside subscription document
          const snapFeature = subscription.features_snapshot?.find(
            f => f.feature_code === FEATURES.DURATION
          );
          const snapUnit = snapFeature?.value?.unit;
          const snapData = String(snapFeature?.value?.data || '');

          if (snapUnit) {
            liveDurationValue.unit = snapUnit;
          } else {
            // Last resort: try embedded unit inside the snapshot data string
            const snapEmbedMatch = snapData.match(EMBEDDED_UNIT_RE);
            if (snapEmbedMatch) {
              liveDurationValue.unit = snapEmbedMatch[1];
              if (!liveDurationValue.data || liveDurationValue.data === 'null') {
                liveDurationValue.data = snapData;
              }
            } else {
              console.error(`[DURATION] ❌ CRITICAL: All fallbacks exhausted! data="${liveDurationValue.data}", plan_snapshot.duration_unit="${snap?.duration_unit}", features_snapshot.value.unit="${snapUnit}". endDate will equal NOW. UPDATE the plan's Duration mapping in DB to include a proper unit!`);
            }
          }
        }
      }
    }

    let endDate = calculateEndDate(now, liveDurationValue);



    /* =========================
       🔐 MERCHANT VERIFICATION (Plan-based)
    ========================= */
    try {
      const verificationElement = await SubscriptionPlanElement.findOne({
        $or: [
          { feature_code: FEATURES.VERIFICATION },
          { feature_name: { $regex: /^verification$/i } },
        ],
      });

      let shouldVerifyMerchant = false;

      if (verificationElement) {
        const verificationMapping = await SubscriptionPlanElementMapping.findOne({
          subscription_plan_id,
          feature_id: verificationElement._id,
          is_enabled: true,
        });

        if (verificationMapping?.value) {
          const valueStr = String(verificationMapping.value.data || "")
            .toLowerCase()
            .trim();

          if (valueStr === "free" || valueStr === "enable") {
            shouldVerifyMerchant = true;
          }
        }
      }

      await Merchant.updateOne(
        { user_id },
        { $set: { verified_status: shouldVerifyMerchant } }
      );

    } catch (verifyErr) {
      console.error("Merchant verification update failed:", verifyErr.message);
    }

    /* =========================
       💬 CHAT SYSTEM ACTIVATION
    ========================= */
    try {
      const chatElement = await SubscriptionPlanElement.findOne({
        $or: [
          { feature_code: FEATURES.CHAT_SYSTEM },
          { feature_name: { $regex: /^chat system$/i } },
        ],
      });

      if (chatElement) {
        const chatMapping = await SubscriptionPlanElementMapping.findOne({
          subscription_plan_id,
          feature_id: chatElement._id,
          is_enabled: true,
        });

        if (chatMapping?.value) {
          let chatExpiry = null;
          let shouldEnableChat = false;

          const value = chatMapping.value;
          const dataStr = String(value.data || "").toLowerCase().trim();

          if (dataStr === "free" || dataStr === "enable") {
            shouldEnableChat = true;
            chatExpiry = subscription.end_date || endDate;
          } else if (
            value.type === "NUMBER" &&
            value.unit &&
            value.unit.toLowerCase().includes("day")
          ) {
            const days = parseInt(value.data, 10);
            if (!isNaN(days) && days > 0) {
              shouldEnableChat = true;
              chatExpiry = new Date(now);
              chatExpiry.setDate(chatExpiry.getDate() + days);
            }
          }

          if (shouldEnableChat) {
            await UserActiveFeature.findOneAndUpdate(
              { user_id, feature_code: FEATURES.CHAT_SYSTEM },
              {
                user_id,
                user_subscription_id: subscription._id,
                feature_id: chatElement._id,
                feature_code: FEATURES.CHAT_SYSTEM,
                activated_at: now,
                expires_at: chatExpiry,
                status: STATUS.ACTIVE,
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    } catch (chatErr) {
      console.error("Chat System activation failed:", chatErr.message);
    }

    /* =========================
       💬 BUY LEAD ACTIVATION
    ========================= */
    try {
      const buyLeadsElement = await SubscriptionPlanElement.findOne({
        $or: [
          { feature_code: FEATURES.BUY_LEADS },
          { feature_name: { $regex: /^buy lead$/i } },
        ],
      });

      if (buyLeadsElement) {
        const leadsMapping = await SubscriptionPlanElementMapping.findOne({
          subscription_plan_id,
          feature_id: buyLeadsElement._id,
          is_enabled: true,
        });

        if (leadsMapping?.value) {
          const value = leadsMapping.value;
          const dataStr = String(value.data || "").toLowerCase().trim();

          if (dataStr === "enable" || dataStr === "free") {
            const leadsExpiry = subscription.end_date || endDate;

            await UserActiveFeature.findOneAndUpdate(
              { user_id, feature_code: FEATURES.BUY_LEADS },
              {
                user_id,
                user_subscription_id: subscription._id,
                feature_id: buyLeadsElement._id,
                feature_code: FEATURES.BUY_LEADS,
                activated_at: now,
                expires_at: leadsExpiry,
                status: STATUS.ACTIVE,
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    } catch (leadsErr) {
      console.error("⚠️ Buy Leads activation failed:", leadsErr.message);
    }

    /* =========================
       🟢 NEW USER EXTRA DURATION (≤ 90 DAYS / 3 MONTHS)
    ========================= */
    try {
      const userToVerify = await User.findById(user_id).select('created_at createdAt').lean();

      if (userToVerify) {
        // Prefer Mongoose-set created_at, fallback to createdAt
        const regDateRaw = userToVerify.created_at || userToVerify.createdAt;
        const regDate = regDateRaw ? new Date(regDateRaw) : null;

        if (!regDate || isNaN(regDate.getTime())) {
          console.warn(`[BONUS] Could not determine registration date for user ${user_id}. Skipping bonus.`);
        } else {
          const diffInDays = (now - regDate) / (1000 * 60 * 60 * 24);

          if (diffInDays <= 90) {
            const newUserElement = await SubscriptionPlanElement.findOne({
              $or: [
                { feature_code: FEATURES.NEW_USER },
                { feature_name: { $regex: /^new user$/i } },
              ],
            });

            if (newUserElement) {
              const newUserMapping = await SubscriptionPlanElementMapping.findOne({
                subscription_plan_id,
                feature_id: newUserElement._id,
                is_enabled: true,
              });

              if (newUserMapping?.value) {
                // Deserialize Mongoose subdocument to plain JS (same fix as base duration)
                const rawBonusValue = newUserMapping.value?.toObject
                  ? newUserMapping.value.toObject()
                  : { type: newUserMapping.value?.type, data: newUserMapping.value?.data, unit: newUserMapping.value?.unit };


                const bonusValue = { type: rawBonusValue.type, data: rawBonusValue.data, unit: rawBonusValue.unit };

                const beforeBonus = endDate.toISOString();
                endDate = calculateEndDate(endDate, bonusValue);
              }
            }
          }
        }
      } else {
        console.warn(`[BONUS] User ${user_id} not found. Skipping New User bonus.`);
      }
    } catch (bonusErr) {
      console.error('[BONUS] Error while applying New User bonus:', bonusErr.message);
    }

    /* =========================
       🔹 TRUST SEAL ACTIVATION + AUTO CREATE
    ========================= */
    const trustSealElement = await SubscriptionPlanElement.findOne({
      $or: [
        { feature_code: FEATURES.TRUST_SEAL },
        { feature_name: { $regex: /^trust seal$/i } },
      ],
    });

    let shouldEnableTrustSeal = false;

    if (trustSealElement) {
      const trustSealMapping = await SubscriptionPlanElementMapping.findOne({
        subscription_plan_id,
        feature_id: trustSealElement._id,
        is_enabled: true,
      });

      if (trustSealMapping?.value) {
        const valueStr = String(trustSealMapping.value.data || "").toLowerCase().trim();
        if (valueStr === "free" || valueStr === "enable") {
          shouldEnableTrustSeal = true;
        }
      }
    }

    if (shouldEnableTrustSeal) {
      await autoCreateFreeTrustSeal({
        user_id,
        subscription_id: subscription._id,
        paidAt: now,
      });
    }

    /* =========================
       🔹 ACTIVATE SUBSCRIPTION
    ========================= */
    subscription.razorpay_payment_id = razorpay_payment_id;
    subscription.razorpay_signature = razorpay_signature;
    subscription.status = subscription.auto_renew ? STATUS.ACTIVE_RENEWAL : STATUS.PAID;
    subscription.razorpay_subscription_status = subscription.auto_renew ? "active" : undefined;
    subscription.captured = true;
    subscription.paid_at = now;
    subscription.end_date = endDate;
    subscription.amount = Math.round(finalAmount * 100);
    subscription.last_renewed_at = now;

    if (subscription.auto_renew) {
      subscription.next_renewal_at = endDate;
    }

    await subscription.save();

    /* =========================
       🔹 ACTIVATE NEW PLAN FEATURES USING SNAPSHOT
    ========================= */
    if (subscription.features_snapshot && subscription.features_snapshot.length > 0) {
      for (const featureSnap of subscription.features_snapshot) {
        // 💡 Backward compatibility: Fallback to feature_name if feature_code is missing
        const featureCode = featureSnap.feature_code;
        const featureName = (featureSnap.feature_name || "").toLowerCase().trim();

        const isChat = (featureCode === FEATURES.CHAT_SYSTEM) || (!featureCode && featureName === "chat system");
        const isBuyLeads = (featureCode === FEATURES.BUY_LEADS) || (!featureCode && featureName === "buy leads");
        const isDealers = (featureCode === FEATURES.ADDING_OF_DEALERS) || (!featureCode && featureName === "adding of dealers");
        const isPersonalManager = (featureCode === FEATURES.PERSONAL_MANAGER) || (!featureCode && featureName === "personal manager");

        if (isChat || isBuyLeads || isDealers || isPersonalManager) continue;
        if (!featureSnap.is_enabled) continue;

        const value = featureSnap.value;
        if (!value) continue;

        if (featureCode === FEATURES.PRODUCTS_VIDEO || (!featureCode && featureName === "products video")) {
          const duration = parseVideoDuration(value);
          if (duration) {
            await UserActiveFeature.create({
              user_id,
              user_subscription_id: subscription._id,
              feature_id: featureSnap.feature_id,
              feature_code: FEATURES.PRODUCTS_VIDEO,
              activated_at: now,
              expires_at: subscription.end_date,
              status: STATUS.ACTIVE,
              product_video_duration: duration,
            });
          }
          continue;
        }

        if (featureCode === FEATURES.COMPANY_VIDEO || (!featureCode && featureName === "company video")) {
          const duration = parseVideoDuration(value);
          if (duration) {
            await UserActiveFeature.create({
              user_id,
              user_subscription_id: subscription._id,
              feature_id: featureSnap.feature_id,
              feature_code: FEATURES.COMPANY_VIDEO,
              activated_at: now,
              expires_at: subscription.end_date,
              status: STATUS.ACTIVE,
              company_video_duration: duration,
            });
          }
          continue;
        }

        if (featureCode === FEATURES.PRODUCT_PHOTOS || (!featureCode && featureName === "product photos")) {
          const limit = parseQuotaValue(value);
          if (limit) {
            await UserActiveFeature.create({
              user_id,
              user_subscription_id: subscription._id,
              feature_id: featureSnap.feature_id,
              feature_code: FEATURES.PRODUCT_PHOTOS,
              activated_at: now,
              expires_at: subscription.end_date,
              status: STATUS.ACTIVE,
              product_photo_limit: limit,
            });
          }
          continue;
        }

        if (featureCode === FEATURES.DIGITAL_BOOK || (!featureCode && featureName === "digital book")) {
          await UserActiveFeature.deleteMany({ user_id, feature_code: FEATURES.DIGITAL_BOOK });
          let cityCount = 0;
          if (value.type === "NUMBER" && value.unit && /cit(y|ies|ites)/i.test(value.unit.trim())) {
            cityCount = parseInt(value.data, 10) || 0;
          } else if (value.type === "TEXT" && /unlimited|all/i.test(String(value.data).trim())) {
            cityCount = -1;
          }
          const featureExpiry = calculateFeatureExpiry(now, value, endDate);
          await UserActiveFeature.create({
            user_id,
            user_subscription_id: subscription._id,
            feature_id: featureSnap.feature_id,
            feature_code: FEATURES.DIGITAL_BOOK,
            activated_at: now,
            expires_at: featureExpiry,
            status: STATUS.ACTIVE,
            initial_plan_city_count: cityCount,
            remaining_plan_city_count: cityCount,
            selected_plan_cities: [],
          });
          continue;
        }

        if (featureCode === FEATURES.PRODUCT_LIMIT || (!featureCode && featureName === "product")) {
          const limit = parseQuotaValue(value);
          if (limit) {
            await UserActiveFeature.create({
              user_id,
              user_subscription_id: subscription._id,
              feature_id: featureSnap.feature_id,
              feature_code: FEATURES.PRODUCT_LIMIT,
              activated_at: now,
              expires_at: subscription.end_date,
              status: STATUS.ACTIVE,
              product_limit: limit,
            });
          }
          continue;
        }

        const featureExpiry = calculateFeatureExpiry(now, value, endDate);
        await UserActiveFeature.create({
          user_id,
          user_subscription_id: subscription._id,
          feature_id: featureSnap.feature_id,
          feature_code: featureCode || featureName.toUpperCase().replace(/\s+/g, "_"), // fallback generation if no code
          activated_at: now,
          expires_at: featureExpiry,
          status: STATUS.ACTIVE,
        });
      }
    }

    /* =========================
       🔵 TREND POINTS ALLOCATION
    ========================= */
    const trendElement = await SubscriptionPlanElement.findOne({
      $or: [
        { feature_code: FEATURES.TREND_POINT },
        { feature_name: { $regex: /^trend[ing]?\s*point[s]?$/i } },
      ],
    });

    if (trendElement) {
      const trendMapping = await SubscriptionPlanElementMapping.findOne({
        subscription_plan_id,
        feature_id: trendElement._id,
        is_enabled: true,
      });

      if (trendMapping?.value?.unit?.toLowerCase().includes("point")) {
        const points = Number(trendMapping.value.data);
        if (points > 0) {
          const existingPoints = await TrendingPointsPayment.findOne({ user_id });
          if (existingPoints) {
            existingPoints.points += points;
            existingPoints.amount += finalAmount;
            existingPoints.payment_status = STATUS.PAID;
            existingPoints.status = STATUS.ACTIVE_CAP;
            existingPoints.subscription_id = subscription._id;
            await existingPoints.save();
          } else {
            await TrendingPointsPayment.create({
              user_id,
              subscription_id: subscription._id,
              points,
              amount: finalAmount,
              razorpay_order_id: razorpay_order_id || null,
              razorpay_subscription_id: req.body.razorpay_subscription_id || null,
              payment_status: STATUS.PAID,
              status: STATUS.ACTIVE_CAP,
            });
          }
        }
      }
    }


    /* =========================
       🔹 ACTIVATE: ADDING OF DEALERS
    ========================= */
    const dealerFeature = await SubscriptionPlanElement.findOne({
      $or: [
        { feature_code: FEATURES.ADDING_OF_DEALERS },
        { feature_name: { $regex: /^adding of dealers$/i } }
      ]
    });

    if (dealerFeature) {
      const mapping = await SubscriptionPlanElementMapping.findOne({
        subscription_plan_id: subscription_plan_id,
        feature_id: dealerFeature._id,
        is_enabled: true
      });

      if (mapping && (mapping.value?.data === "enable" || mapping.value?.data === "free")) {
        await UserActiveFeature.findOneAndUpdate(
          { user_id, feature_code: FEATURES.ADDING_OF_DEALERS },
          {
            user_subscription_id: subscription._id,
            feature_id: dealerFeature._id,
            activated_at: now,
            expires_at: subscription.end_date,
            status: STATUS.ACTIVE
          },
          { upsert: true, new: true }
        );
      }
    }

    /* =========================
       🔹 ACTIVATE: PERSONAL MANAGER
    ========================= */
    const managerFeature = await SubscriptionPlanElement.findOne({
      $or: [
        { feature_code: FEATURES.PERSONAL_MANAGER },
        { feature_name: { $regex: /^personal manager$/i } }
      ]
    });

    if (managerFeature) {
      const mapping = await SubscriptionPlanElementMapping.findOne({
        subscription_plan_id: subscription_plan_id,
        feature_id: managerFeature._id,
        is_enabled: true
      });

      if (mapping && (mapping.value?.data === "enable" || mapping.value?.data === "free")) {
        await UserActiveFeature.findOneAndUpdate(
          { user_id, feature_code: FEATURES.PERSONAL_MANAGER },
          {
            user_subscription_id: subscription._id,
            feature_id: managerFeature._id,
            activated_at: now,
            expires_at: subscription.end_date,
            status: STATUS.ACTIVE
          },
          { upsert: true, new: true }
        );
      }
    }

    /* =========================
       🧾 UPDATE PAYMENT HISTORY
    ========================= */
    const historyQuery = razorpay_order_id
      ? { razorpay_order_id }
      : { user_subscription_id: subscription._id, status: STATUS.CREATED };

    await PaymentHistory.findOneAndUpdate(
      historyQuery,
      {
        user_id,
        payment_type: "subscription",
        subscription_plan_id,
        user_subscription_id: subscription._id,
        razorpay_payment_id,
        razorpay_signature,
        amount: Math.round(finalAmount * 100),
        total_amount: expectedPaise,
        status: STATUS.PAID,
        captured: true,
        paid_at: now,
        notes: "Subscription payment verified & features activated (discounted amount applied)",
      }
    );

    /* ============================================================
       💰 DYNAMIC REFERRAL COMMISSION
    ============================================================ */
    try {
      const User = mongoose.model("User");
      const buyer = await User.findById(user_id);
      if (buyer && buyer.referred_by) {
        const Point = mongoose.model("Point");
        const ReferralCommission = mongoose.model("ReferralCommission");
        const existingCommission = await ReferralCommission.findOne({ razorpay_payment_id });

        if (!existingCommission) {
          const referralConfig = await Point.findOne({ point_name: { $regex: /^referal_point$/i } });
          if (referralConfig && referralConfig.point_count > 0) {
            const commissionPercent = referralConfig.point_count;
            const commission = Math.round((finalAmount * commissionPercent) / 100);
            await ReferralCommission.create({
              referrer_id: buyer.referred_by,
              referred_user_id: user_id,
              subscription_id: subscription._id,
              razorpay_payment_id,
              plan_amount: finalAmount,
              commission_percentage: commissionPercent,
              commission_amount: commission,
              status: "EARNED"
            });
          }
        }
      }
    } catch (referralErr) {
      console.error("[REFERRAL CRITICAL ERROR]:", referralErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and all features activated successfully",
      subscription,
    });

  } catch (error) {
    console.error("VerifyPayment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message || error.toString(),
    });
  }
};



exports.getOrderDetails = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await razorpay.orders.fetch(order_id);
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch order", error: error.message });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const payment = await razorpay.payments.fetch(payment_id);
    res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch payment", error: error.message });
  }
};

// Get user's active subscription
// exports.getUserActiveSubscription = async (req, res) => {
//   try {
//     const { user_id } = req.params;

//     if (!user_id) {
//       return res.status(400).json({ success: false, message: "User ID is required" });
//     }

//     // Fetch active subscription
//     const subscription = await UserSubscription.findOne({
//       user_id,
//       status: STATUS.PAID,
//     })
//       .populate("subscription_plan_id")
//       .lean();

//     if (!subscription) {
//       return res.status(404).json({
//         success: false,
//         message: "No active subscription found",
//       });
//     }

//     // Fetch mapped features for this plan
//     // Use the correct field name: feature_id
//     const elements = await SubscriptionPlanElementMapping.find({
//       subscription_plan_id: subscription.subscription_plan_id._id,
//     })
//       .populate("feature_id")  // ← CORRECT: was "feature_id" before
//       .lean();

//     // Attach formatted elements to subscription
//     subscription.elements = elements.map((elem) => ({
//       feature_id: elem.feature_id._id,
//       feature_name: elem.feature_id.feature_name,
//       is_enabled: elem.is_enabled,
//       value: elem.value,  // { type, data, unit }
//     }));

//     // Razorpay details (only for paid plans)
//     let razorpayOrder = null;
//     let razorpayPayment = null;

//     if (subscription.subscription_plan_id.plan_code !== "FREE") {
//       try {
//         if (subscription.razorpay_order_id) {
//           razorpayOrder = await razorpay.orders.fetch(subscription.razorpay_order_id);
//         }
//         if (subscription.razorpay_payment_id) {
//           razorpayPayment = await razorpay.payments.fetch(subscription.razorpay_payment_id);
//         }
//       } catch (razorpayError) {
//         console.error("Razorpay fetch error:", razorpayError);
//         // Don't fail the whole request if Razorpay API is down
//       }
//     }

//     res.status(200).json({
//       success: true,
//       subscription,
//       razorpayOrder,
//       razorpayPayment,
//     });
//   } catch (error) {
//     console.error("Error fetching active subscription:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch active subscription",
//       error: error.message,
//     });
//   }
// };

exports.getUserActiveSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const subscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE, STATUS.ACTIVE_RENEWAL] },
      cancelled_at: null,
    })
      .sort({ paid_at: -1, updatedAt: -1, createdAt: -1, end_date: -1 })
      .populate("subscription_plan_id")
      .lean();

    if (!subscription) {
      return res.status(200).json({
        success: true,
        subscription: null,
        razorpayOrder: null,
        razorpayPayment: null,
        message: "No active subscription found",
      });
    }


    // ─────────────────────────────────────────────────────────────────────────
    // Compute end_date from plan_snapshot when it's missing (e.g., auto-renewal
    // subscription created but first payment not yet captured)
    // ─────────────────────────────────────────────────────────────────────────
    const planCode = subscription.subscription_plan_id?.plan_code;
    const isFreePlanCheck = planCode === PLAN_CODES.FREE ||
      subscription.subscription_plan_id?.plan_name?.toUpperCase().includes("FREE") ||
      subscription.amount === 0;

    if (!subscription.end_date && !isFreePlanCheck) {
      const snap = subscription.plan_snapshot;
      if (snap?.duration_value && snap?.duration_unit) {
        const startDate = new Date(subscription.paid_at || subscription.createdAt);
        const qty = Number(snap.duration_value);
        const unit = String(snap.duration_unit).toLowerCase().trim();
        const computed = new Date(startDate);

        if (unit.includes("year")) {
          computed.setFullYear(computed.getFullYear() + qty);
        } else if (unit.includes("month")) {
          computed.setMonth(computed.getMonth() + qty);
        } else if (unit.includes("day")) {
          computed.setDate(computed.getDate() + qty);
        }

        subscription.end_date = computed;
        subscription.end_date_computed = true; // flag: computed, not stored in DB
      }
    }

    // Safety check – prevent crash if plan reference is broken
    if (!subscription.subscription_plan_id) {
      console.warn(`Broken plan reference in subscription ${subscription._id}`);
      subscription.elements = [];
      // You can still return the subscription without features
    } else {
      const elements = await SubscriptionPlanElementMapping.find({
        subscription_plan_id: subscription.subscription_plan_id._id,
      })
        .populate("feature_id")
        .lean();

      subscription.elements = elements.map((elem) => ({
        feature_id: elem.feature_id?._id || null,
        feature_code: elem.feature_id?.feature_code || null,
        feature_name: elem.feature_id?.feature_name || "Unknown",
        is_enabled: elem.is_enabled,
        value: elem.value,
      }));
    }

    // Razorpay fetch – skip for FREE (already guarded)
    let razorpayOrder = null;
    let razorpayPayment = null;

    if (
      subscription.subscription_plan_id &&
      subscription.subscription_plan_id.plan_code !== PLAN_CODES.FREE
    ) {
      try {
        if (subscription.razorpay_order_id) {
          razorpayOrder = await razorpay.orders.fetch(subscription.razorpay_order_id);
        }
        if (subscription.razorpay_payment_id) {
          razorpayPayment = await razorpay.payments.fetch(subscription.razorpay_payment_id);
        }
      } catch (err) {
        console.error("Razorpay fetch error (non-blocking):", err);
      }
    }

    return res.status(200).json({
      success: true,
      subscription,
      razorpayOrder,
      razorpayPayment,
    });
  } catch (error) {
    console.error("Error in getUserActiveSubscription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active subscription",
      error: error.message,
    });
  }
};


exports.getUserActiveSubscriptionforBanner = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    // Get latest active paid subscription
    const subscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      captured: true,
    })
      .sort({ paid_at: -1 })
      .populate("subscription_plan_id");

    const hasSubscription = !!subscription;
    const subscriptionId = subscription?._id || null;
    const isRoyal =
      subscription?.subscription_plan_id?.plan_code === "ROYAL";

    const now = new Date();
    let features = {};

    // Get all active feature definitions
    const allFeatures = await SubscriptionPlanElement.find({
      is_active: true,
    });

    if (hasSubscription) {
      // Get user's active features
      const activeFeatures = await UserActiveFeature.find({
        user_id,
        user_subscription_id: subscriptionId,
        status: STATUS.ACTIVE,
        $or: [{ expires_at: { $gt: now } }, { expires_at: null }],
      }).select("feature_code");

      const activeCodesSet = new Set(
        activeFeatures.map((f) => f.feature_code)
      );

      allFeatures.forEach((feature) => {
        let code = feature.feature_code;

        // Fallback: generate from feature_name
        if (!code && feature.feature_name) {
          code = feature.feature_name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, "")
            .replace(/\s+/g, "_");
        }

        if (code) {
          features[code.toLowerCase()] =
            activeCodesSet.has(code);
        }
      });
    } else {
      // No subscription → all features false
      allFeatures.forEach((feature) => {
        let code = feature.feature_code;

        if (!code && feature.feature_name) {
          code = feature.feature_name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, "")
            .replace(/\s+/g, "_");
        }

        if (code) {
          features[code.toLowerCase()] = false;
        }
      });
    }

    res.status(200).json({
      hasSubscription,
      subscriptionId,
      isRoyal,
      features,
      // example:
      // { banner: true, top_listing: false, trust_seal: true }
    });
  } catch (error) {
    console.error("Get User Active Subscription Error:", error);
    res.status(500).json({
      message: "Failed to check active subscription",
      error: error.message,
    });
  }
};


// exports.upgradeSubscription = async (req, res) => {
//   try {
//     const { user_id, subscription_plan_id, old_subscription_id, amount, razorpay_order_id } = req.body;

//     // Validate required fields
//     if (!user_id || !subscription_plan_id || !amount || !razorpay_order_id) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         missing: {
//           user_id: !user_id,
//           subscription_plan_id: !subscription_plan_id,
//           amount: !amount,
//           razorpay_order_id: !razorpay_order_id,
//         },
//       });
//     }

//     // Check if new plan exists
//     const newPlan = await SubscriptionPlan.findById(subscription_plan_id);
//     if (!newPlan) {
//       return res.status(404).json({ message: "New subscription plan not found" });
//     }

//     // Mark old subscription as inactive (if provided)
//     if (old_subscription_id) {
//       const oldSubscription = await UserSubscription.findById(old_subscription_id);
//       if (oldSubscription) {
//         oldSubscription.status = "inactive";
//         oldSubscription.updated_at = new Date();
//         await oldSubscription.save();
//       }
//     }

//     // Create new subscription
//     const subscription = new UserSubscription({
//       user_id,
//       subscription_plan_id,
//       amount,
//       razorpay_order_id,
//       currency: "INR",
//       status: "created", // Will be updated to "paid" after payment verification
//       created_at: new Date(),
//     });

//     await subscription.save();
//     res.status(201).json({ message: "New subscription created", subscription });
//   } catch (error) {
//     console.error("Upgrade Subscription Error:", error);
//     res.status(500).json({ message: "Failed to upgrade subscription", error: error.message });
//   }
// };

exports.upgradeSubscription = async (req, res) => {
  try {
    const {
      user_id,
      subscription_plan_id,
      old_subscription_id,
      amount,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validate required fields
    if (!user_id || !subscription_plan_id || (!razorpay_order_id && !razorpay_subscription_id)) {
      return res.status(400).json({
        message: 'Missing required fields',
        missing: {
          user_id: !user_id,
          subscription_plan_id: !subscription_plan_id,
          payment_id: !razorpay_order_id && !razorpay_subscription_id,
        },
      });
    }

    // Fetch new plan
    const newPlan = await SubscriptionPlan.findById(subscription_plan_id);
    if (!newPlan) {
      return res.status(404).json({ message: 'New subscription plan not found' });
    }

    // Handle free plan case for the new plan
    if (newPlan.plan_code === PLAN_CODES.FREE || newPlan.price === 0) {
      if (razorpay_payment_id || razorpay_signature || amount > 0) {
        return res.status(400).json({
          message: 'Free plan does not require payment details or amount',
        });
      }

      // Fetch duration for free plan
      const durationElement = await SubscriptionPlanElement.findOne({
        feature_code: FEATURES.DURATION,
      });
      if (!durationElement) {
        return res.status(404).json({ message: 'Subscription Duration element not found' });
      }

      const mapping = await SubscriptionPlanElementMapping.findOne({
        subscription_plan_id,
        feature_id: durationElement._id,
      });
      if (!mapping || !mapping.value) {
        return res.status(404).json({ message: 'Subscription Duration mapping not found' });
      }

      // Parse duration
      let totalMonths = 0;
      try {
        totalMonths = parseDuration(mapping.value);
      } catch (durationErr) {
        return res.status(400).json({ message: durationErr.message || 'Invalid subscription duration value' });
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + totalMonths);

      // ★★★ Fetch ALL system features to build a complete snapshot
      const allFeaturesForFree = await SubscriptionPlanElement.find({ is_active: true }).lean();

      // ★★★ Fetch FREE plan mappings
      const freeMappings = await SubscriptionPlanElementMapping.find({
        subscription_plan_id: subscription_plan_id,
      }).lean();

      const featuresSnapshot = allFeaturesForFree.map((feat) => {
        const mapping = freeMappings.find(m => m.feature_id?.toString() === feat._id.toString());
        return {
          feature_id: feat._id,
          feature_name: feat.feature_name || "Unknown",
          feature_code: feat.feature_code || "UNKNOWN",
          is_enabled: mapping ? mapping.is_enabled : false,
          value: mapping && mapping.value ? {
            type: mapping.value.type,
            data: mapping.value.data,
            unit: mapping.value.unit
          } : undefined
        };
      });

      // Check for existing subscription with same razorpay_order_id
      // Check for existing subscription
      const existingSubscription = await UserSubscription.findOne(
        razorpay_order_id
          ? { razorpay_order_id, status: { $in: [STATUS.CREATED, STATUS.PAID, STATUS.ACTIVE_RENEWAL] } }
          : { razorpay_subscription_id, status: { $in: [STATUS.CREATED, STATUS.PAID, STATUS.ACTIVE_RENEWAL] } }
      );

      let subscription;
      if (existingSubscription) {
        // Update existing record using updateOne to avoid full validation of legacy snapshots
        await UserSubscription.updateOne(
          { _id: existingSubscription._id },
          {
            $set: {
              subscription_plan_id,
              amount: 0,
              gst_percentage: 0,
              gst_amount: 0,
              end_date: endDate,
              status: STATUS.PAID,
              captured: true,
              paid_at: new Date(),
              updated_at: new Date(),
              features_snapshot: featuresSnapshot,
              plan_snapshot: {
                plan_name: newPlan.plan_name || "Free Plan",
                plan_code: newPlan.plan_code || "FREE",
                price: 0,
                currency: "INR",
              }
            }
          }
        );
        subscription = await UserSubscription.findById(existingSubscription._id);
      } else {
        // Create new subscription
        subscription = new UserSubscription({
          user_id,
          subscription_plan_id,
          razorpay_order_id: `free_order_${user_id}`,
          amount: 0,
          gst_percentage: 0,
          gst_amount: 0,
          end_date: endDate,
          status: STATUS.PAID,
          captured: true,
          paid_at: new Date(),
          created_at: new Date(),
          currency: 'INR',
          features_snapshot: featuresSnapshot,
          plan_snapshot: {
            plan_name: newPlan.plan_name || "Free Plan",
            plan_code: newPlan.plan_code || "FREE",
            price: 0,
            currency: "INR",
          }
        });
        await subscription.save();
      }

      // COMPREHENSIVE CLEANUP: Delete all old subscriptions for this user except the new one
      await cleanupOldSubscriptions(user_id, subscription._id);


      return res.status(201).json({
        message: 'Free plan assigned successfully',
        subscription,
      });
    }

    // For paid plans, validate payment details
    if (!amount || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: 'Missing payment details for paid plan',
        missing: {
          amount: !amount,
          razorpay_payment_id: !razorpay_payment_id,
          razorpay_signature: !razorpay_signature,
        },
      });
    }

    // Fetch GST plan
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: 'GST',
      category: 'gst',
      durationType: 'percentage',
    });
    if (!gstPlan) {
      return res.status(404).json({ message: 'GST plan not found' });
    }

    const gstPercentage = gstPlan.price;
    let baseAmount = Number(amount || 0);

    // Apply same ₹1 discount as in createOrder
    if (baseAmount > 1) {
      baseAmount -= 1;
    }

    const gstAmount = (baseAmount * gstPercentage) / 100;

    // Calculate prorated amount if upgrading
    let amountToPay = newPlan.price;
    let freePlanTotalMonths = 0;
    let additionalMonths = 0;
    const now = new Date();

    if (old_subscription_id) {
      const oldSub = await UserSubscription.findById(old_subscription_id);
      if (oldSub) {
        const oldPlan = await SubscriptionPlan.findById(oldSub.subscription_plan_id);
        if (oldPlan) {
          amountToPay = newPlan.price - oldPlan.price;
          if (amountToPay < 0) amountToPay = 0;

          // Apply same ₹1 discount rule if we are actually charging something
          if (amountToPay > 1) {
            amountToPay -= 1;
          }

          // Check if old plan is a free plan and user is within 3 months of registration
          if (oldPlan.business_type === PLAN_TYPES.FREE) {
            const user = await User.findById(user_id);
            if (!user) {
              return res.status(404).json({ message: 'User not found' });
            }

            const registrationDate = new Date(user.created_at);
            const diffInMs = now - registrationDate;
            const diffInMonths = diffInMs / (1000 * 60 * 60 * 24 * 30);

            if (diffInMonths <= 3) {
              // Fetch free plan duration
              const durationElement = await SubscriptionPlanElement.findOne({
                feature_code: FEATURES.DURATION,
              });
              if (!durationElement) {
                return res.status(404).json({ message: 'Subscription Duration element not found' });
              }

              const freePlanDurationMapping = await SubscriptionPlanElementMapping.findOne({
                subscription_plan_id: oldPlan._id,
                feature_id: durationElement._id,
              });

              if (freePlanDurationMapping && freePlanDurationMapping.value) {
                try {
                  freePlanTotalMonths = parseDuration(freePlanDurationMapping.value);
                } catch (durationErr) {
                  return res.status(400).json({ message: durationErr.message || 'Invalid subscription duration value' });
                }
                additionalMonths = 6; // Add 6 months if within 3 months and upgrading from free plan
              }
            }
          }
        }
      }
    }




    // Fetch duration for new plan
    const durationElement = await SubscriptionPlanElement.findOne({
      $or: [
        { feature_code: FEATURES.DURATION },
        { feature_name: { $regex: /^subscription duration$/i } },
      ],
    });
    if (!durationElement) {
      return res.status(404).json({ message: 'Subscription Duration element not found' });
    }

    const durationMapping = await SubscriptionPlanElementMapping.findOne({
      subscription_plan_id,
      feature_id: durationElement._id,
    });
    if (!durationMapping || !durationMapping.value) {
      return res.status(404).json({ message: 'Subscription Duration mapping not found' });
    }

    // Deserialize to plain JS to avoid Mongoose subdocument spread issues
    const rawDurVal = durationMapping.value?.toObject
      ? durationMapping.value.toObject()
      : { type: durationMapping.value?.type, data: durationMapping.value?.data, unit: durationMapping.value?.unit };


    const liveDurVal = { type: rawDurVal.type, data: rawDurVal.data, unit: rawDurVal.unit };

    // Embedded unit fallback (e.g. data = "1 year" with no unit field)
    if (!liveDurVal.unit || String(liveDurVal.unit).trim() === '') {
      const EMBEDDED_RE = /^[\d.]+\s*([a-zA-Z]+)$/;
      const embedded = String(liveDurVal.data || '').match(EMBEDDED_RE);
      if (embedded) {
        liveDurVal.unit = embedded[1];
      } else {
        console.error(`[UPGRADE/DURATION] CRITICAL: Cannot resolve unit for data="${liveDurVal.data}" — fix plan mapping in DB!`);
      }
    }

    // Calculate base endDate using calculateEndDate (handles years/months/days/weeks correctly)
    let endDate = calculateEndDate(now, liveDurVal);

    // --- NEW USER BONUS (replaces hardcoded additionalMonths) ---
    // Check user registration date against NEW_USER feature mapping of the plan
    try {
      const upgradeUser = await User.findById(user_id).select('created_at createdAt').lean();
      if (upgradeUser) {
        const regDateRaw = upgradeUser.created_at || upgradeUser.createdAt;
        const regDate = regDateRaw ? new Date(regDateRaw) : null;
        if (regDate && !isNaN(regDate.getTime())) {
          const diffInDays = (now - regDate) / (1000 * 60 * 60 * 24);

          if (diffInDays <= 90) {
            const newUserElement = await SubscriptionPlanElement.findOne({
              $or: [
                { feature_code: FEATURES.NEW_USER },
                { feature_name: { $regex: /^new user$/i } },
              ],
            });
            if (newUserElement) {
              const newUserMapping = await SubscriptionPlanElementMapping.findOne({
                subscription_plan_id,
                feature_id: newUserElement._id,
                is_enabled: true,
              });
              if (newUserMapping?.value) {
                const rawBonus = newUserMapping.value?.toObject
                  ? newUserMapping.value.toObject()
                  : { type: newUserMapping.value?.type, data: newUserMapping.value?.data, unit: newUserMapping.value?.unit };
                const beforeBonus = endDate.toISOString();
                endDate = calculateEndDate(endDate, { type: rawBonus.type, data: rawBonus.data, unit: rawBonus.unit });
              }
            }
          } else {
          }
        }
      }
    } catch (bonusErr) {
      console.error('[UPGRADE/BONUS] Error applying bonus:', bonusErr.message);
    }


    // Check for existing subscription with same razorpay_order_id or razorpay_payment_id
    let subscription;
    const existingSubscription = await UserSubscription.findOne(
      razorpay_order_id
        ? { razorpay_order_id, status: { $in: [STATUS.CREATED, STATUS.PAID, STATUS.ACTIVE_RENEWAL] } }
        : { razorpay_subscription_id, status: { $in: [STATUS.CREATED, STATUS.PAID, STATUS.ACTIVE_RENEWAL] } }
    );

    if (existingSubscription) {
      // Update existing record using updateOne to bypass full document validation on legacy fields
      await UserSubscription.updateOne(
        { _id: existingSubscription._id },
        {
          $set: {
            subscription_plan_id,
            amount: amountToPay * 100,
            razorpay_payment_id,
            razorpay_signature,
            gst_percentage: gstPercentage,
            gst_amount: gstAmount * 100,
            end_date: endDate,
            status: STATUS.PAID,
            captured: true,
            paid_at: new Date(),
            updated_at: new Date()
          }
        }
      );
      subscription = await UserSubscription.findById(existingSubscription._id);
    } else {
      // Create new subscription
      subscription = new UserSubscription({
        user_id,
        subscription_plan_id,
        amount: amountToPay * 100,
        razorpay_order_id,
        razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature,
        gst_percentage: gstPercentage,
        gst_amount: gstAmount * 100,
        end_date: endDate,
        status: STATUS.PAID,
        captured: true,
        paid_at: new Date(),
        created_at: new Date(),
        currency: 'INR',
      });
      await subscription.save();
    }

    // COMPREHENSIVE CLEANUP: Delete all old subscriptions for this user except the new one
    await cleanupOldSubscriptions(user_id, subscription._id);


    res.status(201).json({
      message: 'Subscription upgraded successfully',
      subscription,
    });
  } catch (error) {
    console.error('Upgrade Subscription Error:', error);
    res.status(500).json({
      message: 'Failed to upgrade subscription',
      error: error.message,
    });
  }
};

// Cancel a user subscription
// exports.cancelSubscription = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const subscription = await UserSubscription.findById(id);
//     if (!subscription) {
//       return res.status(404).json({ message: "Subscription not found" });
//     }

//     // Update subscription status to cancelled
//     subscription.status = "cancelled";
//     subscription.cancelled_at = new Date();
//     await subscription.save();

//     // Optionally initiate a refund via Razorpay
//     if (subscription.razorpay_payment_id) {
//       try {
//         const refund = await razorpay.payments.refund(
//           subscription.razorpay_payment_id,
//           {
//             amount: subscription.amount * 100, // Convert to paise
//           }
//         );
//         subscription.refunded = true;
//         subscription.refunded_at = new Date();
//         await subscription.save();
//         return res
//           .status(200)
//           .json({ message: "Subscription cancelled and refunded", refund });
//       } catch (refundError) {
//         console.error("Refund failed:", refundError);
//         return res.status(200).json({
//           message: "Subscription cancelled but refund failed",
//           subscription,
//         });
//       }
//     }

//     res.status(200).json({ message: "Subscription cancelled", subscription });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to cancel subscription", error: error.message });
//   }
// };
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params; // your internal UserSubscription _id

    const subscription = await UserSubscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    if (subscription.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled"
      });
    }

    const userId = subscription.user_id?.toString();
    if (!userId) {
      return res.status(500).json({
        success: false,
        message: "User ID missing from subscription record"
      });
    }

    // 1. Cancel the Razorpay subscription (stops future auto-charges)
    let razorpayCancelResponse = null;
    if (subscription.razorpay_subscription_id) {
      try {
        razorpayCancelResponse = await razorpay.subscriptions.cancel(
          subscription.razorpay_subscription_id,
          false // false = cancel at end of current billing cycle (recommended UX)
          // Change to true if you want immediate cancel
        );
      } catch (rzError) {
        console.error("Razorpay subscription cancel failed:", rzError);
        // Continue anyway — most systems treat webhook sync as eventual consistency
      }
    }

    // 2. Comprehensive Cleanup: Delete ALL old records for this user
    await cleanupOldSubscriptions(userId, null);

    // 3. Assign Lifetime Free Plan
    let planResult;
    try {
      planResult = await assignFreePlan(userId, true);
    } catch (err) {
      console.error(`assignFreePlan failed after subscription cancel for user ${userId}:`, err);
      planResult = {
        success: false,
        message: err.message || "Free plan assignment error"
      };
    }

    // Soft failure on free plan — still count as successful cancel
    if (!planResult.success) {
      console.warn(
        `⚠️ Aggressive cleanup done, but lifetime free plan assignment failed for user ${userId}: ${planResult.message}`
      );
    }

    // 4. Final response
    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully. User moved to a lifetime free plan.",
      freePlanId: planResult.subscriptionId,
      freePlanAssigned: planResult.success,
      ...(planResult.success ? {} : { freePlanWarning: planResult.message })
    });

  } catch (error) {
    console.error("Cancel subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message
    });
  }
};

exports.searchUsersByNumberOrEmail = async (req, res) => {
  try {
    let { query } = req.query;

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    query = query.trim();

    // 1. Find users matching email or phone in User model
    let users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    }).select("name email phone _id role");

    // 2. Fallback: Search in Merchant model if no users found in User model
    if (!users || users.length === 0) {
      const merchants = await Merchant.find({
        $or: [
          { company_email: { $regex: query, $options: "i" } },
          { company_phone_number: { $regex: query, $options: "i" } },
        ],
      }).select("user_id");

      if (merchants && merchants.length > 0) {
        const userIds = merchants.map(m => m.user_id).filter(id => id);
        if (userIds.length > 0) {
          users = await User.find({ _id: { $in: userIds } }).select("name email phone _id role");
        }
      }
    }

    if (!users || !users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    for (const user of users) {
      const role = await Role.findById(user.role);

      if (role && ["MERCHANT", "SERVICE_PROVIDER", "GROCERY_SELLER"].includes(role.role)) {
        // ✅ Find company address for this user
        const companyAddress = await Address.findOne({
          user_id: user._id,
          address_type: "company",
        });

        // ✅ Find active banner payment for this user
        const bannerPayment = await BannerPayment.findOne({
          user_id: user._id,
          payment_status: STATUS.PAID,
          status: STATUS.ACTIVE_CAP,
        }).lean();

        return res.status(200).json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: role.role,
          },
          address: companyAddress || null, // ✅ Include address if found
          bannerPayment: bannerPayment || null, // ✅ Include active banner payment if found
        });
      }
    }

    return res
      .status(404)
      .json({ message: "No users found with role MERCHANT, SERVICE_PROVIDER or BASE_MEMBER" });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchUsersByNumberOrEmailForWallet = async (req, res) => {
  try {
    let { query } = req.query;

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    query = query.trim();

    // Find users matching email or phone
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    }).select("name email phone _id role");

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    for (const user of users) {
      const role = await Role.findById(user.role);

      if (role && ["USER", "MERCHANT", "GROCERY_SELLER", "STUDENT"].includes(role.role)) {
        // Fetch view points for this user (wallet_points)
        const viewPointData = await ViewPoint.findOne({ user_id: user._id });

        return res.status(200).json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: role.role,
            wallet_points: viewPointData?.view_points || 0,
          },
        });
      }
    }

    return res
      .status(404)
      .json({ message: "No users found with role USER, MERCHANT, GROCERY_SELLER or STUDENT" });

  } catch (error) {
    console.error("Search for wallet error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllActiveSubscriptions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    // Use aggregation to join and filter properly at database level
    // This ensures consistency between 'total' and the actual rows returned per page
    const pipeline = [
      {
        $match: {
          status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
          user_id: { $exists: true, $ne: null },
          subscription_plan_id: { $exists: true, $ne: null },
        },
      },
      // Join with Users
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      // Join with Roles
      {
        $lookup: {
          from: "roles",
          localField: "user.role",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
      // Join with Merchants
      {
        $lookup: {
          from: "merchants",
          localField: "user_id",
          foreignField: "user_id",
          as: "merchant",
        },
      },
      { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },
      // Join with SubscriptionPlans
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "subscription_plan_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      // Filter out FREE plans
      {
        $match: {
          "plan.business_type": { $ne: PLAN_TYPES.FREE },
        },
      },
    ];

    // Get total count for metadata
    const countResult = await UserSubscription.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Get paginated data
    const subscriptions = await UserSubscription.aggregate([
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          status: 1,
          auto_renew: 1,
          end_date: 1,
          paid_at: 1,
          created_at: 1,
          plan_snapshot: 1, // ✅ Critical for correct 'round' amount
          user: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            role: "$role.role",
          },
          merchant: {
            company_name: "$merchant.company_name",
            company_email: "$merchant.company_email",
            company_phone_number: "$merchant.company_phone_number",
          },
          subscription_plan_id: {
            _id: "$plan._id",
            plan_name: "$plan.plan_name",
            price: "$plan.price",
            plan_code: "$plan.plan_code",
          },
        },
      },
    ]);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active non-free subscriptions found",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("getAllActiveSubscriptions Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


exports.getRoyalPlanCompanies = async (req, res) => {
  try {
    const royalPlan = await SubscriptionPlan.findOne({ plan_code: PLAN_CODES.ROYAL });
    if (!royalPlan) {
      return res.status(404).json({ message: "Royal plan not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const subscriptions = await UserSubscription.find({
      subscription_plan_id: royalPlan._id,
    }).populate("user_id", "name email");
    const userIds = subscriptions.map((sub) => sub.user_id._id);

    if (userIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found with Royal plan" });
    }

    const merchants = await Merchant.find(
      { user_id: { $in: userIds } },
      "company_logo company_name company_email"
    )
      .skip(skip)
      .limit(limit);
    const serviceProviders = await ServiceProvider.find(
      { user_id: { $in: userIds } },
      "company_logo travels_name company_email"
    )
      .skip(skip)
      .limit(limit);

    const totalMerchants = await Merchant.countDocuments({
      user_id: { $in: userIds },
    });
    const totalServiceProviders = await ServiceProvider.countDocuments({
      user_id: { $in: userIds },
    });
    const totalItems = totalMerchants + totalServiceProviders;
    const totalPages = Math.ceil(totalItems / limit);

    const companyDetails = {
      merchants,
      serviceProviders,
      pagination: { currentPage: page, totalPages, totalItems, limit },
    };

    res.status(200).json(companyDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTrendingDeepSubCategories = async (req, res) => {
  try {
    const letter = req.query.letter ? req.query.letter.toUpperCase() : null;

    let matchStage = {};
    if (letter) {
      matchStage = {
        "category.deep_sub_category_name": {
          $regex: `^${letter}`,
          $options: "i",
        },
      };
    }

    const trendingAggregation = await TrendingPoints.aggregate([
      {
        $group: {
          _id: "$product_id",
          totalPoints: { $sum: "$trending_points" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.deep_sub_category_id",
          totalPoints: { $sum: "$totalPoints" },
          productCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "deepsubcategories", // Matches the collection name from the model
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $match: matchStage },
      { $sort: { totalPoints: -1 } },
      { $limit: 50 },
      {
        $project: {
          deep_sub_category_name: "$category.deep_sub_category_name",
          deep_sub_category_image: "$category.deep_sub_category_image",
          category_id: "$category.category_id",
          sub_category_id: "$category.sub_category_id",
          super_sub_category_id: "$category.super_sub_category_id",
          createdAt: "$category.createdAt",
          updatedAt: "$category.updatedAt",
          count: "$productCount",
          totalPoints: 1,
        },
      },
    ]);

    if (trendingAggregation.length === 0) {
      return res
        .status(404)
        .json({ message: "No trending deep subcategories found" });
    }

    res.status(200).json(trendingAggregation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cron job for subscription management (runs daily at midnight)
const startSubscriptionCron = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const fifteenDaysFromNow = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

      // 1. Send reminders for subscriptions expiring within 5 days
      const subscriptionsToRemind = await UserSubscription.find({
        end_date: { $lte: fiveDaysFromNow, $gte: now },
        status: STATUS.CREATED,
      }).populate('user_id subscription_plan_id');

      for (const subscription of subscriptionsToRemind) {
        const user = subscription.user_id;
        // if (user.email) {
        //   await sendReminderEmail(user, subscription);
        // }
      }

      // 2. Mark expired subscriptions as inActive
      const expiredSubscriptions = await UserSubscription.find({
        end_date: { $lte: now },
        status: STATUS.CREATED,
      });

      for (const subscription of expiredSubscriptions) {
        subscription.status = STATUS.INACTIVE;
        await subscription.save();
      }

      // 3. Reset trendingPoints for inActive subscriptions older than 15 days
      const inactiveSubscriptions = await UserSubscription.find({
        status: STATUS.INACTIVE,
        updated_at: { $lte: fifteenDaysFromNow },
      }).populate('user_id');

      for (const subscription of inactiveSubscriptions) {
        const user = await User.findById(subscription.user_id);
        if (user) {
          user.trendingPoints = 0;
          await user.save();

          // Update related TrendingPointsPayment records
          await TrendingPointsPayment.updateMany(
            { user_id: user._id, subscription_id: subscription._id },
            { status: STATUS.CANCELLED_CAP }
          );
        }
      }
    } catch (error) {
      console.error('Subscription cron job error:', error);
    }
  });
};

// Start the cron job when the controller is loaded
startSubscriptionCron();

// Get subscription status and reminder info
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await UserSubscription
      .findOne({ user_id: userId }) // match user_id
      .sort({ created_at: -1 }) // latest inserted record
      .populate("subscription_plan_id");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    const now = new Date();
    let daysUntilExpiry = null;
    let isReminderPeriod = false;

    if (subscription.end_date) {
      const endDate = new Date(subscription.end_date);

      daysUntilExpiry = Math.ceil(
        (endDate - now) / (1000 * 60 * 60 * 24)
      );

      isReminderPeriod = daysUntilExpiry <= 5 && daysUntilExpiry >= 0;
    }

    return res.json({
      success: true,
      subscription,
      status: subscription.status,
      daysUntilExpiry,
      isReminderPeriod,
    });

  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.checkVerification = async (req, res) => {
  try {
    const { user_id } = req.query;

    // 1️⃣ Validate user_id
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_id",
      });
    }

    // 2️⃣ Find active subscription
    const subscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      captured: true,
    }).select("_id");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Active subscription not found",
      });
    }

    // 3️⃣ Find VERIFICATION feature
    const feature = await UserActiveFeature.findOne({
      user_id,
      user_subscription_id: subscription._id,
      feature_code: FEATURES.VERIFICATION,
      status: STATUS.ACTIVE,
    }).select("expires_at");

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: "Verification feature not active",
      });
    }

    // 4️⃣ Success response
    const expiresAt = feature.expires_at;

    return res.json({
      success: true,
      expires_at: expiresAt,
      is_expired: expiresAt < new Date(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.searchMerchant = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchTerm = query.trim();

    // Search by email, phone or user_code (case-insensitive partial match)
    const users = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { user_code: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id email phone user_code role');

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found matching the search term',
      });
    }

    // We usually want only one good match → take the first merchant/service provider
    for (const user of users) {
      const roleDoc = await Role.findById(user.role);
      if (!roleDoc) continue;

      if (!['MERCHANT', 'SERVICE_PROVIDER'].includes(roleDoc.role)) {
        continue;
      }

      // Get company address (optional)
      const companyAddress = await Address.findOne({
        user_id: user._id,
        address_type: 'company',
      }).lean();

      // Get subscription
      const subscription = await UserSubscription.findOne({
        user_id: user._id,
        status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
        captured: true
      }).sort({ createdAt: -1 }).lean();

      if (!subscription) {
        return res.status(200).json({
          success: false,
          message: 'Merchant found but no subscription exists',
          user: {
            _id: user._id,
            email: user.email,
            phone: user.phone,
            user_code: user.user_code,
            role: roleDoc.role,
          },
          address: companyAddress || null,
          subscription: null,
          activeFeature: null,
        });
      }

      // Get the latest SUBSCRIPTION_DURATION feature that is active or upgraded_away
      const activeFeature = await UserActiveFeature.findOne({
        user_id: user._id,
        user_subscription_id: subscription._id,
        feature_code: 'SUBSCRIPTION_DURATION',
        status: { $in: [STATUS.ACTIVE, STATUS.UPGRADED_AWAY] },
      })
        .sort({ createdAt: -1 }) // most recent
        .lean();

      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          user_code: user.user_code,
          role: roleDoc.role,
        },
        address: companyAddress || null,
        subscription: subscription || null,
        activeFeature: activeFeature || null,
      });
    }

    return res.status(404).json({
      success: false,
      message: 'No merchant or service provider found matching the criteria',
    });
  } catch (error) {
    console.error('Merchant search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during merchant search',
      error: error.message,
    });
  }
};


exports.extendSubscriptionDuration = async (req, res) => {
  try {
    const { data } = req.body;
    const { activeFeatureId, newExpiresAt, reason } = data;
    if (!activeFeatureId || !newExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'activeFeatureId and newExpiresAt are required',
      });
    }

    const newExpiryDate = new Date(newExpiresAt);
    if (isNaN(newExpiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for newExpiresAt',
      });
    }

    if (newExpiryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'New expiry date must be in the future',
      });
    }

    const feature = await UserActiveFeature.findById(activeFeatureId);

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Active feature not found',
      });
    }

    if (feature.feature_code !== 'SUBSCRIPTION_DURATION') {
      return res.status(400).json({
        success: false,
        message: 'This feature is not a SUBSCRIPTION_DURATION feature',
      });
    }

    // Optional: protect route better
    // if (!req.user || req.user.role !== 'ADMIN') { ... }

    const oldExpiresAt = feature.expires_at;
    const daysExtended = Math.ceil(
      (newExpiryDate - oldExpiresAt) / (1000 * 60 * 60 * 24)
    );

    if (daysExtended < 1) {
      return res.status(400).json({
        success: false,
        message: 'New expiry must be at least 1 day later than current expiry',
      });
    }

    // Create log entry BEFORE updating
    await SubscriptionExtensionLog.create({
      user_id: feature.user_id,
      user_subscription_id: feature.user_subscription_id,
      user_active_feature_id: feature._id,
      admin_id: req.user?.userId || null,           // ← assuming you have auth middleware
      old_expires_at: oldExpiresAt,
      new_expires_at: newExpiryDate,
      days_extended: daysExtended,
      reason: reason || 'Extended by admin',
      extended_at: new Date(),
    });

    // Now update the feature
    feature.expires_at = newExpiryDate;
    // Optional: feature.updatedBy = req.user._id;
    await feature.save();

    return res.status(200).json({
      success: true,
      message: 'Subscription duration extended successfully',
      extension: {
        days_extended: daysExtended,
        old_expires_at: oldExpiresAt,
        new_expires_at: newExpiryDate,
      },
      activeFeature: {
        _id: feature._id,
        expires_at: feature.expires_at,
        updatedAt: feature.updatedAt,
      },
    });
  } catch (error) {
    console.error('Extend subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while extending subscription',
      error: error.message,
    });
  }
};
// same controller file or separate history controller
exports.getAllExtensionHistory = async (req, res) => {
  try {
    // Query params for pagination & filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? req.query.search.trim() : null;

    const skip = (page - 1) * limit;

    // Build the filter object
    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i'); // case-insensitive

      // STEP 1: Find all users that match the search term
      const matchingUsers = await User.find({
        $or: [
          { email: searchRegex },
          { name: searchRegex }, // Added name search (optional)
          { phone: searchRegex },
          { user_code: searchRegex },
        ]
      }).select('_id'); // We only need the IDs

      // Extract the IDs into an array
      const userIds = matchingUsers.map(user => user._id);

      // STEP 2: Filter the logs where 'user_id' is one of the found users
      filter.user_id = { $in: userIds };
    }

    // Get total count for pagination info
    const totalCount = await SubscriptionExtensionLog.countDocuments(filter);

    // Fetch paginated & populated logs
    const logs = await SubscriptionExtensionLog.find(filter)
      .sort({ extended_at: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'email name phone user_code') // merchant info
      .populate('admin_id', 'email name')           // admin who extended
      .lean();

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      history: logs,
      pagination: {
        currentPage: page,
        totalPages: totalPages || 1, // Ensure at least 1 to avoid 0/0 issues
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get all extension history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching extension history',
      error: error.message,
    });
  }
};
// Route: GET /api/user-subscription/:userId
exports.getSubscriptionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Search by user_id inside the userSubscription collection
    const subscription = await UserSubscription.findOne({
      user_id: userId,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE, STATUS.ACTIVE_RENEWAL] }, // Include 'paid', 'active', and 'active_renewal' statuses
      captured: true, // Ensure the payment was captured
    }).sort({ createdAt: -1 }); // Get the latest one

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle Auto-Pay for a subscription
// This allows a merchant to turn off auto-renewal for an active subscription.
exports.toggleAutoPay = async (req, res) => {
  try {
    const { id } = req.params; // Subscription ID
    const { auto_renew } = req.body;

    const subscription = await UserSubscription.findById(id);

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (auto_renew === false && subscription.auto_renew === true) {
      // Turning OFF auto-renew
      if (subscription.razorpay_subscription_id && subscription.razorpay_subscription_status === STATUS.ACTIVE) {
        try {
          // Cancel at Razorpay (cancel_at_cycle_end means it won't renew next billing cycle)
          await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id, {
            cancel_at_cycle_end: 1
          });
          subscription.razorpay_subscription_status = 'cancelled';
        } catch (rpErr) {
          console.error("Razorpay subscription cancel failed:", rpErr);
          // Proceed with local update anyway
        }
      }
      subscription.auto_renew = false;
      // Change status to paid so it behaves like a regular non-renewing subscription
      subscription.status = "paid";
    } else if (auto_renew === true && subscription.auto_renew === false) {
      // Turning ON auto-renew (Currently, Razorpay requires a new checkout for new mandate)
      // So we return an error indicating they need to re-purchase or renew.
      return res.status(400).json({
        success: false,
        message: "To re-enable Auto-Pay, please select 'Renew Plan' and authorize a new auto-debit."
      });
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: auto_renew ? "Auto-Pay enabled" : "Auto-Pay disabled successfully.",
      subscription
    });

  } catch (err) {
    console.error("Error toggling auto-pay:", err);
    res.status(500).json({ success: false, message: "Failed to toggle Auto-Pay", error: err.message });
  }
};

