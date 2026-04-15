// src/components/GlobalNotificationBell.jsx
import { Bell } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { usePhoneNotifications } from "@/modules/admin/context/PhoneNotificationContext";

const GlobalNotificationBell = () => {
  const { phoneNotifications, unreadCount, markNotificationRead } = usePhoneNotifications();

  return (
    <Popover onOpenChange={(open) => {
      if (open && unreadCount > 0) {
        // Find all unread and mark them
        phoneNotifications.forEach(n => {
          if (!n.is_read) {
            markNotificationRead(n._id);
          }
        });
      }
    }}>
      <PopoverTrigger asChild>
        <button
          className="relative p-1 rounded-full hover:bg-gray-100 focus:outline-none"
          aria-label="Phone number access notifications"
        >
          <Bell
            size={18}
            className={`text-gray-600 ${unreadCount > 0 ? "animate-bell-shake" : ""}`}
          />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="p-4 border-b">
          <h3 className="font-medium">Phone Number Access Requests</h3>
        </div>

        <Link
          to="/merchant/notifications/phone-number-access"
          className="flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-blue-500" />
            <span>View all requests</span>
          </div>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
        </Link>
      </PopoverContent>
    </Popover>
  );
};

export default GlobalNotificationBell;
