import React, { useRef, useEffect } from 'react';
import { X, Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarkTrustSealNotificationAsReadMutation } from '@/redux/api/TrustSealRequestApi';
import showToast from '@/toast/showToast';

const TrustSealNotificationPanel = ({ showNotifications, closeNotifications, notifications, userId }) => {
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const [markNotificationAsRead] = useMarkTrustSealNotificationAsReadMutation();

  useEffect(() => {
    console.log('🟢 [TrustSeal] Rendering notification panel, showNotifications:', showNotifications);
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        console.log('🟢 [TrustSeal] Clicked outside panel, closing...');
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

  const handleNotificationClick = (requestId) => {
    console.log('🟢 [TrustSeal] Notification clicked:', requestId);
    navigate(`/admin/plans/trust-seal-requests/${requestId}`);
    closeNotifications();
  };

  const handleMarkAsRead = async (requestId) => {
    try {
      console.log('🟢 [TrustSeal] Marking notification as read:', requestId);
      await markNotificationAsRead({ requestId, userId }).unwrap();
      showToast('Notification marked as read', 'success');
    } catch (error) {
      console.error('🔴 [TrustSeal] Failed to mark notification as read:', error);
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('🟢 [TrustSeal] Marking all notifications as read');
      for (const notification of notifications.filter((n) => n.status === 'pending' && !n.isRead)) {
        await markNotificationAsRead({ requestId: notification._id, userId }).unwrap();
      }
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('🔴 [TrustSeal] Failed to mark all notifications as read:', error);
      showToast('Failed to mark all notifications as read', 'error');
    }
  };

  const handleCloseClick = (event) => {
    event.stopPropagation();
    console.log('🟢 [TrustSeal] Close button clicked');
    closeNotifications();
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

  if (!showNotifications) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden animate-fadeIn"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Bell size={18} className="text-gray-700 mr-2" />
          <h3 className="font-medium">Trust Seal Notifications</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck size={14} className="mr-1" />
            Mark all as read
          </button>
          <button
            onClick={handleCloseClick}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notifications"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-6 px-4 text-center text-gray-500">
            <p>No trust seal notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative ${
                  notification.status === 'pending' && !notification.isRead ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Bell size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1" onClick={() => handleNotificationClick(notification._id)}>
                    <p className={`text-sm ${notification.status === 'pending' && !notification.isRead ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                      New Trust Seal Request for ₹{notification.amount}
                    </p>
                    <p className="text-xs text-gray-500">Merchant: {notification.merchantName || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">Status: {notification.status}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{formatTime(notification.created_at)}</span>
                    </div>
                  </div>
                  {notification.status === 'pending' && !notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                      aria-label="Mark notification as read"
                    >
                      <CheckCheck size={14} />
                    </button>
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

export default TrustSealNotificationPanel;