import React, { useState, useEffect, useContext } from 'react';
import { Bell } from 'lucide-react';
import io from 'socket.io-client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import showToast from '@/toast/showToast';
import { useGetPhoneNumberAccessRequestsQuery } from '@/redux/api/PhoneNumberAccessApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const GlobalNotificationBell = () => {
  const [open, setOpen] = useState(false);
  const {user}=useContext(AuthContext);
  const userId=user?.user?._id;
  const [phoneNotifications, setPhoneNotifications] = useState([]);

  const { data: phoneData, refetch: refetchPhone } = useGetPhoneNumberAccessRequestsQuery(userId, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  });

  const phoneSocket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/phone-number-access-notifications`, {
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  useEffect(() => {
    phoneSocket.on('connect', () => {
      phoneSocket.emit('join', userId); // userId is merchant_id
    });
    phoneSocket.on('receiveMessage', (notification) => {
      setPhoneNotifications((prev) => [notification, ...prev].slice(0, 10));
      showToast(`New Phone Number Access Request from ${notification.customer_id?.name || 'a user'}`, 'success');
      refetchPhone();
    });
    phoneSocket.on('connect_error', (err) => {
      console.error('🔴 Socket connection error:', err.message);
      showToast('Failed to connect to notification server', 'error');
    });

    return () => {
      phoneSocket.off('receiveMessage');
      phoneSocket.off('connect');
      phoneSocket.off('connect_error');
      phoneSocket.disconnect();
    };
  }, [userId, refetchPhone]);

  useEffect(() => {
    if (phoneData?.requests) {
      setPhoneNotifications(phoneData.requests);
    }
  }, [phoneData]);

  const phoneUnread = phoneNotifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
            aria-label="Notifications"
          >
            <Bell size={18} className={`text-gray-600 ${phoneUnread > 0 ? 'shakeIcon' : ''}`} />
            {phoneUnread > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {phoneUnread > 9 ? '9+' : phoneUnread}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          align="end"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium">Notifications</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <Link
              to="/merchant/notifications/phone-number-access"
              className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-500" />
                <span>Phone Number Access Requests</span>
              </div>
              {phoneUnread > 0 && <Badge variant="secondary">{phoneUnread}</Badge>}
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GlobalNotificationBell;