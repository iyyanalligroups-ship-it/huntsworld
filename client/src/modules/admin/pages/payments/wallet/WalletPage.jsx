
import { useContext, useEffect, useState } from 'react';
import { useGetCouponsQuery } from '@/redux/api/couponsNotificationApi';
import { useGetUserByIdQuery } from '@/redux/api/SubDealerApi';
import {useGetUserBySearchQuery} from '@/redux/api/UserSubscriptionPlanApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wallet } from 'lucide-react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';
import RedeemPointsForm from './RedeemPointsForm';

const WalletPage = () => {
  const { user } = useContext(AuthContext);
  const adminId = user?.user?._id;
  const { isSidebarOpen } = useSidebar();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('Debounced search value:', searchInput);
      setDebouncedSearch(searchInput);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch search results
  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });

  // Fetch selected user details
  const { data: merchantData, isLoading, isError } = useGetUserByIdQuery(selectedSeller?._id, {
    skip: !selectedSeller,
  });

  const { data: couponsData, isLoading: couponsLoading } = useGetCouponsQuery();

  // Update selected seller when search results change
  useEffect(() => {
    if (searchResults?.users?.length > 0) {
      setSelectedSeller(searchResults.users[0]);
    } else {
      setSelectedSeller(null);
    }
  }, [searchResults]);
  console.log(merchantData,'merchantData');
  
  const handleRedeemSuccess = () => {
    setOpenRedeemDialog(false);
    showToast('Points redeemed successfully', 'success');
  };

  return (
    <div >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-[#0c1f4d]">Admin Wallet Management</h2>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search by email or phone number"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="mb-4"
            />
            {isSearchLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="ml-2">Searching...</p>
              </div>
            ) : searchError ? (
              <p className="text-red-500">Error searching users: {searchError?.data?.message}</p>
            ) : searchResults?.users?.length > 0 ? (
              <div className="space-y-2">
                {searchResults.users.map((seller) => (
                  <div
                    key={seller._id}
                    className={`p-2 cursor-pointer rounded ${selectedSeller?._id === seller._id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    onClick={() => setSelectedSeller(seller)}
                  >
                    <p className="text-sm font-medium">{seller.name}</p>
                    <p className="text-xs text-muted-foreground">Email: {seller.email}</p>
                    <p className="text-xs text-muted-foreground">Phone: {seller.phone || 'N/A'}</p>
                  </div>
                ))}
              </div>
            ) : debouncedSearch ? (
              <p className="text-sm text-muted-foreground">No users found</p>
            ) : null}
          </CardContent>
        </Card>

        {selectedSeller && (
          <Card>
            <CardHeader>
              <CardTitle>Seller Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="ml-2">Loading seller details...</p>
                </div>
              ) : isError ? (
                <p className="text-red-500">Failed to load seller details</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{merchantData?.user?.name || selectedSeller.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{merchantData?.user?.email || selectedSeller.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">{merchantData?.user?.phone || selectedSeller.phone || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl shadow-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-wide uppercase">Wallet Points</p>
                      <p className="text-xl font-bold">{merchantData?.user?.wallet_points || selectedSeller.view_points || 0}</p>
                    </div>
                  </div>
                </div>
              )}
              <Button
                className="flex-1 bg-[#0c1f4d] text-white text-sm py-2 rounded hover:bg-[#0c1f4dd0] transition cursor-pointer"
                onClick={() => setOpenRedeemDialog(true)}
                disabled={(merchantData?.user?.wallet_points || selectedSeller.view_points || 0) < 500}
              >
                Redeem Points
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={openRedeemDialog} onOpenChange={setOpenRedeemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redeem Points for {selectedSeller?.name}</DialogTitle>
            </DialogHeader>
            {couponsLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="ml-2">Loading coupons...</p>
              </div>
            ) : (
              <RedeemPointsForm
                adminId={adminId}
                userId={selectedSeller?._id}
                coupons={couponsData?.data || []}
                walletPoints={merchantData?.user?.wallet_points || selectedSeller?.view_points || 0}
                onSuccess={handleRedeemSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WalletPage;