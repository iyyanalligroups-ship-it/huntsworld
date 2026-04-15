import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import io from 'socket.io-client';
import { useGetTrustSealRequestsQuery } from '@/redux/api/TrustSealRequestApi';
import showToast from '@/toast/showToast';
import TrustSealNotificationPanel from './TrustSealNotificationPanel';

const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/trust-seal-notifications`, {
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const TrustSealNotificationBell = ({ userId }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { data, isLoading, isError, error, refetch } = useGetTrustSealRequestsQuery(
    { page: 1, limit: 10, status: 'pending' },
    {
      refetchOnMountOrArgChange: true,
      pollingInterval: 30000,
    }
  );

  useEffect(() => {
    socket.on('connect', () => {
      console.log('🟢 [TrustSeal] Socket connected:', socket.id);
      socket.emit('join', 'admin');
      console.log('🟢 [TrustSeal] Emitted join for admin room');
    });

    socket.on('connect_error', (err) => {
      console.error('🔴 [TrustSeal] Socket connection error:', err.message);
      showToast('Failed to connect to notification server', 'error');
    });

    socket.on('newTrustSealRequest', (notification) => {
      console.log('🟢 [TrustSeal] Received newTrustSealRequest:', notification);
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
      showToast(`New Trust Seal Request from ${notification.merchantName}`, 'success');
      refetch();
    });

    socket.on('trustSealPaymentVerified', (notification) => {
      console.log('🟢 [TrustSeal] Received trustSealPaymentVerified:', notification);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, ...notification } : n))
      );
      showToast(`Trust Seal Payment Verified for ₹${notification.amount}`, 'success');
      refetch();
    });

    socket.on('trustSealNotificationRead', (notification) => {
      console.log('🟢 [TrustSeal] Received trustSealNotificationRead:', notification);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: notification.isRead } : n))
      );
      refetch();
    });

    // Fallback for initial notifications
    if (data?.data) {
      console.log('🟢 [TrustSeal] Fetched trust seal requests:', data.data);
      setNotifications(data.data);
    }

    return () => {
      socket.off('newTrustSealRequest');
      socket.off('trustSealPaymentVerified');
      socket.off('trustSealNotificationRead');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [data, refetch]);

  if (isError) {
    console.error('🔴 [TrustSeal] Error fetching trust seal requests:', error);
    showToast('Failed to load notifications', 'error');
  }

  const unreadCount = notifications.filter((n) => n.status === 'pending' && !n.isRead).length;

  const toggleNotifications = () => {
    console.log('🟢 [TrustSeal] Toggling notifications, current state:', showNotifications);
    setShowNotifications((prev) => !prev);
  };

  const closeNotifications = () => {
    console.log('🟢 [TrustSeal] Closing notifications');
    setShowNotifications(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
        aria-label="Trust Seal Notifications"
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
      <TrustSealNotificationPanel
        showNotifications={showNotifications}
        closeNotifications={closeNotifications}
        notifications={notifications}
        userId={userId}
      />
    </div>
  );
};

export default TrustSealNotificationBell;