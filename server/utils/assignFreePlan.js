


// const SubscriptionPlan = require("../models/subscriptionPlanModel");
// const SubscriptionPlanElement = require("../models/subscriptionPlanElementModel");
// const SubscriptionPlanElementMapping = require("../models/subscriptionPlanElementMappingModel");
// const UserSubscription = require("../models/userSubscriptionPlanModel");
// const UserActiveFeature = require("../models/UserActiveFeature"); // assuming this exists
// // const TrendingPointsPayment = require("../models/trendingPointsPaymentModel"); // uncomment if used

// // Assuming these helpers already exist in your codebase (from verifyPayment)
// const {calculateEndDate} = require("./freePlanHelper");           // your decimal-aware function
// const {calculateFeatureExpiry} = require("./CalculateExpiry");
// const {parseVideoDuration} = require("./freePlanHelper");
// const {parseQuotaValue} = require("./freePlanHelper");
// const {parseDuration} = require("./freePlanHelper");
// const { autoCreateFreeTrustSeal } = require('./createFreeTrustSeal');


// const assignFreePlan = async (userId) => {
//   const now = new Date();

//   try {
//     // ─── 1. Locate FREE plan ───────────────────────────────────────
//     const freePlan = await SubscriptionPlan.findOne({ plan_code: "FREE" });
//     if (!freePlan) throw new Error("Free plan (plan_code: FREE) not found in database");

//     // ─── 2. Get all enabled feature mappings + populate names ──────
//     const mappings = await SubscriptionPlanElementMapping.find({
//       subscription_plan_id: freePlan._id,
//       is_enabled: true,
//     })
//       .populate("feature_id", "feature_name")
//       .lean();

//     // Build snapshot (exact same shape as paid plans)
//     const featuresSnapshot = mappings
//       .map((m) => ({
//         feature_id: m.feature_id?._id,
//         feature_name: m.feature_id?.feature_name || "Unknown",
//         is_enabled: m.is_enabled,
//         value: m.value
//           ? { type: m.value.type, data: m.value.data, unit: m.value.unit }
//           : undefined,
//       }))
//       .filter((f) => f.feature_id);

//     // ─── 3. Must have Subscription Duration ────────────────────────
//     const durationSnap = featuresSnapshot.find(
//       (f) => f.feature_name?.toLowerCase().trim() === "subscription duration"
//     );

//     if (!durationSnap?.value) {
//       throw new Error("Subscription Duration feature is missing or not enabled in FREE plan");
//     }

//     // Base subscription end date
//     let endDate = calculateEndDate(now, durationSnap.value);

//     // ─── 4. Create UserSubscription with snapshot ──────────────────
//     const subscription = await UserSubscription.create({
//       user_id: userId,
//       subscription_plan_id: freePlan._id,
//       razorpay_order_id: `free_order_${userId}_${now.getTime()}`,
//       amount: 0,
//       gst_percentage: 0,
//       gst_amount: 0,
//       currency: "INR",
//       receipt: `free_receipt_${Date.now()}`,
//       status: "paid",
//       captured: true,
//       paid_at: now,
//       created_at: now,
//       end_date: endDate,
//       features_snapshot: featuresSnapshot,
//     });

//     // ─── 5. Activate each feature ──────────────────────────────────
//     for (const snap of featuresSnapshot) {
//       if (!snap?.is_enabled) continue;

//       const code = snap?.feature_name
//         ?.trim()
//         ?.toUpperCase()
//         ?.replace(/[^A-Z0-9\s]/g, "")
//         ?.replace(/\s+/g, "_") ?? "";

//       const val = snap?.value;
//       if (!val) continue;

//       // ── Chat System ──────────────────────────────────────────────
//       if (code === "CHAT_SYSTEM") {
//         let chatExpiry = endDate;
//         const str = String(val.data ?? "").trim().toLowerCase();

//         if (str === "enable" || str === "free") {
//           // full duration
//         } else if (val.type === "NUMBER" && val.unit?.toLowerCase()?.includes("day")) {
//           const days = Number(val.data);
//           if (days > 0) {
//             chatExpiry = new Date(now);
//             chatExpiry.setDate(chatExpiry.getDate() + days);
//           }
//         } else continue;

//         await UserActiveFeature.findOneAndUpdate(
//           { user_id: userId, feature_code: "CHAT_SYSTEM" },
//           {
//             user_id: userId,
//             user_subscription_id: subscription._id,
//             feature_id: snap.feature_id,
//             feature_code: "CHAT_SYSTEM",
//             activated_at: now,
//             expires_at: chatExpiry,
//             status: "active",
//           },
//           { upsert: true, new: true }
//         );
//         continue;
//       }

//       // ── Trust Seal ───────────────────────────────────────────────
//       if (code === "TRUST_SEAL") {
//         const str = String(val.data ?? "").trim().toLowerCase();
//         if (str !== "free" && str !== "enable") continue;

//         const result = await autoCreateFreeTrustSeal({
//           user_id: userId,
//           subscription_id: subscription._id,
//           paidAt: now,
//         });

//         if (!result?.success) {
//           console.warn(`Trust Seal auto-create failed for free plan: ${result?.message ?? "unknown error"}`);
//         }
//         continue;
//       }

//       // ── Digital Book ─────────────────────────────────────────────
//       if (code === "DIGITAL_BOOK") {
//         let cityCount = 0;

//         if (val.type === "NUMBER" && /city|cities/i.test(val.unit ?? "")) {
//           cityCount = Number(val.data) || 0;
//         } else if (val.type === "TEXT" && String(val.data ?? "").trim().toLowerCase() === "free") {
//           cityCount = 0; // own city only
//         }

//         const expiry = calculateFeatureExpiry(now, val, endDate) || endDate;

//         await UserActiveFeature.create({
//           user_id: userId,
//           user_subscription_id: subscription._id,
//           feature_id: snap.feature_id,
//           feature_code: "DIGITAL_BOOK",
//           activated_at: now,
//           expires_at: expiry,
//           status: "active",
//           initial_plan_city_count: cityCount,
//           remaining_plan_city_count: cityCount,
//           selected_plan_cities: [],
//         });
//         continue;
//       }

//       // ── Video durations ──────────────────────────────────────────
//       if (code === "PRODUCTS_VIDEO" || code === "COMPANY_VIDEO") {
//         const duration = parseVideoDuration(val);
//         if (!duration || duration <= 0) continue;

//         await UserActiveFeature.create({
//           user_id: userId,
//           user_subscription_id: subscription._id,
//           feature_id: snap.feature_id,
//           feature_code: code,
//           activated_at: now,
//           expires_at: endDate,
//           status: "active",
//           ...(code === "PRODUCTS_VIDEO"
//             ? { product_video_duration: duration }
//             : { company_video_duration: duration }),
//         });
//         continue;
//       }

//       // ── Quota-based (photos, products, etc.) ─────────────────────
//       if (code === "PRODUCT_PHOTOS" || code === "PRODUCT") {
//         const limit = parseQuotaValue(val);
//         if (limit <= 0) continue;

//         await UserActiveFeature.create({
//           user_id: userId,
//           user_subscription_id: subscription._id,
//           feature_id: snap.feature_id,
//           feature_code: code,
//           activated_at: now,
//           expires_at: endDate,
//           status: "active",
//           ...(code === "PRODUCT" ? { product_limit: limit } : { product_photo_limit: limit }),
//         });
//         continue;
//       }

//       // ── Generic fallback ─────────────────────────────────────────
//       const expiry = calculateFeatureExpiry(now, val, endDate);
//       if (!expiry && String(val.data ?? "").toLowerCase() !== "unlimited") continue;

//       await UserActiveFeature.create({
//         user_id: userId,
//         user_subscription_id: subscription._id,
//         feature_id: snap.feature_id,
//         feature_code: code,
//         activated_at: now,
//         expires_at: expiry || endDate,
//         status: "active",
//       });
//     }

//     // ─── Optional: Trend Points ────────────────────────────────────
//     const trendSnap = featuresSnapshot.find(
//       (f) => f.feature_name?.toLowerCase().trim() === "trend point"
//     );

//     if (trendSnap?.value?.unit?.toLowerCase()?.includes("point")) {
//       const points = Number(trendSnap.value.data) || 0;
//       if (points > 0) {
//         let record = await TrendingPointsPayment.findOne({ user_id: userId });
//         if (record) {
//           record.points += points;
//           record.amount += 0;
//           record.payment_status = "paid";
//           record.subscription_id = subscription._id;
//           await record.save();
//         } else {
//           await TrendingPointsPayment.create({
//             user_id: userId,
//             subscription_id: subscription._id,
//             points,
//             amount: 0,
//             payment_status: "paid",
//             status: "Active",
//           });
//         }
//       }
//     }

//     // Final save
//     await subscription.save();

//     return {
//       success: true,
//       message: "Free plan assigned and features activated",
//       subscriptionId: subscription._id,
//       endDate: endDate.toISOString().split("T")[0],
//       featureCount: featuresSnapshot.length,
//     };
//   } catch (err) {
//     console.error("[assignFreePlan] Error:", err);
//     return {
//       success: false,
//       message: err.message || "Failed to assign free plan",
//     };
//   }
// };


// module.exports = assignFreePlan;


const SubscriptionPlan = require("../models/subscriptionPlanModel");
const SubscriptionPlanElement = require("../models/subscriptionPlanElementModel");
const SubscriptionPlanElementMapping = require("../models/subscriptionPlanElementMappingModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const UserActiveFeature = require("../models/UserActiveFeature");
const { STATUS, FEATURES } = require("../constants/subscriptionConstants");
// const TrendingPointsPayment = require("../models/trendingPointsPaymentModel"); // uncomment if used

const { calculateEndDate } = require("./freePlanHelper");
const { calculateFeatureExpiry } = require("./CalculateExpiry");
const { parseVideoDuration } = require("./freePlanHelper");
const { parseQuotaValue } = require("./freePlanHelper");
const { parseDuration } = require("./freePlanHelper");
const { autoCreateFreeTrustSeal } = require('./createFreeTrustSeal');

const assignFreePlan = async (userId, isLifetime = true) => {
  const now = new Date();

  try {
    // 1. Locate FREE plan
    const freePlan = await SubscriptionPlan.findOne({ plan_code: "FREE" });
    if (!freePlan) throw new Error("Free plan (plan_code: FREE) not found in database");

    // 2. Fetch ALL system features
    const allFeatures = await SubscriptionPlanElement.find({ is_active: true }).lean();

    // 3. Get all feature mappings for this plan
    const mappings = await SubscriptionPlanElementMapping.find({
      subscription_plan_id: freePlan._id,
    }).lean();

    // 4. Build a comprehensive snapshot
    const featuresSnapshot = allFeatures.map((feat) => {
      const mapping = mappings.find(m => m.feature_id?.toString() === feat._id.toString());
      
      return {
        feature_id: feat._id,
        feature_name: feat.feature_name || "Unknown",
        feature_code: feat.feature_code || "UNKNOWN",
        is_enabled: mapping ? mapping.is_enabled : false,
        value: mapping && mapping.value
          ? { type: mapping.value.type, data: mapping.value.data, unit: mapping.value.unit }
          : undefined,
      };
    });

    // 3. Must have Subscription Duration
    const durationSnap = featuresSnapshot.find(
      (f) => f.feature_name?.toLowerCase().trim() === "subscription duration"
    );

    if (!durationSnap?.value) {
      throw new Error("Subscription Duration feature is missing or not enabled in FREE plan");
    }

    let endDate = isLifetime ? null : calculateEndDate(now, durationSnap.value);

    // ────────────────────────────────────────────────────────────────
    // CREATE USER SUBSCRIPTION – now matches the updated schema
    // ────────────────────────────────────────────────────────────────
    const subscription = await UserSubscription.create({
      user_id: userId,
      subscription_plan_id: freePlan._id,

      // Required new fields
      plan_snapshot: {
        plan_name: freePlan.plan_name || "Free Plan",
        plan_code: freePlan.plan_code || "FREE",
        price: freePlan.price ?? 0,
        currency: freePlan.currency || "INR",
        // Optional – add if your SubscriptionPlan model has these
        // duration_value: freePlan.duration_value,
        // duration_unit: freePlan.duration_unit,
      },

      total_amount: 0,              // ← required field

      // Payment-related (free plan values)
      amount: 0,
      gst_percentage: 0,
      gst_amount: 0,
      currency: "INR",

      razorpay_order_id: `fo_${userId}_${Date.now().toString().slice(-8)}`,
      receipt: `free_receipt_${Date.now()}`,

      status: STATUS.PAID,
      captured: true,
      paid_at: now,
      end_date: endDate,

      features_snapshot: featuresSnapshot,

      // Common defaults for free plan
      auto_renew: false,
      is_upgrade: false,
      renewal_count: 0,
    });

    // 5. Activate each feature (unchanged from your original)
    for (const snap of featuresSnapshot) {
      if (!snap?.is_enabled) continue;

      const code = snap?.feature_name
        ?.trim()
        ?.toUpperCase()
        ?.replace(/[^A-Z0-9\s]/g, "")
        ?.replace(/\s+/g, "_") ?? "";

      const val = snap?.value;
      if (!val) continue;

      // ── Chat System ──────────────────────────────────────────────
      if (code === "CHAT_SYSTEM") {
        let chatExpiry = endDate;
        const str = String(val.data ?? "").trim().toLowerCase();

        if (str === "enable" || str === "free") {
          // full duration
        } else if (val.type === "NUMBER" && val.unit?.toLowerCase()?.includes("day")) {
          const days = Number(val.data);
          if (days > 0) {
            chatExpiry = new Date(now);
            chatExpiry.setDate(chatExpiry.getDate() + days);
          }
        } else continue;

        await UserActiveFeature.findOneAndUpdate(
          { user_id: userId, feature_code: "CHAT_SYSTEM" },
          {
            user_id: userId,
            user_subscription_id: subscription._id,
            feature_id: snap.feature_id,
            feature_code: "CHAT_SYSTEM",
            activated_at: now,
            expires_at: chatExpiry,
            status: STATUS.ACTIVE,
          },
          { upsert: true, new: true }
        );
        continue;
      }

      // ── Trust Seal ───────────────────────────────────────────────
      if (code === "TRUST_SEAL") {
        const str = String(val.data ?? "").trim().toLowerCase();
        if (str !== "free" && str !== "enable") continue;

        const result = await autoCreateFreeTrustSeal({
          user_id: userId,
          subscription_id: subscription._id,
          paidAt: now,
        });

        if (!result?.success) {
          console.warn(`Trust Seal auto-create failed for free plan: ${result?.message ?? "unknown error"}`);
        }
        continue;
      }

      // ── Digital Book ─────────────────────────────────────────────
      if (code === "DIGITAL_BOOK") {
        let cityCount = 0;

        if (val.type === "NUMBER" && /city|cities/i.test(val.unit ?? "")) {
          cityCount = Number(val.data) || 0;
        } else if (val.type === "TEXT" && String(val.data ?? "").trim().toLowerCase() === "free") {
          cityCount = 0; // own city only
        }

        const expiry = calculateFeatureExpiry(now, val, endDate) || endDate;

        await UserActiveFeature.create({
          user_id: userId,
          user_subscription_id: subscription._id,
          feature_id: snap.feature_id,
          feature_code: "DIGITAL_BOOK",
          activated_at: now,
          expires_at: expiry,
          status: STATUS.ACTIVE,
          initial_plan_city_count: cityCount,
          remaining_plan_city_count: cityCount,
          selected_plan_cities: [],
        });
        continue;
      }

      // ── Video durations ──────────────────────────────────────────
      if (code === "PRODUCTS_VIDEO" || code === "COMPANY_VIDEO") {
        const duration = parseVideoDuration(val);
        if (!duration || duration <= 0) continue;

        await UserActiveFeature.create({
          user_id: userId,
          user_subscription_id: subscription._id,
          feature_id: snap.feature_id,
          feature_code: code,
          activated_at: now,
          expires_at: endDate,
          status: STATUS.ACTIVE,
          ...(code === "PRODUCTS_VIDEO"
            ? { product_video_duration: duration }
            : { company_video_duration: duration }),
        });
        continue;
      }

      // ── Quota-based (photos, products, etc.) ─────────────────────
      if (code === "PRODUCT_PHOTOS" || code === "PRODUCT") {
        const limit = parseQuotaValue(val);
        if (limit <= 0) continue;

        await UserActiveFeature.create({
          user_id: userId,
          user_subscription_id: subscription._id,
          feature_id: snap.feature_id,
          feature_code: code,
          activated_at: now,
          expires_at: endDate,
          status: STATUS.ACTIVE,
          ...(code === "PRODUCT" ? { product_limit: limit } : { product_photo_limit: limit }),
        });
        continue;
      }

      // ── Generic fallback ─────────────────────────────────────────
      const expiry = calculateFeatureExpiry(now, val, endDate);
      // For lifetime plans (endDate === null), we don't skip if expiry is null; 
      // for regular plans, we skip if there's no expiry date and it's not explicitly unlimited.
      if (endDate !== null && !expiry && String(val.data ?? "").toLowerCase() !== "unlimited") continue;

      await UserActiveFeature.create({
        user_id: userId,
        user_subscription_id: subscription._id,
        feature_id: snap.feature_id,
        feature_code: code,
        activated_at: now,
        expires_at: expiry || endDate,
        status: STATUS.ACTIVE,
      });
    }

    // Optional: Trend Points (unchanged – but commented out model import)
    // const trendSnap = featuresSnapshot.find(f => f.feature_name?.toLowerCase().trim() === "trend point");
    // if (trendSnap?.value?.unit?.toLowerCase()?.includes("point")) { ... }

    await subscription.save();

    return {
      success: true,
      message: "Free plan assigned and features activated",
      subscriptionId: subscription._id,
      endDate: endDate ? endDate.toISOString().split("T")[0] : "Lifetime",
      featureCount: featuresSnapshot.length,
    };
  } catch (err) {
    console.error("[assignFreePlan] Error:", err);
    return {
      success: false,
      message: err.message || "Failed to assign free plan",
    };
  }
};

module.exports = assignFreePlan;
