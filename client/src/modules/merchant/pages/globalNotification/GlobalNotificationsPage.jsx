import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Loader2, User as UserIcon, Calendar, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import showToast from "@/toast/showToast";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { usePhoneNotifications } from "@/modules/admin/context/PhoneNotificationContext";
import DeleteDialog from "@/model/DeleteModel";
import axios from "axios"; // 1. Added axios import

const GlobalNotificationsPage = () => {
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const {
    phoneNotifications,
    unreadCount,
    markNotificationRead,
    removeNotification, // Crucial: This must be exported from your Context file!
  } = usePhoneNotifications();

  // Modal and tracking states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationId, setNotificationId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Local copy for optimistic UI update
  const [displayedNotifications, setDisplayedNotifications] = useState([]);

  // Sync with context
  useEffect(() => {
    setDisplayedNotifications(phoneNotifications || []);
  }, [phoneNotifications]);

  const [page, setPage] = useState(1);
  const limit = 10;
  const hasMore = displayedNotifications.length >= page * limit;

  const currentPageNotifications = displayedNotifications.slice(0, page * limit);

  const handleMarkAsRead = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification._id);
        showToast("Request marked as read", "success");
      } catch (error) {
        showToast("Failed to mark as read", "error");
      }
    }
    navigate(`/merchant/notifications/phone-number-access/${notification._id}`);
  };

  const handleDeleteDialogOpen = (e, id) => {
    e.stopPropagation();
    setNotificationId(id);
    setDeleteDialogOpen(true);
  };

  // 2. Updated handleDelete to use Axios directly
  const handleDelete = async () => {
    setDeletingId(notificationId);
    setDeleteDialogOpen(false);

    try {
      const token = sessionStorage.getItem("token");

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/phone-number-access/merchant-delete-request/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showToast("Request deleted successfully", "success");

      // Instantly remove from local view
      setDisplayedNotifications((prev) => prev.filter((n) => n._id !== notificationId));

      // Instantly remove from context so it doesn't reappear
      if (removeNotification) {
        removeNotification(notificationId);
      } else {
        console.warn("removeNotification function is missing from PhoneNotificationContext!");
      }
    } catch (err) {
      console.error("Axios Delete error:", err);
      showToast(
        err?.response?.data?.message || err?.message || "Failed to delete request",
        "error"
      );
    } finally {
      setDeletingId(null);
      setNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = displayedNotifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    try {
      for (const n of unread) {
        await markNotificationRead(n._id);
      }
      showToast("All requests marked as read", "success");
    } catch (error) {
      showToast("Failed to mark all as read", "error");
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className={`${isSidebarOpen ? "ml-1 sm:ml-56" : "ml-1 sm:ml-16"} p-4`}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={24} className="text-blue-500" />
              Phone Number Access Requests
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs flex items-center text-blue-600 hover:text-blue-700"
              >
                <CheckCheck size={14} className="mr-1" />
                Mark all as read
              </button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {displayedNotifications.length === 0 ? (
            <div className="py-6 px-4 text-center text-gray-500">
              <p>No phone number access requests yet</p>
            </div>
          ) : (
            <>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100">
                {currentPageNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleMarkAsRead(notification)}
                    className={`group mb-4 mx-1 p-5 cursor-pointer rounded-xl border transition-all duration-300 relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                      notification.is_read 
                        ? "bg-white border-slate-100" 
                        : "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100 ring-1 ring-blue-50"
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {!notification.is_read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-lg shadow-blue-400" />
                    )}

                    {/* LEFT SIDE: Avatar & Core Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`mt-1 flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm shadow-inner ${
                        notification.is_read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"
                      }`}>
                        {notification.customer_id?.name ? notification.customer_id.name.substring(0, 1).toUpperCase() : <UserIcon size={16} />}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <h3 className={`text-sm tracking-tight ${notification.is_read ? "text-slate-600 font-medium" : "text-slate-900 font-bold"}`}>
                             {notification.customer_id?.name || "Anonymous User"}
                           </h3>
                           {notification.customer_id?.role?.role && (
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                               {notification.customer_id.role.role}
                             </span>
                           )}
                        </div>
                        
                        <p className={`text-xs leading-relaxed ${notification.is_read ? "text-slate-500" : "text-slate-700"}`}>
                           {notification.message || "Requested access to your phone number."}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                             <Clock size={12} />
                             {formatTime(notification.createdAt || notification.created_at || notification.request_date)}
                           </div>
                           <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                             notification.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                             notification.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {notification.status?.toUpperCase()}
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE: Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-0 pt-3 md:pt-0">
                      <button
                        onClick={(e) => handleDeleteDialogOpen(e, notification._id)}
                        disabled={deletingId === notification._id}
                        className="text-slate-400 cursor-pointer hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                        title="Delete Request"
                      >
                        {deletingId === notification._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                      <div className="h-8 w-8 flex items-center justify-center rounded-full group-hover:bg-slate-100 transition-colors">
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={handleLoadMore}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}

          <DeleteDialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleDelete}
            title="Delete Request"
            description="Are you sure you want to delete this notification? This action cannot be undone."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalNotificationsPage;
