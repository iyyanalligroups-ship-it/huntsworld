// import React from 'react';
// import { Bell } from 'lucide-react';
// // import { useNotifications } from '../context/NotificationContext';
// import NotificationPanel from './NotificationPanel';
// import '../css/Animation.css';

// const NotificationBell = () => {
//   // const { unreadCount, toggleNotifications, showNotifications } = useNotifications();

//   return (
//     <div className="relative">
//       <button
//         onClick={toggleNotifications}
//         className="relative p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
//         aria-label="Notifications"
//       >
//         <Bell
//           size={18}
//           className={`text-gray-600 ${unreadCount > 0 ? 'shakeIcon' : ''}`}
//         />
//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
//             {unreadCount > 9 ? '9+' : unreadCount}
//           </span>
//         )}
//       </button>
//       <NotificationPanel />
//     </div>
//   );
// };

// export default NotificationBell;
