import { Smile, Paperclip, Mic, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // ✅ ShadCN Button
import { useContext, useEffect, useState } from "react";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSendMessageMutation, useMarkAsReadMutation } from "@/redux/api/MessageApi";
import ChatAttachmentUploader from "./helper/ChatAttachmentUploader";
import EmojiPicker from "emoji-picker-react";
import AudioUpload from "./helper/AudioUpload";

export default function MessageInput({ onTyping, onStopTyping }) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const { selectedUser } = useSelectedUser();
  const [sendMessageToDB] = useSendMessageMutation();
  const [markAsRead] = useMarkAsReadMutation();

  // Typing effect
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

  // Join chat room + mark as read
  useEffect(() => {
    if (user?.user?._id && selectedUser?._id) {
      socket?.emit("joinChatRoom", {
        userId: user?.user?._id,
        selectedUserId: selectedUser._id,
      });

      const markMessagesAsRead = async () => {
        try {
          const payload = {
            userId: user?.user?._id,
            selectedUserId: selectedUser._id,
          };
          await markAsRead(payload).unwrap();
        } catch (err) {
          console.error("❌ Failed to mark messages as read", err);
        }
      };

      markMessagesAsRead();
    }
  }, [user?.user?._id, selectedUser?._id, socket, markAsRead]);

  // Send message
  const handleSend = async () => {
    if (!content.trim() || !selectedUser || !user?.user?._id) return;

    const messageData = {
      sender: user.user._id,
      receiver: selectedUser._id,
      content,
    };

    // 1. Emit via socket
    socket?.emit("sendMessage", {
      ...messageData,
      fromMe: true,
    });
    onStopTyping?.();

    // 2. Save to DB
    try {
      await sendMessageToDB(messageData).unwrap();
    } catch (error) {
      console.error("Failed to save message:", error);
    }

    setContent(""); // Clear input
  };

  // Emoji picker
  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  // Audio upload
  const handleAudioUploadComplete = async (audioUrl) => {
    if (!audioUrl || !user?.user?._id || !selectedUser?._id) return;

    const messageData = {
      sender: user.user._id,
      receiver: selectedUser._id,
      content: audioUrl,
    };

    socket?.emit("sendMessage", { ...messageData, fromMe: true });

    try {
      await sendMessageToDB(messageData).unwrap();
    } catch (err) {
      console.error("❌ Error saving audio message", err);
    }
  };

  return (
    <div className="p-4 border-t bg-white flex items-center gap-2 relative">
      {/* Emoji button */}
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
        <Smile size={20} />
      </button>

      {/* Emoji picker popup */}
      {showEmojiPicker && (
        <div
          style={{
            position: "absolute",
            left: "10px",
            bottom: "60px",
            zIndex: 10,
          }}
        >
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* File uploader */}
      <ChatAttachmentUploader />

      {/* Message input */}
      <Input
        placeholder="e.g. Type a message..."
        className="flex-1 border-2 border-slate-300"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      {/* ✅ ShadCN Send button */}
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!content.trim()}
        className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
      >
        <Send size={18} />
      </Button>

      {/* Audio Upload */}
      <AudioUpload
        senderId={user?.user?._id}
        receiverId={selectedUser?._id}
        onUploadComplete={handleAudioUploadComplete}
      />
    </div>
  );
}
