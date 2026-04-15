import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, User as UserIcon, Calendar, Clock, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  useGetPhoneNumberAccessRequestsQuery,
  useMarkNotificationAsReadMutation,
} from '@/redux/api/PhoneNumberAccessApi';

const GlobalNotificationsPage = () => {
  const { isSidebarOpen } = useSidebar();
  const { user, isLoading: isAuthLoading } = useContext(AuthContext);
  const userId = user?.user?._id; // Adjust based on your AuthContext structure
  console.log('AuthContext user:', user, 'userId:', userId);

  const navigate = useNavigate();
  const [phoneNotifications, setPhoneNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  const { data: phoneData, isLoading, isError, refetch } = useGetPhoneNumberAccessRequestsQuery(
    { seller_id: userId, page, limit },
    { skip: !userId || isAuthLoading, refetchOnMountOrArgChange: true }
  );
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();

  useEffect(() => {
    console.log('Query params:', { seller_id: userId, page, limit });
    if (!userId && !isAuthLoading) {
      showToast('Please log in to view notifications', 'error');
    }
  }, [userId, isAuthLoading]);

  useEffect(() => {
    if (phoneData?.requests) {
      if (page === 1) {
        setPhoneNotifications(phoneData.requests);
      } else {
        setPhoneNotifications((prev) => [...prev, ...phoneData.requests]);
      }
      setHasMore(phoneData.pagination.hasMore);
    }
    if (isError) {
      console.error('Query error:', isError);
      showToast('Failed to load phone number access requests', 'error');
    }
  }, [phoneData, isError, page]);

  const handleMarkAsRead = async (notification) => {
    if (!userId) {
      showToast('Please log in to perform this action', 'error');
      return;
    }
    if (!notification.is_read) {
      try {
        await markNotificationAsRead({ request_id: notification._id, seller_id: userId }).unwrap();
        showToast('Request marked as read', 'success');
        refetch();
      } catch (error) {
        showToast('Failed to mark request as read', 'error');
      }
    }
    navigate(`/merchant/notifications/phone-number-access/${notification._id}`);
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) {
      showToast('Please log in to perform this action', 'error');
      return;
    }
    try {
      for (const notification of phoneNotifications.filter((n) => !n.is_read)) {
        await markNotificationAsRead({ request_id: notification._id, seller_id: userId }).unwrap();
      }
      showToast('All requests marked as read', 'success');
      refetch();
    } catch (error) {
      showToast('Failed to mark all requests as read', 'error');
    }
  };

  const handleLoadMore = () => {
    if (!userId) {
      showToast('Please log in to load more requests', 'error');
      return;
    }
    setPage((prev) => prev + 1);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (isAuthLoading) {
    return (
      <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} p-4`}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={24} className="text-blue-500" />
              Phone Number Access Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-6 px-4 text-center text-gray-500">
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} p-4`}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={24} className="text-blue-500" />
              Phone Number Access Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-6 px-4 text-center text-gray-500">
              <p>Please log in to view phone number access requests</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} p-4`}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={24} className="text-blue-500" />
              Phone Number Access Requests
            </div>
            {phoneNotifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs flex items-center text-blue-600 hover:text-blue-700"
              >
                <CheckCheck size={14} className="mr-1" />
                Mark all as Read
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <div>
         <div>
<span> this is text
</span>
         </div>
        </div>
        <CardContent>
          {isLoading && page === 1 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                      <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : phoneNotifications.length === 0 ? (
            <div className="py-6 px-4 text-center text-gray-500">
              <p>No phone number access requests yet</p>
            </div>
          ) : (
            <>
              <div className="max-h-[600px] overflow-y-auto pt-2">
                {phoneNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleMarkAsRead(notification)}
                    className={`group mb-4 mx-1 p-5 cursor-pointer rounded-xl border transition-all duration-300 relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                      notification.is_read 
                        ? "bg-white border-slate-100" 
                        : "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100 ring-1 ring-blue-50"
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {!notification.is_read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-lg shadow-blue-400" />
                    )}

                    {/* LEFT SIDE: Avatar & Core Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`mt-1 flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm shadow-inner ${
                        notification.is_read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"
                      }`}>
                        {notification.customer_id?.name ? notification.customer_id.name.substring(0, 1).toUpperCase() : <UserIcon size={16} />}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <h3 className={`text-sm tracking-tight ${notification.is_read ? "text-slate-600 font-medium" : "text-slate-900 font-bold"}`}>
                             {notification.customer_id?.name || "Anonymous User"}
                           </h3>
                           {notification.customer_id?.role?.role && (
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                               {notification.customer_id.role.role}
                             </span>
                           )}
                        </div>
                        
                        <p className={`text-xs leading-relaxed ${notification.is_read ? "text-slate-500" : "text-slate-700"}`}>
                           {notification.message || "Requested access to your phone number."}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                             <Clock size={12} />
                             {formatTime(notification.createdAt || notification.created_at || notification.request_date)}
                           </div>
                           <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                             notification.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                             notification.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {notification.status?.toUpperCase()}
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE: Action Indicator */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-0 pt-3 md:pt-0">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full group-hover:bg-slate-100 transition-colors">
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalNotificationsPage;