// const SubscriptionPlanElement = require('../models/subscriptionPlanElementModel');

// // Create a new subscription plan element
// exports.createElement = async (req, res) => {
//     try {
//         const { feature_name } = req.body;
//         

//         const element = await SubscriptionPlanElement.create({ feature_name });
//         res.status(201).json({
//             success:true,
//             message:"Subscription Element Created Successfully",
//             data:element
//         });
//     } catch (error) {
//         res.status(500).json({success:false, error: error.message });
//     }
// };

// // Get all subscription plan elements
// exports.getAllElements = async (req, res) => {
//     try {
//         const elements = await SubscriptionPlanElement.find();
//         res.json({
//             success:true,
//             message:"Fetched Subscription Element Successfully",
//             data:elements
//         });
//     } catch (error) {
//         res.status(500).json({success:false, error: error.message });
//     }
// };


// exports.getAllElementsForMapping = async (req, res) => {
//   try {
//       const elements = await SubscriptionPlanElement.find();
//       res.json({
//           success:true,
//           message:"Fetched Subscription Element Successfully",
//           data:elements
//       });
//   } catch (error) {
//       res.status(500).json({success:false, error: error.message });
//   }
// };

// // Get a specific subscription plan element by ID
// exports.getElementById = async (req, res) => {
//     try {
//         const element = await SubscriptionPlanElement.findByPk(req.params.id);
//         if (!element) return res.status(404).json({ message: "Element not found" });
//         res.json(element);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Update a subscription plan element
// exports.updateElement = async (req, res) => {
//     try {
//       const { feature_name } = req.body;

//       const element = await SubscriptionPlanElement.findByIdAndUpdate(
//         req.params.id,
//         { feature_name },
//         { new: true } // return the updated document
//       );

//       if (!element) {
//         return res.status(404).json({ success: false, message: "Element not found" });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Subscription Element Updated Successfully",
//         data: element,
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   };


// // Delete a subscription plan element
// exports.deleteElement = async (req, res) => {
//     try {
//       const element = await SubscriptionPlanElement.findByIdAndDelete(req.params.id);

//       if (!element) {
//         return res.status(404).json({ success: false, message: "Element not found" });
//       }

//       res.json({
//         success: true,
//         message: "Element deleted successfully",
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   };

// controllers/subscriptionPlanElementController.js
const SubscriptionPlanElement = require('../models/subscriptionPlanElementModel');

exports.createElement = async (req, res) => {
  try {
    const { feature_name, feature_code } = req.body;

    // 1. Required fields validation
    if (!feature_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feature name is required",
      });
    }

    if (!feature_code?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feature code is required",
      });
    }

    const trimmedName = feature_name.trim();
    const normalizedCode = feature_code.trim().toUpperCase();

    // 2. Format validation for feature_code
    if (!/^[A-Z0-9_]+$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message:
          "Feature code must contain only uppercase letters, numbers and underscores (_)",
      });
    }

    // 3. Check duplicate feature name (case-insensitive)
    const existingName = await SubscriptionPlanElement.findOne({
      feature_name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existingName) {
      return res.status(409).json({
        success: false,
        message: "A feature with this name already exists (case-insensitive)",
      });
    }

    // 4. Check duplicate feature code (exact match)
    const existingCode = await SubscriptionPlanElement.findOne({
      feature_code: normalizedCode,
    });

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: "This feature code is already in use",
      });
    }

    // 5. Create the document
    const element = await SubscriptionPlanElement.create({
      feature_name: trimmedName,
      feature_code: normalizedCode,
      is_active: true,
    });

    return res.status(201).json({
      success: true,
      message: "Feature created successfully",
      data: element,
    });
  } catch (error) {
    console.error("Create feature error:", error);

    // Handle MongoDB unique index violation
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate feature name or code detected",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating feature",
    });
  }
};

exports.getAllElements = async (req, res) => {
  try {
    const elements = await SubscriptionPlanElement.find()
      .select("feature_name is_active createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Features fetched successfully",
      data: elements,
    });
  } catch (error) {
    console.error("Get elements error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching features",
    });
  }
};

exports.getAllElementsForMapping = async (req, res) => {
  try {
    const elements = await SubscriptionPlanElement.find({ is_active: true })
      .select("feature_name _id")
      .sort({ feature_name: 1 });

    res.status(200).json({
      success: true,
      message: "Active features fetched for mapping",
      data: elements,
    });
  } catch (error) {
    console.error("Get elements for mapping error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updateElement = async (req, res) => {
  try {
    const { feature_name, feature_code } = req.body;

    const element = await SubscriptionPlanElement.findById(req.params.id);
    if (!element) {
      return res.status(404).json({
        success: false,
        message: "Feature not found",
      });
    }

    let hasChanges = false;

    // ── Update feature_name if provided ─────────────────────────────
    if (feature_name !== undefined) {
      const trimmedName = feature_name.trim();

      if (trimmedName === "") {
        return res.status(400).json({
          success: false,
          message: "Feature name cannot be empty",
        });
      }

      // Check for duplicate name (excluding current document)
      const existingName = await SubscriptionPlanElement.findOne({
        feature_name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        _id: { $ne: element._id },
      });

      if (existingName) {
        return res.status(409).json({
          success: false,
          message: "Another feature with this name already exists",
        });
      }

      element.feature_name = trimmedName;
      hasChanges = true;
    }

    // ── Update feature_code if provided ─────────────────────────────
    if (feature_code !== undefined) {
      const normalizedCode = feature_code.trim().toUpperCase();

      if (normalizedCode === "") {
        return res.status(400).json({
          success: false,
          message: "Feature code cannot be empty",
        });
      }

      if (!/^[A-Z0-9_]+$/.test(normalizedCode)) {
        return res.status(400).json({
          success: false,
          message:
            "Feature code must contain only uppercase letters, numbers and underscores (_)",
        });
      }

      // Check for duplicate code (excluding current document)
      const existingCode = await SubscriptionPlanElement.findOne({
        feature_code: normalizedCode,
        _id: { $ne: element._id },
      });

      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: "This feature code is already in use by another feature",
        });
      }

      element.feature_code = normalizedCode;
      hasChanges = true;
    }

    // Optional: you can require at least one field to change
    // if (!hasChanges) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "No fields were provided to update",
    //   });
    // }

    await element.save();

    return res.status(200).json({
      success: true,
      message: "Feature updated successfully",
      data: element,
    });
  } catch (error) {
    console.error("Update feature error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate feature name or code detected",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating feature",
    });
  }
};

exports.deleteElement = async (req, res) => {
  try {
    const element = await SubscriptionPlanElement.findById(req.params.id);
    if (!element) {
      return res.status(404).json({
        success: false,
        message: "Feature not found",
      });
    }

    await element.deleteOne();

    res.status(200).json({
      success: true,
      message: "Feature deleted successfully",
    });
  } catch (error) {
    console.error("Delete element error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting feature",
    });
  }
};
