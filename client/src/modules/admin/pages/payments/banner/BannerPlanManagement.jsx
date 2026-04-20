import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useCreateBannerOrderMutation,
  useVerifyBannerPaymentMutation,
  useUpgradeBannerMutation,
  useCancelBannerMutation,
  useCheckUserSubscriptionQuery,
} from '@/redux/api/BannerPaymentApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import showToast from '@/toast/showToast';
import {
  ShoppingCart,
  ArrowUpCircle,
  XCircle,
  Upload,
  Lock,
  Unlock,
  Sparkles,
  AlertCircle,
  IndianRupee
} from "lucide-react";

const BannerPlanManagement = ({ user, selectedSeller, refetchBannerPayments, actionMode }) => {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [days, setDays] = useState('');
  const [amount, setAmount] = useState(0);

  // For banner uploads
  const [freeBannerFile, setFreeBannerFile] = useState(null);
  const [paidBannerFile, setPaidBannerFile] = useState(null);

  const [createBannerOrder] = useCreateBannerOrderMutation();
  const [verifyBannerPayment] = useVerifyBannerPaymentMutation();
  const [upgradeBanner] = useUpgradeBannerMutation();
  const [cancelBanner] = useCancelBannerMutation();

  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(selectedSeller?.user?._id, {
    skip: !selectedSeller?.user?._id,
  });

  const hasSubscription = subscriptionData?.hasSubscription;
  const subscriptionId = subscriptionData?.subscriptionId;

  const hasActivePaidBanner = !!selectedSeller?.bannerPayment?._id;
  const bannerDaysLeft = selectedSeller?.bannerPayment?.days || 0;

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

  const handleFreeBannerUpload = () => {
    if (!freeBannerFile) {
      showToast('Please select an image for free banner', 'error');
      return;
    }
    showToast('Free banner uploaded successfully!', 'success');
    setFreeBannerFile(null);
  };

  const handlePaidBannerUpload = () => {
    if (!paidBannerFile) {
      showToast('Please select an image for paid banner', 'error');
      return;
    }
    if (!hasActivePaidBanner) {
      showToast('Purchase a paid banner plan first to upload premium banner', 'error');
      return;
    }
    showToast('Paid banner uploaded! Now featured on top', 'success');
    setPaidBannerFile(null);
  };

  const handlePurchase = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      if (!selectedSeller?.user?._id) throw new Error('No seller selected');
      if (!hasSubscription) throw new Error('No active subscription found for the seller');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const { order, bannerPayment } = await createBannerOrder({
        user_id: selectedSeller.user._id,
        days,
        amount,
        subscription_id: subscriptionId,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Subscription Payment',
        description: `Purchasing banner for ${days} days for seller ${selectedSeller.user.email}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyBannerPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              showToast(`Payment for ${days} days (₹${amount}) completed.`, 'success');
              await refetchBannerPayments();
            } else {
              showToast('Payment verification failed', 'error');
            }
          } catch (error) {
            showToast(`Error verifying payment: ${error.message}`, 'error');
          }
        },
        prefill: {
          email: selectedSeller.user.email || 'demo@example.com',
          contact: selectedSeller.user.phone || '9999999999',
        },
        theme: { color: '#0c1f4d' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => showToast('Payment failed. Please try again.', 'error'));
      razorpay.open();
    } catch (error) {
      showToast(`Something went wrong: ${error.message}`, 'error');
    } finally {
      setIsRazorpayLoading(false);
      setIsPurchaseOpen(false);
      setDays('');
      setAmount(0);
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      if (!selectedSeller?.user?._id) throw new Error('No seller selected');
      if (!selectedSeller?.bannerPayment?._id) throw new Error('No active banner payment selected');
      if (!hasSubscription) throw new Error('No active subscription found');
      if (!subscriptionId) throw new Error('No subscription ID found');

      setIsRazorpayLoading(true);
      await loadRazorpayScript();

      const bannerData = {
        user_id: selectedSeller.user._id,
        old_banner_payment_id: selectedSeller.bannerPayment._id,
        days,
        amount,
        subscription_id: subscriptionId,
      };

      const { order } = await upgradeBanner(bannerData).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Upgrade Payment',
        description: `Upgrading banner for ${days} days`,
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await verifyBannerPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }).unwrap();

          if (verifyRes.success) {
            showToast(`Upgraded banner for ${days} days for ₹${amount}`, 'success');
            await refetchBannerPayments();
          }
        },
        prefill: { email: selectedSeller.user.email, contact: selectedSeller.user.phone },
        theme: { color: '#0c1f4d' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => showToast('Upgrade payment failed.', 'error'));
      razorpay.open();
    } catch (error) {
      showToast(`Something went wrong: ${error.message}`, 'error');
    } finally {
      setIsRazorpayLoading(false);
      setIsUpgradeOpen(false);
      setDays('');
      setAmount(0);
    }
  };

  const handleCancel = async () => {
    if (!selectedSeller?.bannerPayment?._id) {
      showToast('No banner payment selected.', 'error');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      await cancelBanner(selectedSeller.bannerPayment._id).unwrap();
      showToast('Banner subscription cancelled successfully', 'success');
      await refetchBannerPayments();
      setIsCancelDialogOpen(false);
    } catch (error) {
      showToast(`Failed to cancel: ${error.message}`, 'error');
      setIsCancelDialogOpen(false);
    }
  };

  return (
    <Card className="border-[#0c1f4d] rounded-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#0c1f4d] to-blue-800 text-white">
        <CardTitle className="text-2xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8" />
          Banner Plan & Upload Management
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-10">
        <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-green-800">Free Banner Upload</h3>
            <Badge variant="success" className="text-lg px-4 py-1">
              <Unlock className="h-4 w-4 mr-1" /> Always Available
            </Badge>
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFreeBannerFile(e.target.files[0])}
            className="mb-4"
          />
          {freeBannerFile && (
            <p className="text-sm text-gray-700 mb-4">Selected: <strong>{freeBannerFile.name}</strong></p>
          )}
          <Button
            onClick={handleFreeBannerUpload}
            disabled={!freeBannerFile}
            className="bg-green-600 hover:bg-green-700 text-white font-medium"
            size="lg"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Free Banner
          </Button>
        </div>

        <div className={`rounded-2xl p-8 border-2 ${hasActivePaidBanner
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-dashed border-gray-400 bg-gray-50'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-yellow-600" />
              Paid Banner (Premium Slot)
            </h3>
            {hasActivePaidBanner ? (
              <Badge variant="success" className="text-lg px-4 py-2">
                <Unlock className="h-5 w-5 mr-2" /> Active ({bannerDaysLeft} days left)
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                <Lock className="h-5 w-5 mr-2" /> Locked
              </Badge>
            )}
          </div>

          {hasActivePaidBanner ? (
            <>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPaidBannerFile(e.target.files[0])}
                className="mb-4"
              />
              {paidBannerFile && (
                <p className="text-sm text-gray-700 mb-4">Selected: <strong>{paidBannerFile.name}</strong></p>
              )}
              <Button
                onClick={handlePaidBannerUpload}
                disabled={!paidBannerFile}
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white font-medium"
                size="lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Paid Banner (Top Position)
              </Button>
            </>
          ) : (
            <Alert className="bg-amber-50 border-amber-300">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <AlertDescription className="ml-3">
                <p className="font-bold text-amber-900">Premium Banner Locked</p>
                <p className="text-amber-800 mt-1">
                  Purchase a paid plan to unlock top banner placement
                </p>
                <div className="mt-4 flex items-center gap-2 text-lg font-bold text-amber-700">
                  <IndianRupee className="h-6 w-6" />
                  Only ₹20 per day — Get featured above everyone!
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>


        <div className="pt-8 border-t-4 border-gray-300">
          <h3 className="text-xl font-bold text-[#0c1f4d] mb-6">Admin Payment Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white"
              onClick={() => setIsPurchaseOpen(true)}
              disabled={actionMode !== "purchase" || !selectedSeller?.user || isSubscriptionLoading || isRazorpayLoading}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Purchase Banner Plan
            </Button>

            <Button
            variant="outline"
            onClick={() => setIsUpgradeOpen(true)}
            disabled={actionMode !== "upgrade" || !selectedSeller?.bannerPayment || isSubscriptionLoading || isRazorpayLoading}
            >
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Upgrade Plan
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={actionMode !== "cancel" || !selectedSeller?.bannerPayment || isRazorpayLoading}
            >
              <XCircle className="mr-2 h-5 w-5" />
              Cancel Plan
            </Button>
          </div>
        </div>

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
                min="1"
                disabled={isRazorpayLoading}
              />
              <p className="text-lg font-medium">Total: ₹{amount} (₹20/day)</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>Cancel</Button>
              <Button
                className="bg-[#0c1f4d]"
                onClick={handlePurchase}
                disabled={!days || amount <= 0 || isRazorpayLoading}
              >
                {isRazorpayLoading ? 'Processing...' : 'Proceed to Payment'}
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
                placeholder="Add more days"
                value={days}
                onChange={handleDaysChange}
                min="1"
                disabled={isRazorpayLoading}
              />
              <p className="text-lg font-medium">Add: ₹{amount}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>Cancel</Button>
              <Button className="bg-[#0c1f4d]" onClick={handleUpgrade}>
                {isRazorpayLoading ? 'Processing...' : 'Upgrade Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Cancellation</DialogTitle>
            </DialogHeader>
            <p>Cancel banner subscription for {selectedSeller?.user?.email}?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>Cancel</Button>
              <Button className="bg-red-600 text-white" onClick={handleCancel}>
                Confirm Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
};

export default BannerPlanManagement;
