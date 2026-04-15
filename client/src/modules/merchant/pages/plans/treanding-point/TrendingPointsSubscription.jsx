
import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  useGetActiveTrendingPointsQuery,
  useCheckUserSubscriptionQuery,
  useCreateTrendingPointsOrderMutation,
  useVerifyTrendingPointsPaymentMutation,
  useGetTrendingPointsConfigQuery
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import TrendingPointsPlanManagement from './TrendingPointsPlanManagement';
import TrendingPointsProductManagement from './TrendingPointsProductManagement';
import Loader from '@/loader/Loader';

const TrendingPointsSubscription = () => {
  const { user } = useContext(AuthContext);
  const [version, setVersion] = useState(0);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isTrendingPointsProductOpen, setIsTrendingPointsProductOpen] = useState(false);
  const [points, setPoints] = useState('');
  const [amount, setAmount] = useState(0);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);

  const { data: configData, isLoading: isConfigLoading } = useGetTrendingPointsConfigQuery();
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  console.log(subscriptionData,'subcsnfnsdfndj');

  const {
    data: activeTrendingPointsData,
    isLoading: isTrendingPointsLoading,
    isFetching,
    error,
    refetch,
  } = useGetActiveTrendingPointsQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });

  const [createTrendingPointsOrder] = useCreateTrendingPointsOrderMutation();
  const [verifyTrendingPointsPayment] = useVerifyTrendingPointsPaymentMutation();

  const pointRate = configData?.pointRate || 45 / 100; // ₹45 per 100 points as fallback

  const handleTrendingPointsRefresh = async () => {
    await refetch();
    setVersion((v) => v + 1); // Force re-render
  };

  const handlePointsChange = (e) => {
    const inputPoints = parseInt(e.target.value, 10);
    if (!isNaN(inputPoints) && inputPoints > 0) {
      setPoints(inputPoints);
      setAmount(inputPoints * pointRate);
    } else {
      setPoints('');
      setAmount(0);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!points || !amount) throw new Error('Please specify the number of points');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      console.log('Creating trending points order with:', { user_id: userId, points, amount, subscription_id: subscriptionId });
      const { order, trendingPointsPayment } = await createTrendingPointsOrder({
        user_id: userId,
        points,
        amount,
        subscription_id: subscriptionId,
      }).unwrap();

      console.log('Order created:', { order, trendingPointsPayment });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Trending Points Subscription Payment',
        description: `Purchasing ${points} trending points`,
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('Verifying payment:', response);
            const verifyRes = await verifyTrendingPointsPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              toast.success(`Payment for ${points} points (₹${amount.toFixed(2)}) completed. Please add points to products.`);
              setIsTrendingPointsProductOpen(true);
              await handleTrendingPointsRefresh();
              setIsPurchaseOpen(false);
              setPoints('');
              setAmount(0);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error(`Error verifying payment: ${error.message}`);
          }
        },
        prefill: {
          email: user?.user?.email || 'demo@example.com',
          contact: user?.user?.contact || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      console.log('Opening Razorpay popup with options:', options);
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response);
        toast.error('Payment failed. Please try again.');
      });
      razorpay.open();
    } catch (error) {
      console.error('Purchase Error:', error);
      toast.error(`Something went wrong: ${error.message}`);
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  console.log('Trending Points Query States:', { isTrendingPointsLoading, isFetching, error, userId: user?.user?._id, data: activeTrendingPointsData });
  console.log('Subscription Check:', { hasSubscription: subscriptionData?.hasSubscription, subscriptionId: subscriptionData?.subscriptionId, isSubscriptionLoading });
  console.log('Config Data:', { pointRate, isConfigLoading });
  console.log('User Data:', { userId: user?.user?._id });

  const hasSubscription = subscriptionData?.hasSubscription;
  const subscriptionId = subscriptionData?.subscriptionId;
  const activeTrendingPointsPayment = activeTrendingPointsData?.trendingPointsPayment;
  const pendingTrendingPointsPayment = activeTrendingPointsData?.pendingTrendingPointsPayment;

  if (isTrendingPointsLoading || isFetching || isSubscriptionLoading || isConfigLoading || !user) {
    return (
      <Loader />
    );
  }

  return (
    <div className="lg:p-6">
      <div className="text-center mb-10">
           <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 w-66 rounded-r-2xl w- font-bold">Trending Points Subscription</h1>
        <p className="text-gray-600 mt-2">Purchase trending points to boost your products. Cost: ₹{pointRate.toFixed(2)} per point.</p>
        {!hasSubscription && (
          <p className="text-red-600 mt-2">You need an active subscription to purchase trending points.</p>
        )}
      </div>
      {subscriptionId ? (
        <>
          <TrendingPointsPlanManagement
            user={user}
            hasSubscription={hasSubscription}
            subscriptionId={subscriptionId}
            planCode={subscriptionData?.planCode}
            activeTrendingPointsPayment={activeTrendingPointsPayment}
            pendingTrendingPointsPayment={pendingTrendingPointsPayment}
            onRefresh={handleTrendingPointsRefresh}
            setIsTrendingPointsProductOpen={setIsTrendingPointsProductOpen}
            pointRate={pointRate}
          />
          
          <TrendingPointsProductManagement
            user={user}
            subscriptionId={subscriptionId}
            activeTrendingPointsPayment={activeTrendingPointsPayment}
            pendingTrendingPointsPayment={pendingTrendingPointsPayment}
            refetch={refetch}
          />
        </>
      ) : (
        <div className="p-6 text-center">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Trending Points Subscription</h2>
          <p className="text-red-600 mt-4">
            No active subscription found. Please subscribe first to purchase trending points.
          </p>
          <Button
            className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white mt-4"
            onClick={() => setIsPurchaseOpen(true)}
          >
            Go to Subscription
          </Button>
        </div>
      )}

      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        {isRazorpayLoading && <Loader label="Processing Payment Securely..." />}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Trending Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="e.g. 100"
              value={points}
              onChange={handlePointsChange}
              className="w-full border-2 border-slate-300"
              min="1"
            />
            <p className="text-sm text-gray-600">Total Cost: ₹{amount.toFixed(2)} (₹{pointRate.toFixed(2)} per point)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              disabled={!points || amount <= 0 || isRazorpayLoading}
              onClick={handlePurchase}
            >
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrendingPointsSubscription;
