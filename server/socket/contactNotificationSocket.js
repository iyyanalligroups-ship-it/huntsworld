// sockets/contactNotificationSocket.js

module.exports = (contactNamespace) => {
  contactNamespace.on("connection", (socket) => {
    console.log(`[Contacts] Client connected: ${socket.id}`);

    // Admin joins the room when they load the admin dashboard / sidebar
    socket.on("join-admins", () => {
      socket.join("admins-room");
      console.log(`Admin joined contacts admins-room`);
    });

    // Client requests individual contact unread count (legacy / per-item badge)
    socket.on("get-unread-count", async () => {
      try {
        const Contact = require("../models/contactModel");
        const unread = await Contact.countDocuments({ markAsRead: false });

        socket.emit("contact-unread-count", { count: unread });
        console.log(`[Contacts] Sent contact-unread-count to ${socket.id}: ${unread}`);

        // ALSO send global "Others" count on initial request
        const totalOthers = unread; // + future unread items (e.g. complaints)
        socket.emit("others-unread-count", { count: totalOthers });
        console.log(`[Others Global] Sent initial others-unread-count to ${socket.id}: ${totalOthers}`);
      } catch (err) {
        console.error("[Contacts] Error sending initial counts:", err);
      }
    });

    // Optional: dedicated request for Others global count (if needed separately)
    socket.on("get-others-unread-count", async () => {
      try {
        const Contact = require("../models/contactModel");
        const unreadContacts = await Contact.countDocuments({ markAsRead: false });
        const totalOthers = unreadContacts; // extend later

        socket.emit("others-unread-count", { count: totalOthers });
        console.log(`[Others Global] Sent on-demand others-unread-count to ${socket.id}: ${totalOthers}`);
      } catch (err) {
        console.error("[Others Global] Error on-demand:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Contacts] Disconnected: ${socket.id}`);
    });
  });

  // Internal helper – broadcasts individual contact count
  const broadcastContactUnreadCount = async () => {
    try {
      const Contact = require("../models/contactModel");
      const unread = await Contact.countDocuments({ markAsRead: false });
      contactNamespace.to("admins-room").emit("contact-unread-count", { count: unread });
      console.log(`[Contacts] Broadcasted contact-unread-count: ${unread}`);
    } catch (err) {
      console.error("[Contacts] Failed to broadcast contact count:", err);
    }
  };

  // Internal helper – broadcasts global count for "Others" parent
  const broadcastOthersUnreadCount = async () => {
    try {
      const Contact = require("../models/contactModel");
      const unreadContacts = await Contact.countDocuments({ markAsRead: false });

      // Future: add other types under "Others"
      // const unreadComplaints = await Complaint.countDocuments({ read: false });
      // const totalOthers = unreadContacts + unreadComplaints + ...
      const totalOthers = unreadContacts;

      contactNamespace.to("admins-room").emit("others-unread-count", { count: totalOthers });
      console.log(`[Others Global] Broadcasted unread count: ${totalOthers}`);
    } catch (err) {
      console.error("[Others Global] Failed to broadcast count:", err);
    }
  };

  // Combined broadcast – used by create and markAsRead
  const broadcastUnreadCounts = async () => {
    await broadcastContactUnreadCount();
    await broadcastOthersUnreadCount();
  };

  // Public API returned to controllers
  return {
    notifyNewContact: async (contact) => {
      if (!contact?._id) {
        console.warn("[Contacts] Invalid contact object received");
        return;
      }

      const payload = {
        _id: contact._id.toString(),
        name: contact.name || "Unknown",
        email: contact.email || "",
        phone: contact.phone || "",
        date: contact.date || "",
        time: contact.time || "",
        createdAt: contact.createdAt ? contact.createdAt.toISOString() : new Date().toISOString(),
        markAsRead: !!contact.markAsRead,
      };

      console.log(`[Contacts] Broadcasting new contact: ${payload.name}`);

      contactNamespace.to("admins-room").emit("new-contact", payload);
      await broadcastUnreadCounts(); // triggers both
    },

    updateUnreadCount: async () => {
      await broadcastUnreadCounts(); // triggers both
    },
  };
};
