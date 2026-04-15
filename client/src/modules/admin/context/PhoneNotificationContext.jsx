// src/modules/admin/context/PhoneNotificationContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  useGetPhoneNumberAccessRequestsQuery,
  useMarkNotificationAsReadMutation,
} from "@/redux/api/PhoneNumberAccessApi";
const PhoneNotificationContext = createContext(undefined);

export const PhoneNotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);                     // ← correct hook
  const userId = user?.user?._id;                 // merchant user id

  const [phoneNotifications, setPhoneNotifications] = useState([]);
  const socketRef = useRef(null);

  /* -------------------------------------------------
   *  RTK-Query – same shape as the page
   * ------------------------------------------------- */
  const { data, refetch } = useGetPhoneNumberAccessRequestsQuery(
    { seller_id: userId, page: 1, limit: 50 },
    {
      skip: !userId,
      refetchOnMountOrArgChange: true,
      pollingInterval: 30_000,
    }
  );

  /* -------------------------------------------------
   *  ONE SOCKET – namespace /phone-number-access-notifications
   * ------------------------------------------------- */
  useEffect(() => {
    if (!userId) return;

    // avoid double connection
    if (socketRef.current?.connected) return;

    const socket = io(
      `${import.meta.env.VITE_SOCKET_IO_URL}/phone-number-access-notifications`,
      {
        withCredentials: true,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    socket.on("connect", () => {
      socket.emit("join", userId);
      console.log("[PhoneNotif] Connected & joined room:", userId);
    });

    // ---- NEW REQUEST ----
    socket.on("newPhoneNumberRequest", (notification) => {
      console.log("[PhoneNotif] New request:", notification);
      setPhoneNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev].slice(0, 50);
      });
      refetch(); // keep RTK cache in sync
    });

    // ---- MARK AS READ ----
    socket.on("notificationUpdated", ({ _id, is_read }) => {
      setPhoneNotifications((prev) =>
        prev.map((n) => (n._id === _id ? { ...n, is_read } : n))
      );
    });

    socket.on("connect_error", (err) => {
      console.error("[PhoneNotif] connect_error:", err.message);
    });

    socketRef.current = socket;

    // cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]); // ← refetch **not** in deps

  /* -------------------------------------------------
   *  Sync RTK data → local state
   * ------------------------------------------------- */
  useEffect(() => {
    if (data?.requests) {
      setPhoneNotifications((prev) => {
        const incoming = data.requests;
        const newIds = new Set(incoming.map((r) => r._id));
        const filtered = prev.filter((n) => !newIds.has(n._id));
        return [...incoming, ...filtered].slice(0, 50);
      });
    }
  }, [data]);

  /* -------------------------------------------------
   *  Mark-as-read helper (used by page & bell)
   * ------------------------------------------------- */
  const [markAsRead] = useMarkNotificationAsReadMutation();

  const markNotificationRead = async (id) => {
    if (!userId) return;
    try {
      await markAsRead({ request_id: id, seller_id: userId }).unwrap();
      setPhoneNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("markNotificationRead error:", err);
    }
  };

  const removeNotification = (id) => {
    setPhoneNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const unreadCount = phoneNotifications.filter((n) => !n.is_read).length;

  return (
    <PhoneNotificationContext.Provider
      value={{
        phoneNotifications,
        unreadCount,
        refetch,
        markNotificationRead,
        removeNotification,
      }}
    >
      {children}
    </PhoneNotificationContext.Provider>
  );
};

/* -------------------------------------------------
 *  Hook
 * ------------------------------------------------- */
export const usePhoneNotifications = () => {
  const ctx = useContext(PhoneNotificationContext);
  if (!ctx) {
    return {
      phoneNotifications: [],
      unreadCount: 0,
      refetch: () => { },
      markNotificationRead: async () => { },
      removeNotification: () => { },
    };
  }
  return ctx;
};
