// Updated UpgradePlanPage to include PurchasedSellersTable and pre-select seller if passed in state

import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PurchaseDialog from './PurchaseDialog';
import { useGetAllPlansQuery, useUpgradeSubscriptionMutation, useCreateRazorpayOrderMutation, useVerifyPaymentMutation, useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import PurchasedSellersTable from './PurchasedSellersTable';

const UpgradePlanPage = () => {
  const { state } = useLocation();
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { data: plans, isLoading: isPlansLoading } = useGetAllPlansQuery();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [upgradeSubscription] = useUpgradeSubscriptionMutation();
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
      


    const { data: searchResults, isLoading, error } = useGetUserBySearchQuery(
    { email: searchInput.includes('@') ? searchInput : '', phone: !searchInput.includes('@') ? searchInput : '' },
    { skip: !searchInput }
  );
  const activePlanId = state?.activePlanId;
  const oldSubscriptionId = state?.oldSubscriptionId;
  const preSelectedSellerId = state?.selectedSellerId;

  // If pre-selected seller from table, set it
  useEffect(() => {
    if (preSelectedSellerId) {
      // Fetch seller details if needed, but for simplicity, assume we set ID and fetch if necessary
      setSelectedSeller({ _id: preSelectedSellerId }); // Extend with actual fetch if needed
    }
  }, [preSelectedSellerId]);

  const getPlanType = (price) => {
    if (price <= 1000) return 'Standard Plan';
    if (price > 1000 && price <= 2000) return 'Professional Plan';
    if (price > 2000) return 'Enterprise Plan';
    return 'Custom Plan';
  };

  const handleSelectPlan = (plan) => {
    if (!selectedSeller) {
      showToast('Please select a seller first', 'error');
      return;
    }
    setSelectedPlan(plan);
    setIsPurchaseOpen(true);
  };

  const handlePurchase = async (plan) => {
    try {
      if (!plan || !plan.subscription_plan_id || !plan.subscription_plan_id._id || !plan.subscription_plan_id.price) {
        throw new Error('Invalid plan or missing price');
      }

      const userId = selectedSeller?._id;
      if (!userId) throw new Error('No seller selected');

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load Razorpay script');

      const payload = {
        user_id: userId,
        subscription_plan_id: plan.subscription_plan_id._id,
        amount: plan.subscription_plan_id.price,
      };
      console.log('createRazorpayOrder Payload:', payload);

      const { order } = await createRazorpayOrder(payload).unwrap();
      console.log('Razorpay Order:', order);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Subscription Payment',
        description: `Upgrading to ${plan.subscription_plan_id.plan_name} for seller`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              await upgradeSubscription({
                user_id: userId,
                subscription_plan_id: plan.subscription_plan_id._id,
                old_subscription_id: oldSubscriptionId,
                amount: plan.subscription_plan_id.price,
                razorpay_order_id: order.id,
              }).unwrap();
              showToast(`Upgraded to ${plan.subscription_plan_id.plan_name} for ₹${plan.subscription_plan_id.price}`, 'success');
              navigate('/admin/plans/subscription');
            } else {
              showToast("Payment verification failed", 'error');
            }
          } catch (error) {
            console.error('Verification failed:', error);
            showToast("Error verifying payment", 'error');
          }
        },
        prefill: {
          email: selectedSeller?.email || 'demo@example.com',
          contact: selectedSeller?.contact || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Purchase Error:', error);
      showToast(`Something went wrong: ${error.message}`, 'error');
    }
    setIsPurchaseOpen(false);
  };

  if (isPlansLoading) return <div>Loading...</div>;

  return (
    <div
      className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen
          ? 'ml-1 sm:ml-64'
          : 'ml-1 sm:ml-16'
        }`}
    >
    <div className="p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#0c1f4d]">Upgrade Your Plan</h2>
        <p className="text-gray-600 mt-2">
          Choose a new plan to upgrade your subscription. Your current plan will be replaced.
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
        {searchResults?.data && (
          <div className="mt-2">
            {searchResults.data.length > 0 ? (
              <ul className="space-y-2">
                {searchResults.data.map((seller) => (
                  <li
                    key={seller._id}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedSeller(seller)}
                  >
                    {seller.email} | {seller.phone} {selectedSeller?._id === seller._id && '(Selected)'}
                  </li>
                ))}
              </ul>
            ) : (
              <div>No sellers found</div>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.data
          ?.filter((plan) => plan.subscription_plan_id._id !== activePlanId)
          .map((plan) => {
            const planType = getPlanType(plan.subscription_plan_id.price);

            return (
              <Card key={plan.subscription_plan_id._id} className="flex flex-col h-full">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {planType}
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-[#0c1f4d]">
                    ₹{(Math.round(plan.subscription_plan_id.price - 1)).toLocaleString('en-IN')}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">Billed Annually</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2 text-sm text-gray-600">
                    {plan.elements.map((elem) => (
                      <li key={elem.element_id} className="flex items-center">
                        <span className="mr-2 text-[#0c1f4d]">✔</span>
                        {elem.element_name}: {elem.value}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button
                    className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white cursor-pointer"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={!selectedSeller}
                  >
                    Select Plan
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
      </div>
      <PurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        plan={selectedPlan}
        onPurchase={handlePurchase}
      />
      <PurchasedSellersTable />
    </div>
    </div>
  );
};

export default UpgradePlanPage;