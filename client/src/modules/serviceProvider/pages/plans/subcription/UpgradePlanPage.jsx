import { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PurchaseDialog from './UpdatePurchaseDialog';
import {
  useGetAllPlansQuery,
  useUpgradeSubscriptionMutation,
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
} from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { loadRazorpayScript, RAZORPAY_GLOBAL_CONFIG } from '@/modules/serviceProvider/utils/Razorpay';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import { ArrowLeft } from 'lucide-react';

const UpgradePlanPage = () => {
  const { state } = useLocation();
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { data: plans, isLoading } = useGetAllPlansQuery();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false); // New state for purchase loading
  const [upgradeSubscription] = useUpgradeSubscriptionMutation();
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const activePlanId = state?.activePlanId;
  const oldSubscriptionId = state?.oldSubscriptionId;

  console.log(plans, 'plans');

  const getPlanType = (price) => {
    if (price <= 1000) return 'Standard Plan';
    if (price > 1000 && price <= 2000) return 'Professional Plan';
    if (price > 2000) return 'Enterprise Plan';
    return 'Custom Plan';
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsPurchaseOpen(true);
  };

  const handlePurchase = async (plan) => {
    try {
      setIsPurchaseLoading(true);
      console.log('Plan:', plan);
      if (!plan || !plan.subscription_plan_id || !plan.subscription_plan_id._id || plan.subscription_plan_id.price === undefined) {
        throw new Error('Invalid plan or missing price');
      }

      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');

      // Handle free plan
      if (plan.subscription_plan_id.plan_code === 'FREE' || plan.subscription_plan_id.price === 0) {
        const payload = {
          user_id: userId,
          subscription_plan_id: plan.subscription_plan_id._id,
          old_subscription_id: oldSubscriptionId,
          razorpay_order_id: `free_order_${userId}`,
          amount: 0,
        };
        console.log('upgradeSubscription Payload (Free Plan):', payload);

        const { subscription } = await upgradeSubscription(payload).unwrap();
        showToast(`Upgraded to ${plan.subscription_plan_id.plan_name} for free`, 'success');
        navigate('/service/plans/subscription');
        setIsPurchaseOpen(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load Razorpay script');

      const orderPayload = {
        user_id: userId,
        subscription_plan_id: plan.subscription_plan_id._id,
        amount: plan.subscription_plan_id.price,
      };
      console.log('createRazorpayOrder Payload:', orderPayload);

      const { order } = await createRazorpayOrder(orderPayload).unwrap();
      console.log('Razorpay Order:', order);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Subscription Payment',
        description: `Upgrading to ${plan.subscription_plan_id.plan_name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('Razorpay Response:', response);
            if (!response.razorpay_payment_id || !response.razorpay_signature) {
              throw new Error('Missing payment details in Razorpay response');
            }

            const verifyRes = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();
            console.log('Verify Payment Response:', verifyRes);

            if (verifyRes.success) {
              const upgradePayload = {
                user_id: userId,
                subscription_plan_id: plan.subscription_plan_id._id,
                old_subscription_id: oldSubscriptionId,
                amount: plan.subscription_plan_id.price,
                razorpay_order_id: order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              };
              console.log('upgradeSubscription Payload:', upgradePayload);

              const { subscription } = await upgradeSubscription(upgradePayload).unwrap();
              showToast(
                `Upgraded to ${plan.subscription_plan_id.plan_name} for ₹${((subscription.amount + subscription.gst_amount) / 100).toFixed(2)}`,
                'success'
              );
              navigate('/service/plans/subscription');
            } else {
              showToast(verifyRes.message || 'Payment verification failed', 'error');
            }
          } catch (error) {
            console.error('Verification failed:', error);
            showToast(error.data?.message || error.message || 'Error verifying payment', 'error');
          } finally {
            setIsPurchaseLoading(false);
            setIsPurchaseOpen(false);
          }
        },
        prefill: {
          email: user?.user?.email || 'demo@example.com',
          contact: user?.user?.contact || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
        config: RAZORPAY_GLOBAL_CONFIG,
        modal: {
          ondismiss: () => {
            setIsPurchaseLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        console.error('Razorpay Payment Failed:', response);
        showToast('Payment failed. Please try again.', 'error');
        setIsPurchaseLoading(false);
        setIsPurchaseOpen(false);
      });
      razorpay.open();
    } catch (error) {
      console.error('Purchase Error:', error);
      showToast(`Something went wrong: ${error.message}`, 'error');
      setIsPurchaseLoading(false);
      setIsPurchaseOpen(false);
    }
  };

  const backToSubscription = () => {
    navigate('/service/plans/subscription');
  };

  if (isLoading) {
    return (
      <div
        className={`flex-1 p-4 transition-all duration-300 ${
          isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'
        }`}
      >
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="text-center mb-10">
          <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
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
    <div
      className={`flex-1 p-4 transition-all duration-300 ${
        isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'
      }`}
    >
      <div>
        <Button className="cursor-pointer" variant="outline" onClick={backToSubscription}>
          <ArrowLeft className="w-4 h-4" /> Back to Subscription page
        </Button>
      </div>
      <div className="p-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Upgrade Your Plan</h2>
          <p className="text-gray-600 mt-2">
            Choose a new plan to upgrade your subscription. Your current plan will be replaced.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.data
            ?.filter(
              (plan) =>
                plan.subscription_plan_id._id !== activePlanId &&
                plan.subscription_plan_id.plan_code !== 'FREE'
            )
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
                      {plan.subscription_plan_id.plan_code} ( ₹ {(Math.round(plan.subscription_plan_id.price - 1)).toLocaleString("en-IN")})
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
                      className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4d]/80 text-white cursor-pointer"
                      onClick={() => handleSelectPlan(plan)}
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
          isLoading={isPurchaseLoading}
        />
      </div>
    </div>
  );
};

export default UpgradePlanPage;