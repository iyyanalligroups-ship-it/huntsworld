
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';

import { ArrowUpCircle, XCircle, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';

import {
  useCreateTrendingPointsOrderMutation,
  useVerifyTrendingPointsPaymentMutation,
  useUpgradeTrendingPointsMutation,
  useCancelTrendingPointsMutation,

} from '@/redux/api/UserTrendingPointSubscriptionApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';

const AdminTrendingPointsPlanManagement = ({ targetUser, hasSubscription, subscriptionId, activeTrendingPointsPayment, pendingTrendingPointsPayment, onRefresh, pointRate }) => {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [points, setPoints] = useState('');
  const [amount, setAmount] = useState(0);
  const [createTrendingPointsOrder] = useCreateTrendingPointsOrderMutation();
  const [verifyTrendingPointsPayment] = useVerifyTrendingPointsPaymentMutation();
  const [upgradeTrendingPoints] = useUpgradeTrendingPointsMutation();
  const [cancelTrendingPoints] = useCancelTrendingPointsMutation();

  const user_id = targetUser?._id;

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
      if (!user_id) throw new Error('No user selected');
      if (!hasSubscription) throw new Error('No active subscription found');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      console.log('Creating trending points order with:', { user_id, points, amount, subscriptionId });
      const { order, trendingPointsPayment } = await createTrendingPointsOrder({
        user_id,
        points,
        amount,
        subscriptionId,
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
              toast.success(`Payment for ${points} points (₹${amount.toFixed(2)}) completed.`);
              await onRefresh();
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
          email: targetUser?.email || 'demo@example.com',
          contact: targetUser?.contact || '9999999999',
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

  const handleUpgrade = async () => {
    try {
      if (!points || !amount) throw new Error('Please specify the number of points');
      if (!user_id) throw new Error('No user selected');
      if (!hasSubscription) throw new Error('No active subscription found');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!activeTrendingPointsPayment) throw new Error('No active trending points to upgrade');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const pointsData = {
        user_id,
        old_trending_points_payment_id: activeTrendingPointsPayment._id,
        points,
        amount,
        subscription_id:subscriptionId,
      };

      console.log('Creating upgrade order with:', pointsData);
      const { order } = await upgradeTrendingPoints(pointsData).unwrap();

      console.log('Upgrade order created:', { order });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Trending Points Upgrade Payment',
        description: `Upgrading to ${points} points`,
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('Verifying upgrade payment:', response);
            const verifyRes = await verifyTrendingPointsPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              toast.success(`Upgraded to ${points} points for ₹${amount.toFixed(2)}`);
              await onRefresh();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Upgrade Verification failed:', error);
            toast.error(`Error verifying upgrade payment: ${error.message}`);
          }
        },
        prefill: {
          email: targetUser?.email || 'demo@example.com',
          contact: targetUser?.contact || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      console.log('Opening Razorpay popup for upgrade with options:', options);
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        console.error('Razorpay upgrade payment failed:', response);
        toast.error('Upgrade payment failed. Please try again.');
      });
      razorpay.open();
    } catch (error) {
      console.error('Upgrade Error:', error);
      toast.error(`Something went wrong: ${error.message}`);
    } finally {
      setIsRazorpayLoading(false);
      setIsUpgradeOpen(false);
    }
  };

  const handleCancel = async () => {
    if (!activeTrendingPointsPayment) {
      toast.error('No active trending points to cancel.');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      await cancelTrendingPoints({ trending_points_payment_id: activeTrendingPointsPayment._id, user_id }).unwrap();
      toast.success('Trending points subscription cancelled successfully');
      setIsCancelDialogOpen(false);
      await onRefresh();
    } catch (error) {
      console.error('Cancel Trending Points Error:', error);
      toast.error(`Failed to cancel trending points subscription: ${error.message}`);
      setIsCancelDialogOpen(false);
    }
  };

  return (
    <Card className="border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#0c1f4d]">Trending Points Plan Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(activeTrendingPointsPayment || pendingTrendingPointsPayment) && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#0c1f4d]">Active Plan</h3>
            <p className="text-sm text-gray-600">Points: {activeTrendingPointsPayment?.points || pendingTrendingPointsPayment?.points}</p>
            <p className="text-sm text-gray-600">Amount: ₹{activeTrendingPointsPayment?.amount || pendingTrendingPointsPayment?.amount}</p>
            <p className="text-sm text-gray-600">Status: {activeTrendingPointsPayment?.payment_status || pendingTrendingPointsPayment?.payment_status}</p>
            <div className="flex gap-3 pt-4">
              <Button
                className="bg-[#0c1f4d] text-white cursor-pointer hover:bg-[#0c1f4dcc] flex items-center gap-2"
                onClick={() => setIsUpgradeOpen(true)}
              >
                <ArrowUpCircle className="w-4 h-4" />
                Upgrade Plan
              </Button>
              <Button
                className="bg-red-600 text-white cursor-pointer hover:bg-red-700 flex items-center gap-2"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                <XCircle className="w-4 h-4" />
                Cancel Plan
              </Button>
            </div>
          </div>
        )}
        {!activeTrendingPointsPayment && !pendingTrendingPointsPayment && (
          <div className="text-center">
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white flex items-center gap-2"
              onClick={() => setIsPurchaseOpen(true)}
              disabled={!hasSubscription || !subscriptionId}
            >
              <IndianRupee className="w-4 h-4" />
              Purchase Trending Points
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Trending Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Number of Points (e.g., 100)"
              value={points}
              onChange={handlePointsChange}
              className="w-full"
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
              disabled={!hasSubscription || !points || amount <= 0 || !subscriptionId || isRazorpayLoading}
              onClick={handlePurchase}
            >
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Trending Points Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Number of Points (e.g., 100)"
              value={points}
              onChange={handlePointsChange}
              className="w-full"
              min="1"
            />
            <p className="text-sm text-gray-600">Total Cost: ₹{amount.toFixed(2)} (₹{pointRate.toFixed(2)} per point)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              disabled={!hasSubscription || !points || amount <= 0 || !subscriptionId || isRazorpayLoading}
              onClick={handleUpgrade}
            >
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to cancel this trending points subscription?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleCancel}>
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminTrendingPointsPlanManagement;