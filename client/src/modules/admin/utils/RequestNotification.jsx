import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import "../css/Animation.css"



const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/redeem`, {
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const RequestNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socket.on('receiveMessage', (notification) => {
      console.log('🟢 [Redeem] Received receiveMessage:', notification);
      setNotifications((prev) => [
        {
          _id: notification._id || new Date().getTime().toString(),
          message: notification.content,
          timestamp: new Date(notification.createdAt || new Date()),
          isRead: false,
        },
        ...prev,
      ]);
    });
    return () => {
      socket.off('newNotification'); // Clean up when the component is unmounted
    };
  }, []);

  return (
    <div>
      {notifications.length > 0 && (
        <div className="notification-dropdown">
          <h3>New Notifications</h3>
          <ul>
            {notifications.map((notif, index) => (
              <li key={index}>{notif.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RequestNotification;
