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
import AudioUpload from "./helper/AudioUpload";
import showToast from '@/toast/showToast';

export default function MessageInput({ onTyping, onStopTyping, setMessages }) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useContext(AuthContext);
  const { socketRef } = useSocket();
  const socket = socketRef?.current;
  const { selectedUser } = useSelectedUser();
  const [sendMessageToDB] = useSendMessageMutation();
  const [markAsRead] = useMarkAsReadMutation();

  const chatPartnerId = selectedUser?.user_id?._id || selectedUser?._id;
  const senderId = user?.user?._id;

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
      createdAt: new Date().toISOString(),
      _id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      fromMe: true,
      read: false,
      isOptimistic: true, // Flag to identify optimistic update
    };
    socket?.emit("sendMessage", messageData);

    // Optimistic update
    if (typeof setMessages === 'function') {
      setMessages((prev) => [...prev, messageData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } else {
      console.warn("setMessages is not a function, skipping optimistic update");
    }

    try {
      const response = await sendMessageToDB({
        sender: senderId,
        receiver: chatPartnerId,
        content: content.trim(),
      }).unwrap();

      if (response.isOneTimeMessage) {
        showToast(
          "This is your one-time message. Subscribe to send more messages.",
          "info"
        );
      } else {
        showToast("Message sent successfully", "success");
      }

      // Update message with server response
      if (typeof setMessages === 'function') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageData._id
              ? { ...msg, _id: response._id, createdAt: response.createdAt, isOptimistic: false }
              : msg
          ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }

      setContent("");
      onStopTyping?.();
    } catch (error) {
      console.error("Failed to save message:", error);
      // Revert optimistic update
      if (typeof setMessages === 'function') {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageData._id));
      }
      const errorMessage = error?.data?.error || "Failed to send message";
      showToast(errorMessage, "error");
    }
  };

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  const handleAttachmentUploadComplete = async (fileUrls) => {
    if (!fileUrls?.length || !senderId || !chatPartnerId) {
      console.error("Missing required fields for attachment upload:", {
        fileUrls,
        senderId,
        chatPartnerId,
      });
      showToast("Failed to send attachment", "error");
      return;
    }

    // Optimistic update for each file URL
    const tempMessages = fileUrls.map((url, index) => ({
      sender: senderId,
      receiver: chatPartnerId,
      content: url,
      createdAt: new Date(Date.now() + index).toISOString(), // Unique timestamps
      _id: `temp-${Date.now() + index}`, // Unique temporary ID
      fromMe: true,
      read: false,
      isOptimistic: true, // Flag to identify optimistic update
    }));

    tempMessages.forEach(msg => socket?.emit("sendMessage", msg));

    if (typeof setMessages === 'function') {
      setMessages((prev) => [...prev, ...tempMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } else {
      console.warn("setMessages is not a function, skipping optimistic update");
    }

    try {
      // Send each file URL as a separate message
      const responses = await Promise.all(
        fileUrls.map((url) =>
          sendMessageToDB({
            sender: senderId,
            receiver: chatPartnerId,
            content: url,
          }).unwrap()
        )
      );

      // Update messages with server response
      if (typeof setMessages === 'function') {
        setMessages((prev) =>
          prev.map((msg) => {
            const response = responses.find((res, idx) => msg._id === tempMessages[idx]?._id);
            if (response) {
              return { ...msg, _id: response._id, createdAt: response.createdAt, isOptimistic: false };
            }
            return msg;
          }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }

      showToast(`${fileUrls.length} file(s) sent successfully`, "success");
    } catch (err) {
      console.error("❌ Error saving attachment messages", err);
      // Revert optimistic updates
      if (typeof setMessages === 'function') {
        setMessages((prev) => prev.filter((msg) => !tempMessages.some((temp) => temp._id === msg._id)));
      }
      showToast("Failed to send attachment", "error");
    }
  };

  const handleAudioUploadComplete = async (audioUrl) => {
    if (!audioUrl || !senderId || !chatPartnerId) {
      console.error("Missing required fields for audio upload:", {
        audioUrl,
        senderId,
        chatPartnerId,
      });
      showToast("Failed to send audio message", "error");
      return;
    }

    const messageData = {
      sender: senderId,
      receiver: chatPartnerId,
      content: audioUrl,
      createdAt: new Date().toISOString(),
      _id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      fromMe: true,
      read: false,
      isOptimistic: true, // Flag to identify optimistic update
    };
    socket?.emit("sendMessage", messageData);

    // Optimistic update
    if (typeof setMessages === 'function') {
      setMessages((prev) => [...prev, messageData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } else {
      console.warn("setMessages is not a function, skipping optimistic update");
    }

    try {
      const response = await sendMessageToDB({
        sender: senderId,
        receiver: chatPartnerId,
        content: audioUrl,
      }).unwrap();

      if (typeof setMessages === 'function') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageData._id
              ? { ...msg, _id: response._id, createdAt: response.createdAt, isOptimistic: false }
              : msg
          ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }

      showToast("Audio message sent successfully", "success");
    } catch (err) {
      console.error("❌ Error saving audio message", err);
      if (typeof setMessages === 'function') {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageData._id));
      }
      showToast("Failed to send audio message", "error");
    }
  };

  return (
    <div className="p-4 border-t bg-white flex items-center gap-2 relative">
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
        <Smile size={20} />
      </button>

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

      <ChatAttachmentUploader
        senderId={senderId}
        receiverId={chatPartnerId}
        onUploadComplete={handleAttachmentUploadComplete}
      />

      <Input
        placeholder="Type a message..."
        className="flex-1"
        value={content}
        onChange={(e) => setContent(e?.target?.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      <Button
        size="icon"
        onClick={handleSend}
        disabled={!content.trim()}
        className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
      >
        <Send size={18} />
      </Button>

      <AudioUpload
        senderId={senderId}
        receiverId={chatPartnerId}
        onUploadComplete={handleAudioUploadComplete}
      />
    </div>
  );
}