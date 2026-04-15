import { useContext, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useGetAllUsersQuery, useMarkAsReadMutation } from "@/redux/api/MessageApi";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import UserListItemWithLastMessage from "./helper/UserListItemWithLastMessage";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { socketRef } = useSocket();
  const socket = socketRef?.current;
  const { toggleSidebar } = useSidebar();
  const [page, setPage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const { selectedUser, setSelectedUser } = useSelectedUser();
  const [markAsRead] = useMarkAsReadMutation();

  const selectedUserId = selectedUser?.user_id?._id || selectedUser?._id;

  const { data, isFetching, isSuccess, refetch } = useGetAllUsersQuery(
    {
      userId: user?.user?._id,
      page,
      limit: 10,
    },
    { skip: !user?.user?._id }
  );

  useEffect(() => {
    if (isSuccess && data?.users?.length) {
      setAllUsers((prev) => {
        const existingIds = new Set(prev.map((user) => user?._id));
        const newUsers = data.users
          .filter((user) => !existingIds.has(user?._id))
          .map((user) => ({
            ...user,
            unreadCount: user?.unreadCount || 0,
            lastMessageDeleted: false,
          }));
        return [...prev, ...newUsers].sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
      });
    }
  }, [data?.users, isSuccess]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFetching || !data?.totalPages) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = container;
      if ((scrollTop + clientHeight) / scrollHeight >= 0.98 && page < (data?.totalPages || 0)) {
        setPage((prev) => prev + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [data?.totalPages, isFetching, page]);

  useEffect(() => {
    if (!socket || !user?.user?._id) return;

    const handleReceiveMessage = (msg) => {
      const isRelated =
        msg.sender === user?.user?._id || msg.receiver === user?.user?._id;
      if (isRelated) {
        const contactId = msg.sender === user?.user?._id ? msg.receiver : msg.sender;
        setAllUsers((prev) => {
          const userExists = prev.some((u) => u?._id === contactId);
          if (!userExists) {
            refetch();
            return prev;
          }
          const updatedUsers = prev.map((u) =>
            u?._id === contactId
              ? {
                ...u,
                lastMessage: msg.content || "No messages",
                lastMessageTime: msg.createdAt || new Date().toISOString(),
                lastMessageDeleted: false,
                unreadCount:
                  msg.receiver === user?.user?._id && u?._id !== selectedUserId
                    ? (u?.unreadCount || 0) + 1
                    : u?.unreadCount || 0,
              }
              : u
          );
          return updatedUsers.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
          });
        });
      }
    };

    const handleMessageUpdated = (updatedMsg) => {
      console.log("messageUpdated received:", updatedMsg);
      const isRelated =
        updatedMsg.sender === user?.user?._id || updatedMsg.receiver === user?.user?._id;
      if (isRelated) {
        const contactId = updatedMsg.sender === user?.user?._id ? updatedMsg.receiver : updatedMsg.sender;
        setAllUsers((prev) => {
          const updatedUsers = prev.map((u) => {
            if (u?._id === contactId) {
              const isLatest =
                !u.lastMessageTime ||
                new Date(updatedMsg.updatedAt).getTime() >= new Date(u.lastMessageTime).getTime();
              if (isLatest) {
                return {
                  ...u,
                  lastMessage: updatedMsg.content || "No messages",
                  lastMessageTime: updatedMsg.updatedAt || u.lastMessageTime || new Date().toISOString(),
                  lastMessageDeleted: updatedMsg.deleted || false,
                };
              }
            }
            return u;
          });
          return updatedUsers.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
          });
        });
      }
    };

    const handleMessageDeleted = (deletedMsg) => {
      console.log("messageDeleted received:", deletedMsg);
      const isRelated =
        deletedMsg.sender === user?.user?._id || deletedMsg.receiver === user?.user?._id;
      if (isRelated) {
        const contactId = deletedMsg.sender === user?.user?._id ? deletedMsg.receiver : deletedMsg.sender;
        setAllUsers((prev) => {
          const updatedUsers = prev.map((u) => {
            if (u?._id === contactId) {
              const isLatest =
                u.lastMessageTime &&
                Math.abs(new Date(u.lastMessageTime).getTime() - new Date(deletedMsg.createdAt).getTime()) <= 1000;
              console.log("isLatest check:", { isLatest, lastMessageTime: u.lastMessageTime, deletedMsgCreatedAt: deletedMsg.createdAt });
              if (isLatest) {
                return {
                  ...u,
                  lastMessage: "This message was deleted",
                  lastMessageTime: deletedMsg.updatedAt || new Date().toISOString(),
                  lastMessageDeleted: true,
                };
              }
            }
            return u;
          });
          return updatedUsers.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
          });
        });
      }
    };

    const handleMessageRead = ({ userId, selectedUserId }) => {
      if (userId === user?.user?._id) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u?._id === selectedUserId
              ? { ...u, unreadCount: 0 }
              : u
          ).sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
          })
        );
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messagesRead", handleMessageRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messagesRead", handleMessageRead);
    };
  }, [socket, user?.user?._id, selectedUserId]);

  useEffect(() => {
    if (selectedUserId && user?.user?._id) {
      (async () => {
        try {
          await markAsRead({
            userId: user?.user?._id,
            selectedUserId: selectedUserId,
          }).unwrap();
        } catch (err) {
          console.error("Failed to mark messages as read:", err);
        }
      })();
    }
  }, [selectedUserId, user?.user?._id, markAsRead]);

  const filteredUsers = allUsers.filter((u) =>
    u?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() || "")
  );

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <div className="w-72 bg-gray-100 border-r h-full flex flex-col p-2">
      <Input
        placeholder="Search users..."
        className="mb-4"
        value={searchTerm || ""}
        onChange={(e) => setSearchTerm(e.target.value || "")}
      />
      <div ref={containerRef} className="space-y-2 overflow-y-scroll" style={{ height: "560px" }}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <UserListItemWithLastMessage
              key={u?._id}
              user={u}
              currentUserId={user?.user?._id}
              selectedUser={selectedUser}
              setSelectedUser={handleUserSelect}
              unreadCount={u?.unreadCount || 0}
            />
          ))
        ) : (
          <p className="text-center text-xs text-gray-500 py-2">
            {searchTerm ? "No users found" : "No users available"}
          </p>
        )}
        {isFetching && (
          <p className="text-center text-xs text-gray-500 py-2">Loading more users...</p>
        )}
      </div>
    </div>
  );
}