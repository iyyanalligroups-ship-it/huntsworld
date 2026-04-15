// import { useContext, useEffect, useRef, useState } from "react";
// import { Input } from "@/components/ui/input";
// import { useGetAllUsersQuery } from "@/redux/api/MessageApi";
// import UserListItem from "./UserListItem";
// import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
// import { useMarkAsReadMutation ,useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";  // Import the mutation hook
// import { AuthContext } from "@/modules/landing/context/AuthContext";

// export default function Sidebar() {
//   const {user}=useContext(AuthContext);
//   const [page, setPage] = useState(1);
//   const [allUsers, setAllUsers] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const containerRef = useRef(null);
//   const { selectedUser, setSelectedUser } = useSelectedUser();
//   const { data, isFetching, isSuccess } = useGetAllUsersQuery({ page, limit: 10 });

//   // Import the RTK Query mutation hook
//   const [markAsRead, { isLoading: isMarkingRead }] = useMarkAsReadMutation();

//   // Update user list when new data is fetched
//   useEffect(() => {
//     if (isSuccess && data?.users) {
//       setAllUsers((prev) => {
//         const existingIds = new Set(prev.map((user) => user._id));
//         const newUsers = data.users.filter((user) => !existingIds.has(user._id));
//         return [...prev, ...newUsers];
//       });
//     }
//   }, [data, isSuccess]);

//   // Handle infinite scroll
//   useEffect(() => {
//     const handleScroll = () => {
//       const container = containerRef.current;
//       if (!container || isFetching) return;

//       const scrollHeight = container.scrollHeight;
//       const scrollTop = container.scrollTop;
//       const clientHeight = container.clientHeight;

//       const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

//       if (scrollPercentage >= 0.98 && data?.hasMore) {
//         setPage((prev) => prev + 1);
//       }
//     };

//     const container = containerRef.current;
//     if (container) container.addEventListener("scroll", handleScroll);
//     return () => {
//       if (container) container.removeEventListener("scroll", handleScroll);
//     };
//   }, [data?.hasMore, isFetching]);

//   // Filter users based on the search term
//   const filteredUsers = allUsers.filter((user) =>
//     user.name?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Mark messages as read when the selected user changes
//   useEffect( () => {
//     if (selectedUser && user) {

//       const markMessagesAsRead = async () => {
//         try {
//           const payload = {
//             userId: user?.user?._id,
//             selectedUserId: selectedUser._id,
//           };
//           const res = await markAsRead(payload).unwrap();
//           console.log("✅ Messages marked as read", res);
//         } catch (err) {
//           console.error("❌ Failed to mark messages as read", err);
//         }
//       };

//       markMessagesAsRead(); // Assuming markAsRead is a function that triggers an API call
//     }
//   }, [selectedUser, user, markAsRead]);


//   // Handle user selection and mark messages as read
//   const handleUserClick = (user) => {
//     setSelectedUser(user);
//     markAsRead(user._id); // Mark as read when the user is clicked
//   };

//   return (
//     <div className="w-72 bg-gray-100 border-r h-full flex flex-col p-2">
//       <Input
//         placeholder="Search users..."
//         className="mb-4"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//       />
//        <div ref={containerRef} className="space-y-2 overflow-y-scroll" style={{ height: "560px" }}>
//         {filteredUsers.map((u) => {
//           const { data: lastMsgData } = useGetLastMessageBetweenUsersQuery(
//             {
//               userId: user?.user?._id,
//               contactId: u._id,
//             },
//             { skip: !user?.user?._id || !u._id }
//           );

//           return (
//             <div key={u._id} onClick={() => setSelectedUser(u)}>
//               <UserListItem
//                 user={{
//                   ...u,
//                   lastMessage: lastMsgData?.lastMessage || "Last message...",
//                   lastMessageTime: lastMsgData?.timestamp || "",
//                 }}
//                 isActive={selectedUser?._id === u._id}
//               />
//             </div>
//           );
//         })}
//         {isFetching && (
//           <p className="text-center text-xs text-gray-500 py-2">Loading more users...</p>
//         )}
//       </div>

//     </div>
//   );
// }



import { useContext, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useGetAllUsersQuery, useMarkAsReadMutation } from "@/redux/api/MessageApi";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSocket } from "@/modules/admin/context/SocketContext";
import UserListItemWithLastMessage from "./helper/UserListItemWithLastMessage";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const [page, setPage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const { selectedUser, setSelectedUser } = useSelectedUser();
  const [markAsRead] = useMarkAsReadMutation();

  const { data, isFetching, isSuccess, refetch } = useGetAllUsersQuery({
    userId: user?.user?._id,
    page,
    limit: 10,
  });

  // Merge new users into the list (avoiding duplicates)
  useEffect(() => {
    if (isSuccess && data?.users?.length) {
      setAllUsers((prev) => {
        const existingIds = new Set(prev.map((user) => user._id));
        const newUsers = data.users.filter((user) => !existingIds.has(user._id));
        return [...prev, ...newUsers];
      });
    }
  }, [data, isSuccess]);

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isFetching || !data?.totalPages) return;

      const { scrollTop, clientHeight, scrollHeight } = container;
      if ((scrollTop + clientHeight) / scrollHeight >= 0.98 && page < data.totalPages) {
        setPage((prev) => prev + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [data?.totalPages, isFetching, page]);

  // Socket listeners: receive new messages, updates, and deletions
  useEffect(() => {
    if (!socket || !user?.user?._id) return;

    const currentUserId = user.user._id;

    const handleReceiveMessage = (msg) => {
      const isRelated = msg.sender === currentUserId || msg.receiver === currentUserId;
      if (isRelated) {
        const contactId = msg.sender === currentUserId ? msg.receiver : msg.sender;
        setAllUsers((prev) => {
          const userExists = prev.some((u) => u?._id === contactId);
          if (!userExists) {
            refetch();
            return prev;
          }
          const updatedUsers = prev.map((u) =>
            u._id === contactId
              ? {
                ...u,
                unreadCount:
                  msg.receiver === currentUserId && u._id !== selectedUser?._id
                    ? (u.unreadCount || 0) + 1
                    : u.unreadCount || 0,
                lastMessage: msg.content || "Attachment",
                lastMessageTime: msg.createdAt,
                lastMessageDeleted: false,
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

    const handleMessageUpdated = (msg) => {
      const contactId = msg.sender === currentUserId ? msg.receiver : msg.sender;
      setAllUsers((prev) => {
        const updatedUsers = prev.map((u) =>
          u._id === contactId
            ? {
              ...u,
              lastMessage: msg.deleted ? "This message was deleted" : msg.content || "Attachment",
              lastMessageTime: msg.updatedAt || u.lastMessageTime,
              lastMessageDeleted: !!msg.deleted,
            }
            : u
        );
        return updatedUsers.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
      });
    };

    const handleMessageDeleted = (msg) => {
      const contactId = msg.sender === currentUserId ? msg.receiver : msg.sender;
      setAllUsers((prev) => {
        const updatedUsers = prev.map((u) =>
          u._id === contactId
            ? {
              ...u,
              lastMessage: "This message was deleted",
              lastMessageTime: msg.updatedAt || u.lastMessageTime,
              lastMessageDeleted: true,
            }
            : u
        );
        return updatedUsers.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
      });
    };

    const handleMessageRead = ({ userId, selectedUserId }) => {
      if (userId === currentUserId) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u._id === selectedUserId ? { ...u, unreadCount: 0 } : u
          )
        );
        refetch(); // Refetch users to sync unread counts
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
  }, [socket, user?.user?._id, selectedUser?._id, refetch]);

  // Mark messages as read when selected user changes
  useEffect(() => {
    if (selectedUser?._id && user?.user?._id) {
      (async () => {
        try {
          await markAsRead({
            userId: user.user._id,
            selectedUserId: selectedUser._id,
          }).unwrap();
          refetch();
        } catch (err) {
          console.error("Failed to mark messages as read:", err);
        }
      })();
    }
  }, [selectedUser?._id]);

  // Filter by name
  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-72 bg-gray-100 border-r h-full flex flex-col p-2">
      <Input
        placeholder="e.g. Search customers..."
        className="mb-4 border-2 border-slate-300"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div ref={containerRef} className="space-y-2 overflow-y-scroll" style={{ height: "560px" }}>
        {filteredUsers.map((u) => (
          <UserListItemWithLastMessage
            key={u._id}
            user={u}
            currentUserId={user?.user?._id}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            unreadCount={u.unreadCount || 0}
          />
        ))}
        {isFetching && (
          <p className="text-center text-xs text-gray-500 py-2">Loading more users...</p>
        )}
      </div>
    </div>
  );
}
