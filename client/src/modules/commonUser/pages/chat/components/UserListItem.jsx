
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Image, Video, Music, File } from "lucide-react";
import { useSocket } from "@/modules/admin/context/SocketContext";
const getMessageType = (content) => {
  const extension = content?.split(".").pop()?.toLowerCase();
  if (!extension) return "text";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (["mp4", "mov", "webm"].includes(extension)) return "video";
  if (["mp3", "wav", "ogg", "webm"].includes(extension)) return "audio";
  if (["pdf"].includes(extension)) return "pdf";
  if (["txt", "md"].includes(extension)) return "textFile";
  return "text";
};

export default function UserListItem({ user, isActive }) {
  console.log(user, "user");
  const { onlineUsers, lastSeenMap } = useSocket();
const isOnline = onlineUsers.includes(user?._id?.toString());

  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors",
        isActive ? "bg-blue-100" : "hover:bg-gray-200"
      )}
    >
      <Avatar className="relative">
        <AvatarImage src={user.profile_pic} alt={user.name} />
        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </Avatar>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{user?.name}</span>
          {user.unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {user.unreadCount}
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-500 truncate">
          {(() => {
            const msg = user?.lastMessage?.toLowerCase() || "";
            if (msg.endsWith(".jpg") || msg.endsWith(".jpeg") || msg.endsWith(".png") || msg.endsWith(".gif") || msg.endsWith(".webp")) {
              return (
                <>
                  <Image className="inline-block w-4 h-4 mr-1" /> Photo
                </>
              );
            } else if (msg.endsWith(".mp4") || msg.endsWith(".webm") || msg.endsWith(".mov")) {
              return (
                <>
                  <Video className="inline-block w-4 h-4 mr-1" /> Video
                </>
              );
            } else if (msg.endsWith(".mp3") || msg.endsWith(".wav") || msg.endsWith(".ogg")) {
              return (
                <>
                  <Music className="inline-block w-4 h-4 mr-1" /> Audio
                </>
              );
            } else if (msg.endsWith(".pdf") || msg.endsWith(".txt") || msg.endsWith(".doc") || msg.endsWith(".docx")) {
              return (
                <>
                  <File className="inline-block w-4 h-4 mr-1" /> Document
                </>
              );
            }
            return user.lastMessage;
          })()}
        </span>
      </div>

      <div className="text-xs text-gray-400 whitespace-nowrap">
        {user?.lastMessageTime
          ? new Date(user.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : ""}
      </div>

      <div className="flex items-center space-x-1">
        {user?.lastMessage && (
          (() => {
            const type = getMessageType(user.lastMessage);
            switch (type) {
              case "image":
                return <Image className="text-gray-500" size={16} />;
              case "video":
                return <Video className="text-gray-500" size={16} />;
              case "audio":
                return <Music className="text-gray-500" size={16} />;
              case "pdf":
              case "textFile":
                return <File className="text-gray-500" size={16} />;
              default:
                return null;
            }
          })()
        )}
      </div>
    </div>
  );
}
