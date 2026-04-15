// import React, { useRef, useEffect, useContext } from 'react';
// import { X, CheckCheck, Bell } from 'lucide-react';
// // import { useNotifications } from '../context/NotificationContext';
// import NotificationItem from './NotificationItem';
// import { AuthContext } from '@/modules/landing/context/AuthContext';


// const NotificationPanel = () => {
//   // const {
//   //   notifications,
//   //   showNotifications,
//   //   closeNotifications,
//   //   markAllAsRead
//   // } = useNotifications();

//   const panelRef = useRef(null);
//   const {user}=useContext(AuthContext);

//   // Close notifications when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (panelRef.current && !panelRef.current.contains(event.target)) {
//         closeNotifications();
//       }
//     };

//     if (showNotifications) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [showNotifications, closeNotifications]);

//   if (!showNotifications) {
//     return null;
//   }

//   return (
//     <div
//       ref={panelRef}
//       className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden animate-fadeIn"
//     >
//       <div className="flex items-center justify-between p-4 border-b border-gray-100">
//         <div className="flex items-center">
//           <Bell size={18} className="text-gray-700 mr-2" />
//           <h3 className="font-medium">Notifications</h3>
//         </div>
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={()=> markAllAsRead(user?.user?._id)}
//             className="text-xs flex items-center text-blue-600 hover:text-blue-700 transition-colors"
//           >
//             <CheckCheck size={14} className="mr-1" />
//             Mark all as read
//           </button>
//           <button
//             onClick={closeNotifications}
//             className="text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <X size={18} />
//           </button>
//         </div>
//       </div>

//       <div className="max-h-[400px] overflow-y-auto">
//         {notifications.length === 0 ? (
//           <div className="py-6 px-4 text-center text-gray-500">
//             <p>No notifications yet</p>
//           </div>
//         ) : (
//           <div>
//             {notifications.map(notification => (
//               <NotificationItem key={notification._id} notification={notification} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default NotificationPanel;
