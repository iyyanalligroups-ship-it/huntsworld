import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSocket } from "./SocketContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSelectedUser } from "./SelectedUserContext";
import axios from "axios";

const UnreadCountContext = createContext(undefined);

export const UnreadCountProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useSocket();
  const { selectedUser } = useSelectedUser();

  const [totalUnread, setTotalUnread] = useState(0);
  const isInitialFetchDone = useRef(false);

  const selectedUserId = selectedUser?.user_id?._id || selectedUser?._id;
  const currentUserId = user?.user?._id;

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const resp = await axios.get(
        `${import.meta.env.VITE_API_URL}/chat/unread-count?userId=${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem("token") || user?.token}`,
          },
        }
      );
      if (resp.data.success) {
        const count = Number(resp.data.count) || 0;
        console.log("UnreadCountContext: Initial count fetched:", count);

        setTotalUnread((prev) => {
          // Trust Higher: Don't downgrade from a real-time increment to a stale API response
          if (!isInitialFetchDone.current) return count;
          return Math.max(prev, count);
        });
        isInitialFetchDone.current = true;
      }
    } catch (err) {
      console.error("Unread count fetch failed", err);
    }
  }, [currentUserId, token, user?.token]);

  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCount();
    }
  }, [currentUserId, fetchUnreadCount]);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    console.log("Attaching listeners to UnreadCountContext", { socketId: socket.id });

    const handleReceiveMessage = (msg) => {
      console.log("UnreadCountContext: receiveMessage:", msg);
      if (!msg._id) return;

      const isForMe = String(msg.receiver) === String(currentUserId);
      const isNotFromOpenChat = !selectedUserId || String(msg.sender) !== String(selectedUserId);

      if (isForMe && isNotFromOpenChat) {
        console.log("UnreadCountContext: Incrementing count");
        setTotalUnread((prev) => Number(prev) + 1);

        // Sync fallback: Give DB time to update count index
        setTimeout(() => fetchUnreadCount(), 2000);
      }
    };

    const handleMessagesRead = ({ userId, readCount }) => {
      if (String(userId) === String(currentUserId)) {
        console.log("UnreadCountContext: messagesRead event:", readCount);
        if (readCount !== undefined) {
          setTotalUnread((prev) => Math.max(0, Number(prev) - Number(readCount)));
        } else {
          fetchUnreadCount();
        }
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, currentUserId, selectedUserId, fetchUnreadCount]);

  const value = useMemo(() => ({
    totalUnread,
    setTotalUnread
  }), [totalUnread]);

  return (
    <UnreadCountContext.Provider value={value}>
      {children}
    </UnreadCountContext.Provider>
  );
};

export const useUnreadCount = () => {
  const context = useContext(UnreadCountContext);
  if (!context) {
    return { totalUnread: 0, setTotalUnread: () => { } };
  }
  return context;
};
