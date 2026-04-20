import { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search, CircleCheck, CircleX, CircleAlert, RefreshCw, Eye } from 'lucide-react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  useCheckUserSubscriptionQuery,
  useSearchMerchantsQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import {
  useGetUserTrustSealStatusQuery,
  useGetTrustSealRequestsQuery,
  useGetTrustSealPriceQuery,
  useGetMerchantTrustSealDetailsQuery,
} from '@/redux/api/TrustSealRequestApi';
import AdminTrustSealPlanManagement from './AdminTrustSealPlanManagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import TrustSealCertificate from './TrustSealCertificate';

const AdminTrustSealManagement = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [page, setPage] = useState(1);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const limit = 10;

  const { data: configData, isLoading: isConfigLoading } = useGetTrustSealPriceQuery();
  const { data: searchResults, isLoading: isSearchLoading } = useSearchMerchantsQuery(debouncedSearch, { skip: !debouncedSearch || debouncedSearch.length < 3 });
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: trustSealData, isLoading: isTrustSealLoading, isFetching: isTrustSealFetching, refetch: refetchTrustSeal } = useGetUserTrustSealStatusQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: activeRequestsData, isLoading: isActiveRequestsLoading, isFetching: isActiveRequestsFetching, refetch: refetchActiveRequests } = useGetTrustSealRequestsQuery({
    page,
    limit,
    status: 'verified',
  });
  const { data: merchantDetails, isLoading: isMerchantDetailsLoading } = useGetMerchantTrustSealDetailsQuery({userId:selectedTargetUser?._id}, { skip: !selectedTargetUser || !isCertificateModalOpen });

  console.log(merchantDetails, 'certificate');

  const trustSealAmount = configData?.data?.price || 500;

  const handleTrustSealRefresh = async () => {
    await Promise.all([refetchTrustSeal(), refetchActiveRequests()]);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (searchResults?.length > 0) {
      setSelectedTargetUser(searchResults[0]);
    } else {
      setSelectedTargetUser(null);
    }
  }, [searchResults]);

  const handleSelectUser = (user) => {
    setSelectedTargetUser(user);
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const paginatedData = activeRequestsData?.data || [];
  const totalPages = activeRequestsData ? Math.ceil(activeRequestsData.total / limit) : 1;


  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy, HH:mm');
  };

 
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CircleCheck className="w-4 h-4" /> Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CircleX className="w-4 h-4" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> {status || 'Unknown'}
          </Badge>
        );
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <CircleCheck className="w-4 h-4" /> Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CircleX className="w-4 h-4" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> {paymentStatus || 'Unknown'}
          </Badge>
        );
    }
  };

  if (isConfigLoading || !user) {
    return (
      <div className="flex justify-center items-center p-4 sm:p-6 bg-[#f0f4f6] rounded-xl min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
        <span className="ml-3 text-gray-700 text-base sm:text-lg font-medium">Loading trust seal management...</span>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${
      isSidebarOpen ? 'ml-0 sm:ml-64' : 'ml-0 sm:ml-16'
    } max-w-full`}>
      <div className="text-center mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0c1f4d]">Admin Trust Seal Management</h2>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage trust seals for merchants. Cost: ₹{trustSealAmount.toFixed(2)}.</p>
      </div>

      <div className="relative mb-6 w-full max-w-md mx-auto sm:max-w-lg">
        <Input
          placeholder="Search merchant by email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 text-sm sm:text-base"
        />
        <Search className="absolute right-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        {isSearchLoading && <p className="text-sm text-gray-600 mt-2">Searching...</p>}
        {searchResults && searchResults.length > 0 && (
          <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-60 overflow-auto">
            {searchResults.map((user) => (
              <li
                key={user._id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm sm:text-base"
                onClick={() => handleSelectUser(user)}
              >
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span>{user.name || 'Unnamed'} ({user.email})</span>
                  <span className="text-sm text-gray-500">{user.phone}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedTargetUser && (
        <>
          <h3 className="text-lg sm:text-xl font-semibold text-[#0c1f4d] mb-4">
            Managing for {selectedTargetUser.name || selectedTargetUser.email}
          </h3>
          {isSubscriptionLoading || isTrustSealLoading || isTrustSealFetching ? (
            <div className="flex justify-center items-center p-4 sm:p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
              <span className="ml-3 text-gray-700 text-base sm:text-lg font-medium">Loading...</span>
            </div>
          ) : (
            <>
              {!subscriptionData?.hasSubscription && (
                <p className="text-red-600 mt-2 mb-4 text-sm sm:text-base">This merchant does not have an active subscription.</p>
              )}
              <AdminTrustSealPlanManagement
                targetUser={selectedTargetUser}
                hasSubscription={subscriptionData?.hasSubscription}
                trustSealRequest={trustSealData?.trustSealRequest}
                onRefresh={handleTrustSealRefresh}
                trustSealAmount={trustSealAmount}
                subscriptionId={subscriptionData?.subscriptionId}
              />
              {trustSealData?.trustSealRequest?.status === 'verified' && (
                <Dialog open={isCertificateModalOpen} onOpenChange={setIsCertificateModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Trust Seal Certificate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Trust Seal Certificate</DialogTitle>
                    </DialogHeader>
                    {isMerchantDetailsLoading ? (
                      <div className="flex justify-center items-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
                      </div>
                    ) : (
                      <TrustSealCertificate
                        companyName={merchantDetails?.companyName || selectedTargetUser.name}
                        address={merchantDetails?.address?.fullAddress || 'N/A'}
                        director={merchantDetails?.director || 'N/A'}
                        gstin={merchantDetails?.gstin || 'N/A'}
                        iec={merchantDetails?.iec || 'N/A'}
                        mobile={selectedTargetUser?.phone || 'N/A'}
                        email={selectedTargetUser.email || 'N/A'}
                        issueDate={trustSealData?.trustSealRequest?.issueDate || new Date()}
                        expiryDate={trustSealData?.trustSealRequest?.expiryDate || new Date()}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </>
      )}

      <Card className="border-[#0c1f4d] rounded-xl shadow-md mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl font-bold text-[#0c1f4d]">Active Trust Seal Users</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTrustSealRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isActiveRequestsLoading || isActiveRequestsFetching ? (
            <p className="text-center text-gray-600 text-sm sm:text-base">Loading...</p>
          ) : paginatedData?.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Email</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Contact</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Amount (₹)</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Payment Status</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Created At</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Updated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((request) => (
                      <TableRow
                        key={request._id}
                        onClick={() => handleSelectUser(request.user_id)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={request.user_id?.avatarUrl} alt={request.user_id?.name} />
                              <AvatarFallback>
                                {request.user_id?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{request.user_id?.name || 'Unnamed'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{request.user_id?.email}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{request.user_id?.phone}</TableCell>
                        <TableCell
                          className={`text-xs sm:text-sm font-medium ${
                            request.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {request.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {getPaymentStatusBadge(request.payment_status || 'Paid')}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatDate(request.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-4 justify-end items-center mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white w-8 h-8 sm:w-10 sm:h-10"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <span className="text-xs sm:text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white w-8 h-8 sm:w-10 sm:h-10"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-600 text-sm sm:text-base">No active trust seal users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTrustSealManagement;