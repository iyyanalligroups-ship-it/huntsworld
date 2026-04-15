const TopListingPlan = require("../models/topListingModel");

/**
 * @desc Create Top Listing Plan
 * @route POST /api/top-listing-plans
 */
exports.createPlan = async (req, res) => {
  try {
    const {
      plan_name,
      plan_code,
      amount,
      duration_days,
      description,
      sort_order,
    } = req.body;

    // 🔴 Validation
    if (!plan_name || !plan_code || amount == null || !duration_days) {
      return res.status(400).json({
        success: false,
        message: "plan_name, plan_code, amount and duration_days are required",
      });
    }

    if (amount < 0 || duration_days < 1) {
      return res.status(400).json({
        success: false,
        message: "Amount must be >= 0 and duration_days must be >= 1",
      });
    }

    // 🔴 Unique plan_code check (fast indexed lookup)
    const existing = await TopListingPlan.findOne({ plan_code }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Plan code already exists",
      });
    }

    const plan = await TopListingPlan.create({
      plan_name,
      plan_code,
      amount,
      duration_days,
      description,
      sort_order,
    });

    return res.status(201).json({
      success: true,
      message: "Top listing plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Create Plan Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating plan",
    });
  }
};

/**
 * @desc Get All Top Listing Plans (with filters)
 * @route GET /api/top-listing-plans
 */
exports.getAllPlans = async (req, res) => {
  try {
    const { is_active } = req.query;

    // 🔹 Filter object
    const filter = {};
    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    }

    // ⚡ Fast read (lean + sort + projection)
    const plans = await TopListingPlan.find(filter)
      .select("-__v")
      .sort({ sort_order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("Get Plans Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching plans",
    });
  }
};

/**
 * @desc Get Single Plan by ID
 * @route GET /api/top-listing-plans/:id
 */
exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await TopListingPlan.findById(id)
      .select("-__v")
      .lean();

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Top listing plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Get Plan Error:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid plan ID",
    });
  }
};

/**
 * @desc Update Top Listing Plan
 * @route PUT /api/top-listing-plans/:id
 */
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedPlan = await TopListingPlan.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updated_at: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Top listing plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Top listing plan updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Update Plan Error:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid data or plan ID",
    });
  }
};

/**
 * @desc Soft Delete (Deactivate) Plan
 * @route DELETE /api/top-listing-plans/:id
 */
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    // CHANGED: findByIdAndDelete removes it physically from the DB
    const plan = await TopListingPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Top listing plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Top listing plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete Plan Error:", error);
    return res.status(500).json({ // Changed to 500 for server errors
      success: false,
      message: "Failed to delete plan",
      error: error.message
    });
  }
};
