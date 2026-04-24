// controllers/subscriptionPlanController.js
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const SubscriptionPlanElementMapping = require("../models/subscriptionPlanElementMappingModel");
const razorpay = require("../config/razorpay");

exports.createPlan = async (req, res) => {
  try {
    const {
      plan_code,
      plan_name,
      price,
      strike_amount,
      description,
      status,
      business_type,
      razorpay_plan_id,
      razorpay_plan_id_test,
      razorpay_plan_id_live,
    } = req.body;

    if (!plan_code || !plan_name || !price || !business_type) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing (plan_code, plan_name, price, business_type)",
      });
    }

    const normalizedCode = plan_code.toUpperCase().trim();

    const existingPlan = await SubscriptionPlan.findOne({ plan_code: normalizedCode });
    if (existingPlan) {
      return res.status(400).json({ success: false, message: "Plan code already exists" });
    }

    const validTypes = ["merchant", "grocery_seller", "free"];
    const normalizedType = business_type.toLowerCase().trim();
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business_type. Must be 'merchant', 'grocery_seller', or 'free'",
      });
    }

    const plan = new SubscriptionPlan({
      plan_code: normalizedCode,
      plan_name: plan_name.trim(),
      price: Number(price),
      strike_amount: strike_amount ? Number(strike_amount) : null,
      business_type: normalizedType,
      description: description?.trim() || null,
      status: status || "Active",
      razorpay_plan_id: razorpay_plan_id?.trim() || null,
      razorpay_plan_id_test: razorpay_plan_id_test?.trim() || null,
      razorpay_plan_id_live: razorpay_plan_id_live?.trim() || null,
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncWithRazorpay = async (req, res) => {
  try {
    const { plan_name, price } = req.body;

    if (!plan_name || !price) {
      return res.status(400).json({
        success: false,
        message: "Plan name and price are required for sync",
      });
    }

    // Apply ₹1 discount to the base price for Razorpay Plan creation
    const discountedPrice = Number(price) > 1 ? Number(price) - 1 : Number(price);

    const razorpayPlan = await razorpay.plans.create({
      period: "yearly",
      interval: 1,
      item: {
        name: `${plan_name} (Yearly)`,
        amount: Math.round(discountedPrice * 100),
        currency: "INR",
        description: `Automatic renewal for ${plan_name}`,
      },
    });

    res.status(200).json({
      success: true,
      message: "Plan synced with Razorpay successfully",
      razorpay_plan_id: razorpayPlan.id,
      // Also return which mode we are in to help frontend find the right field
      mode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live') ? 'live' : 'test'
    });
  } catch (error) {
    console.error("Razorpay sync error:", error);
    res.status(500).json({
      success: false,
      message: error.description || error.message || "Failed to sync with Razorpay",
    });
  }
};

exports.getAllPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await SubscriptionPlan.countDocuments();

    const plans = await SubscriptionPlan.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Plans fetched successfully",
      data: plans,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPlansWithDetails = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ plan_code: { $ne: "FREE" } }).lean();

    const planIds = plans.map((plan) => plan._id);

    const mappings = await SubscriptionPlanElementMapping.find({
      subscription_plan_id: { $in: planIds },
    })
      .populate("feature_id", "feature_name")
      .lean();

    const mappingByPlan = {};
    mappings.forEach((m) => {
      if (!mappingByPlan[m.subscription_plan_id]) {
        mappingByPlan[m.subscription_plan_id] = [];
      }
      mappingByPlan[m.subscription_plan_id].push({
        element_name: m.feature_id?.feature_name || "Unknown",
        value: m.value,
        is_enabled: m.is_enabled,
      });
    });

    const result = plans.map((plan) => ({
      ...plan,
      elements: mappingByPlan[plan._id] || [],
    }));

    res.status(200).json({
      success: true,
      message: "Plans with details fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get plans with details error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPlansForMapping = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().select("plan_name plan_code _id");
    res.status(200).json({
      success: true,
      message: "Plans for mapping fetched successfully",
      data: plans,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const {
      plan_code,
      plan_name,
      price,
      strike_amount,
      description,
      status,
      business_type,
      razorpay_plan_id,
      razorpay_plan_id_test,
      razorpay_plan_id_live,
    } = req.body;

    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    if (plan_code) {
      const normalizedCode = plan_code.toUpperCase().trim();
      if (normalizedCode !== plan.plan_code) {
        const existing = await SubscriptionPlan.findOne({ plan_code: normalizedCode });
        if (existing) {
          return res.status(400).json({ success: false, message: "Plan code already exists" });
        }
        plan.plan_code = normalizedCode;
      }
    }

    if (plan_name) plan.plan_name = plan_name.trim();
    if (price !== undefined) plan.price = Number(price);
    if (strike_amount !== undefined) plan.strike_amount = strike_amount ? Number(strike_amount) : null;
    if (description !== undefined) {
      plan.description = description ? String(description).trim() || null : null;
    }
    if (status) plan.status = status;

    if (business_type) {
      const validTypes = ["merchant", "grocery_seller", "free"];
      const normalizedType = business_type.toLowerCase().trim();
      if (!validTypes.includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid business_type. Must be 'merchant', 'grocery_seller', or 'free'",
        });
      }
      plan.business_type = normalizedType;
    }

    if (razorpay_plan_id !== undefined) {
      plan.razorpay_plan_id = razorpay_plan_id?.trim() || null;
    }
    if (razorpay_plan_id_test !== undefined) {
      plan.razorpay_plan_id_test = razorpay_plan_id_test?.trim() || null;
    }
    if (razorpay_plan_id_live !== undefined) {
      plan.razorpay_plan_id_live = razorpay_plan_id_live?.trim() || null;
    }

    await plan.save();

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    await SubscriptionPlanElementMapping.deleteMany({
      subscription_plan_id: plan._id,
    });

    await plan.deleteOne();

    res.status(200).json({
      success: true,
      message: "Plan and its mappings deleted successfully",
    });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
