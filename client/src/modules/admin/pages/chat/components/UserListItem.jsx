// src/modules/admin/components/chat/UserListItem.jsx (or wherever your UserListItem is)
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Image, Video, Music, File, Ban } from "lucide-react";
import { useSocket } from "@/modules/admin/context/SocketContext";

/* -----------------------------
   UPDATED getMessageType()
   Detects images, videos, audio, documents, HTML (requirement request)
-------------------------------- */
const getMessageType = (content) => {
  if (!content) return "text";

  // Detect HTML content first (Requirement Request)
  const isHTML = /<\/?[a-z][\s\S]*>/i.test(content);
  if (isHTML) return "html";

  const extension = content?.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (["mp4", "mov", "webm"].includes(extension)) return "video";
  if (["mp3", "wav", "ogg", "webm"].includes(extension)) return "audio";
  if (["pdf"].includes(extension)) return "pdf";
  if (["txt", "md"].includes(extension)) return "textFile";

  return "text";
};

export default function UserListItem({ user, isActive }) {
  const { onlineUsers } = useSocket();
  const isOnline = onlineUsers?.includes(user?._id?.toString());
  const lastMsg = user?.lastMessage || "";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative",
        isActive
          ? "bg-indigo-50 shadow-sm ring-1 ring-indigo-100"
          : "hover:bg-slate-50"
      )}
    >
      {/* Avatar Section */}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={user?.profile_pic} alt={user?.name} className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-lg">
            {user?.name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Online Status Dot */}
        {isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 min-w-0 py-0.5">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex flex-col min-w-0">
            <span className={cn(
              "font-bold truncate tracking-tight transition-colors",
              isActive ? "text-indigo-900" : "text-slate-900",
              user?.unreadCount > 0 && !isActive ? "font-black" : ""
            )}>
              {user?.name}
            </span>
            {(user?.company_name || user?.college_name || user?.shop_name) && (
              <span className="text-[11px] font-medium text-indigo-600/80 truncate leading-tight">
                {user.company_name || user.college_name || user.shop_name}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap ml-2">
            {user?.lastMessageTime
              ? new Date(user.lastMessageTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : ""}
          </span>
        </div>

        {/* Message Preview */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-xs truncate flex items-center gap-1.5",
            user?.unreadCount > 0 && !isActive ? "text-slate-900 font-bold" : "text-slate-500"
          )}>
            {(() => {
              if (
                user?.lastMessageDeleted ||
                lastMsg.toLowerCase() === "this message was deleted"
              ) {
                return (
                  <>
                    <Ban className="w-3 h-3 text-red-500/70" />
                    <span className="italic opacity-80 text-[11px]">Message deleted</span>
                  </>
                );
              }

              const type = getMessageType(lastMsg);

              switch (type) {
                case "image": return <><Image className="w-3.5 h-3.5" /> <span className="text-[11px]">Photo</span></>;
                case "video": return <><Video className="w-3.5 h-3.5" /> <span className="text-[11px]">Video</span></>;
                case "audio": return <><Music className="w-3.5 h-3.5" /> <span className="text-[11px]">Voice note</span></>;
                case "pdf":
                case "textFile": return <><File className="w-3.5 h-3.5" /> <span className="text-[11px]">Document</span></>;
                case "html": return <><File className="w-3.5 h-3.5 text-indigo-500" /> <span className="text-[11px] text-indigo-600 font-semibold italic">Requirement Request</span></>;
                default: return <span className="truncate leading-relaxed">{lastMsg || "No messages yet"}</span>;
              }
            })()}
          </span>

          {user?.unreadCount > 0 && (
            <div className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm ring-2 ring-white">
              {user.unreadCount > 99 ? "99+" : user.unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full shadow-lg shadow-indigo-200"></div>
      )}
    </div>
  );
}
