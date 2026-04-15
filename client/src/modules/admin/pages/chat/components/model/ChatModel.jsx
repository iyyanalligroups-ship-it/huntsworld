import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import {
  FileText,
  File,
  Ban,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

/* -------------------------------------------------------
   Utility helpers
------------------------------------------------------- */

const normalizeId = (val) =>
  typeof val === "object" ? val?._id?.toString() : val?.toString();

/**
 * ADMIN MODE ALIGNMENT
 * senderId   → RIGHT
 * receiverId → LEFT
 */
const isSenderSide = (msg, senderId) => {
  return normalizeId(msg.sender) === normalizeId(senderId);
};

function detectMessageType(content) {
  if (!content) return "text";
  const url = content.toLowerCase();
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
  if (url.match(/\.(mp4|webm|ogg)$/)) return "video";
  if (url.match(/\.(mp3|wav|ogg|m4a)$/)) return "audio";
  if (url.endsWith(".pdf")) return "pdf";
  if (url.match(/\.(txt|doc|docx|zip|rar)$/)) return "textFile";
  return "text";
}

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

  return grouped;
}

/* -------------------------------------------------------
   Chat Modal Component (ADMIN REVIEW MODE)
------------------------------------------------------- */

const ChatModal = ({
  open,
  onOpenChange,
  senderId,
  receiverId,
  senderName,
  receiverName,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const scrollRef = useRef(null);

  /* -------------------------------------------------------
     Fetch messages
  ------------------------------------------------------- */
  const fetchMessages = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/recieve-message/${senderId}/${receiverId}?page=${pageNum}&limit=10`
      );
      const data = await res.json();

      if (data?.data?.length) {
        const newMessages = [...(data?.data || [])].filter(Boolean).reverse();

        setMessages((prev) => {
          const validPrev = (prev || []).filter(Boolean);
          return append ? [...newMessages, ...validPrev] : newMessages;
        });

        setHasMore(data.data.length === 10);
        setPage(pageNum);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  /* -------------------------------------------------------
     Effects
  ------------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      return;
    }
    fetchMessages(1, false);
  }, [open, senderId, receiverId]);

  useEffect(() => {
    if (scrollRef.current && page === 1 && !loadingMore) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, page, loadingMore]);

  const handleScroll = () => {
    if (!scrollRef.current || loadingMore || !hasMore) return;
    if (scrollRef.current.scrollTop < 100) {
      fetchMessages(page + 1, true);
    }
  };

  const groupedMessages = groupMessagesByDate(messages);

  const handleDownload = (url) => window.open(url, "_blank");

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl">
            Admin Review:{" "}
            <span className="font-bold text-blue-600">{senderName}</span> ↔{" "}
            <span className="font-bold text-red-600">{receiverName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* CHAT BODY */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50"
        >
          {loading ? (
            <div className="flex justify-center">Loading...</div>
          ) : (
            Object.keys(groupedMessages).map((date) => (
              <div key={date}>
                <div className="text-center text-xs text-gray-500 my-3">
                  {date}
                </div>

                {(groupedMessages[date] || []).filter(Boolean).map((msg) => {
                  const sentBySender = isSenderSide(msg, senderId);
                  const type = detectMessageType(msg?.content);

                  return (
                    <div
                      key={msg?._id || Math.random()}
                      className={`flex ${
                        sentBySender ? "justify-end" : "justify-start"
                      } mb-2`}
                    >
                      <div className="max-w-xs lg:max-w-md flex flex-col">
                        {/* NAME LABEL FOR ADMIN */}
                        <span className="text-[10px] text-gray-500 mb-1">
                          {sentBySender ? receiverName : senderName}
                        </span>

                        <div
                          className={`px-3 py-2 rounded-xl shadow ${
                            sentBySender
                              ? "bg-[#d8fdd1] rounded-br-none"
                              : "bg-white rounded-bl-none"
                          }`}
                        >
                          {msg.deleted ? (
                            <div className="flex gap-2 text-gray-400 italic">
                              <Ban size={14} />
                              Message deleted
                            </div>
                          ) : type === "image" ? (
                            <Zoom>
                              <img
                                src={msg.content}
                                className="w-72 rounded"
                              />
                            </Zoom>
                          ) : type === "video" ? (
                            <video controls className="w-72 rounded">
                              <source src={msg.content} />
                            </video>
                          ) : type === "audio" ? (
                            <audio controls className="w-full">
                              <source src={msg.content} />
                            </audio>
                          ) : type === "pdf" ? (
                            <div className="flex gap-3 items-center">
                              <FileText />
                              <a
                                href={msg.content}
                                target="_blank"
                                className="text-blue-600 underline"
                              >
                                View PDF
                              </a>
                            </div>
                          ) : (
                            <p
                              className="text-sm whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: msg.content.replace(/\n/g, "<br/>"),
                              }}
                            />
                          )}

                          <div className="text-[10px] text-right mt-1 text-gray-500">
                            {dayjs(msg.createdAt).format("hh:mm A")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
