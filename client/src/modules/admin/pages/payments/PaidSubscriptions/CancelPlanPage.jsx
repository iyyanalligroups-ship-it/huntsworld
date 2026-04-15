import { useState, useContext,useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { useCancelSubscriptionMutation, useGetUserBySearchQuery, useGetUserActiveSubscriptionQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import PurchasedSellersTable from './PurchasedSellersTable';

const CancelPlanPage = () => {
  const { state } = useLocation();
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [cancelSubscription] = useCancelSubscriptionMutation();
const [debouncedSearch, setDebouncedSearch] = useState("");


   useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 500); // 2 seconds

        return () => {
            clearTimeout(handler); // clear previous timer if user types again
        };
    }, [searchInput]);

    // API call only runs when debouncedSearch changes
    const { data: searchResults, isLoading, error } = useGetUserBySearchQuery(debouncedSearch, {
        skip: !debouncedSearch, // skip empty queries
    });


 useEffect(() => {
        if (searchResults?.users?.length > 0) {
            setSelectedSeller(searchResults.users[0]);
        } else {
            setSelectedSeller(null);
        }
    }, [searchResults]);

  const { data: activeSubscription } = useGetUserActiveSubscriptionQuery(selectedSeller?._id, { skip: !selectedSeller });

  const preSubscriptionId = state?.subscriptionId;

  const handleCancel = async () => {
    try {
      const subscriptionId = preSubscriptionId || activeSubscription?.subscription?._id;
      if (!subscriptionId) throw new Error('No subscription to cancel');
        const id=subscriptionId;
      await cancelSubscription(id).unwrap();
      showToast('Subscription cancelled successfully', 'success');
      navigate('/admin/plans/subscription');
    } catch (error) {
      console.error('Cancel Error:', error);
      showToast(`Something went wrong: ${error.message}`, 'error');
    }
    setIsConfirmOpen(false);
  };

  const openConfirm = () => {
    if (!selectedSeller || !activeSubscription) {
      showToast('Please select a seller with active subscription', 'error');
      return;
    }
    setIsConfirmOpen(true);
  };

  return (
    <div
      className={`flex-1 p-4 transition-all duration-300 ${
        isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'
      }`}
    >
      <div className="p-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Cancel Seller Plan</h2>
          <p className="text-gray-600 mt-2">
            Search for a seller by email or phone number to cancel their subscription plan.
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <Label htmlFor="searchInput" className="text-gray-700">Search Seller by Email or Phone</Label>
          <Input
            id="searchInput"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter email or phone number"
            className="mt-1"
          />
           {isLoading && <p>Loading...</p>}
                    {error && <p>Error fetching users</p>}

                    {/* Selected Seller Info */}
                    {selectedSeller && (
                        <div className="p-3 rounded-lg border mt-5 border-gray-300 bg-gray-50">
                            <p className="font-medium">Seller Info:</p>
                            <p className="text-sm">Email: {selectedSeller.email}</p>
                            <p className="text-sm">Phone Number : {selectedSeller.phone || "N/A"}</p>
                        </div>
                    )}
        </div>

        {selectedSeller && activeSubscription && (
          <div className="mb-6">
            <h3 className="text-xl font-bold">Active Plan: {activeSubscription.subscription.subscription_plan_id.plan_name}</h3>
            <Button className="bg-red-600 text-white mt-4" onClick={openConfirm}>
              Cancel Plan
            </Button>
          </div>
        )}

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>Confirm Cancellation</DialogHeader>
            <p>Are you sure you want to cancel this subscription?</p>
            <DialogFooter>
              <Button onClick={() => setIsConfirmOpen(false)}>No</Button>
              <Button className="bg-red-500" onClick={handleCancel}>Yes, Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PurchasedSellersTable />
      </div>
    </div>
  );
};

export default CancelPlanPage;