
// Updated BannerPlanManagement Component
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import {
  useCreateBannerOrderMutation,
  useVerifyBannerPaymentMutation,
  useUpgradeBannerMutation,
  useCancelBannerMutation,
} from '@/redux/api/BannerPaymentApi';
import { useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi'; // Import GST query
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import { toast } from 'react-toastify';

const BannerPlanManagement = ({ user, hasSubscription, subscriptionId, activeBannerPayment, pendingBannerPayment, onRefresh, isRoyal }) => {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [days, setDays] = useState('');
  const [amount, setAmount] = useState(0);
  const [createBannerOrder] = useCreateBannerOrderMutation();
  const [verifyBannerPayment] = useVerifyBannerPaymentMutation();
  const [upgradeBanner] = useUpgradeBannerMutation();
  const [cancelBanner] = useCancelBannerMutation();

  // Fetch GST plan
  const { data: gstPlanData, isLoading: isGSTLoading, error: gstError } = useGetGSTPlanQuery();

  const handleDaysChange = (e) => {
    const inputDays = parseInt(e.target.value, 10);
    if (!isNaN(inputDays) && inputDays > 0) {
      setDays(inputDays);
      setAmount(inputDays * 20);
    } else {
      setDays('');
      setAmount(0);
    }
  };

  // Calculate GST and total for display
  const gstPercentage = gstPlanData?.data?.price || 0;
  const gstAmount = (amount * gstPercentage) / 100;
  const totalAmount = amount + gstAmount;

  const handlePurchase = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!hasSubscription) throw new Error('No active subscription found');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      console.log('Creating banner order with:', { user_id: userId, days, amount, subscription_id: subscriptionId });
      const { order, bannerPayment } = await createBannerOrder({
        user_id: userId,
        days,
        amount,
        subscription_id: subscriptionId,
      }).unwrap();

      console.log('Order created:', { order, bannerPayment });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Subscription Payment',
        description: `Purchasing banner for ${days} days`,
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('Verifying payment:', response);
            const verifyRes = await verifyBannerPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              toast.success(`Payment for ${days} days (₹${totalAmount.toFixed(2)}) completed. Please upload banner details.`);
              await onRefresh();
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
      setIsPurchaseOpen(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!hasSubscription) throw new Error('No active subscription found');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!activeBannerPayment) throw new Error('No active banner to upgrade');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const bannerData = {
        user_id: userId,
        old_banner_payment_id: activeBannerPayment._id,
        days,
        amount,
        subscription_id: subscriptionId,
      };

      console.log('Creating upgrade order with:', bannerData);
      const { order } = await upgradeBanner(bannerData).unwrap();

      console.log('Upgrade order created:', { order });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Upgrade Payment',
        description: `Upgrading banner for ${days} days`,
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('Verifying upgrade payment:', response);
            const verifyRes = await verifyBannerPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              toast.success(`Upgraded banner for ${days} days for ₹${totalAmount.toFixed(2)}`);
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
          email: user?.user?.email || 'demo@example.com',
          contact: user?.user?.contact || '9999999999',
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
    if (!activeBannerPayment) {
      toast.error('No active banner to cancel.');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      await cancelBanner(activeBannerPayment._id).unwrap();
      toast.success('Banner subscription cancelled successfully');
      setIsCancelDialogOpen(false);
      await onRefresh();
    } catch (error) {
      console.error('Cancel Banner Error:', error);
      toast.error(`Failed to cancel banner subscription: ${error.message}`);
      setIsCancelDialogOpen(false);
    }
  };

  return (
    <Card className="border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#0c1f4d]">Banner Plan Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(activeBannerPayment || pendingBannerPayment) && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#0c1f4d]">Active Plan</h3>
            <p className="text-sm text-gray-600">
              Duration: {activeBannerPayment?.days || pendingBannerPayment?.days} days
            </p>
            <p className="text-sm text-gray-600">
              Amount: ₹{activeBannerPayment?.amount || pendingBannerPayment?.amount}
            </p>
            <p className="text-sm text-gray-600">
              Status: {activeBannerPayment?.payment_status || pendingBannerPayment?.payment_status}
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dcc]"
                onClick={() => setIsUpgradeOpen(true)}
              >
                Upgrade Plan
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel Plan
              </Button>
            </div>
          </div>
        )}
        {!activeBannerPayment && !pendingBannerPayment && (
          <div className="text-center">
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white"
              onClick={() => setIsPurchaseOpen(true)}
              disabled={!hasSubscription || !subscriptionId}
            >
              Purchase Banner Ad
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Banner Ad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Number of Days (e.g., 30)"
              value={days}
              onChange={handleDaysChange}
              className="w-full"
              min="1"
            />
            {isGSTLoading ? (
              <p className="text-sm text-gray-600">Loading GST...</p>
            ) : gstError ? (
              <p className="text-sm text-red-600">Failed to load GST details</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">Base Cost: ₹{amount} (₹20 per day)</p>
                <p className="text-sm text-gray-600">GST ({gstPercentage}%): ₹{gstAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 font-bold">Total Cost: ₹{totalAmount.toFixed(2)}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              disabled={!hasSubscription || !days || amount <= 0 || !subscriptionId || isRazorpayLoading || isGSTLoading || gstError}
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
            <DialogTitle>Upgrade Banner Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Number of Days (e.g., 30)"
              value={days}
              onChange={handleDaysChange}
              className="w-full"
              min="1"
            />
            {isGSTLoading ? (
              <p className="text-sm text-gray-600">Loading GST...</p>
            ) : gstError ? (
              <p className="text-sm text-red-600">Failed to load GST details</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">Base Cost: ₹{amount} (₹20 per day)</p>
                <p className="text-sm text-gray-600">GST ({gstPercentage}%): ₹{gstAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 font-bold">Total Cost: ₹{totalAmount.toFixed(2)}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              disabled={!hasSubscription || !days || amount <= 0 || !subscriptionId || isRazorpayLoading || isGSTLoading || gstError}
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
          <p>Are you sure you want to cancel your banner subscription?</p>
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

export default BannerPlanManagement;