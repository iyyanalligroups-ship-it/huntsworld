// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
// import { useNotifications } from '../context/NotificationContext';

// const NotificationItem = ({ notification }) => {
//   const navigate = useNavigate();
//   const { markAsRead } = useNotifications();

//   const handleClick = () => {
//     markAsRead(notification.id);
//     if (notification.link) {
//       navigate(notification.link);
//     }
//   };

//   // Format the time (e.g., "2 hours ago", "5 minutes ago")
//   const formatTime = (timestamp) => {
//     const now = new Date();
//     const diff = now.getTime() - timestamp.getTime();

//     const seconds = Math.floor(diff / 1000);
//     const minutes = Math.floor(seconds / 60);
//     const hours = Math.floor(minutes / 60);
//     const days = Math.floor(hours / 24);

//     if (days > 0) {
//       return `${days} day${days > 1 ? 's' : ''} ago`;
//     } else if (hours > 0) {
//       return `${hours} hour${hours > 1 ? 's' : ''} ago`;
//     } else if (minutes > 0) {
//       return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
//     } else {
//       return 'Just now';
//     }
//   };

//   // Get the appropriate icon based on notification type
//   const getIcon = () => {
//     switch (notification.type) {
//       case 'success':
//         return <CheckCircle size={16} className="text-green-500" />;
//       case 'warning':
//         return <AlertCircle size={16} className="text-amber-500" />;
//       case 'info':
//       default:
//         return <Info size={16} className="text-blue-500" />;
//     }
//   };

//   // Get background color based on read status and type
//   const getBgColor = () => {
//     if (!notification.isRead) {
//       switch (notification.type) {
//         case 'success':
//           return 'bg-green-50';
//         case 'warning':
//           return 'bg-amber-50';
//         case 'info':
//         default:
//           return 'bg-blue-50';
//       }
//     }
//     return 'bg-white';
//   };

//   return (
//     <div
//       onClick={handleClick}
//       className={`${getBgColor()} p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200`}
//     >
//       <div className="flex items-start gap-3">
//         <div className="mt-1">{getIcon()}</div>
//         <div className="flex-1">
//           <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
//             {notification.message}
//           </p>
//           <div className="flex items-center mt-1 text-xs text-gray-500">
//             <Clock size={12} className="mr-1" />
//             <span>{formatTime(notification.timestamp)}</span>
//           </div>
//         </div>
//         {!notification.isRead && (
//           <span className="h-2 w-2 rounded-full bg-[#0c1f4d]"></span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default NotificationItem;
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Info, Clock, MoreVertical, Trash } from 'lucide-react';
// import { useNotifications } from '../context/NotificationContext';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { toast } from "react-toastify";
import { useDeletePermissionRequestMappingMutation } from "@/redux/api/PermissionRequestApi";

const NotificationItem = ({ notification }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  // const { markAsRead } = useNotifications();
  const [deleteRequest] = useDeletePermissionRequestMappingMutation();

  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for menu toggle

  const handleClick = () => {
    // markAsRead(notification._id, user?.user?._id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-amber-500" />;
      case 'info':
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getBgColor = () => {
    if (!notification.isRead) {
      switch (notification.type) {
        case 'success':
          return 'bg-green-50';
        case 'warning':
          return 'bg-amber-50';
        case 'info':
        default:
          return 'bg-blue-50';
      }
    }
    return 'bg-white';
  };

  const getMessage = () => {
    try {
      const user = notification.user_id?.name || 'Someone';
      const permission = notification.permission_id?.name || 'a permission';
      const status = notification.status || 'updated';

      return `${user} request for ${permission} has been ${status}`;
    } catch (err) {
      return 'You have a new notification';
    }
  };

  const handleDelete = async (notification) => {
    console.log(notification,"get");

    try {
      const res = await deleteRequest({permissionRequestId:notification._id,adminId:user?.user?._id}).unwrap();
      if (res) {
        toast.success("Message Deleted Successfully");
      }
    } catch (error) {
      console.log(error?.data?.message);

      toast.error(`${error?.data?.message}` || "Something went wrong");
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation(); // Prevent the parent click
    setIsMenuOpen(!isMenuOpen); // Toggle the menu visibility
  };

  return (
    <div
      onClick={handleClick}
      className={`${getBgColor()} p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">{getIcon()}</div>
        <div className="flex-1">
          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
            {getMessage()}
          </p>
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <Clock size={12} className="mr-1" />
            <span>{formatTime(notification.requested_at || notification.timestamp)}</span>
          </div>
        </div>

        {/* Menu Trigger */}
        {/* <button
          onClick={toggleMenu}
          className="p-1 hover:bg-gray-100 rounded-full transition"
        >
          <MoreVertical size={16} />
        </button> */}

        {/* Floating Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Prevent parent click
                  handleDelete(notification); // Call delete
                  setIsMenuOpen(false); // Close menu after action
                }}
                className="text-red-600 cursor-pointer flex items-center px-4 text-sm hover:bg-gray-100"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Unread Notification Indicator */}
        {!notification.isRead && (
          <span className="h-2 w-2 rounded-full bg-[#0c1f4d] absolute top-3 right-8"></span>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
