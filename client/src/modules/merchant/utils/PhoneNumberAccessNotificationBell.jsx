import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { usePhoneNotifications } from '@/modules/admin/context/PhoneNotificationContext';
import showToast from '@/toast/showToast';
import PhoneNumberAccessNotificationPanel from './PhoneNumberAccessNotificationPanel';
import '../css/Animation.css';

const PhoneNumberAccessNotificationBell = ({ userId }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Use global context instead of duplicate socket/API calls
  const {
    phoneNotifications: notifications,
    unreadCount,
    markNotificationRead,
  } = usePhoneNotifications();

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  const handleMarkAsRead = async (requestId) => {
    try {
      await markNotificationRead(requestId);
      showToast('Notification marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark notification as read', 'error');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
        aria-label="Phone Number Access Notifications"
      >
        <Bell
          size={18}
          className={`text-gray-600 ${unreadCount > 0 ? 'shakeIcon' : ''}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <PhoneNumberAccessNotificationPanel
        showNotifications={showNotifications}
        closeNotifications={closeNotifications}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        userId={userId}
      />
    </div>
  );
};

export default PhoneNumberAccessNotificationBell;