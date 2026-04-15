// src/modules/admin/components/chat/helper/UserListItemWithLastMessage.jsx
import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import UserListItem from "../UserListItem"; // Adjust path if needed: "../UserListItem" or "./UserListItem"
import { useEffect } from "react";

export default function UserListItemWithLastMessage({
  user,
  currentUserId,
  selectedUser,
  onSelect, // or setSelectedUser if you pass it directly
  unreadCount,
}) {
  const { data: lastMsgData, isLoading, refetch } = useGetLastMessageBetweenUsersQuery(
    {
      userId: currentUserId,
      contactId: user?._id,
    },
    {
      skip: !currentUserId || !user?._id,
    }
  );

  // Determine the actual last message and time (fallback to API if local user prop is incomplete)
  const lastMessage = user.lastMessageDeleted || lastMsgData?.deleted
    ? "This message was deleted"
    : user.lastMessage !== undefined && user.lastMessage !== null
      ? user.lastMessage
      : (isLoading ? "Loading..." : lastMsgData?.lastMessage || "No messages");

  const lastMessageTime = user.lastMessageTime || lastMsgData?.timestamp || "";

  const lastMessageDeleted = user.lastMessageDeleted || lastMsgData?.deleted || false;

  // Refetch if local data seems incomplete
  useEffect(() => {
    if (!user.lastMessage && !user.lastMessageDeleted && !isLoading && !lastMsgData) {
      refetch();
    }
  }, [user.lastMessage, user.lastMessageDeleted, isLoading, lastMsgData, refetch]);

  const isActive = selectedUser?._id === user?._id || selectedUser?.user_id?._id === user?._id;

  return (
    <div onClick={() => onSelect(user)}>
      <UserListItem
        user={{
          ...user,
          lastMessage,
          lastMessageTime,
          lastMessageDeleted,
          unreadCount: unreadCount || user.unreadCount || 0,
        }}
        isActive={isActive}
      />
    </div>
  );
}