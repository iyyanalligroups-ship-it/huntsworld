// import { useEffect, useState } from 'react';
// import io from 'socket.io-client';
// import { useGetNotificationsQuery, useMarkNotificationAsReadMutation, useSendRedeemAmountMutation } from '@/redux/api/SubDealerApi';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { useSidebar } from '@/modules/admin/hooks/useSidebar';
// import { useToast } from '@/components/ui/use-toast';
// import { Loader2 } from 'lucide-react';

// const socket = io('http://localhost:5000');

// const RedeemNotification = ({ userId }) => {
//   const { isSidebarOpen } = useSidebar();
//   const { toast } = useToast();
//   const [notifications, setNotifications] = useState([]);
//   const { data, isLoading, isError } = useGetNotificationsQuery(userId);
//   const [markNotificationAsRead, { isLoading: markLoading }] = useMarkNotificationAsReadMutation();
//   const [sendRedeemAmount, { isLoading: sendLoading }] = useSendRedeemAmountMutation();

//   useEffect(() => {
//     if (data?.notifications) {
//       setNotifications(data.notifications);
//     }
//   }, [data]);

//   useEffect(() => {
//     socket.on('newRedemption', (notification) => {
//       setNotifications((prev) => [{ ...notification, isRead: false }, ...prev].slice(0, 10));
//     });

//     socket.on('notificationUpdated', (updatedNotification) => {
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n
//         )
//       );
//     });

//     return () => {
//       socket.off('newRedemption');
//       socket.off('notificationUpdated');
//     };
//   }, []);

//   const handleMarkAsRead = async (notificationId) => {
//     try {
//       await markNotificationAsRead({ notificationId, userId }).unwrap();
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n._id === notificationId ? { ...n, isRead: true } : n
//         )
//       );
//       toast({ title: 'Success', description: 'Notification marked as read' });
//     } catch (error) {
//       toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark notification as read' });
//     }
//   };

//   const handleSendAmount = async (notificationId) => {
//     try {
//       await sendRedeemAmount({ notificationId, userId }).unwrap();
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n._id === notificationId ? { ...n, amount_sent: true } : n
//         )
//       );
//       toast({ title: 'Success', description: 'Redeem amount sent successfully' });
//     } catch (error) {
//       toast({ variant: 'destructive', title: 'Error', description: error.data?.message || 'Failed to send redeem amount' });
//     }
//   };

//   return (
//     <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'} transition-all duration-300`}>
//       <Card>
//         <CardHeader>
//           <CardTitle>Admin Notifications</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="flex items-center justify-center">
//               <Loader2 className="h-6 w-6 animate-spin" />
//               <p className="ml-2">Loading notifications...</p>
//             </div>
//           ) : isError ? (
//             <p className="text-red-500">Failed to load notifications</p>
//           ) : notifications.length > 0 ? (
//             <ul className="space-y-4">
//               {notifications.map((notification) => (
//                 <li key={notification._id} className="flex items-center justify-between">
//                   <div>
//                     <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
//                       {notification.message}
//                     </p>
//                     <p className="text-xs text-muted-foreground">
//                       {new Date(notification.created_at).toLocaleString()}
//                     </p>
//                     <p className="text-xs text-muted-foreground">
//                       Amount Sent: <Badge variant={notification.amount_sent ? 'default' : 'secondary'}>
//                         {notification.amount_sent ? 'Yes' : 'No'}
//                       </Badge>
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Badge variant={notification.isRead ? 'secondary' : 'default'}>
//                       {notification.isRead ? 'Read' : 'Unread'}
//                     </Badge>
//                     {!notification.isRead && (
//                       <Button
//                         size="sm"
//                         onClick={() => handleMarkAsRead(notification._id)}
//                         disabled={markLoading}
//                       >
//                         {markLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as Read'}
//                       </Button>
//                     )}
//                     {!notification.amount_sent && (
//                       <Button
//                         size="sm"
//                         onClick={() => handleSendAmount(notification._id)}
//                         disabled={sendLoading}
//                       >
//                         {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Amount'}
//                       </Button>
//                     )}
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-sm text-muted-foreground">No notifications</p>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default RedeemNotification;
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation, useMarkNotificationAsUnreadMutation } from '@/redux/api/couponsNotificationApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import { Loader2 } from 'lucide-react';

const socket = io(import.meta.env.VITE_SOCKET_IO_URL,{
  withCredentials: true,
  transports: ["websocket"],
});

const RedeemNotifications = ({ userId }) => {
  const { isSidebarOpen } = useSidebar();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { data, isLoading, isError } = useGetNotificationsQuery(userId);
  const [markNotificationAsRead, { isLoading: markReadLoading }] = useMarkNotificationAsReadMutation();
  const [markNotificationAsUnread, { isLoading: markUnreadLoading }] = useMarkNotificationAsUnreadMutation();

  useEffect(() => {
    socket.emit('join', userId);

    if (data?.notifications) {
      setNotifications(data.notifications);
    }
  }, [data, userId]);

  useEffect(() => {
    socket.on('newRedemption', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    });

    socket.on('notificationUpdated', (updatedNotification) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n
        )
      );
    });

    return () => {
      socket.off('newRedemption');
      socket.off('notificationUpdated');
    };
  }, []);
const handleMarkAsRead = async (notificationId) => {
  try {
   const res= await markNotificationAsRead({ notificationId, userId }).unwrap();
   console.log(res);
   
    showToast('Notification marked as read', 'success');
  } catch (error) {
    showToast('Failed to mark notification as read', 'error');
  }
};

const handleMarkAsUnread = async (notificationId) => {
  try {
    await markNotificationAsUnread({ notificationId, userId }).unwrap();
    showToast('Notification marked as unread', 'success');
  } catch (error) {
    showToast('Failed to mark notification as unread', 'error');
  }
};

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="h-5 w-5" />
      </Button>
      {showNotifications && (
        <Card className="absolute right-0 mt-2 w-96 z-10">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="ml-2">Loading notifications...</p>
              </div>
            ) : isError ? (
              <p className="text-red-500">Failed to load notifications</p>
            ) : notifications.length > 0 ? (
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className="border-b pb-2 cursor-pointer"
                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                  >
                    <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">Merchant: {notification.merchantName}</p>
                    <p className="text-xs text-muted-foreground">Coupon: {notification.couponName}</p>
                    <p className="text-xs text-muted-foreground">Points: {notification.redeemPointsId.redeem_point}</p>
                    <p className="text-xs text-muted-foreground">Reason: {notification.redeemPointsId.reason}</p>
                    {notification.notes && (
                      <p className="text-xs text-muted-foreground">Notes: {notification.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                        {notification.isRead ? 'Read' : 'Unread'}
                      </Badge>
                      {notification.isRead ? (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsUnread(notification._id);
                          }}
                          disabled={markUnreadLoading}
                        >
                          {markUnreadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as Unread'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          disabled={markReadLoading}
                        >
                          {markReadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as Read'}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No notifications</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RedeemNotifications;