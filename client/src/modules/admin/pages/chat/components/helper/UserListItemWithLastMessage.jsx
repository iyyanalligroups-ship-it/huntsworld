
import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import UserListItem from "../UserListItem";
import { useEffect } from "react";

export default function UserListItemWithLastMessage({
  user,
  currentUserId,
  selectedUser,
  onSelect, 
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

  const lastMessage = user.lastMessageDeleted || lastMsgData?.deleted
    ? "This message was deleted"
    : user.lastMessage !== undefined && user.lastMessage !== null
      ? user.lastMessage
      : (isLoading ? "Loading..." : lastMsgData?.lastMessage || "No messages");

  const lastMessageTime = user.lastMessageTime || lastMsgData?.timestamp || "";

  const lastMessageDeleted = user.lastMessageDeleted || lastMsgData?.deleted || false;

 
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