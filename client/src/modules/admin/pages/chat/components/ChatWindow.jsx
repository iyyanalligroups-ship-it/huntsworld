import { useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import MessageInput from "./MessageInput";
import {
  Edit,
  MoreHorizontal,
  Trash2,
  MessageSquare,
  Download,
  ChevronDown,
  Ban,
  FileText,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetMessagesQuery,
  useDeleteMessageMutation,
  useUpdateMessageMutation,
} from "@/redux/api/MessageApi";
import showToast from "@/toast/showToast";
import CustomAudioPlayer from "./helper/CustomAudioPlayer";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

function groupMessagesByDate(messages) {
  const grouped = {};
  messages.forEach((msg) => {
    const date = dayjs(msg.createdAt);
    const key = date.isToday()
      ? "Today"
      : date.isYesterday()
        ? "Yesterday"
        : date.format("DD MMM YYYY");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(msg);
  });
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  });
  const sortedGrouped = {};
  Object.keys(grouped)
    .sort((a, b) => {
      const dateA =
        a === "Today"
          ? new Date()
          : a === "Yesterday"
            ? new Date(Date.now() - 86400000)
            : new Date(a);
      const dateB =
        b === "Today"
          ? new Date()
          : b === "Yesterday"
            ? new Date(Date.now() - 86400000)
            : new Date(b);
      return dateA - dateB;
    })
    .forEach((key) => {
      sortedGrouped[key] = grouped[key];
    });
  return sortedGrouped;
}

export default function ChatWindow() {
  const { socket } = useSocket();
  const { selectedUser } = useSelectedUser();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [editMessage, setEditMessage] = useState(null);
  const [atBottom, setAtBottom] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [editMessageId, setEditMessageId] = useState(null);
  const messageContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const [opponentTyping, setOpponentTyping] = useState(false);

  const chatPartnerId = selectedUser?.user_id?._id || selectedUser?._id;

  const pageSize = 10;
  const [pageBottom, setPageBottom] = useState(1);
  const [pageTop, setPageTop] = useState(0);
  const [hasMoreBottom, setHasMoreBottom] = useState(true);
  const [hasMoreTop, setHasMoreTop] = useState(true);
  const maxMessages = 95;

  const {
    data: bottomData,
    isSuccess: isBottomSuccess,
    isFetching: isFetchingBottom,
    refetch: refetchBottom,
  } = useGetMessagesQuery(
    {
      userId: user?.user?._id,
      chatPartnerId: chatPartnerId,
      page: pageBottom,
      pageSize,
    },
    { skip: !chatPartnerId }
  );

  const {
    data: topData,
    isSuccess: isTopSuccess,
    isFetching: isFetchingTop,
  } = useGetMessagesQuery(
    {
      userId: user?.user?._id,
      chatPartnerId: chatPartnerId,
      page: pageTop,
      pageSize,
    },
    { skip: !chatPartnerId || pageTop === 0 }
  );

  const [updateMessage, { isLoading: isUpdatingMessage }] =
    useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  useEffect(() => {
    setMessages([]);
    setPageBottom(1);
    setPageTop(0);
    setHasMoreBottom(true);
    setHasMoreTop(true);
    scrollToBottom();
  }, [chatPartnerId]);

  useEffect(() => {
    if (isBottomSuccess && bottomData?.data) {
      const formatted = bottomData.data.map((msg) => ({
        ...msg,
        fromMe: msg.sender === user?.user?._id,
      }));
      setMessages((prev) => {
        const validPrev = (prev || []).filter(Boolean);
        const existingIds = new Set(validPrev.map((msg) => msg?._id));
        const newMessages = formatted.filter(
          (msg) => msg && !existingIds.has(msg?._id)
        );
        return [...validPrev, ...newMessages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
      setHasMoreBottom(
        bottomData.hasMore && messages.length + formatted.length < maxMessages
      );
      if (pageBottom > 1 && messageContainerRef.current) {
        const prevHeight = messageContainerRef.current.scrollHeight;
        setTimeout(() => {
          const newHeight = messageContainerRef.current.scrollHeight;
          messageContainerRef.current.scrollTop = newHeight - prevHeight;
        }, 0);
      } else {
        setTimeout(() => scrollToBottom("auto"), 100);
      }
    }
  }, [isBottomSuccess, bottomData, user?.user?._id]);

  useEffect(() => {
    if (isTopSuccess && topData?.data) {
      const formatted = topData.data.map((msg) => ({
        ...msg,
        fromMe: msg.sender === user?.user?._id,
      }));
      setMessages((prev) => {
        const validPrev = (prev || []).filter(Boolean);
        const existingIds = new Set(validPrev.map((msg) => msg?._id));
        const newMessages = formatted.filter(
          (msg) => msg && !existingIds.has(msg?._id)
        );
        return [...newMessages, ...validPrev].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
      setHasMoreTop(
        topData.hasMore && messages.length + formatted.length < maxMessages
      );
      if (pageTop > 0 && messageContainerRef.current) {
        const prevHeight = messageContainerRef.current.scrollHeight;
        setTimeout(() => {
          const newHeight = messageContainerRef.current.scrollHeight;
          messageContainerRef.current.scrollTop = newHeight - prevHeight;
        }, 0);
      }
    }
  }, [isTopSuccess, topData, user?.user?._id]);

  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;

    const isAtBottom =
      Math.abs(
        container.scrollHeight - container.scrollTop - container.clientHeight
      ) < 1;
    setAtBottom(isAtBottom);

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const bottomThreshold = scrollHeight * 0.05;
    const topThreshold = clientHeight * 0.05;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (
      distanceFromBottom < bottomThreshold &&
      hasMoreBottom &&
      !isFetchingBottom &&
      messages.length < maxMessages
    ) {
      setPageBottom((prev) => prev + 1);
    }

    if (
      scrollTop < topThreshold &&
      hasMoreTop &&
      !isFetchingTop &&
      messages.length < maxMessages &&
      pageTop >= 0
    ) {
      setPageTop((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!socket || !chatPartnerId) return;

    const handleReceiveMessage = (msg) => {
      console.log("ChatWindow receiveMessage:", msg);
      const isRelated =
        (msg.sender === user?.user?._id && msg.receiver === chatPartnerId) ||
        (msg.sender === chatPartnerId && msg.receiver === user?.user?._id);
      if (isRelated && msg?._id) {
        setMessages((prev) => {
          const validPrev = (prev || []).filter(Boolean);
          const existingIds = new Set(validPrev.map((m) => m?._id));
          if (!existingIds.has(msg?._id)) {
            return [
              ...validPrev,
              { ...msg, fromMe: msg?.sender === user?.user?._id },
            ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          }
          return validPrev;
        });
        // Always scroll to bottom if I'm the sender, OR if I'm already at the bottom
        if (msg.sender === user?.user?._id || atBottom) {
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
      }
    };

    const handleMessageUpdated = (updatedMsg) => {
      console.log("ChatWindow messageUpdated:", updatedMsg);
      const isRelated =
        (updatedMsg.sender === user?.user?._id &&
          updatedMsg.receiver === chatPartnerId) ||
        (updatedMsg.sender === chatPartnerId &&
          updatedMsg.receiver === user?.user?._id);
      if (isRelated && updatedMsg?._id) {
        setMessages((prev) => {
          const validPrev = (prev || []).filter(Boolean);
          const messageExists = validPrev.some((m) => m?._id === updatedMsg?._id);
          if (!messageExists) return validPrev;
          return validPrev
            .map((m) =>
              m?._id === updatedMsg?._id
                ? {
                  ...m,
                  content: updatedMsg?.content,
                  updatedAt: updatedMsg?.updatedAt || new Date().toISOString(),
                  deleted: updatedMsg?.deleted || false,
                }
                : m
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    };

    const handleMessageDeleted = (deletedMsg) => {
      console.log("ChatWindow messageDeleted:", deletedMsg);
      const isRelated =
        (deletedMsg.sender === user?.user?._id &&
          deletedMsg.receiver === chatPartnerId) ||
        (deletedMsg.sender === chatPartnerId &&
          deletedMsg.receiver === user?.user?._id);
      if (isRelated && deletedMsg?._id) {
        setMessages((prev) => {
          const validPrev = (prev || []).filter(Boolean);
          return validPrev
            .map((m) =>
              m?._id === deletedMsg?._id
                ? {
                  ...m,
                  deleted: true,
                  updatedAt: deletedMsg?.updatedAt || new Date().toISOString(),
                }
                : m
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, chatPartnerId, user?.user?._id, atBottom]);

  useEffect(() => {
    if (!socket || !chatPartnerId) return;

    let typingTimeout;
    const handleTyping = (senderId) => {
      if (senderId === chatPartnerId) {
        setOpponentTyping(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => setOpponentTyping(false), 2000);
      }
    };

    const handleStopTyping = (senderId) => {
      if (senderId === chatPartnerId) {
        setOpponentTyping(false);
        clearTimeout(typingTimeout);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      clearTimeout(typingTimeout);
    };
  }, [socket, chatPartnerId]);

  useEffect(() => {
    if (!socket || !chatPartnerId) return;

    const handleMarkMessageAsRead = (data) => {
      const { userId, selectedUserId } = data;
      if (userId === user?.user?._id && selectedUserId === chatPartnerId) {
        setMessages((prev) => {
          const validPrev = (prev || []).filter(Boolean);
          return validPrev
            .map((msg) =>
              msg?.sender === selectedUserId && !msg?.read
                ? { ...msg, read: true }
                : msg
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    };

    socket.on("messagesRead", handleMarkMessageAsRead);
    return () => socket.off("messagesRead", handleMarkMessageAsRead);
  }, [socket, chatPartnerId, user?.user?._id]);

  useEffect(() => {
    if (atBottom && messages.length > 0) {
      setTimeout(() => scrollToBottom("smooth"), 100);
    }
  }, [messages, atBottom]);

  const scrollToBottom = (behavior = "smooth") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    }
  };

  const handleEdit = (msg) => {
    console.log("handleEdit called with msg:", msg);
    if (!msg?._id || !msg?.content || getMessageType(msg.content) !== "text") {
      console.error("Invalid message for editing:", msg);
      showToast("Cannot edit this message", "error");
      return;
    }
    setEditMessageId(msg._id);
    setIsEditing(true);
    setEditMessage({ ...msg, originalContent: msg.content }); // Store original content
  };

  const handleEditSubmit = async () => {
    console.log("handleEditSubmit called with:", {
      editMessageId,
      content: editMessage?.content,
    });
    if (editMessage && editMessageId && editMessage.content.trim()) {
      // Optimistic update
      setMessages((prev) => {
        const validPrev = (prev || []).filter(Boolean);
        return validPrev
          .map((m) =>
            m?._id === editMessageId
              ? {
                ...m,
                content: editMessage.content.trim(),
                updatedAt: new Date().toISOString(),
                deleted: false,
              }
              : m
          )
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      try {
        const response = await updateMessage({
          messageId: editMessageId,
          updatedData: { content: editMessage.content.trim() }, // Wrap content in updatedData
        }).unwrap();
        console.log("Message updated successfully:", response);
        // Invalidate RTK Query cache
        refetchBottom();
        showToast("Message updated successfully", "success");
      } catch (error) {
        console.error("Failed to update message:", error);
        // Revert optimistic update
        setMessages((prev) => {
          const validPrev = (prev || []).filter(Boolean);
          return validPrev
            .map((m) =>
              m?._id === editMessageId
                ? {
                  ...m,
                  content: editMessage.originalContent,
                  updatedAt: m.updatedAt,
                }
                : m
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        showToast(error?.data?.error || "Failed to update message", "error");
      } finally {
        setIsEditing(false);
        setEditMessage(null);
        setEditMessageId(null);
      }
    } else {
      console.error("Invalid edit data:", { editMessage, editMessageId });
      showToast("Please enter valid message content", "error");
    }
  };

  const handleDeleteConfirm = (msgId) => {
    setMessageToDelete(msgId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (messageToDelete) {
      try {
        await deleteMessage({ messageId: messageToDelete }).unwrap();
        setShowDeleteConfirm(false);
        setMessageToDelete(null);
        showToast("Message deleted successfully", "success");
      } catch (error) {
        console.error("Failed to delete message:", error);
        showToast(error?.data?.error || "Failed to delete message", "error");
      }
    }
  };

  const getFileName = (url) => {
    try {
      return decodeURIComponent(url.split("/").pop().split("?")[0]);
    } catch {
      return "file";
    }
  };

  const handleDownload = async (url) => {
    try {
      console.log(url, "url sdlkfndf");

      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = getFileName(url);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed:", error);
      showToast("Failed to download file", "error");
    }
  };

  const getMessageType = (content) => {
    const extension = content?.split(".").pop()?.toLowerCase();
    if (!extension) return "text";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension))
      return "image";
    if (["mp4", "mov", "webm"].includes(extension)) return "video";
    if (["mp3", "wav", "ogg", "webm"].includes(extension)) return "audio";
    if (["pdf"].includes(extension)) return "pdf";
    if (["txt", "md"].includes(extension)) return "textFile";
    return "text";
  };

  const formatAudioExtension = (url) => {
    if (!url || typeof url !== "string") return "";
    return url.replace(/\.webm$/, ".mp3");
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full"></div>
          <div className="relative w-32 h-32 bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 flex items-center justify-center border border-slate-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <svg
              className="w-16 h-16 text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 transform rotate-12">
            <span className="text-xl">👋</span>
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Select a conversation</h2>
        <p className="text-slate-500 text-center max-w-[280px] leading-relaxed font-medium">
          Choose a user from the list on the left to start messaging and manage requests.
        </p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-slate-50/30 relative">
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8 sidebar-scrollbar"
      >
        {isFetchingTop && (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading older messages</p>
          </div>
        )}

        <div ref={topRef} />

        {Object.keys(groupedMessages).length === 0 && !isFetchingBottom ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <MessageSquare size={48} className="mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">No messages yet</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="space-y-6">
              <div className="flex items-center justify-center p-4">
                <span className="px-4 py-1 rounded-full bg-white border border-slate-100 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 shadow-sm">
                  {date}
                </span>
              </div>

              {(msgs || []).filter(Boolean).map((msg) => {
                const isAutoRequirementCard =
                  msg?.isAutoRequirement === true ||
                  (typeof msg?.content === "string" &&
                    msg.content.includes("NEW REQUIREMENT") &&
                    msg.content.includes("Call Now"));

                const isAskPriceCard =
                  typeof msg.content === "string" &&
                  msg.content.includes("PRICE ENQUIRY");

                const isAutoComplaintCard =
                  typeof msg.content === "string" &&
                  msg.content.includes("NEW COMPLAINT");


                return (
                  <div
                    key={msg?._id || Math.random()}
                    className={cn(
                      "flex flex-col max-w-[85%] lg:max-w-[70%] group transition-all duration-300",
                      msg?.fromMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex flex-col px-4 py-3 shadow-sm transition-all duration-200",
                        msg.fromMe ? "bg-slate-900 text-white rounded-[22px] rounded-tr-none hover:shadow-md" : "bg-white text-slate-800 rounded-[22px] rounded-tl-none border border-slate-100 hover:shadow-md",
                        (isAutoRequirementCard || isAutoComplaintCard || isAskPriceCard) ? "p-0 bg-transparent shadow-none border-none max-w-full" : ""
                      )}

                    >
                      {msg.deleted ? (
                        <div className="flex items-center gap-2 italic text-sm opacity-60">
                          <Ban size={14} /> This message was deleted
                        </div>
                      ) : isAutoRequirementCard ? (
                        <div className="max-w-xs mx-auto">
                          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-indigo-600 rounded-xl p-5 shadow-lg ring-1 ring-indigo-100">
                            <div className="flex items-center justify-between mb-4">
                              <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wider">
                                NEW REQUIREMENT
                              </span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-4">
                              {msg.content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "Product Inquiry"}
                            </h3>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Quantity Needed</span>
                                <span className="font-semibold text-gray-900">
                                  {msg.content.match(/Quantity Needed[\s\n]*<\/span>\s*<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-5 text-center">
                              <a
                                href={`tel:${msg.content.match(/href="tel:([^"]+)"/i)?.[1] || "#"}`}
                                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                              >
                                Call Now
                              </a>
                        </div>
                        </div>
                        </div>
                      ) : isAskPriceCard ? (
                        <div className="max-w-xs mx-auto">
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-xl p-5 shadow-lg ring-1 ring-orange-100">
                            <div className="flex items-center justify-between mb-4">
                              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wider">
                                PRICE ENQUIRY
                              </span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-4">
                              {msg.content.match(/<h3[^>]*>\s*([\s\S]*?)\s*<\/h3>/i)?.[1]?.trim() || "Product Inquiry"}
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">From</span>
                                <span className="font-semibold text-gray-900">
                                  {msg.content.match(/From<\/span>\s*<strong>([^<]*)<\/strong>/i)?.[1] || "Customer"}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-orange-100 pt-2">
                                <span className="text-gray-600">Contact</span>
                                <span className="font-semibold text-orange-600">
                                  {msg.content.match(/Contact<\/span>\s*<strong[^>]*>([^<]*)<\/strong>/i)?.[1] || "N/A"}
                                </span>
                              </div>
                              {msg.content.includes("Email") && msg.content.match(/Email<\/span><strong>([^<]+)<\/strong>/i)?.[1] && (
                                <div className="flex justify-between border-t border-orange-100 pt-2">
                                  <span className="text-gray-600">Email</span>
                                  <span className="font-semibold text-gray-900 text-xs">
                                    {msg.content.match(/Email<\/span><strong>([^<]+)<\/strong>/i)?.[1]}
                                  </span>
                                </div>
                              )}
                              {msg.content.includes("Message") && (
                                <div className="border-t border-orange-100 pt-2">
                                  <span className="text-gray-500 text-xs block mb-1">Message</span>
                                  <em className="text-gray-700 text-xs">
                                    {msg.content.match(/<em[^>]*>"([\s\S]*?)"<\/em>/i)?.[1] || ""}
                                  </em>
                                </div>
                              )}
                            </div>
                            <div className="mt-5 text-center">
                              <a
                                href={`tel:${msg.content.match(/href="tel:([^"]+)"/i)?.[1] || "#"}`}
                                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                              >
                                Call Now
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : isAutoComplaintCard ? (
                        <div className="max-w-xs mx-auto">
                          <div className="bg-gradient-to-br from-rose-50 to-orange-50 border-l-4 border-rose-500 rounded-xl p-5 shadow-lg ring-1 ring-rose-100">
                            <div className="flex items-center justify-between mb-4">
                              <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-[0.1em] uppercase">
                                New Complaint
                              </span>
                              <span className="text-[10px] font-bold text-rose-400 opacity-60">
                                {msg.content.match(/color:#888">([\s\S]*?)<\/span>/i)?.[1] || "Just Now"}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div className="pb-3 border-b border-rose-100/50">
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-rose-400 mb-1">Reporter Details</h4>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                  <span className="opacity-40">User:</span> {msg.content.match(/User:<\/b>\s*([\s\S]*?)<\/div>/i)?.[1] || "Unknown"}
                                </p>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                  <span className="opacity-40">Phone:</span> {msg.content.match(/Phone:<\/b>\s*([\s\S]*?)<\/div>/i)?.[1] || "N/A"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-rose-400 mb-1">Issue</h4>
                                <div className="p-3 bg-white/50 rounded-lg border border-rose-100/50">
                                  <p className="text-xs font-bold text-rose-600 mb-2">
                                    Option: <span className="text-slate-800">{msg.content.match(/Option:<\/b>\s*([\s\S]*?)<\/div>/i)?.[1] || "Not specified"}</span>
                                  </p>
                                  <p className="text-xs leading-relaxed text-slate-600 font-medium italic">
                                    "{msg.content.match(/Description:<\/b><br\/>\s*([\s\S]*?)<\/div>/i)?.[1]?.trim() || "No description provided"}"
                                  </p>
                                </div>
                              </div>

                              {msg.content.includes("Address:") && (
                                <div className="pt-2">
                                  <p className="text-[10px] font-bold text-slate-400 leading-tight">
                                    <span className="uppercase tracking-tighter text-rose-300">Location:</span> {msg.content.match(/Address:<\/b>\s*([\s\S]*?)<\/div>/i)?.[1] || "N/A"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const type = getMessageType(msg.content);
                          if (type === "image") {
                            return (
                              <Zoom>
                                <div className="relative rounded-xl overflow-hidden shadow-lg">
                                  <img src={msg.content} alt="Sent" className="max-w-full h-auto object-cover" />
                                  <button
                                    onClick={() => handleDownload(msg.content)}
                                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Download size={16} />
                                  </button>
                                </div>
                              </Zoom>
                            );
                          }
                          if (type === "video") {
                            return (
                              <div className="relative rounded-xl overflow-hidden shadow-lg bg-black">
                                <video controls className="max-w-full">
                                  <source src={msg.content} />
                                </video>
                                <button
                                  onClick={() => handleDownload(msg.content)}
                                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Download size={16} />
                                  </button>
                                </div>
                              );
                          }
                          if (type === "audio") {
                            return <CustomAudioPlayer src={formatAudioExtension(msg.content)} />;
                          }
                          if (type === "pdf" || type === "textFile") {
                            return (
                              <div className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                                msg.fromMe ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-100 text-slate-800"
                              )}>
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  msg.fromMe ? "bg-white/20" : "bg-indigo-100 text-indigo-600"
                                )}>
                                  {type === "pdf" ? <FileText size={20} /> : <File size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">File Attached</p>
                                  <button
                                    onClick={() => handleDownload(msg.content)}
                                    className="text-[10px] font-black uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                                  >
                                    Download File
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium">
                              {msg.content}
                            </p>
                          );
                        })()
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center gap-2 mt-1 px-1",
                      msg.fromMe ? "justify-end" : "justify-start"
                    )}>
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayjs(msg.createdAt).format("hh:mm A")}
                      </span>
                      {msg.fromMe && (
                        <span className={cn(
                          "text-[10px] font-bold",
                          msg.read ? "text-indigo-500" : "text-slate-300"
                        )}>
                          {msg.read ? "Read" : "Sent"}
                        </span>
                      )}

                      {msg.fromMe && !msg.deleted && !isAutoRequirementCard && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex gap-1">
                          {getMessageType(msg.content) === "text" && (
                            <button onClick={() => handleEdit(msg)} className="text-slate-400 hover:text-indigo-500 transition-colors p-1">
                              <Edit size={12} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteConfirm(msg._id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {opponentTyping && (
          <div className="flex items-start gap-2 max-w-[70%] mr-auto">
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-[22px] rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!atBottom && (
        <Button
          className="absolute bottom-32 right-8 z-50 bg-slate-900 text-white w-10 h-10 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all p-0"
          onClick={() => scrollToBottom("smooth")}
        >
          <ChevronDown size={20} />
        </Button>
      )}

      <div className="p-4 bg-white border-t border-slate-100">
        <MessageInput
          onTyping={() => {
            socket?.emit("typing", {
              senderId: user?.user?._id,
              receiverId: chatPartnerId,
            });
          }}
          onStopTyping={() => {
            socket?.emit("stopTyping", {
              senderId: user?.user?._id,
              receiverId: chatPartnerId,
            });
          }}
        />
      </div>

      {/* Edit Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center backdrop-blur-sm bg-slate-900/20 p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-4">Edit Message</h3>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-[120px] font-medium resize-none shadow-inner"
              value={editMessage?.content || ""}
              onChange={(e) => setEditMessage({ ...editMessage, content: e.target.value })}
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 rounded-xl font-bold text-slate-500"
                onClick={() => {
                  setIsEditing(false);
                  setEditMessage(null);
                  setEditMessageId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                onClick={handleEditSubmit}
                disabled={isUpdatingMessage}
              >
                {isUpdatingMessage ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center backdrop-blur-sm bg-slate-900/20 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Ban size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete Message?</h3>
            <p className="text-slate-500 font-medium mb-8">
              This message will be removed for everyone in this conversation.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 rounded-xl font-bold text-slate-500"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Keep it
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
