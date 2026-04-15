import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import UserListItem from "../UserListItem";
import { useEffect } from "react";

export default function UserListItemWithLastMessage({
  user,
  currentUserId,
  selectedUser,
  setSelectedUser,
  unreadCount,
}) {
  const { data: lastMsgData, isLoading, refetch } = useGetLastMessageBetweenUsersQuery(
    {
      userId: currentUserId,
      contactId: user._id,
    },
    {
      skip: !currentUserId || !user._id,
    }
  );

  console.log("lastMsgData:", lastMsgData); // Debug log
  console.log("selectedUser:", selectedUser, "user._id:", user._id); // Debug log

  // Prioritize user.lastMessageDeleted and lastMsgData?.deleted
  const lastMessage = user.lastMessageDeleted || lastMsgData?.deleted
    ? "This message was deleted"
    : user.lastMessage !== undefined && user.lastMessage !== null
      ? user.lastMessage
      : (isLoading ? "Loading..." : lastMsgData?.lastMessage || "No messages");
  const lastMessageTime = user.lastMessageTime || (lastMsgData?.timestamp || "");

  // Refetch when lastMessage is null and not deleted
  useEffect(() => {
    if (!user.lastMessage && !user.lastMessageDeleted && !isLoading && !lastMsgData) {
      refetch();
    }
  }, [user.lastMessage, user.lastMessageDeleted, isLoading, lastMsgData, refetch]);

  // Handle both selectedUser._id and selectedUser.user_id._id
  const isActive = selectedUser?._id === user._id || selectedUser?.user_id?._id === user._id;

  return (
    <div onClick={() => setSelectedUser(user)}>
      <UserListItem
        user={{
          ...user,
          lastMessage,
          lastMessageTime,
          unreadCount: unreadCount || user.unreadCount || 0,
        }}
        isActive={isActive}
      />
    </div>
  );
}