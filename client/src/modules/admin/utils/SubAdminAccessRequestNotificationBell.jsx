import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import io from 'socket.io-client';
import {
  useGetAccessRequestsQuery,
  useMarkNotificationAsReadMutation,
} from '@/redux/api/SubAdminAccessRequestApi';
import showToast from '@/toast/showToast';
import AccessRequestNotificationPanel from './SubAdminAccessRequestNotificationPanel';
import '../css/Animation.css';

const AccessRequestNotificationBell = ({ userId, isAdmin }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { data, isError, error, refetch } = useGetAccessRequestsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  });
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/access-request-notifications`, {
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  useEffect(() => {
    socket.on('connect', () => {
      console.log(`🟢 Connected to /access-request-notifications namespace: ${socket.id}`);
      if (isAdmin) {
        socket.emit('join_admins');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('🔴 Socket connection error:', err.message);
      showToast('Failed to connect to notification server', 'error');
    });

    socket.on('receiveMessage', (notification) => {
      console.log('🟢 [SubadminAccess] Received receiveMessage:', notification);
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
      showToast(`New Access Request: ${notification.content}`, 'success');
      refetch();
    });

    if (data?.requests) {
      setNotifications(data.requests);
    }

    return () => {
      socket.off('receiveMessage');
      socket.off('connect');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [data, isAdmin, refetch]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  const handleMarkAsRead = async (requestId) => {
    try {
      await markNotificationAsRead({ request_id: requestId }).unwrap();
      showToast('Notification marked as read', 'success');
      refetch();
    } catch (error) {
      showToast('Failed to mark notification as read', 'error');
    }
  };

  if (isError) {
    console.error('🔴 Error fetching notifications:', error);
    showToast('Failed to load notifications', 'error');
  }

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
        aria-label="Access Request Notifications"
      >
        <Bell
          size={18}
          className={`text-gray-600 ${unreadCount > 0 ? 'shakeIcon' : ''}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#0c1f4d] text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AccessRequestNotificationPanel
        showNotifications={showNotifications}
        closeNotifications={closeNotifications}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        userId={userId}
      />
    </div>
  );
};

export default AccessRequestNotificationBell;