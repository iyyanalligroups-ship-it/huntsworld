import { useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import MessageInput from "./MessageInput";
import { Edit, MoreHorizontal, Trash2, MessageSquare, Download, Ban } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMessagesQuery, useDeleteMessageMutation, useUpdateMessageMutation } from "@/redux/api/MessageApi";
import showToast from '@/toast/showToast';

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
  Object.keys(grouped).sort((a, b) => {
    const dateA = a === "Today" ? new Date() : a === "Yesterday" ? new Date(Date.now() - 86400000) : new Date(a);
    const dateB = b === "Today" ? new Date() : b === "Yesterday" ? new Date(Date.now() - 86400000) : new Date(b);
    return dateA - dateB;
  }).forEach((key) => {
    sortedGrouped[key] = grouped[key];
  });
  return sortedGrouped;
}

export default function ChatWindow() {
  const { socketRef } = useSocket();
  const socket = socketRef?.current;
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

  const { data: bottomData, isSuccess: isBottomSuccess, isFetching: isFetchingBottom } = useGetMessagesQuery(
    {
      userId: user?.user?._id,
      chatPartnerId: chatPartnerId,
      page: pageBottom,
      pageSize,
    },
    { skip: !chatPartnerId }
  );

  const { data: topData, isSuccess: isTopSuccess, isFetching: isFetchingTop } = useGetMessagesQuery(
    {
      userId: user?.user?._id,
      chatPartnerId: chatPartnerId,
      page: pageTop,
      pageSize,
    },
    { skip: !chatPartnerId || pageTop === 0 }
  );

  const [updateMessage] = useUpdateMessageMutation();
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
        const existingIds = new Set(prev.map((msg) => msg._id));
        const newMessages = formatted.filter((msg) => !existingIds.has(msg._id));
        return [...prev, ...newMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      setHasMoreBottom(bottomData.hasMore && messages.length + formatted.length < maxMessages);
      if (pageBottom > 1 && messageContainerRef.current) {
        const prevHeight = messageContainerRef.current.scrollHeight;
        setTimeout(() => {
          const newHeight = messageContainerRef.current.scrollHeight;
          messageContainerRef.current.scrollTop = newHeight - prevHeight;
        }, 0);
      } else {
        scrollToBottom();
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
        const existingIds = new Set(prev.map((msg) => msg._id));
        const newMessages = formatted.filter((msg) => !existingIds.has(msg._id));
        return [...newMessages, ...prev].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      setHasMoreTop(topData.hasMore && messages.length + formatted.length < maxMessages);
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
      Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 1;
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
  const isRelated =
    (msg.sender === user?.user?._id && msg.receiver === chatPartnerId) ||
    (msg.sender === chatPartnerId && msg.receiver === user?.user?._id);

  if (!isRelated || !msg._id) return;

  // CRITICAL: Ignore if this is a message WE just sent (optimistic)
  const isOurSentMessage = msg.sender === user?.user?._id && msg.fromMe !== true;

  setMessages((prev) => {
    const alreadyExists = prev.some(m => m._id === msg._id);
    if (alreadyExists || isOurSentMessage) {
      return prev; // Skip duplicate or our own optimistic message
    }

    return [...prev, { ...msg, fromMe: msg.sender === user?.user?._id }]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  });

  if (atBottom) scrollToBottom();
};
    const handleMessageUpdated = (updatedMsg) => {
      const isRelated =
        (updatedMsg.sender === user?.user?._id && updatedMsg.receiver === chatPartnerId) ||
        (updatedMsg.sender === chatPartnerId && updatedMsg.receiver === user?.user?._id);
      if (isRelated) {
        if (!updatedMsg._id || !updatedMsg.content) {
          console.error("Invalid updatedMsg:", updatedMsg);
          return;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m._id === updatedMsg._id
              ? {
                  ...m,
                  content: updatedMsg.content,
                  updatedAt: updatedMsg.updatedAt,
                  deleted: updatedMsg.deleted || false,
                }
              : m
          ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }
    };

    const handleMessageDeleted = (deletedMsg) => {
      const isRelated =
        (deletedMsg.sender === user?.user?._id && deletedMsg.receiver === chatPartnerId) ||
        (deletedMsg.sender === chatPartnerId && deletedMsg.receiver === user?.user?._id);
      if (isRelated) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === deletedMsg._id
              ? { ...m, deleted: true, updatedAt: deletedMsg.updatedAt }
              : m
          ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
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
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === selectedUserId && !msg.read ? { ...msg, read: true } : msg
          ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }
    };

    socket.on("messagesRead", handleMarkMessageAsRead);
    return () => socket.off("messagesRead", handleMarkMessageAsRead);
  }, [socket, chatPartnerId, user?.user?._id]);

  useEffect(() => {
    if (atBottom && messages.length > 0) scrollToBottom();
  }, [messages, atBottom]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleEdit = (msg) => {
    console.log("handleEdit called with msg:", msg);
    if (!msg?._id || !msg?.content || msg.deleted) {
      console.error("Invalid message for editing:", msg);
      showToast("Cannot edit this message", "error");
      return;
    }
    setEditMessageId(msg._id);
    setEditMessage({ content: msg.content }); // Initialize with current content
    setIsEditing(true);
  };

  const handleEditSubmit = async () => {
    console.log("handleEditSubmit called with:", { editMessageId, editMessage });
    if (!editMessageId || !editMessage || !editMessage.content?.trim()) {
      console.error("Invalid edit data:", { editMessageId, editMessage });
      showToast("Please enter valid message content", "error");
      setIsEditing(false);
      setEditMessage(null);
      setEditMessageId(null);
      return;
    }

    try {
      const updatedData = { content: editMessage.content.trim() };
      console.log("Calling updateMessage with:", { messageId: editMessageId, updatedData });
      await updateMessage({
        messageId: editMessageId,
        updatedData,
      }).unwrap();
      
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === editMessageId
            ? { ...msg, content: editMessage.content.trim(), updatedAt: new Date().toISOString() }
            : msg
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      );

      showToast("Message updated successfully", "success");
      setIsEditing(false);
      setEditMessage(null);
      setEditMessageId(null);
    } catch (error) {
      console.error("Failed to update message:", error);
      showToast("Failed to update message", "error");
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
        showToast("Failed to delete message", "error");
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
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
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
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <MessageSquare className="w-48 h-48 text-gray-500 mb-4" />
        <p className="text-gray-500 text-sm">
          Select a user to start the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-scroll flex-1 h-full">
      {opponentTyping && (
        <div className="text-sm text-gray-500 italic mb-2">
          {selectedUser.name || "User"} is typing...
        </div>
      )}

      <div
        className="flex-1 overflow-y-scroll p-4 space-y-4 bg-gray-50"
        ref={messageContainerRef}
        onScroll={handleScroll}
        style={{ maxHeight: "calc(100vh - 120px)" }}
      >
        {isFetchingTop && (
          <div className="space-y-2">
            {Array.from({ length: pageSize }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-3/4 rounded-xl" />
            ))}
          </div>
        )}
        <div ref={topRef} />
        {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center text-xs text-gray-500 my-2">{date}</div>
            {msgs.map((msg, i) => (
              <div
                key={msg._id || i}
                className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-xl max-w-xs shadow relative mb-2 ${
                    msg.fromMe ? "bg-[#d8fdd1] text-black" : "bg-white"
                  } group`}
                >
                  {msg.deleted ? (
                    <div className="flex items-center gap-2 text-gray-400 italic cursor-pointer">
                      <Ban size={16} className="text-red-500" />
                      <span>This message was deleted</span>
                    </div>
                  ) : (
                    (() => {
                      const type = getMessageType(msg.content);
                      const isDownloadable = ["image", "video", "audio", "pdf", "textFile"].includes(type);
                      return (
                        <div className="relative">
                          {type === "image" && (
                            <Zoom>
                              <img
                                src={msg.content}
                                alt="Image"
                                className="max-w-full w-90 h-40 rounded-lg cursor-zoom-in"
                              />
                            </Zoom>
                          )}
                          {type === "video" && (
                            <video
                              src={msg.content}
                              controls
                              className="max-w-full w-90 h-40 rounded-lg"
                            />
                          )}
                          {type === "audio" && (
                            <audio controls>
                              <source src={formatAudioExtension(msg.content)} type="audio/mp3" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {type === "pdf" && (
                            <a
                              href={msg.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              View PDF
                            </a>
                          )}
                          {type === "textFile" && (
                            <a
                              href={msg.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              View Text File
                            </a>
                          )}
                          {type === "text" && <div>{msg.content}</div>}
                          {isDownloadable && (
                            <button
                              onClick={() => handleDownload(msg.content)}
                              className="absolute top-1 right-1 text-gray-500 hover:text-blue-500 hidden group-hover:block"
                              title="Download"
                            >
                              <Download size={18} />
                            </button>
                          )}
                        </div>
                      );
                    })()
                  )}
                  <div className="text-xs mt-1 flex justify-end gap-1 items-center">
                    <span>{dayjs(msg.createdAt).format("hh:mm A")}</span>
                    {msg.fromMe && (
                      <span className={`${msg.read ? "text-blue-400" : "text-gray-400"}`}>
                        {msg.read ? "✓✓" : "✓"}
                      </span>
                    )}
                    {msg.fromMe && (
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-blue-400">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        <div className="absolute right-0 z-50 hidden group-hover:block bg-white shadow-md p-2 rounded-lg w-32">
                          {getMessageType(msg.content) === "text" && !msg.deleted && (
                            <div
                              onClick={() => handleEdit(msg)}
                              className="flex items-center px-3 py-2 cursor-pointer text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="mr-2" /> Edit
                            </div>
                          )}
                          {!msg.deleted && (
                            <div
                              onClick={() => handleDeleteConfirm(msg._id)}
                              className="flex items-center px-3 py-2 cursor-pointer text-gray-700 hover:bg-gray-100"
                            >
                              <Trash2 className="mr-2" /> Delete
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {isFetchingBottom && (
          <div className="space-y-2">
            {Array.from({ length: pageSize }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-3/4 rounded-xl" />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {!atBottom && (
        <Button
          className="fixed bottom-20 right-4 bg-white text-black p-3 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          ⬇
        </Button>
      )}
      <MessageInput
        onTyping={() => {
          socket?.emit("typing", { senderId: user?.user?._id, receiverId: chatPartnerId });
        }}
        onStopTyping={() => {
          socket?.emit("stopTyping", { senderId: user?.user?._id, receiverId: chatPartnerId });
        }}
        setMessages={setMessages}
      />
      {isEditing && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h3 className="text-lg font-semibold mb-4">Edit Message</h3>
            <textarea
              className="w-full p-2 border-2 border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-[#0c1f4d] outline-none"
              value={editMessage?.content || ""}
              onChange={(e) => {
                console.log("textarea onChange:", e.target.value);
                setEditMessage({ ...editMessage, content: e.target.value });
              }}
            />
            <div className="flex justify-between">
              <Button className="bg-gray-300" onClick={() => {
                setIsEditing(false);
                setEditMessage(null);
                setEditMessageId(null);
              }}>
                Cancel
              </Button>
              <Button className="bg-[#0c1f4d] text-white" onClick={handleEditSubmit}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this message?</p>
            <div className="flex justify-between mt-4">
              <Button className="bg-gray-300" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button className="bg-red-500 text-white" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}