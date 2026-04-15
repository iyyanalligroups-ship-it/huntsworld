import React, { useRef, useState, useEffect } from 'react';
import { X, CheckCheck, Bell } from 'lucide-react';
import {
  useApproveAccessMutation,
  useRejectAccessMutation,
  useMarkNotificationAsReadMutation,
} from '@/redux/api/SubAdminAccessRequestApi';
import showToast from '@/toast/showToast';
import { useNavigate } from 'react-router-dom';

const AccessRequestNotificationPanel = ({
  showNotifications,
  closeNotifications,
  notifications,
  handleMarkAsRead,
  userId,
}) => {
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const [approveAccess] = useApproveAccessMutation();
  const [rejectAccess] = useRejectAccessMutation();
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [selectedPermissions, setSelectedPermissions] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        closeNotifications();
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, closeNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      for (const notification of notifications.filter((n) => !n.is_read)) {
        await markNotificationAsRead({ request_id: notification._id }).unwrap();
      }
      showToast('All notifications marked as read', 'success');
      navigate('/admin/access-requests');
    } catch (error) {
      showToast('Failed to mark all notifications as read', error);
    }
  };

  const handleCheckboxChange = (requestId, page, action) => {
    setSelectedPermissions(prev => {
      const requestPerms = prev[requestId] || [];
      const pagePerm = requestPerms.find(p => p.page === page) || { page, actions: [] };
      const newActions = pagePerm.actions.includes(action)
        ? pagePerm.actions.filter(a => a !== action)
        : [...pagePerm.actions, action];
      const newRequestPerms = requestPerms.filter(p => p.page !== page);
      if (newActions.length > 0) {
        newRequestPerms.push({ page, actions: newActions });
      }
      return { ...prev, [requestId]: newRequestPerms };
    });
  };

  const handleApprove = async (requestId, requestedPermissions) => {
    const approvedPermissions = selectedPermissions[requestId] || [];
    if (approvedPermissions.length === 0) {
      showToast('Select at least one page and action to approve', 'error');
      return;
    }
    try {
      await approveAccess({ request_id: requestId, approved_permissions: approvedPermissions }).unwrap();
      showToast(`Access approved for ${approvedPermissions.length} permission(s)`, 'success');
      setSelectedPermissions(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    } catch (error) {
      showToast('Failed to approve access', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectAccess({ request_id: requestId }).unwrap();
      showToast('Access rejected', 'success');
      setSelectedPermissions(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    } catch (error) {
      showToast('Failed to reject access', error);
    }
  };

  if (!showNotifications) {
    return null;
  }

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

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden animate-fadeIn"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Bell size={18} className="text-gray-700 mr-2" />
          <h3 className="font-medium">Access Request Notifications</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <CheckCheck size={14} className="mr-1" />
            Mark all as read & Manage
          </button>
          <button
            onClick={closeNotifications}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-6 px-4 text-center text-gray-500">
            <p>No access requests yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.is_read && handleMarkAsRead(notification._id)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative ${
                  notification.is_read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Bell size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                      {notification.message || 'Access request'}
                    </p>
                    <p className="text-xs text-gray-500">Requester: {notification.requester_id.name}</p>
                    <p className="text-xs text-gray-500">
                      Requested Permissions: {notification.permissions.map(p => `${p.page} (${p.actions.join(', ')})`).join(', ')}
                    </p>
                    {notification.approved_permissions?.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Approved Permissions: {notification.approved_permissions.map(p => `${p.page} (${p.actions.join(', ')})`).join(', ')}
                      </p>
                    )}
                    {notification.status === 'pending' && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold">Select Permissions to Approve:</p>
                        {notification.permissions.map(perm => (
                          <div key={perm.page} className="ml-2 mt-1">
                            <p className="text-xs font-medium">{perm.page}</p>
                            <div className="grid grid-cols-1 gap-1">
                              {perm.actions.map(action => (
                                <label key={action} className="flex items-center text-xs">
                                  <input
                                    type="checkbox"
                                    value={action}
                                    checked={selectedPermissions[notification._id]?.find(p => p.page === perm.page)?.actions.includes(action) || false}
                                    onChange={() => handleCheckboxChange(notification._id, perm.page, action)}
                                    className="mr-1"
                                  />
                                  {action.charAt(0).toUpperCase() + action.slice(1)}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleApprove(notification._id, notification.permissions)}
                            className="text-xs text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded"
                          >
                            Approve Selected
                          </button>
                          <button
                            onClick={() => handleReject(notification._id)}
                            className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Status: {notification.status}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{formatTime(notification.created_at)}</span>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-[#0c1f4d] absolute top-3 right-8"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessRequestNotificationPanel;