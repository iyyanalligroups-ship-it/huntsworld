import { useContext, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  useGetAllUsersQuery,
  useMarkAsReadMutation,
} from "@/redux/api/MessageApi";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSocket } from "@/modules/admin/context/SocketContext";
import UserListItemWithLastMessage from "./helper/UserListItemWithLastMessage";
import { useUnreadCount } from "@/modules/admin/context/UnreadCountContext";

export default function Sidebar({ onSelect }) {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();

  const [page, setPage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const containerRef = useRef(null);
  const { selectedUser, setSelectedUser } = useSelectedUser();
  const [markAsRead] = useMarkAsReadMutation();
  const { setTotalUnread } = useUnreadCount();

  const currentUserId = user?.user?._id;
  const selectedUserId = selectedUser?.user_id?._id || selectedUser?._id;

  const { data, isFetching, isSuccess, refetch } = useGetAllUsersQuery(
    { userId: currentUserId, page, limit: 15 },
    { skip: !currentUserId }
  );


  useEffect(() => {
    if (!isSuccess || !data?.users) return;

    setAllUsers((prev) => {
      const validPrev = (prev || []).filter(Boolean);
      const prevMap = new Map(validPrev.map((u) => [u?._id, u]));

      const validApiUsers = (data?.users || []).filter(Boolean);
      const merged = validApiUsers.map((apiUser) => {
        const local = prevMap.get(apiUser?._id);
        if (!local) {
          return {
            ...apiUser,
            unreadCount: Number(apiUser?.unreadCount) || 0,
            lastMessageDeleted: !!apiUser?.lastMessageDeleted,
          };
        }


        return {
          ...local,
          ...apiUser, 
          unreadCount: local.unreadCount > (apiUser.unreadCount || 0)
            ? local.unreadCount
            : Number(apiUser.unreadCount) || 0,
          lastMessage: local.lastMessageTime > (apiUser.lastMessageTime || "1970")
            ? local.lastMessage
            : apiUser.lastMessage || local.lastMessage,
          lastMessageTime:
            local.lastMessageTime > (apiUser.lastMessageTime || "1970")
              ? local.lastMessageTime
              : apiUser.lastMessageTime,
          lastMessageDeleted: local.lastMessageDeleted ?? !!apiUser.lastMessageDeleted,
        };
      });


      const apiIds = new Set(merged.map((u) => u?._id));
      const extraLocal = validPrev.filter((u) => !apiIds.has(u?._id));

      return [...merged, ...extraLocal].sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
    });
  }, [data?.users, isSuccess]);


  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFetching || page >= (data?.totalPages || 1)) return;

    const handleScroll = () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 120) {
        setPage((p) => p + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isFetching, page, data?.totalPages]);


  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleReceiveMessage = (msg) => {
      if (!msg?._id) return;

      const isFromMe = String(msg.sender) === String(currentUserId);
      const contactId = isFromMe ? msg.receiver : msg.sender;

      setAllUsers((prev) => {
        const validPrev = (prev || []).filter(Boolean);
        const exists = validPrev.some((u) => String(u?._id) === String(contactId));

        if (!exists) {
          refetch();
          return validPrev;
        }

        const updated = validPrev.map((u) =>
          String(u?._id) === String(contactId)
            ? {
                ...u,
                lastMessage: msg.content || "Attachment",
                lastMessageTime: msg.createdAt,
                lastMessageDeleted: false,
                unreadCount:
                  !isFromMe && String(contactId) !== String(selectedUserId)
                    ? (Number(u.unreadCount) || 0) + 1
                    : Number(u.unreadCount) || 0,
              }
            : u
        );

        return updated.sort((a, b) => {
          const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return tb - ta;
        });
      });
    };

    const handleMessageUpdated = (msg) => {
      const contactId = String(msg?.sender) === String(currentUserId) ? msg?.receiver : msg?.sender;

      setAllUsers((prev) => {
        const validPrev = (prev || []).filter(Boolean);
        return validPrev
          .map((u) =>
            String(u?._id) === String(contactId)
              ? {
                  ...u,
                  lastMessage: msg?.deleted ? "This message was deleted" : msg?.content || "Attachment",
                  lastMessageTime: msg?.updatedAt || u.lastMessageTime,
                  lastMessageDeleted: !!msg?.deleted,
                }
              : u
          )
          .sort((a, b) => {
            const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return tb - ta;
          });
      });
    };

    const handleMessageDeleted = (msg) => {
      const contactId = String(msg?.sender) === String(currentUserId) ? msg?.receiver : msg?.sender;

      setAllUsers((prev) => {
        const validPrev = (prev || []).filter(Boolean);
        return validPrev
          .map((u) =>
            String(u?._id) === String(contactId)
              ? {
                  ...u,
                  lastMessage: "This message was deleted",
                  lastMessageTime: msg?.updatedAt || u.lastMessageTime,
                  lastMessageDeleted: true,
                }
              : u
          )
          .sort((a, b) => {
            const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return tb - ta;
          });
      });
    };

    const handleMessagesRead = ({ userId, selectedUserId: readFor }) => {
      if (String(userId) !== String(currentUserId)) return;

      setAllUsers((prev) => {
        const validPrev = (prev || []).filter(Boolean);
        return validPrev.map((u) =>
          String(u?._id) === String(readFor) ? { ...u, unreadCount: 0 } : u
        );
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, currentUserId, selectedUserId, refetch]);

  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;

    markAsRead({ userId: currentUserId, selectedUserId }).unwrap().catch(() => {

    });
  }, [selectedUserId, currentUserId, markAsRead]);

  const filteredUsers = (allUsers || []).filter((u) =>
    u && (u.name || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const handleUserSelect = (u) => {
    setSelectedUser(u);
    if (onSelect) onSelect(u);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="p-8 border-b border-slate-50 bg-white">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
        <div className="relative group">
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 rounded-xl"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto sidebar-scrollbar p-2"
      >
        {filteredUsers.length > 0 ? (
          <div className="space-y-1">
            {filteredUsers.map((u) => (
              <UserListItemWithLastMessage
                key={u?._id || Math.random()}
                user={u}
                currentUserId={currentUserId}
                selectedUser={selectedUser}
                onSelect={handleUserSelect}
                unreadCount={u.unreadCount || 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-slate-900 font-semibold mb-1">
              {searchTerm ? "No results found" : "No messages yet"}
            </p>
            <p className="text-slate-500 text-sm">
              {searchTerm ? `We couldn't find any users matching "${searchTerm}"` : "Active conversations will appear here."}
            </p>
          </div>
        )}

        {isFetching && page > 1 && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
