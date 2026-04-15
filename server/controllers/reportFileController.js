// controllers/reportController.js
const Report = require("../models/reportFileModel");
const User = require("../models/userModel");

// Submit a report (any logged-in user)
const submitReport = async (req, res) => {
  try {
    const {
      reported_by,
      reported_user_id,
      description,
      attachments = [],
      sender_user_id,
      receiver_user_id,
    } = req.body;

    if (!reported_by || !reported_user_id || !description) {
      return res.status(400).json({
        success: false,
        message: "reported_by, reported_user_id and description are required",
      });
    }

    if (reported_by.toString() === reported_user_id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot report yourself",
      });
    }

    // ✅ Check reported user exists
    const reportedUser = await User.findById(reported_user_id);
    if (!reportedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Reported user not found" });
    }

    // ✅ Rate limit (5 per day)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReports = await Report.countDocuments({
      reported_by,
      createdAt: { $gte: oneDayAgo },
    });

    if (recentReports >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many reports today. Try again tomorrow.",
      });
    }

    const report = await Report.create({
      reported_by,
      reported_user_id,
      sender_user_id,
      receiver_user_id,
      description,
      attachments,
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (error) {
    console.error("Report Submit Error:", error);

    // If it's a validation error, extract the message
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.length > 0 ? messages[0] : "Validation failed",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// Get all reports (Admin only)
// const getAllReports = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 20;

//     const reports = await Report.find()
//       .populate("sender_user_id", "name email profile_pic")
//       .populate("receiver_user_id", "name email profile_pic")
//       .populate("reviewed_by", "name")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit);

//     const total = await Report.countDocuments();

//     res.json({
//       success: true,
//       data: reports,
//       pagination: {
//         current: page,
//         pages: Math.ceil(total / limit),
//         total,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// Admin: Update report status (resolve, dismiss, block user)
const updateReportStatus = async (req, res) => {
  try {
    const { status, is_blocked } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    if (status) report.status = status;
    if (typeof is_blocked === "boolean") {
      report.is_blocked = is_blocked;

      // Block the user in User model too
      if (is_blocked) {
        await User.findByIdAndUpdate(report.receiver_user_id, { isBlocked: true });
      }
    }

    report.reviewed_by = req.user._id;
    report.reviewed_at = new Date();

    await report.save();

    res.json({ success: true, message: "Report updated", data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// controllers/reportController.js

// PICK a report (admin takes ownership)
const pickReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const adminId = req.body.admin_id; // or req.user._id in production

    const report = await Report.findById(reportId)
      .populate("sender_user_id", "name email")
      .populate("receiver_user_id", "name email");

    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.picked_by) {
      return res.status(400).json({ message: "Report already picked by another admin" });
    }

    if (report.status !== "pending") {
      return res.status(400).json({ message: "Only pending reports can be picked" });
    }

    report.picked_by = adminId;
    report.status = "picked";
    await report.save();

    res.json({ message: "Report picked successfully", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// CLOSE a report (only the admin who picked it)
const closeReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const adminId = req.body.admin_id;

    const report = await Report.findById(reportId);

    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!report.picked_by || report.picked_by.toString() !== adminId) {
      return res.status(403).json({ message: "You are not authorized to close this report" });
    }

    if (report.status === "closed") {
      return res.status(400).json({ message: "Report already closed" });
    }

    report.status = "closed";
    report.closed_at = new Date();
    await report.save();

    res.json({ message: "Report closed successfully", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL Reports (Admin Panel)
const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;

    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .populate("sender_user_id", "name email phone profile_pic")
      .populate("receiver_user_id", "name email phone profile_pic")
      .populate("picked_by", "name email")
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      reports,
      message: "fetch all reports successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET MY Reports (assigned to current admin)
const getMyReports = async (req, res) => {
  try {
    let adminId = req.query.admin_id?.trim();
    if (!adminId || ["undefined", "null", ""].includes(adminId)) {
      return res.status(400).json({ message: "Valid Admin ID required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = { picked_by: adminId };
    if (status === "picked" || status === "closed") {
      filter.status = status;
    } else {
      filter.status = { $in: ["picked", "closed"] };
    }

    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .populate("sender_user_id", "name email")
      .populate("receiver_user_id", "name email profile_pic")
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      reports,
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
module.exports = {
  submitReport,
  getAllReports,
  updateReportStatus,
  pickReport,
  closeReport,
  getMyReports
};
