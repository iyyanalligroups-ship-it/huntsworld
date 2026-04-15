import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import UserListItem from "../UserListItem";

export default function UserListItemWithLastMessage({
  user,
  currentUserId,
  selectedUser,
  setSelectedUser,
  unreadCount
}) {
  const { data: lastMsgData, isLoading } = useGetLastMessageBetweenUsersQuery(
    {
      userId: currentUserId,
      contactId: user._id,
    },
    {
      skip: !currentUserId || !user._id,
    }
  );


  const lastMessage = user.lastMessageDeleted || lastMsgData?.deleted
    ? "This message was deleted"
    : user.lastMessage !== undefined && user.lastMessage !== null
      ? user.lastMessage
      : (isLoading ? "Loading..." : lastMsgData?.lastMessage || "No messages");
  const lastMessageTime = user.lastMessageTime || (lastMsgData?.timestamp || "");

  return (
    <div onClick={() => setSelectedUser(user)}>
      <UserListItem
        user={{
          ...user,
          lastMessage,
          lastMessageTime,
          unreadCount: unreadCount || user.unreadCount || 0,
        }}
        isActive={selectedUser?._id === user._id}
      />
    </div>
  );
}
