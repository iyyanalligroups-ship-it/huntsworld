import React, { useState } from 'react';
import { useGetAccessRequestsQuery, useGetUserByIdQuery, useApproveAccessMutation, useRejectAccessMutation } from '@/redux/api/SubAdminAccessRequestApi';
import showToast from '@/toast/showToast';

const AccessRequests = () => {
  const { data: requests, refetch } = useGetAccessRequestsQuery();
  const [selectedSubadminId, setSelectedSubadminId] = useState(null);
  const { data: subadminDetails } = useGetUserByIdQuery(selectedSubadminId, { skip: !selectedSubadminId });
  const [approveAccess] = useApproveAccessMutation();
  const [rejectAccess] = useRejectAccessMutation();
  const [selectedPermissions, setSelectedPermissions] = useState({});

  const handleSelectSubadmin = (id) => {
    setSelectedSubadminId(id);
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
      refetch();
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
      refetch();
    } catch (error) {
      showToast('Failed to reject access', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Access Requests</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold">Requests List</h2>
          {requests?.requests.map(req => (
            <div key={req._id} className="border p-2 mb-2">
              <p>Requester: {req.requester_id.name}</p>
              <p>Requested Permissions: {req.permissions.map(p => `${p.page} (${p.actions.join(', ')})`).join(', ')}</p>
              {req.approved_permissions?.length > 0 && (
                <p>Approved Permissions: {req.approved_permissions.map(p => `${p.page} (${p.actions.join(', ')})`).join(', ')}</p>
              )}
              <p>Status: {req.status}</p>
              {req.status === 'pending' && (
                <div>
                  <p className="text-sm font-semibold">Select Permissions to Approve:</p>
                  {req.permissions.map(perm => (
                    <div key={perm.page} className="ml-2 mt-1">
                      <p className="text-sm font-medium">{perm.page}</p>
                      <div className="grid grid-cols-1 gap-1">
                        {perm.actions.map(action => (
                          <label key={action} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              value={action}
                              checked={selectedPermissions[req._id]?.find(p => p.page === perm.page)?.actions.includes(action) || false}
                              onChange={() => handleCheckboxChange(req._id, perm.page, action)}
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
                      onClick={() => handleApprove(req._id, req.permissions)}
                      className="bg-green-500 text-white px-2 py-1 mr-2"
                    >
                      Approve Selected
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      className="bg-red-500 text-white px-2 py-1"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => handleSelectSubadmin(req.requester_id._id)}
                className="bg-[#0c1f4d] text-white px-2 py-1 ml-2 mt-2"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
        <div>
          {selectedSubadminId && subadminDetails && (
            <>
              <h2 className="text-lg font-semibold">Subadmin Details: {subadminDetails.name}</h2>
              <p>Role: {subadminDetails.role?.role || 'N/A'}</p>
              <p>Current Permissions: {subadminDetails.permissions?.map(p => `${p.page} (${p.actions.join(', ')})`).join(', ') || 'None'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessRequests;