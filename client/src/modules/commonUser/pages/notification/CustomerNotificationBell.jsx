// src/components/customer/CustomerNotificationBell.jsx
import { Bell } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useCustomerPhoneNotifications } from "@/modules/admin/context/CustomerPhoneNotificationContext";
export default function CustomerNotificationBell() {
  const { notifications, markAllAsRead } = useCustomerPhoneNotifications();
  const [open, setOpen] = useState(false);

  // Count unread (you can add 'seen' field later)
  const unreadCount = notifications.filter(n => !n.seen).length;

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (newOpen && unreadCount > 0) {
        markAllAsRead();
      }
    }}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-gray-700" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-red-500 text-white p-0 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>

        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-3 border-b last:border-b-0 hover:bg-gray-50 ${notif.type === "approved" ? "bg-green-50/40" : ""
                  }`}
              >
                <p className="text-sm font-medium">
                  {notif.type === "approved" && "✅ Access Approved"}
                  {notif.type === "rejected" && "❌ Request Rejected"}
                  {notif.type === "submitted" && "📩 Request Sent"}
                </p>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.request_date || notif.createdAt || notif.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 border-t text-center">
          <Link
            to="/customer-notification-page"
            className="text-blue-600 text-sm hover:underline"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
