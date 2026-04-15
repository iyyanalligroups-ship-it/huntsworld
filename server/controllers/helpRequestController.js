const HelpRequest = require("../models/helpRequestModel");
const User = require("../models/userModel");
const mongoose = require('mongoose');

// CREATE help request
exports.createHelpRequest = async (req, res) => {
  try {
    const { user_id, description } = req.body;

    const help = await HelpRequest.create({
      user_id,
      description,
    });

    res.status(201).json({ message: "Help request created", help });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// GET all help requests (admin)
exports.getHelpRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // optional filter: pending, picked, closed
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && ["pending", "picked", "closed"].includes(status)) {
      filter.status = status;
    }

    const total = await HelpRequest.countDocuments(filter);

    const helpRequests = await HelpRequest.find(filter)
      .populate("user_id", "name email phone")
      .populate({
        path: "picked_by",
        select: "name email",
        model: "User", // Make sure "Admin" model exists
      })
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      helpRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// PICK help request by admin — only 1 admin can pick
exports.pickHelpRequest = async (req, res) => {
  try {
    const helpId = req.params.id;
    const adminId = req.body.admin_id;

    const help = await HelpRequest.findById(helpId);
    if (!help) return res.status(404).json({ message: "Help request not found" });

    if (help.picked_by)
      return res.status(400).json({ message: "Already picked by another admin" });

    help.picked_by = adminId;
    help.status = "picked";
    await help.save();

    res.json({ message: "Case picked successfully", help });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// UPDATE (ex: close case)
exports.updateHelpRequest = async (req, res) => {
  try {
    const help = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(help);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// DELETE help request
exports.deleteHelpRequest = async (req, res) => {
  try {
    const help = await HelpRequest.findByIdAndDelete(req.params.id);
    if (!help) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Help request deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// NEW: GET my help requests (picked and closed by the current admin)

exports.getMyHelpRequests = async (req, res) => {
  try {
    let adminId = req.query.admin_id?.trim();

    // Fix common mistakes: "undefined", "null", empty string
    if (!adminId || adminId === "undefined" || adminId === "null") {
      return res.status(400).json({ message: "Valid Admin ID is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = { picked_by: adminId };
    if (status === "picked" || status === "closed") {
      filter.status = status;
    } else {
      filter.status = { $in: ["picked", "closed"] };
    }

    const total = await HelpRequest.countDocuments(filter);

    const helpRequests = await HelpRequest.find(filter)
      .populate("user_id", "name email phone")
      .populate({
        path: "picked_by",
        select: "name email",
        model: "User",
      })
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      helpRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// NEW: CLOSE help request by admin (only the picker can close)
exports.closeHelpRequest = async (req, res) => {
  try {
    const helpId = req.params.id;
    const adminId = req.body.admin_id; // In production, get from auth (req.user._id)

    const help = await HelpRequest.findById(helpId);
    if (!help) return res.status(404).json({ message: "Help request not found" });

    if (!help.picked_by || help.picked_by.toString() !== adminId)
      return res.status(403).json({ message: "You are not authorized to close this request" });

    if (help.status === "closed")
      return res.status(400).json({ message: "Request already closed" });

    help.status = "closed";
    await help.save();

    res.json({ message: "Request closed successfully", help });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



exports.exchangeHelpRequest = async (req, res) => {
  try {
    const { id } = req.params; // help request ID
    const { newAdminId } = req.body;

    if (!newAdminId) {
      return res.status(400).json({ message: "New admin ID is required" });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(newAdminId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const updatedRequest = await HelpRequest.findByIdAndUpdate(
      id,
      {
        picked_by: newAdminId,
        status: "picked", // optional: keep status consistent
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Help request not found" });
    }

    res.status(200).json({
      success: true,
      message: "Help request exchanged successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Exchange help error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
