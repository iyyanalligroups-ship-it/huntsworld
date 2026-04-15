// controllers/subscriptionPlan.controller.js
const CommonSubscriptionPlan = require('../models/commonSubcriptionPlanModel');

// Create a new subscription plan
exports.createPlan = async (req, res) => {
  try {
    const { name, category, durationType, durationValue, price, description } = req.body;

    // Validation checks
    if (!name) return res.status(400).json({ success: false, message: "Plan name is required" });
    if (!durationType) return res.status(400).json({ success: false, message: "Duration type is required" });
    if (price === undefined || price === null) return res.status(400).json({ success: false, message: "Price is required" });

    const plan = await CommonSubscriptionPlan.create({
      name,
      category,
      durationType,
      durationValue,
      price,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: plan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all subscription plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await CommonSubscriptionPlan.find();
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a specific plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await CommonSubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update a plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await CommonSubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await CommonSubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getEbookSubscriptionPlans = async (req, res) => {
  try {
    const ebookPlans = await CommonSubscriptionPlan.find({ category: 'ebook' });

    if (ebookPlans.length === 0) {
      return res.status(404).json({ message: 'No subscription plans found for category: ebook' });
    }

    res.status(200).json(ebookPlans);
  } catch (error) {
    console.error('Error fetching ebook subscription plans:', error);
    res.status(500).json({ message: 'Server error while fetching ebook subscription plans' });
  }
};

exports.getSubscriptionPlanByFields = async (req, res) => {
    try {
        // Hardcoded values
        const name = "GST";
        const category = "gst";
        const durationType = "percentage";

        // Query the database for a matching record
        const plan = await CommonSubscriptionPlan.findOne({
            name,
            category,
            durationType
        });

        // Check if a plan was found
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'No subscription plan found with the specified criteria'
            });
        }

        // Return the found plan
        return res.status(200).json({
            success: true,
            data: plan,
            message: 'Subscription plan retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching subscription plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching subscription plan'
        });
    }
};


exports.getBannerAdAmount = async (req, res) => {
  try {
    const plan = await CommonSubscriptionPlan.findOne({
      name: { $regex: /^Banner Ads$/i },
      category: { $regex: /^ads$/i },
      durationType: { $regex: /^per_day$/i },
    })
      .select("price")
      .lean();

    if (!plan) {
      return res.status(200).json({
        success: true,
        data: { price: 0 },
        message: "Banner Ads plan not found",
      });
    }

    const price = Number(plan.price);

    if (isNaN(price) || price < 0) {
      return res.status(200).json({
        success: true,
        data: { price: 0 },
        message: "Invalid price value",
      });
    }

    return res.status(200).json({
      success: true,
      data: { price },
      message: "Banner Ad amount fetched successfully",
    });

  } catch (error) {
    console.error("❌ Error fetching Banner Ads amount:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
exports.getPlanByName = async (req, res) => {
  try {
    const { name } = req.params;
    const plan = await CommonSubscriptionPlan.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
