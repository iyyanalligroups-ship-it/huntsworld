// src/modules/admin/context/SocketContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSelectedUser } from "./SelectedUserContext";

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);
  const { selectedUser } = useSelectedUser();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});

  // 🔌 Initialize Socket Connection
  useEffect(() => {
    if (!user?.user?._id) return;

    // Prevent multiple connections
    if (socketRef.current) return;

    const socketInstance = io(
      `${import.meta.env.VITE_SOCKET_IO_URL}/messages`,
      {
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log(`✅ Connected to /messages: ${socketInstance.id}`);
      socketInstance.emit("join", user.user._id);
      setSocket(socketInstance);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socketInstance.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    socketInstance.on("user-disconnected", ({ userId, lastSeen }) => {
      setLastSeenMap((prev) => ({
        ...prev,
        [userId]: lastSeen,
      }));
    });

    socketInstance.on("disconnect", () => {
      console.log("⚠️ Socket disconnected");
    });

    // 🧹 Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user?.user?._id]);

  // 💬 Join Chat Room when selected user changes
  useEffect(() => {
    if (!socket || !user?.user?._id || !selectedUser?._id) return;

    socket.emit("joinChatRoom", {
      userId: user.user._id,
      selectedUserId: selectedUser._id,
    });
  }, [selectedUser?._id, user?.user?._id, socket]);

  const value = useMemo(
    () => ({
      socketRef,
      socket,
      onlineUsers,
      lastSeenMap,
    }),
    [socket, onlineUsers, lastSeenMap]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// 🎯 Custom Hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return { socket: null, socketRef: { current: null }, onlineUsers: [], lastSeenMap: {} };
  }
  return context;
};
