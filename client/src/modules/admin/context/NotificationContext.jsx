

// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { io } from 'socket.io-client';
// import {
//   useMarkNotificationAsReadMutation,
//   useMarkAllNotificationsAsReadMutation,
// } from '@/redux/api/PermissionRequestApi';
// import { AuthContext } from '@/modules/landing/context/AuthContext';

// const NotificationContext = createContext();

// export const NotificationProvider = ({ children }) => {
//   const { user } = useContext(AuthContext);
//   const userId = user?.user?._id
//   const [notifications, setNotifications] = useState([]);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [socket, setSocket] = useState(null);
//   // const { data, isLoading, isError } =
//   //   useGetPermissionRequestsMappingQuery(
//   //     { filter: "all", adminId: userId },
//   //     { skip: !userId }
//   //   );

//   const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
//   const [markAllNotificationsAsRead] = useMarkAllNotificationsAsReadMutation();

//   // useEffect(() => {
//   //   if (data?.data && Array.isArray(data?.data)) {
//   //     const formatted = data?.data.map(n => ({
//   //       ...n,
//   //       timestamp: new Date(n.createdAt),
//   //       isRead: n.isRead || false, // comes from DB
//   //     }));
//   //     setNotifications(formatted);
//   //   }
//   // }, [data]);
//   useEffect(() => {
//     const newSocket = io(import.meta.env.VITE_SOCKET_IO_URL, {
//       withCredentials: true,
//       transports: ["websocket"],
//     });
//     setSocket(newSocket);

//     newSocket.on('newNotification', (notification) => {
//       setNotifications(prev => [
//         {
//           ...notification,
//           timestamp: new Date(notification.timestamp || new Date()),
//           isRead: false,
//         },
//         ...prev,
//       ]);
//     });

//     return () => {
//       newSocket.disconnect();
//     };
//   }, []);
//   const unreadCount = notifications.filter(n => !n.isRead).length;
//   const markAsRead = async (permission_id, adminId) => {
//     try {

//       const response = await markNotificationAsRead({ permissionRequestId: permission_id, adminId }).unwrap();
//       console.log(response, "res");

//       setNotifications(prev =>
//         prev.map(notification =>
//           notification._id === response?.data?.permissionRequest_id
//             ? { ...notification, isRead: true }
//             : notification
//         )
//       );
//     } catch (error) {
//       console.error("Failed to mark as read:", error);
//     }
//   };
//   const markAllAsRead = async (adminId) => {
//     try {
//       // const adminId = currentUser?._id;
//       await markAllNotificationsAsRead(adminId).unwrap();

//       setNotifications(prev =>
//         prev.map(notification => ({ ...notification, isRead: true }))
//       );
//     } catch (error) {
//       console.error("Failed to mark all as read:", error);
//     }
//   };

//   const toggleNotifications = () => {
//     setShowNotifications(prev => !prev);
//   };

//   const closeNotifications = () => {
//     setShowNotifications(false);
//   };

//   return (
//     <NotificationContext.Provider
//       value={{
//         notifications,
//         unreadCount,
//         showNotifications,
//         toggleNotifications,
//         markAsRead,
//         markAllAsRead,
//         closeNotifications,
//         isLoading,
//         isError
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };
// export const useNotifications = () => {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error('useNotifications must be used within a NotificationProvider');
//   }
//   return context;
// };
