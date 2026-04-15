import React, { useRef, useEffect } from 'react';
import { X, CheckCheck, Bell } from 'lucide-react';
import {
  useApprovePhoneNumberAccessMutation,
  useRejectPhoneNumberAccessMutation,
  useMarkNotificationAsReadMutation,
} from '@/redux/api/PhoneNumberAccessApi';
import showToast from '@/toast/showToast';

const PhoneNumberAccessNotificationPanel = ({
  showNotifications,
  closeNotifications,
  notifications,
  handleMarkAsRead,
  userId,
}) => {
  const panelRef = useRef(null);
  const [approvePhoneNumberAccess] = useApprovePhoneNumberAccessMutation();
  const [rejectPhoneNumberAccess] = useRejectPhoneNumberAccessMutation();
  const [markAllAsRead] = useMarkNotificationAsReadMutation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        closeNotifications();
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, closeNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      for (const notification of notifications.filter((n) => !n.is_read)) {
        await markAllAsRead({ request_id: notification._id, seller_id: userId }).unwrap();
      }
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark all notifications as read', error);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await approvePhoneNumberAccess({ request_id: requestId }).unwrap();
      showToast('Phone number access approved', 'success');
    } catch (error) {
      showToast('Failed to approve phone number access', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectPhoneNumberAccess({ request_id: requestId }).unwrap();
      showToast('Phone number access rejected', 'success');
    } catch (error) {
      showToast('Failed to reject phone number access', error);
    }
  };

  if (!showNotifications) {
    return null;
  }

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

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden animate-fadeIn"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Bell size={18} className="text-gray-700 mr-2" />
          <h3 className="font-medium">Phone Number Access Notifications</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <CheckCheck size={14} className="mr-1" />
            Mark all as read
          </button>
          <button
            onClick={closeNotifications}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-6 px-4 text-center text-gray-500">
            <p>No phone number access requests yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.is_read && handleMarkAsRead(notification._id)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative ${
                  notification.is_read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Bell size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                      {notification.message || 'Phone number access request'}
                    </p>
                    <p className="text-xs text-gray-500">Customer: {notification.customer_id.name}</p>
                    <p className="text-xs text-gray-500">Company: {notification.merchant_id.company_name}</p>
                    {notification.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApprove(notification._id)}
                          className="text-xs text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(notification._id)}
                          className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Status: {notification.status}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{formatTime(notification.created_at)}</span>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-[#0c1f4d] absolute top-3 right-8"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneNumberAccessNotificationPanel;