const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");
// Send a new message
router.post("/send-message", messageController.sendMessage);

// Get all messages between two users
router.get("/recieve-message/:userId/:chatPartnerId", messageController.getMessages);

router.get("/last-message", messageController.getLastMessage);


// Mark a message as read
router.patch("/mark-as-read", messageController.markAsRead);

// Update a message
router.put("/update-message/:messageId", messageController.updateMessage);

// Delete a message
router.delete("/delete-message/:messageId", messageController.deleteMessage);
// routes/chatRoutes.js
router.get("/unread-count", messageController.getUnreadCount);

module.exports = router;
