import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetPhoneNumberAccessRequestDetailsQuery,
  useMarkNotificationAsReadMutation,
  useApprovePhoneNumberAccessMutation,
  useRejectPhoneNumberAccessMutation,
} from '@/redux/api/PhoneNumberAccessApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, User as UserIcon, Mail, Phone, ShieldCheck, Check, X, Calendar } from 'lucide-react';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const PhoneNumberAccessDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  
  const { data, isLoading, isError, error } = useGetPhoneNumberAccessRequestDetailsQuery(id, {
    skip: !id,
  });

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [approvePhoneNumberAccess] = useApprovePhoneNumberAccessMutation();
  const [rejectPhoneNumberAccess] = useRejectPhoneNumberAccessMutation();

  useEffect(() => {
    if (data && !data?.data?.is_read) {
      markNotificationAsRead({ request_id: id, seller_id: userId })
        .unwrap()
        .catch(() => showToast('Failed to mark request as read', 'error'));
    }
  }, [data, id, userId]);

  const handleApprove = async () => {
    try {
      await approvePhoneNumberAccess({ request_id: id }).unwrap();
      showToast('Phone number access approved', 'success');
      navigate('/merchant/notifications/phone-number-access');
    } catch (error) {
      showToast('Failed to approve phone number access', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await rejectPhoneNumberAccess({ request_id: id }).unwrap();
      showToast('Phone number access rejected', 'success');
      navigate('/merchant/notifications/phone-number-access');
    } catch (error) {
      showToast('Failed to reject phone number access', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} p-4 lg:p-10 fade-in`}>
        <Card className="w-full max-w-4xl mx-auto border-0 shadow-md">
          <CardHeader className="bg-slate-50 border-b pb-6">
            <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex gap-6">
                 <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                 <div className="flex-1 space-y-3 pt-2">
                   <div className="h-5 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                   <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                   <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    showToast('Failed to load phone number access request details', 'error');
    return (
      <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} p-4`}>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          Error loading phone number access request details. Please try again later.
        </div>
      </div>
    );
  }

  const customer = data?.data?.customer_id || {};
  const isPending = data?.data?.status === 'pending';
  const roleName = customer?.role?.role || 'User';

  return (
    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} p-4 lg:p-8 bg-slate-50 min-h-screen font-sans`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Button */}
        <Button
          variant="ghost"
          className="hover:bg-slate-200/50 text-slate-600 transition-colors mb-2"
          onClick={() => navigate('/merchant/notifications/phone-number-access')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>

        <Card className="w-full border border-slate-200 shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white">
          
          {/* Header Section */}
          <div className="bg-[#0c1f4d] p-6 text-white flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Bell className="text-amber-400" size={24} />
                Access Request
              </h2>
              <p className="text-slate-300 text-sm">
                Review contact information access request safely.
              </p>
            </div>
            
            <Badge 
              className={`px-3 py-1 shadow-sm text-xs font-bold uppercase tracking-wider ${
                isPending 
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' 
                  : data?.data?.status === 'approved' 
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-red-100 text-red-800 hover:bg-red-100'
              }`}
            >
              {data?.data?.status || 'Unknown'}
            </Badge>
          </div>

          <CardContent className="p-0">
            
            {/* Customer Profile Section */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                {/* Avatar */}
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white shrink-0">
                  {customer?.name ? customer.name.substring(0, 1).toUpperCase() : 'U'}
                </div>

                {/* Info Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="space-y-1">
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Full Name</p>
                     <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                       <UserIcon size={18} className="text-blue-500" />
                       {customer?.name || 'Unknown'}
                     </div>
                  </div>
                  
                  <div className="space-y-1">
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                     <div className="flex items-center gap-2 text-slate-700">
                       <Mail size={16} className="text-slate-400" />
                       {customer?.email || 'N/A'}
                     </div>
                  </div>

                  <div className="space-y-1">
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Phone Number</p>
                     <div className="flex items-center gap-2 text-slate-700">
                       <Phone size={16} className="text-slate-400" />
                       {customer?.phone || 'Not Provided'}
                     </div>
                  </div>

                  <div className="space-y-1">
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Account Role</p>
                     <div className="flex items-center gap-2 text-slate-700">
                       <ShieldCheck size={16} className="text-emerald-500" />
                       <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase shadow-sm">
                         {roleName}
                       </span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Details Section */}
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                   Message from Requestor
                </h3>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {data?.data?.message || 'Standard phone number access request. No additional message provided.'}
                </p>
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={handleApprove} 
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-md shadow-lg shadow-green-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Approve Access
                  </Button>
                  <Button 
                    onClick={handleReject} 
                    variant="outline"
                    className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <X size={20} />
                    Decline Request
                  </Button>
                </div>
              )}
              
              {!isPending && (
                <div className={`p-4 rounded-xl border ${data?.data?.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} text-center mt-6`}>
                   <p className={`font-semibold ${data?.data?.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                     This request has been {data?.data?.status.toUpperCase()}
                   </p>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhoneNumberAccessDetail;
