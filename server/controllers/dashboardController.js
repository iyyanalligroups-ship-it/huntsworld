const mongoose = require("mongoose");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Product = require("../models/productModel");
const { STATUS } = require("../constants/subscriptionConstants");
const TrendingPoints = require("../models/trendingPointsModel");
const ViewPoint = require("../models/viewPointsModel");
const Review = require("../models/reviewModel");
const Complaint = require("../models/ComplaintFormModel");
const PostByRequirement = require("../models/postByRequirementModel");
const SubscriptionPlanElement = require("../models/subscriptionPlanElementModel");
const SubscriptionPlanElementMapping = require("../models/subscriptionPlanElementMappingModel");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Subscription (needed to derive plan details — must resolve first)
    // ─────────────────────────────────────────────────────────────────────────
    const subscription = await UserSubscription.findOne({
      user_id: userObjectId,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE, STATUS.ACTIVE_RENEWAL, STATUS.FREE, STATUS.TRIAL] },
    })
      .sort({ paid_at: -1, updatedAt: -1, createdAt: -1, end_date: -1 })
      .populate({ path: "subscription_plan_id", select: "plan_name plan_code" })
      .lean();

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Subscription duration lookup (only if a plan exists)
    // ─────────────────────────────────────────────────────────────────────────
    let subscriptionData = {
      plan_name: "No Active Plan",
      start_date: "N/A",
      end_date: "N/A",
      status: "Inactive",
      price: 0,
      duration: "N/A",
    };

    // Fire merchant/SP lookup and subscription duration lookup in parallel
    const [durationElement, merchant, sp] = await Promise.all([
      subscription?.subscription_plan_id
        ? SubscriptionPlanElement.findOne({
          $expr: {
            $eq: [{ $toLower: { $trim: { input: "$feature_name" } } }, "subscription duration"],
          },
        }).lean()
        : Promise.resolve(null),
      Merchant.findOne({ user_id: userObjectId }).lean(),
      // Only query SP if we didn't find a merchant — we'll decide below
      ServiceProvider.findOne({ user_id: userObjectId }).lean(),
    ]);

    // ── Subscription duration mapping ────────────────────────────────────────
    if (subscription && subscription.subscription_plan_id) {
      const plan = subscription.subscription_plan_id;
      const isFreePlan =
        plan.plan_code === "FREE" || plan.plan_name?.toUpperCase().includes("FREE");

      let durationDisplay = "N/A";

      if (durationElement) {
        const mapping = await SubscriptionPlanElementMapping.findOne({
          subscription_plan_id: plan._id,
          feature_id: durationElement._id,
          is_enabled: true,
        }).lean();

        if (mapping?.value) {
          const val = mapping.value;
          if (val?.data && val?.unit) {
            const num = parseFloat(val.data);
            const unit = (val.unit || "").toLowerCase().trim();
            if (!isNaN(num)) {
              if (unit.includes("year")) durationDisplay = `${num} Year${num !== 1 ? "s" : ""}`;
              else if (unit.includes("month")) durationDisplay = `${num} Month${num !== 1 ? "s" : ""}`;
              else if (unit.includes("day")) durationDisplay = `${num} Day${num !== 1 ? "s" : ""}`;
              else durationDisplay = `${num} ${val.unit}`;
            }
          } else if (typeof val === "string" || typeof val === "number") {
            const num = parseFloat(val);
            durationDisplay = `${num} Year${num !== 1 ? "s" : ""}`;
          }
        }
      }

      // If end_date is null and it's not a free plan, try to compute from plan_snapshot
      let resolvedEndDate = subscription.end_date;
      if (!resolvedEndDate && !isFreePlan && subscription.plan_snapshot?.duration_value && subscription.plan_snapshot?.duration_unit) {
        const startDate = new Date(subscription.paid_at || subscription.created_at || subscription.createdAt);
        const qty = Number(subscription.plan_snapshot.duration_value);
        const unit = String(subscription.plan_snapshot.duration_unit).toLowerCase().trim();
        const computed = new Date(startDate);
        if (unit.includes("year")) computed.setFullYear(computed.getFullYear() + qty);
        else if (unit.includes("month")) computed.setMonth(computed.getMonth() + qty);
        else if (unit.includes("day")) computed.setDate(computed.getDate() + qty);
        resolvedEndDate = computed;
      }

      let endDateStr = resolvedEndDate ? new Date(resolvedEndDate).toISOString().split("T")[0] : "N/A";
      const startSource = subscription.paid_at || subscription.createdAt;
      let startDateStr = startSource ? new Date(startSource).toISOString().split("T")[0] : "N/A";

      let displayStatus = "Inactive";
      if (isFreePlan) displayStatus = "Free";
      else if ([STATUS.PAID, STATUS.ACTIVE, STATUS.ACTIVE_RENEWAL].includes(subscription.status)) displayStatus = "Active";
      else displayStatus = subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);

      subscriptionData = {
        plan_name: plan.plan_name || "Unknown Plan",
        start_date: startDateStr,
        end_date: endDateStr,
        status: displayStatus,
        price: isFreePlan ? 0 : Math.round((subscription.amount || 0) / 100),
        duration: durationDisplay,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Resolve entity (Merchant has priority over ServiceProvider)
    // ─────────────────────────────────────────────────────────────────────────
    let entityId = null;
    let entityType = null;

    if (merchant) {
      entityId = merchant._id;
      entityType = "Merchant";
    } else if (sp) {
      entityId = sp._id;
      entityType = "ServiceProvider";
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Fire all remaining independent queries in parallel
    // ─────────────────────────────────────────────────────────────────────────
    const [
      totalProducts,
      trendingAgg,
      viewPointDoc,
      trendingProducts,
      reviews,
      complaintsRaw,
      requirements,
    ] = await Promise.all([
      entityId
        ? Product.countDocuments({ seller_id: entityId, sellerModel: entityType, status: STATUS.ACTIVE_CAP })
        : Promise.resolve(0),

      TrendingPoints.aggregate([
        { $match: { user_id: userObjectId } },
        { $group: { _id: null, total: { $sum: "$trending_points" } } },
      ]),

      ViewPoint.findOne({ user_id: userObjectId }).lean(),

      TrendingPoints.aggregate([
        { $match: { user_id: userObjectId, last_updated_date: { $regex: `^${currentMonth}` } } },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ["$product.product_name", "Unknown"] },
            points: "$trending_points",
          },
        },
        { $sort: { points: -1 } },
        { $limit: 5 },
      ]),

      Review.find({ userId: userObjectId })
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Complaint.find({ user_id: userObjectId })
        .populate("user_id", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      PostByRequirement.find({ user_id: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Format results
    // ─────────────────────────────────────────────────────────────────────────
    const totalTrendingPoints = trendingAgg[0]?.total || 0;
    const totalViewPoints = viewPointDoc?.view_points || 0;

    const formattedReviews = reviews.map((r) => ({
      id: r._id,
      user: r.userId?.name || "Anonymous",
      comment: r.comments || "",
      rating: r.rating || 0,
    }));

    const complaints = complaintsRaw.map((c, i) => {
      let issue = "No issue specified";
      if (c.type === "type1") issue = c.details?.complaint_description || "No description";
      else if (c.type === "type2" && c.option === "ipr_dispute") {
        issue = `${c.details?.ipr_type || "?"} - ${c.details?.brand_name || "?"}`;
      } else if (c.type === "type3") {
        if (c.option === "buyer_complaint")
          issue = `Buyer: ${c.details?.buyer_name || "?"} - ${c.details?.product_name || "?"}`;
        else if (c.option === "supplier_complaint")
          issue = `Supplier: ${c.details?.supplier_name || "?"} - ${c.details?.supplier_product_name || "?"}`;
      }
      return {
        id: i + 1,
        user: c.user_id?.name || "Anonymous",
        issue,
        type: c.type,
        option: c.option,
      };
    });

    const formattedRequirements = requirements.map((r, i) => ({
      id: i + 1,
      product: r.product_or_service || "N/A",
      qty: r.quantity && r.unit_of_measurement ? `${r.quantity} ${r.unit_of_measurement}` : "N/A",
    }));

    return res.status(200).json({
      subscription: subscriptionData,
      stats: [
        { title: "Total Products", icon: "PackageSearch", count: totalProducts, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Trending Points", icon: "TrendingUp", count: totalTrendingPoints, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "View Points", icon: "Eye", count: totalViewPoints, color: "text-green-600", bg: "bg-green-100" },
      ],
      trendingProducts,
      reviews: formattedReviews,
      complaints,
      requirements: formattedRequirements,
    });
  } catch (err) {
    console.error("getDashboardData error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: err.message,
    });
  }
};
