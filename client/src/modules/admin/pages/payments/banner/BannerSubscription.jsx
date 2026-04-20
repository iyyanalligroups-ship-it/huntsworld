import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetAllActiveBannerPaymentsQuery } from '@/redux/api/BannerPaymentApi';
import { useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AdminBannerPlanManagement from './BannerPlanManagement';
import { Edit, X, RefreshCw, Search, IndianRupee } from 'lucide-react';
import showToast from '@/toast/showToast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const BannerSubscription = () => {

  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionMode, setActionMode] = useState(null);
  const limit = 5;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });

  useEffect(() => {
    if (searchResults?.users?.length > 0) {
      setSelectedSeller(searchResults.users[0]);
    } else {
      setSelectedSeller(null);
    }
  }, [searchResults]);

  const { data: activeBannerPayments, isLoading: isBannerPaymentsLoading, refetch: refetchBannerPayments } = useGetAllActiveBannerPaymentsQuery({ page, limit });

  const totalPages = activeBannerPayments?.pages || 1;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchBannerPayments();
      setSearchInput('');
      setDebouncedSearch('');
      setSelectedSeller(null);
    } catch (error) {
      showToast('Failed to refresh banner data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRandomBg = (name) => {
    const colors = ["#E63946", "#1D3557", "#457B9D", "#A8DADC", "#F4A261", "#2A9D8F", "#8D99AE"];
    const index = name?.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`flex-1 p-4 transition-all duration-300 `}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Manage Banner Subscriptions</h2>
          <Button
            onClick={handleRefresh}
            className="bg-[#0c1f4d] hover:bg-[#0c1f4dd0] text-white"
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="mb-6">
          <Label htmlFor="searchInput">Search Seller by Email or Phone</Label>
          <div className="relative w-full max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="searchInput"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedSeller({ user: selectedSeller, bannerPayment: null });
                  setActionMode("purchase");
                }
              }}
              placeholder="Search by email or phone..."
              className="pl-9 pr-3 py-2 rounded-lg bg-gray-100"
              disabled={isRefreshing}
            />
          </div>

          {isSearchLoading && <p className="mt-2">Searching...</p>}
          {searchError && <p className="mt-2 text-red-600">Error: {searchError?.data?.message}</p>}

          {selectedSeller?.user && (
            <div className="p-4 mt-6 rounded-lg border bg-gray-50">
              <p className="font-medium">Selected Seller:</p>
              <p>Email: {selectedSeller.user.email}</p>
              <p>Phone: {selectedSeller.user.phone || 'N/A'}</p>
              {selectedSeller.bannerPayment && (
                <>
                  <p>Plan: {selectedSeller.bannerPayment.days} days</p>
                  <p>Amount: ₹{selectedSeller.bannerPayment.amount}</p>
                </>
              )}
            </div>
          )}
        </div>

        <AdminBannerPlanManagement
          user={user}
          selectedSeller={selectedSeller}
          refetchBannerPayments={refetchBannerPayments}
          actionMode={actionMode}
        />

               <div className="mt-8">
          <h3 className="text-2xl font-bold text-[#0c1f4d] mb-4">Active Banner Purchases</h3>
       {isBannerPaymentsLoading ? (
            <p>Loading banner purchases...</p>
          ) : activeBannerPayments?.data?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeBannerPayments.data.map((payment) => {

                  return (
                    <TableRow key={payment._id} className="hover:bg-gray-50">
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback
                            className="text-white font-bold"
                            style={{
                              backgroundColor: getRandomBg(payment?.user?.name),
                            }}
                          >
                            {payment.user?.name?.[0]?.toUpperCase() || "N"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{payment.user?.name || "N/A"}</span>
                      </TableCell>

                      <TableCell>{payment.user.email}</TableCell>


                      <TableCell>{payment.user.phone || "N/A"}</TableCell>


                      <TableCell>{payment.days}</TableCell>


                      <TableCell className="flex items-center gap-1 font-semibold text-green-600">
                        <IndianRupee className="w-4 h-4" />
                        {payment.amount}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            payment.payment_status === "paid"
                              ? "success"
                              : payment.payment_status === "created"
                                ? "secondary"
                                : "destructive"
                          }
                          className="capitalize"
                        >
                          {payment.payment_status}
                        </Badge>
                      </TableCell>

                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>

 
                      <TableCell className="flex justify-center gap-2">

                        <Button
                          size="icon"
                          className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dd9] rounded-full p-2"
                          onClick={() => {
                            setSelectedSeller({ user: payment.user, bannerPayment: payment });
                            setActionMode("upgrade");
                          }}
                          disabled={isRefreshing}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>


                        <Button
                          size="icon"
                          className="bg-red-500 text-white hover:bg-red-600 rounded-full p-2"
                          onClick={() => {
                            setSelectedSeller({ user: payment.user, bannerPayment: payment });
                            setActionMode("cancel");
                          }}
                          disabled={isRefreshing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p>No active banner purchases found.</p>
          )}
          {activeBannerPayments?.data?.length > 0 && (
            <div className="mt-4 float-end">
              <Pagination>
                <PaginationContent>

                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1 && !isRefreshing) setPage(page - 1);
                      }}
                      className={page === 1 || isRefreshing ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        isActive={page === i + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isRefreshing) setPage(i + 1);
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {totalPages > 5 && page < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages && !isRefreshing) setPage(page + 1);
                      }}
                      className={page === totalPages || isRefreshing ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerSubscription;


