const SubscriptionPlanElement = require('../models/subscriptionPlanElementModel');
const SubscriptionPlanElementMapping = require('../models/subscriptionPlanElementMappingModel');
// Create new mapping for multiple elements
exports.createMapping = async (req, res) => {
  try {
    const { subscription_plan_id, elements } = req.body;

    if (!subscription_plan_id || !Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({
        success: false,
        message: "subscription_plan_id and elements array are required",
      });
    }

    const createdMappings = [];

    for (const item of elements) {
      const { feature_id, value } = item;

      if (!feature_id) {
        return res.status(400).json({
          success: false,
          message: "Each item must have feature_id",
        });
      }

      // Check for existing mapping
      const existing = await SubscriptionPlanElementMapping.findOne({
        subscription_plan_id,
        feature_id,
      });

      if (existing) {
        // Update existing (upsert behavior)
        existing.value = value;
        existing.is_enabled = value !== null;
        await existing.save();
        createdMappings.push(existing);
      } else {
        // Create new
        const newMapping = await SubscriptionPlanElementMapping.create({
          subscription_plan_id,
          feature_id,
          is_enabled: value !== null,
          value: value,
        });
        createdMappings.push(newMapping);
      }
    }

    res.status(201).json({
      success: true,
      message: "Features mapped successfully (created/updated)",
      data: createdMappings,
    });
  } catch (error) {
    console.error("Create mapping error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update mapping for multiple elements
exports.updateMapping = async (req, res) => {
  try {
    const { subscription_plan_id, elements } = req.body;

    if (!subscription_plan_id || !elements || !Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ success: false, message: "subscription_plan_id and elements are required" });
    }

    // Loop through the elements and update them for the given subscription_plan_id
    for (let i = 0; i < elements.length; i++) {
      const { feature_id, value } = elements[i];

      if (!feature_id || value == null) {
        return res.status(400).json({ success: false, message: "Each feature_id and value are required" });
      }

      // Check if the mapping exists for the given subscription_plan_id and feature_id
      const mapping = await SubscriptionPlanElementMapping.findOne({ subscription_plan_id, feature_id });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: `Mapping not found for subscription_plan_id: ${subscription_plan_id} and feature_id: ${feature_id}`
        });
      }

      // Update the mapping entry
      mapping.value = value;
      await mapping.save();
    }

    res.json({
      success: true,
      message: "Subscription Mapping(s) Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.getMappingById = async (req, res) => {
    try {
        const mapping = await SubscriptionPlanElementMapping.findByPk(req.params.id);
        if (!mapping) return res.status(404).json({ message: "Mapping not found" });
        res.json(mapping);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllMappings = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ success: false, message: "Unauthorized - missing role" });
    }

    const userRole = user.role.toUpperCase(); // normalize to uppercase

    // Define which business types this user is allowed to see
    let allowedBusinessTypes = [];

    if (userRole === "ADMIN" || userRole === "SUB_ADMIN") {
      allowedBusinessTypes = ["merchant", "grocery_seller"];
    } else if (userRole === "MERCHANT") {
      allowedBusinessTypes = ["merchant"];
    } else if (userRole === "GROCERY_SELLER") {
      allowedBusinessTypes = ["grocery_seller"];
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view subscription plans",
      });
    }

    // ────────────────────────────────────────────────
    // Step 1: Get all active features
    // ────────────────────────────────────────────────
    const allFeatures = await SubscriptionPlanElement.aggregate([
      { $match: { is_active: true } },
      {
        $project: {
          _id: 0,
          feature_id: "$_id",
          feature_name: "$feature_name",
        },
      },
      { $sort: { feature_name: 1 } },
    ]);

    // ────────────────────────────────────────────────
    // Step 2: Get relevant plans + their mappings
    // ────────────────────────────────────────────────
    const planMappings = await SubscriptionPlanElementMapping.aggregate([
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "subscription_plan_id",
          foreignField: "_id",
          as: "subscription_plan",
        },
      },
      { $unwind: "$subscription_plan" },
      {
        $match: {
          "subscription_plan.business_type": { $in: allowedBusinessTypes },
          "subscription_plan.status": "Active", // adjust if your DB actually stores "ACTIVE"
        },
      },
      {
        $lookup: {
          from: "subscriptionplanelements",
          localField: "feature_id",
          foreignField: "_id",
          as: "element",
        },
      },
      { $unwind: { path: "$element", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$subscription_plan_id",
          subscription_plan: { $first: "$subscription_plan" },
          mappedFeatures: {
            $push: {
              feature_id: "$feature_id",
              feature_name: "$element.feature_name",
              is_enabled: "$is_enabled",
              value: "$value",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          subscription_plan_id: {
            _id: "$subscription_plan._id",
            plan_code: "$subscription_plan.plan_code",
            plan_name: "$subscription_plan.plan_name",
            price: "$subscription_plan.price",
            strike_amount: "$subscription_plan.strike_amount",
            status: "$subscription_plan.status",
            description: "$subscription_plan.description",
            business_type: "$subscription_plan.business_type",
            razorpay_plan_id: "$subscription_plan.razorpay_plan_id",
          },
          mappedFeatures: 1,
        },
      },
    ]);

    // ────────────────────────────────────────────────
    // Step 3: Build final structure with all features
    // ────────────────────────────────────────────────
    const result = planMappings.map((plan) => {
      const featureMap = new Map();
      plan.mappedFeatures.forEach((mapped) => {
        if (mapped.feature_id) {
          featureMap.set(mapped.feature_id.toString(), {
            is_enabled: mapped.is_enabled === true,
            value: mapped.value || null,
          });
        }
      });

      const elements = allFeatures.map((feature) => {
        const key = feature.feature_id.toString();
        const mappedData = featureMap.get(key);
        return {
          feature_id: feature.feature_id,
          feature_name: feature.feature_name,
          is_enabled: !!mappedData?.is_enabled,
          value: mappedData?.value ?? null,
        };
      });

      return {
        subscription_plan_id: plan.subscription_plan_id,
        elements,
      };
    });

    // Sort plans by price (ascending)
    result.sort((a, b) => a.subscription_plan_id.price - b.subscription_plan_id.price);

    return res.status(200).json({
      success: true,
      message: "Plans fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in getAllMappings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching plans",
      error: error.message,
    });
  }
};


exports.deleteMapping = async (req, res) => {
  try {
    // 1. Extract delete_all flag explicitly
    const { subscription_plan_id, feature_id, delete_all } = req.body;

    if (!subscription_plan_id) {
      return res.status(400).json({ success: false, message: "subscription_plan_id is required" });
    }

    // CASE 1: Delete specific feature (Prioritize safety)
    if (feature_id) {
      const mapping = await SubscriptionPlanElementMapping.findOneAndDelete({
        subscription_plan_id,
        feature_id,
      });

      if (!mapping) {
        return res.status(404).json({ success: false, message: "Mapping not found" });
      }
      return res.json({ success: true, message: "Feature removed successfully" });
    }

    // CASE 2: Delete All (Require explicit flag)
    // Only run this if delete_all is TRUE. This prevents accidental wipes.
    if (delete_all === true) {
      const result = await SubscriptionPlanElementMapping.deleteMany({ subscription_plan_id });

      if (!result.deletedCount) {
         return res.json({ success: true, message: "Plan was already empty" });
      }
      return res.json({ success: true, message: "All features cleared successfully" });
    }

    // CASE 3: Bad Request (Neither specific ID nor delete_all flag provided)
    return res.status(400).json({
        success: false,
        message: "Invalid request. Provide 'feature_id' to delete one, or 'delete_all: true' to clear plan."
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
