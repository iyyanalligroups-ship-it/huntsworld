import { Smile, Paperclip, Mic, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useContext, useEffect, useState } from "react";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSendMessageMutation, useMarkAsReadMutation } from "@/redux/api/MessageApi";
import ChatAttachmentUploader from "./helper/ChatAttachmentUploader";
import EmojiPicker from "emoji-picker-react";
import { cn } from "@/lib/utils";
import showToast from '@/toast/showToast';

export default function MessageInput({ onTyping, onStopTyping }) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const { selectedUser } = useSelectedUser();
  const [sendMessageToDB] = useSendMessageMutation();
  const [markAsRead] = useMarkAsReadMutation();

  const chatPartnerId = selectedUser?.user_id?._id || selectedUser?._id;
  const senderId = user?.user?._id; // ✅ Extract senderId

  useEffect(() => {
    if (!content) {
      onStopTyping?.();
      return;
    }
    onTyping?.();
    const timeout = setTimeout(() => {
      onStopTyping?.();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [content, onTyping, onStopTyping]);

  useEffect(() => {
    if (senderId && chatPartnerId) {
      socket?.emit("joinChatRoom", {
        userId: senderId,
        selectedUserId: chatPartnerId,
      });

      const markMessagesAsRead = async () => {
        try {
          const payload = {
            userId: senderId,
            selectedUserId: chatPartnerId,
          };
          await markAsRead(payload).unwrap();
        } catch (err) {
          console.error("❌ Failed to mark messages as read", err);
        }
      };

      markMessagesAsRead();
    }
  }, [senderId, chatPartnerId, socket, markAsRead]);

  const handleSend = async () => {
    if (!content.trim() || !chatPartnerId || !senderId) {
      console.error("Missing required fields for sending message:", {
        content: content?.trim(),
        chatPartnerId,
        senderId,
      });
      showToast("Please enter a message and select a recipient", "error");
      return;
    }

    const messageData = {
      sender: senderId,
      receiver: chatPartnerId,
      content: content.trim(),
    };

    console.log("Sending message data:", messageData);
    socket?.emit("sendMessage", messageData);

    try {
      const response = await sendMessageToDB(messageData).unwrap();
      if (response.isOneTimeMessage) {
        showToast(
          "This is your one-time message. Subscribe to send more messages.",
          "info"
        );
      } else {
        // showToast("Message sent successfully", "success");
      }
      setContent("");
      onStopTyping?.();
    } catch (error) {
      console.error("Failed to save message:", error);
      const errorMessage = error?.data?.error || "Failed to send message";
      showToast(errorMessage, "error");
    }
  };

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  // ✅ NEW: Handle File Upload Complete (Send each file as a message)
  const handleFileUploadComplete = async (fileUrls) => {
    console.log("Files uploaded, sending as messages:", fileUrls);
    if (!fileUrls?.length || !senderId || !chatPartnerId) {
      console.error("Missing required fields for file messages:", {
        fileUrls,
        senderId,
        chatPartnerId,
      });
      showToast("Failed to send file messages", "error");
      return;
    }

    try {
      // Send each file URL as a separate message
      for (const fileUrl of fileUrls) {
        const messageData = {
          sender: senderId,
          receiver: chatPartnerId,
          content: fileUrl, // File URL as message content
        };
        socket?.emit("sendMessage", messageData);
        await sendMessageToDB(messageData).unwrap();
      }
      // showToast(`${fileUrls.length} file(s) sent successfully`, "success");
    } catch (err) {
      console.error("❌ Error saving file messages", err);
      showToast("Failed to send file messages", "error");
    }
  };



  return (
    <div className="flex items-end gap-2 bg-white p-2 lg:p-3 relative">
      <div className="flex items-center gap-1 mb-1">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "p-2 rounded-xl transition-all duration-200",
            showEmojiPicker ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          )}
        >
          <Smile size={22} strokeWidth={2.5} />
        </button>

        {showEmojiPicker && (
          <div className="absolute left-4 bottom-20 z-50 shadow-2xl border border-slate-100 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <ChatAttachmentUploader
          senderId={senderId}
          receiverId={chatPartnerId}
          onUploadComplete={handleFileUploadComplete}
        />
      </div>

      <div className="flex-1 relative group">
        <Input
          placeholder="Type your message..."
          className="w-full bg-slate-50 border-slate-100 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-200 rounded-[20px] py-6 px-5 text-[15px] font-medium placeholder:text-slate-400 border-none shadow-inner"
          value={content}
          onChange={(e) => setContent(e?.target?.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
      </div>

      <div className="flex items-center gap-2 mb-1">


        <Button
          size="icon"
          onClick={handleSend}
          disabled={!content.trim()}
          className={cn(
            "h-12 w-12 rounded-[18px] transition-all duration-300 shadow-lg",
            content.trim()
              ? "bg-slate-900 hover:bg-slate-800 text-white translate-y-0 opacity-100 shadow-indigo-200"
              : "bg-slate-100 text-slate-300 translate-y-1 opacity-50 shadow-none pointer-events-none"
          )}
        >
          <Send size={20} strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}