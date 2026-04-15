const Message = require("../models/messageModel");
const { STATUS, FEATURES } = require("../constants/subscriptionConstants");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const UserActiveFeature = require("../models/UserActiveFeature");
const GrocerySeller = require("../models/grocerySellerModel");
const Role = require("../models/roleModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");

exports.sendMessage = async (req, res) => {
  const { sender, receiver, content } = req.body;
  const io = global.io?.of("/messages");
  const onlineUsers = req.app.get("onlineUsers") || new Map();
  try {
    if (!io) {
      console.error("Socket.IO instance is undefined");
      return res.status(500).json({ error: "Socket.IO server not initialized" });
    }

    if (!sender || !receiver || !content) {
      console.error("Missing fields:", { sender, receiver, content });
      return res
        .status(400)
        .json({ error: "All fields (sender, receiver, content) are required." });
    }

    /* =========================
       🔹 FETCH SENDER & RECEIVER + ROLES
    ========================= */
    const [senderUser, receiverUser] = await Promise.all([
      User.findById(sender).populate("role").select("name profile_pic hasSentOneTimeMessage role"),
      User.findById(receiver).populate("role").select("name profile_pic role")
    ]);

    if (!senderUser) {
      console.error("Sender not found:", sender);
      return res.status(404).json({ error: "Sender not found" });
    }
    if (!receiverUser) {
      console.error("Receiver not found:", receiver);
      return res.status(404).json({ error: "Receiver not found" });
    }

    const isAdminReceiver = ["ADMIN", "SUB_ADMIN"].includes(receiverUser.role?.role);

    const restrictedRoles = ["MERCHANT", "GROCERY_SELLER", "SERVICE_PROVIDER"];
    let isOneTimeMessage = false;
    const now = new Date();

    /* =========================
       🔥 CHAT ACCESS LOGIC
    ========================= */
    if (restrictedRoles.includes(senderUser.role?.role) && !isAdminReceiver) {

      /* =====================================================
         🟢 GROCERY SELLER SPECIAL CONDITION
      ===================================================== */
      if (senderUser.role?.role === "GROCERY_SELLER") {
        let groceryMemberType = null;

        const grocerySeller = await GrocerySeller.findOne(
          { user_id: sender },
          { member_type: 1 }
        ).lean();

        if (grocerySeller?.member_type) {
          groceryMemberType = String(grocerySeller.member_type)
            .trim()
            .toLowerCase();
        }

        // 🟢 FARMER → FULL ACCESS (NO RESTRICTION)
        if (groceryMemberType === "farmer" || groceryMemberType === "Farmer") {
        }

        // 🔴 NON-FARMER → subscription / one-time logic
        else {
          const chatFeature = await UserActiveFeature.findOne({
            user_id: sender,
            feature_code: FEATURES.CHAT_SYSTEM,
            status: STATUS.ACTIVE,
            $or: [
              { expires_at: { $gt: now } },
              { expires_at: null },
            ],
          });
          if (!chatFeature) {
            if (senderUser.hasSentOneTimeMessage) {
              return res.status(403).json({
                error:
                  "Chat subscription required to continue messaging.",
              });
            }

            // ✅ Allow ONE-TIME message
            isOneTimeMessage = true;
            senderUser.hasSentOneTimeMessage = true;
            await senderUser.save();
          }
        }
      }

      /* =====================================================
         🔴 MERCHANT SPECIFIC LOGIC (FREE PLAN RESTRICTION)
      ===================================================== */
      else if (senderUser.role?.role === "MERCHANT") {
        const subscription = await UserSubscription.findOne({
          user_id: sender,
          status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
          captured: true,
          $or: [
            { end_date: { $gt: now } },
            { end_date: null }
          ],
        }).sort({ createdAt: -1 });

        const isFreePlan = !subscription || subscription.plan_snapshot?.plan_code?.toUpperCase() === "FREE";

        if (isFreePlan) {
          if (senderUser.hasSentOneTimeMessage) {
            return res.status(403).json({
              error: "FREE plan merchants can only send 1 message. Please upgrade your plan to continue messaging.",
            });
          }
          // ✅ Allow ONE-TIME message
          isOneTimeMessage = true;
          senderUser.hasSentOneTimeMessage = true;
          await senderUser.save();
        } else {
          const chatFeature = await UserActiveFeature.findOne({
            user_id: sender,
            feature_code: FEATURES.CHAT_SYSTEM,
            status: STATUS.ACTIVE,
            $or: [{ expires_at: { $gt: now } }, { expires_at: null }],
          });

          if (!chatFeature) {
            if (senderUser.hasSentOneTimeMessage) {
              return res.status(403).json({
                error: "Chat subscription expired. Please subscribe to continue messaging.",
              });
            }
            // ✅ Allow ONE-TIME message
            isOneTimeMessage = true;
            senderUser.hasSentOneTimeMessage = true;
            await senderUser.save();
          }
        }
      }
      /* =====================================================
         🔴 OTHER ROLES (SERVICE_PROVIDER)
      ===================================================== */
      else {
        const chatFeature = await UserActiveFeature.findOne({
          user_id: sender,
          feature_code: FEATURES.CHAT_SYSTEM,
          status: STATUS.ACTIVE,
          $or: [
            { expires_at: { $gt: now } },
            { expires_at: null },
          ],
        });

        if (!chatFeature) {
          if (senderUser.hasSentOneTimeMessage) {
            return res.status(403).json({
              error:
                "Chat subscription expired. Please subscribe to continue messaging.",
            });
          }

          // ✅ Allow ONE-TIME message
          isOneTimeMessage = true;
          senderUser.hasSentOneTimeMessage = true;
          await senderUser.save();
        }
      }
    }

    /* =========================
       💬 SAVE MESSAGE
    ========================= */
    const newMessage = new Message({
      sender,
      receiver,
      content,
      read: false,
      deleted: false,
    });

    await newMessage.save();

    // receiverUser is already fetched at the top

    const messageObject = {
      _id: newMessage._id,
      sender,
      receiver,
      content: newMessage.content,
      createdAt: newMessage.createdAt,
      read: newMessage.read,
      deleted: newMessage.deleted,
      senderUser: senderUser ? senderUser.toObject() : null,
      receiverUser: receiverUser ? receiverUser.toObject() : null,
      fromMe: true,
      isOneTimeMessage,
    };
    /* =========================
       📡 SOCKET EMIT
    ========================= */
    if (io) {
      // 🔹 Room-based emission (more reliable than onlineUsers map)
      io.to(receiver.toString()).emit("receiveMessage", messageObject);
      io.to(sender.toString()).emit("receiveMessage", {
        ...messageObject,
        fromMe: true,
      });
    }

    /* =========================
       ✅ RESPONSE
    ========================= */
    return res.status(201).json({
      message: isOneTimeMessage
        ? "One-time message sent successfully. Subscribe to send more messages."
        : "Message sent successfully",
      data: newMessage,
      isOneTimeMessage,
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      error: "Failed to send message",
      details: error.message,
    });
  }
};

exports.getMessages = async (req, res) => {
  const { userId, chatPartnerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 15;

  if (isNaN(page) || isNaN(pageSize)) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }

  try {
    const query = {
      $or: [
        { sender: userId, receiver: chatPartnerId },
        { sender: chatPartnerId, receiver: userId },
      ],
    };

    const totalMessages = await Message.countDocuments(query);
    const skip = (page - 1) * pageSize;
    const hasMore = totalMessages > page * pageSize;

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('_id sender receiver content createdAt updatedAt read deleted') // Include updatedAt
      .lean();

    res.status(200).json({
      data: messages,
      hasMore,
      totalMessages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.getLastMessage = async (req, res) => {
  const { userId, contactId } = req.query;

  try {
    const lastMessage = await Message.findOne({
      $or: [
        { sender: userId, receiver: contactId },
        { sender: contactId, receiver: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      lastMessage: lastMessage?.content || "",
      timestamp: lastMessage?.createdAt || null,
      deleted: lastMessage?.deleted || false, // ✅ return deleted flag
    });
  } catch (error) {
    console.error("Error fetching last message:", error);
    res.status(500).json({ error: "Failed to fetch last message" });
  }
};

exports.markAsRead = async (req, res) => {
  const { userId, selectedUserId } = req.body;
  const io = global.io?.of("/messages");
  const onlineUsers = req.app.get("onlineUsers") || new Map();

  try {
    if (!userId || !selectedUserId) {
      return res.status(400).json({
        error: "userId and selectedUserId are required",
      });
    }

    /* ===============================
       1️⃣ COUNT unread messages FIRST
       =============================== */
    const unreadCount = await Message.countDocuments({
      sender: selectedUserId,
      receiver: userId,
      read: false,
      deleted: false,
    });

    if (unreadCount === 0) {
      return res.status(200).json({
        message: "No unread messages",
        readCount: 0,
      });
    }

    /* ===============================
       2️⃣ MARK AS READ
       =============================== */
    await Message.updateMany(
      {
        sender: selectedUserId,
        receiver: userId,
        read: false,
        deleted: false,
      },
      { $set: { read: true } }
    );

    /* ===============================
       3️⃣ EMIT SOCKET EVENT WITH COUNT
       =============================== */
    if (io) {
      // 🔹 Room-based emission
      io.to(userId.toString()).emit("messagesRead", {
        userId,
        selectedUserId,
        readCount: unreadCount,
      });
    }

    res.status(200).json({
      message: "Messages marked as read",
      readCount: unreadCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      error: "Failed to mark messages as read",
      details: error.message,
    });
  }
};

exports.updateMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const io = global.io;
  if (!io) {
    console.warn("Socket.IO not initialized for updateMessage");
  }
  try {
    // Validate input
    if (!messageId || !content || content.trim() === "") {
      return res.status(400).json({ error: "Message ID and content are required" });
    }

    // Find and update message
    const message = await Message.findOneAndUpdate(
      { _id: messageId, deleted: false },
      { content: content.trim(), updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Message not found or already deleted" });
    }

    // Prepare complete message object for socket emission
    const updatedMessage = {
      _id: message._id,
      sender: message.sender.toString(),
      receiver: message.receiver.toString(),
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      read: message.read,
      deleted: message.deleted,
    };

    // Emit to both sender and receiver
    const onlineUsers = req.app.get("onlineUsers") || new Map();
    const senderSocketId = onlineUsers.get(message.sender.toString());
    const receiverSocketId = onlineUsers.get(message.receiver.toString());

    if (io) {
      io.to(message.sender.toString()).emit("messageUpdated", updatedMessage);
      io.to(message.receiver.toString()).emit("messageUpdated", updatedMessage);
    }
    res.status(200).json({ message: "Message updated successfully", data: updatedMessage });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Failed to update message", details: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const io = global.io?.of("/messages");

  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { deleted: true, updatedAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const deletedMessage = {
      _id: message._id,
      sender: message.sender,
      receiver: message.receiver,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      read: message.read,
      deleted: message.deleted,
    };

    if (io) {
      io.to(message.sender.toString()).emit("messageDeleted", deletedMessage);
      io.to(message.receiver.toString()).emit("messageDeleted", deletedMessage);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const count = await Message.countDocuments({
      receiver: userId,
      read: false,
      deleted: false,
    });

    res.json({ success: true, count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ success: false });
  }
};
