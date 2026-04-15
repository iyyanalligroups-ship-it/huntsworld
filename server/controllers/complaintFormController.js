const Complaint = require("../models/ComplaintFormModel");
const ComplaintNotification = require("../models/ComplaintNotificationModel");
const Address = require("../models/addressModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel")
const Role = require("../models/roleModel");

// Create Complaint
// exports.createComplaint = async (req, res) => {
//   try {
//     const { type, option, user_id, details } = req.body;

//      // To log and inspect the incoming data

//     if (!type || !option || !user_id) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // Assuming 'details' is a nested object that is directly sent in JSON format
//     if (!details || typeof details !== "object") {
//       return res.status(400).json({ message: "Invalid details format" });
//     }

//     const complaint = new Complaint({ type, option, user_id, details });
//     await complaint.save();

//     res
//       .status(201)
//       .json({ message: "Complaint created successfully", complaint });
//   } catch (err) {
//     console.error("Error creating complaint:", err);
//     res
//       .status(500)
//       .json({ message: "Error creating complaint", error: err.message });
//   }
// };
// 1. CREATE COMPLAINT + NOTIFICATION
exports.createComplaint = async (req, res) => {
  try {
    const { type, option, user_id, details } = req.body;

    if (!type || !option || !user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!details || typeof details !== "object") {
      return res.status(400).json({ message: "Invalid details format" });
    }

    // 1️⃣ Save complaint
    const complaint = new Complaint({ type, option, user_id, details });
    await complaint.save();

    // 2️⃣ Populate user_id with name, email, phone
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("user_id", "name email phone")
      .lean();

    // 3️⃣ Fetch personal address (same logic as getAllComplaints)
    const personalAddress = await Address.findOne({
      user_id: user_id,
      address_type: "personal",
    })
      .select("street city state country pincode address_type -_id")
      .lean();

    // 4️⃣ Enrich with personal_address (exact same format)
    const enrichedComplaint = {
      ...populatedComplaint,
      user_id: {
        ...populatedComplaint.user_id,
        personal_address: personalAddress
          ? {
            address_type: "personal",
            street: personalAddress.street || "",
            city: personalAddress.city,
            state: personalAddress.state,
            country: personalAddress.country,
            pincode: personalAddress.pincode,
          }
          : null,
      },
    };

    // 5️⃣ OLD: Save & send notification (preserved)
    const notif = new ComplaintNotification({
      complaintId: complaint._id,
      message: `New ${option.replace(/_/g, " ")} complaint from user`,
    });
    await notif.save();

    if (global.complaintIo) {
      global.complaintIo.to("admin-complaints").emit("newComplaint", {
        _id: notif._id,
        complaintId: complaint._id,
        type,
        option,
        user_id: enrichedComplaint.user_id, // ← Now enriched!
        message: notif.message,
        created_at: notif.created_at,
        isRead: false,
      });
    }

    /* =================================================
       🔹 NEW: Send enriched complaint as chat message
       ================================================= */
    try {
      const io = global.io?.of("/messages");
      const onlineUsers = req.app.get("onlineUsers") || new Map();

      const senderUser = enrichedComplaint.user_id; // Already enriched

      const adminRole = await Role.findOne({ role: "ADMIN" }).lean();
      if (adminRole) {
        const admins = await User.find({ role: adminRole._id })
          .select("_id name profile_pic")
          .lean();

        const complaintHTML = `
<div style="border-left:5px solid #e63946;background:#fff5f5;border-radius:12px;padding:14px;margin:8px 0;max-width:380px;font-family:'Segoe UI',Arial,sans-serif;border:1px solid #ffd6d6">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
    <strong style="color:#e63946;font-size:15px">NEW COMPLAINT</strong>
    <span style="font-size:11px;color:#888">Just Now</span>
  </div>
  <div style="font-size:14px;color:#333;line-height:1.6">
    <div><b>User:</b> ${senderUser.name}</div>
    <div><b>Phone:</b> ${senderUser.phone || "N/A"}</div>
    ${senderUser.personal_address
            ? `<div><b>Address:</b> ${senderUser.personal_address.street ? senderUser.personal_address.street + ", " : ""}${senderUser.personal_address.city}, ${senderUser.personal_address.state} - ${senderUser.personal_address.pincode}</div>`
            : ""
          }

    <div><b>Option:</b> ${option.replace(/_/g, " ")}</div>
    <div style="margin-top:8px">
      <b>Description:</b><br/>
      ${details.description || details.complaint_description || "No description provided"}
    </div>
  </div>
</div>
`.trim();

        for (const admin of admins) {
          const msg = new Message({
            sender: user_id,
            receiver: admin._id,
            content: complaintHTML,
            type: "COMPLAINT",
            read: false,
            deleted: false,
          });
          await msg.save();

          const messagePayload = {
            _id: msg._id,
            sender: user_id,
            receiver: admin._id,
            content: complaintHTML,
            createdAt: msg.createdAt,
            read: false,
            senderUser: senderUser,
            receiverUser: admin,
            isComplaint: true,
          };

          if (io) {
            // 🔹 Room-based emission (more reliable)
            io.to(admin._id.toString()).emit("receiveMessage", messagePayload);
            io.to(user_id.toString()).emit("receiveMessage", {
              ...messagePayload,
              fromMe: true,
            });
          }
        }
      }
    } catch (chatErr) {
      console.error("Failed to send complaint chat message:", chatErr);
    }

    // Final response
    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: enrichedComplaint, // ← Now matches getAllComplaints format
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
// ──────────────────────────────────────────────────────────────
// 2. GET ALL COMPLAINT NOTIFICATIONS (for bell + page)
exports.getComplaintNotifications = async (req, res) => {
  try {
    const { userId, page = 1, limit = 10, status = "all" } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const skip = (page - 1) * limit;
    let filter = {};

    if (status === "unread") filter.isRead = false;
    if (status === "read") filter.isRead = true;

    const notifications = await ComplaintNotification.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "complaintId",
        select: "type option user_id details",
        populate: {
          path: "user_id",
          model: "User",              // 👈 User model name
          select: "name email",       // 👈 fields you want
        },
      })
      .lean();

    const total = await ComplaintNotification.countDocuments(filter);

    res.status(200).json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching complaint notifications:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ──────────────────────────────────────────────────────────────
// 3. GET SINGLE NOTIFICATION DETAIL
exports.getComplaintNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await ComplaintNotification.findById(id)
      .populate({
        path: "complaintId",
        select: "type option user_id details",
        populate: {
          path: "user_id",
          model: "User",
          select: "name phone email", // add/remove fields as needed
        },
      })
      .lean();

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ data: notif });
  } catch (err) {
    console.error("Error fetching notification detail:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ──────────────────────────────────────────────────────────────
// 4. MARK AS READ
exports.markComplaintAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notif = await ComplaintNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Emit to all admins
    if (global.complaintIo) {
      global.complaintIo
        .to("admin-complaints")
        .emit("complaintRead", {
          _id: notif._id,
          isRead: true,
        });
    }

    res.status(200).json({
      message: "Marked as read",
      notification: notif,
    });
  } catch (err) {
    console.error("Error marking as read:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get All Complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { type, option } = req.query;

    // Filter for complaints
    const filter = {};
    if (type) filter.type = type;
    if (option) filter.option = option;

    const total = await Complaint.countDocuments(filter);

    // Step 1: Fetch complaints with populated user info
    const complaints = await Complaint.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("user_id", "name email phone")
      .sort({ createdAt: -1 })
      .lean(); // Use .lean() for plain JS objects (easier to modify)

    if (complaints.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Fetched Complaints Successfully",
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Step 2: Collect unique user IDs
    const userIds = [...new Set(complaints.map(c => c.user_id?._id).filter(Boolean))];

    // Step 3: Fetch personal addresses for these users
    const personalAddresses = await Address.find({
      user_id: { $in: userIds },
      address_type: "personal"
    })
      .select("user_id street city state country pincode address_type -_id") // Select needed fields
      .lean();

    // Step 4: Create a map: userId → personal_address
    const addressMap = {};
    personalAddresses.forEach(addr => {
      addressMap[addr.user_id.toString()] = addr;
      // Remove user_id from the address object (optional cleanup)
      delete addr.user_id;
    });

    // Step 5: Attach personal_address to each complaint's user
    const enrichedComplaints = complaints.map(complaint => {
      const userIdStr = complaint.user_id?._id?.toString();
      const personalAddress = userIdStr ? addressMap[userIdStr] || null : null;

      return {
        ...complaint,
        user_id: {
          ...complaint.user_id,
          personal_address: personalAddress
        }
      };
    });

    res.status(200).json({
      success: true,
      message: "Fetched Complaints Successfully",
      data: enrichedComplaints,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching complaints",
      error: err.message,
    });
  }
};
// Get Complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "user_id",
      "name email"
    );
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });
    res.status(200).json(complaint);
  } catch (err) {
    console.error("Error fetching complaint:", err);
    res
      .status(500)
      .json({ message: "Error fetching complaint", error: err.message });
  }
};

// Update Complaint
exports.updateComplaint = async (req, res) => {
  try {
    const { type, option, user_id, details } = req.body;
    // Assuming 'details' is a nested object that is directly sent in JSON format
    if (!details || typeof details !== "object") {
      return res.status(400).json({ message: "Invalid details format" });
    }

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { type, option, user_id, details },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Complaint not found" });

    res
      .status(200)
      .json({ message: "Complaint updated successfully", complaint: updated });
  } catch (err) {
    console.error("Error updating complaint:", err);
    res
      .status(500)
      .json({ message: "Error updating complaint", error: err.message });
  }
};

// Delete Complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const deleted = await Complaint.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Complaint not found" });

    res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Error deleting complaint:", err);
    res
      .status(500)
      .json({ message: "Error deleting complaint", error: err.message });
  }
};


// New controller: Get Complaints for Logged-in User
// controllers/complaintFormController.js

exports.getUserComplaints = async (req, res) => {
  try {
    const { user_id, option } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const filter = { user_id: user_id };
    if (option && option !== "all" && option !== "") {
      filter.option = option;
    }

    const complaints = await Complaint.find(filter)
      .select('+details')                  // THIS LINE IS CRUCIAL
      .populate("user_id", "name email phone")
      .sort({ createdAt: -1 })
      .lean(); // optional but faster

    res.status(200).json({
      success: true,
      message: "Fetched User Complaints Successfully",
      data: complaints,
    });
  } catch (err) {
    console.error("Error fetching user complaints:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching user complaints",
      error: err.message,
    });
  }
};


// New controller: Get Complaints by Supplier Number and Type
exports.getComplaintsBySupplierNumberAndType = async (req, res) => {
  try {
    const { supplier_number, type } = req.query;

    if (!supplier_number || !type) {
      return res.status(400).json({ message: "Supplier number and type are required" });
    }

    const filter = { "details.supplier_number": supplier_number, type };

    const complaints = await Complaint.find(filter)
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Fetched Complaints Successfully",
      data: complaints,
    });
  } catch (err) {
    console.error("Error fetching complaints by supplier number and type:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching complaints",
      error: err.message,
    });
  }
};


exports.getMerchantByUserId = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const merchant = await Merchant.findOne({ user_id })
      .populate({ path: "user_id", select: "name email phone_number" })
      .populate({
        path: "address_id",
        select: "street city state country postal_code",
      });

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found for this user" });
    }

    res.status(200).json({
      success: true,
      message: "Merchant fetched successfully",
      data: merchant,
    });
  } catch (error) {
    console.error("Error fetching merchant by user_id:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching merchant",
      error: error.message,
    });
  }
};


exports.updateComplaint = async (req, res) => {
  try {
    const { status, ...otherUpdates } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (Object.keys(otherUpdates).length > 0) {
      // merge other fields if needed
      Object.assign(updateData, otherUpdates);
    }

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Complaint not found" });

    res.json({ message: "Updated successfully", complaint: updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};
exports.deleteComplaintNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await ComplaintNotification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Optional: also delete the actual complaint? (most admins keep complaint history)
    // If yes → uncomment next line:
    // await Complaint.findByIdAndDelete(notification.complaintId);

    await ComplaintNotification.findByIdAndDelete(notificationId);

    // Optional: emit socket event to refresh admin lists
    if (global.complaintIo) {
      global.complaintIo.to("admin-complaints").emit("notificationDeleted", {
        _id: notificationId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting notification:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['not_seen', 'in_process', 'solved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
