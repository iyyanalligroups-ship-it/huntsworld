import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import io from 'socket.io-client';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '@/redux/api/couponsNotificationApi';
import showToast from '@/toast/showToast';
import CouponNotificationPanel from './CouponNotificationPanel';
import '../css/Animation.css';

const socket = io(import.meta.env.VITE_SOCKET_IO_URL,{
  withCredentials: true,
  transports: ["websocket"],
});

const CouponNotificationBell = ({ userId }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { data, isLoading, isError, error, refetch } = useGetNotificationsQuery(userId, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000, // Poll every 30 seconds as a fallback
  });
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();

  useEffect(() => {
    // Ensure socket is connected before joining
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join', userId);
      console.log(`Emitted join for userId: ${userId}`);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    if (data?.notifications) {
      // Filter for coupon redemption notifications
      const couponNotifications = data.notifications.filter(
        (n) => n.redeemPointsId && !n.amount_sent
      );
      setNotifications(couponNotifications);
    }
  }, [data, userId]);

  useEffect(() => {
    socket.on('newRedemption', (notification) => {
      console.log('Received newRedemption:', notification);
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
      showToast(`New Coupon Redemption: ${notification.message}`, 'success');
      // Refetch to sync with backend
      refetch();
    });

    socket.on('notificationUpdated', (updatedNotification) => {
      console.log('Received notificationUpdated:', updatedNotification);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n
        )
      );
      refetch();
    });

    return () => {
      socket.off('newRedemption');
      socket.off('notificationUpdated');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [refetch]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead({ notificationId, userId }).unwrap();
      showToast('Notification marked as read', 'success');
      refetch(); // Sync with backend after marking as read
    } catch (error) {
      showToast('Failed to mark notification as read', 'error');
    }
  };

  if (isError) {
    console.error('Error fetching notifications:', error);
    showToast('Failed to load notifications', 'error');
  }

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
        aria-label="Coupon Notifications"
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
      <CouponNotificationPanel
        showNotifications={showNotifications}
        closeNotifications={closeNotifications}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        userId={userId}
      />
    </div>
  );
};

export default CouponNotificationBell;