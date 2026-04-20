// src/modules/customer/context/CustomerPhoneNotificationContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "@/modules/landing/context/AuthContext";
const CustomerPhoneNotificationContext = createContext(undefined);

export const CustomerPhoneNotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;

  const [notifications, setNotifications] = useState([]); 
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    if (socketRef.current?.connected) return;

    const socket = io(
      `${import.meta.env.VITE_SOCKET_IO_URL}/phone-number-access-notifications`,
      {
        withCredentials: true,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
      }
    );

    socket.on("connect", () => {
      socket.emit("join", userId); // ← join own userId room
      console.log("[CustomerPhoneNotif] Connected & joined:", userId);
    });

    // Listen for approval
    socket.on("phoneNumberRequestApproved", (payload) => {
      console.log("[Customer] Approved!", payload);
      setNotifications((prev) => [
        {
          ...payload,
          type: "approved",
          created_at: new Date().toISOString(),
          seen: false,
        },
        ...prev,
      ].slice(0, 20));

      // Optional: show toast immediately
      // showToast(`Phone number access approved!`, "success");
    });

    // Listen for rejection
    socket.on("phoneNumberRequestRejected", (payload) => {
      console.log("[Customer] Rejected!", payload);
      setNotifications((prev) => [
        {
          ...payload,
          type: "rejected",
          created_at: new Date().toISOString(),
          seen: false,
        },
        ...prev,
      ].slice(0, 20));

      // showToast("Your phone number request was rejected", "error");
    });

    socket.on("connect_error", (err) => {
      console.error("[CustomerPhoneNotif] connect error:", err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.seen ? n : { ...n, seen: true }))
    );
  };

  return (
    <CustomerPhoneNotificationContext.Provider
      value={{
        notifications,           // approved/rejected ones
        markAllAsRead,           // mark all as read function
      }}
    >
      {children}
    </CustomerPhoneNotificationContext.Provider>
  );
};

export const useCustomerPhoneNotifications = () => {
  const ctx = useContext(CustomerPhoneNotificationContext);
  if (!ctx) {
    throw new Error("useCustomerPhoneNotifications must be used within CustomerPhoneNotificationProvider");
  }
  return ctx;
};
