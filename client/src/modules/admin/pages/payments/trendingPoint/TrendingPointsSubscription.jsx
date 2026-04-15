
import { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search, CircleCheck, CircleX, CircleAlert } from 'lucide-react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  useGetTrendingPointsConfigQuery,
  useCheckUserSubscriptionQuery,
  useGetAllActiveTrendingPointUsersQuery,
  useSearchMerchantsQuery,
  useGetActiveTrendingPointsQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import AdminTrendingPointsPlanManagement from './TrendingPointsPlanManagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const AdminTrendingPointsManagement = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: configData, isLoading: isConfigLoading } = useGetTrendingPointsConfigQuery();
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useSearchMerchantsQuery(debouncedSearch, { skip: !debouncedSearch || debouncedSearch.length < 3 });
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: activeTrendingPointsData, isLoading: isTrendingPointsLoading, isFetching, refetch } = useGetActiveTrendingPointsQuery(selectedTargetUser?._id, { skip: !selectedTargetUser });
  const { data: activeUsersData, isLoading: isActiveUsersLoading } = useGetAllActiveTrendingPointUsersQuery();

  const pointRate = configData?.pointRate || 45 / 100;

  const handleTrendingPointsRefresh = async () => {
    await refetch();
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('Debounced search value:', search);
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(handler);
  }, [search]);

  // Set selected user based on search results
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

  const paginatedData = activeUsersData?.data
    ? activeUsersData.data.slice((page - 1) * limit, page * limit)
    : [];
  const totalPages = activeUsersData ? Math.ceil(activeUsersData.total / limit) : 1;

  // Format date to professional style
  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy, HH:mm');
  };

  // Map status to badge variants and icons
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CircleCheck className="w-4 h-4" /> Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 flex items-center gap-1">
            <CircleX className="w-4 h-4" /> Inactive
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

  // Map payment status to badge variants and icons
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
        <span className="ml-3 text-gray-700 text-base sm:text-lg font-medium">Loading trending points management...</span>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-64' : 'ml-0 sm:ml-16'
      } max-w-full`}>
      <div className="text-center mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0c1f4d]">Admin Trending Points Management</h2>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage trending points for merchants. Cost: ₹{pointRate.toFixed(2)} per point.</p>
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
          {isSubscriptionLoading || isTrendingPointsLoading || isFetching ? (
            <div className="flex justify-center items-center p-4 sm:p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
              <span className="ml-3 text-gray-700 text-base sm:text-lg font-medium">Loading...</span>
            </div>
          ) : (
            <>
              {!subscriptionData?.hasSubscription && (
                <p className="text-red-600 mt-2 mb-4 text-sm sm:text-base">This merchant does not have an active subscription.</p>
              )}
              <AdminTrendingPointsPlanManagement
                targetUser={selectedTargetUser}
                hasSubscription={subscriptionData?.hasSubscription}
                subscriptionId={subscriptionData?.subscriptionId}
                activeTrendingPointsPayment={activeTrendingPointsData?.trendingPointsPayment}
                pendingTrendingPointsPayment={activeTrendingPointsData?.pendingTrendingPointsPayment}
                onRefresh={handleTrendingPointsRefresh}
                pointRate={pointRate}
              />
            </>
          )}
        </>
      )}

      <Card className="border-[#0c1f4d] rounded-xl shadow-md mt-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold text-[#0c1f4d]">Active Trending Points Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isActiveUsersLoading ? (
            <p className="text-center text-gray-600 text-sm sm:text-base">Loading...</p>
          ) : paginatedData?.length > 0 ? (
            <>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Email</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Contact</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Points</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Amount (₹)</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Payment Status</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Created At</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold text-gray-700">Updated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((payment) => (
                      <TableRow
                        key={payment._id}
                        onClick={() => handleSelectUser(payment.user_id)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={payment.user_id?.avatarUrl} alt={payment.user_id?.name} />
                              <AvatarFallback>
                                {payment.user_id?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{payment.user_id?.name || 'Unnamed'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{payment.user_id?.email}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{payment.user_id?.phone}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{payment.points}</TableCell>
                        <TableCell
                          className={`text-xs sm:text-sm font-medium ${payment.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          {payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{getPaymentStatusBadge(payment.payment_status)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatDate(payment.created_at)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatDate(payment.updated_at)}</TableCell>
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
            <p className="text-center text-gray-600 text-sm sm:text-base">No active trending points users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTrendingPointsManagement;
