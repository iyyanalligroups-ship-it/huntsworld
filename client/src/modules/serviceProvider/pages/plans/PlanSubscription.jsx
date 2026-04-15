import { useState, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import PurchaseDialog from './subcription/PurchaseDialog';
import ActivePlanCard from './subcription/ActiveCard';
import {
  useGetAllPlansQuery,
  useCreateRazorpayOrderMutation,
  useGetUserActiveSubscriptionQuery,
  useCancelSubscriptionMutation
} from '@/redux/api/UserSubscriptionPlanApi';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';
import axios from 'axios';

// Helper: Sort plans by price (low to high)
const sortPlansByPrice = (plansArray) => {
  return [...(plansArray ?? [])].sort(
    (a, b) => a.subscription_plan_id.price - b.subscription_plan_id.price
  );
};

const SubscriptionPlan = () => {
  const { user } = useContext(AuthContext);
  const { data: plans, isLoading } = useGetAllPlansQuery();
  const {
    data: activeSubscriptionData,
    isLoading: isActiveSubscriptionLoading,
    refetch
  } = useGetUserActiveSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  const { isSidebarOpen } = useSidebar();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  const [createUserSubscription] = useCreateRazorpayOrderMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();

  const activePlan = activeSubscriptionData?.subscription;

  const getPlanType = (price) => {
    if (price <= 1000) return 'Standard Plan';
    if (price > 1000 && price <= 2000) return 'Professional Plan';
    if (price > 2000) return 'Enterprise Plan';
    return 'Custom Plan';
  };

  const handleSelectPlan = async (plan) => {
    try {
      const userId = user?.user?._id;
      if (!userId) {
        showToast("Please login to continue", "error");
        return;
      }

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users/check-email/${userId}`);
      if (!data.hasEmail) {
        showToast("Please update your email before purchasing a plan", "warning");
        return;
      }

      showToast("Click the Upgrade plan button to change plan", "info");
      setSelectedPlan(plan);
      // setIsPurchaseOpen(true); // Keep closed until user confirms
    } catch (error) {
      console.error("Check email failed:", error);
      showToast("Something went wrong while checking email", "error");
    }
  };

  const handlePurchase = async (plan) => {
    try {
      setIsPurchaseLoading(true);
      if (!plan) throw new Error('No plan selected');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');

      await createUserSubscription({
        user_id: userId,
        subscription_plan_id: plan.subscription_plan_id._id
      }).unwrap();

      showToast(`Purchased ${plan.subscription_plan_id.plan_name} for ₹${plan.subscription_plan_id.price}`, 'success');
      await refetch();
    } catch (error) {
      console.error(error);
      showToast('Failed to purchase plan', 'error');
    } finally {
      setIsPurchaseLoading(false);
      setIsPurchaseOpen(false);
    }
  };

  const handleCancel = () => {
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!activePlan) {
      showToast("No active plan to cancel.", 'error');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      await cancelSubscription(activePlan._id).unwrap();
      showToast("Subscription cancelled successfully", 'success');
      setIsCancelDialogOpen(false);
      await refetch();
    } catch (error) {
      console.error('Cancel Subscription Error:', error);
      showToast("Failed to cancel subscription", 'error');
      setIsCancelDialogOpen(false);
    }
  };

  // Loading State
  if (isLoading || isActiveSubscriptionLoading) {
    return (
      <div className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'}`}>
        <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-6 w-1/2 mx-auto mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="flex flex-col h-full">
              <CardHeader>
                <Skeleton className="h-6 w-24 mx-auto" />
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'}`}>
      {/* Title */}
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-36 font-bold inline-block mb-6">
        Plan Subscription
      </h1>

      {/* Hero Text */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#0c1f4d]">No Hidden Fee! Choose Your Plan.</h2>
        <p className="text-gray-600 mt-2">
          Discover the most robust and cohesive social media business solution, built to scale as you grow or cancel anytime.
        </p>
      </div>

      {/* Active Plan */}
      {activePlan && (
        <div className="mb-8">
          <ActivePlanCard
            plan={activePlan}
            onCancel={handleCancel}
            razorpayOrder={activeSubscriptionData?.razorpayOrder}
            razorpayPayment={activeSubscriptionData?.razorpayPayment}
          />
        </div>
      )}

      {/* Plans Grid - Sorted by Price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortPlansByPrice(plans?.data).map((plan) => {
          const planType = getPlanType(plan.subscription_plan_id.price);
          const isActive = activePlan?.subscription_plan_id?._id === plan.subscription_plan_id._id;

          return (
            <Card key={plan.subscription_plan_id._id} className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {planType}
                  </span>
                </div>
                <CardTitle className="text-2xl text-[#0c1f4d]">
                  {plan?.subscription_plan_id?.plan_code} (₹ {(Math.round(plan.subscription_plan_id.price - 1)).toLocaleString("en-IN")})
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">Billed Annually</CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-2 text-sm text-gray-600">
                  {plan.elements.map((elem) => (
                    <li key={elem.element_id} className="flex items-center">
                      <span className="mr-2 text-[#0c1f4d]">Check</span>
                      <span>
                        <strong>{elem.element_name}:</strong> {elem.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto">
                <Button
                  className={`w-full transition-all ${
                    isActive
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white'
                  }`}
                  onClick={() => !isActive && handleSelectPlan(plan)}
                  disabled={isActive}
                >
                  {isActive ? 'Current Plan' : 'Get Started'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Purchase Dialog */}
      <PurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        plan={selectedPlan}
        onPurchase={handlePurchase}
        isLoading={isPurchaseLoading}
      />

      {/* Cancel Confirmation */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Are you sure you want to cancel your <strong>{activePlan?.subscription_plan_id?.plan_name}</strong> subscription?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Plan
            </Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={confirmCancel}>
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlan;