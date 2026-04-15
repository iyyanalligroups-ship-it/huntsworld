import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import showToast from '@/toast/showToast';
import {
  useCreateTopListingOrderMutation,
  useUpgradeTopListingMutation,
  useVerifyTopListingPaymentMutation,
  useCancelTopListingMutation,
} from '@/redux/api/TopListingApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import { ArrowUpCircle, XCircle, Calendar, Zap, Clock, ShieldCheck, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import Loader from '@/loader/Loader';

const TopListingPlanManagement = ({
  user,
  gst,
  hasSubscription,
  subscriptionId,
  planCode,
  activeTopListing,
  pendingTopListing,
  onRefresh,
  ratePerDay,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [days, setDays] = useState('');
  const [amount, setAmount] = useState(0);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);

  const [createOrder, { isLoading: isCreatingOrder }] = useCreateTopListingOrderMutation();
  const [upgradeOrder, { isLoading: isUpgradingOrder }] = useUpgradeTopListingMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyTopListingPaymentMutation();
  const [cancelTopListing, { isLoading: isCancelling }] = useCancelTopListingMutation();
  const isAnyLoading = isCreatingOrder || isUpgradingOrder || isVerifyingPayment || isCancelling || isRazorpayLoading;

  const gstRate = Number(gst) || 0;
  const taxAmount = (amount * gstRate) / 100;
  const totalWithGst = amount + taxAmount;

  const handleDaysChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setDays(val);
      setAmount(val * ratePerDay);
    } else {
      setDays('');
      setAmount(0);
    }
  };

  const handleAction = async (isUpgrade = false) => {
    if (!days || amount <= 0) {
      showToast('Enter valid number of days', 'error');
      return;
    }
    setIsRazorpayLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Razorpay failed to load');

      let response;
      const basePayload = {
        user_id: user?.user?._id,
        days,
        amount,
        subscription_id: subscriptionId,
      };

      if (isUpgrade && activeTopListing) {
        response = await upgradeOrder({
          ...basePayload,
          old_top_listing_payment_id: activeTopListing._id,
        }).unwrap();
      } else {
        response = await createOrder(basePayload).unwrap();
      }

      const { order } = response;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Top Listing Service',
        description: `${isUpgrade ? 'Extension' : 'Activation'} for ${days} days`,
        order_id: order.id,
        handler: async (rzpResponse) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_order_id: rzpResponse.razorpay_order_id,
              razorpay_signature: rzpResponse.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              showToast(isUpgrade ? 'Plan extended successfully!' : 'Top listing activated!', 'success');
              onRefresh();
            }
          } catch (err) {
            showToast('Payment verification failed', 'error');
          }
        },
        prefill: {
          email: user?.user?.email || '',
          contact: user?.user?.phone || '',
        },
        theme: { color: '#0c1f4d' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      showToast(err.message || 'Payment initiation failed', 'error');
    } finally {
      setIsRazorpayLoading(false);
      setIsOpen(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelTopListing({ top_listing_payment_id: activeTopListing._id }).unwrap();
      showToast('Plan cancelled', 'success');
      setIsCancelOpen(false);
      onRefresh();
    } catch (err) {
      showToast('Failed to cancel', 'error');
    }
  };

  return (
    <>
      {isRazorpayLoading && <Loader label="Processing Payment Securely..." />}
      {isAnyLoading && !isRazorpayLoading && <Loader />}
      <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-blue-600 w-6 h-6" />
                Plan Management
            </CardTitle>
            {activeTopListing && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live Now
                </span>
            )}
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {planCode === "FREE" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold text-amber-900">Paid Plan Required</h4>
              <p className="text-sm text-amber-700 leading-relaxed font-medium">
                Top Listing is a premium feature exclusive to merchants on a paid subscription (Basic, Royal, or Premium). 
                Upgrade your main business plan to activate priority ranking for your products.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 cursor-pointer border-amber-300 text-amber-800 hover:bg-amber-100 font-bold px-6 h-10 rounded-xl transition-all"
                onClick={() => window.location.href = '/merchant/plans/subscription'}
              >
                View Plans
              </Button>
            </div>
          </div>
        )}

        {activeTopListing || pendingTopListing ? (
          <div className="space-y-4">
            {activeTopListing && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Calendar className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Remaining Time</p>
                        <p className="text-lg font-bold text-gray-900">{activeTopListing.days} Days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Clock className="text-orange-500 w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Expiry Date</p>
                        <p className="text-lg font-bold text-gray-900">
                            {new Date(activeTopListing.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-[#0c1f4d] cursor-pointer hover:bg-[#162e63] rounded-xl flex-1 h-12 shadow-lg shadow-blue-900/10"
                    onClick={() => setIsOpen(true)}
                    disabled={planCode === "FREE"}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Boost Duration
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 cursor-pointer text-red-600 hover:bg-red-50 rounded-xl flex-1 h-12"
                    onClick={() => setIsCancelOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Stop Campaign
                  </Button>
                </div>
              </div>
            )}

            {pendingTopListing && !activeTopListing && (
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <div className="flex items-center gap-3">
                    <AlertCircle className="text-amber-600 w-5 h-5" />
                    <div>
                        <p className="text-amber-900 font-bold text-sm">Action Required: Payment Pending</p>
                        <p className="text-amber-700 text-xs">A {pendingTopListing.days}-day plan is waiting for payment.</p>
                    </div>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 rounded-lg text-xs" onClick={() => setIsOpen(true)}>
                    Complete Now
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <Zap className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No Active Promotion</h3>
            <p className="text-gray-500 mb-8 max-w-[260px] mx-auto text-sm">
              Your products aren't being prioritized right now. Activate a plan to fix that.
            </p>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#162e63] px-8 h-12 rounded-xl shadow-xl shadow-blue-900/20"
              onClick={() => setIsOpen(true)}
              disabled={!hasSubscription || !subscriptionId || planCode === "FREE"}
            >
              Start New Campaign
            </Button>
          </div>
        )}
      </CardContent>

      {/* Modern Checkout Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#0c1f4d] p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {activeTopListing ? 'Extend Promotion' : 'Activate Promotion'}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Plan Duration</label>
              <div className="relative">
                <Input
                    type="number"
                    placeholder="e.g. 30"
                    className="h-14 rounded-xl border-2 border-slate-300 bg-gray-50 focus:bg-white text-lg font-bold pr-16"
                    value={days}
                    onChange={handleDaysChange}
                    min="1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Days</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-inner">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-400">
                        <span>Daily Rate</span>
                        <span>₹{ratePerDay.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-400">
                        <span>Subtotal</span>
                        <span>₹{amount.toFixed(2)}</span>
                    </div>
                    {gstRate > 0 && (
                        <div className="flex justify-between text-sm text-blue-400">
                            <span>GST ({gstRate}%)</span>
                            <span>+ ₹{taxAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-3 mt-3 border-t border-slate-700 flex justify-between items-end">
                        <span className="font-bold">Total Amount</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-blue-400">₹{totalWithGst.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl cursor-pointer text-gray-500" onClick={() => setIsOpen(false)}>
              Back
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#162e63] flex-[2] cursor-pointer rounded-xl h-12 font-bold"
              onClick={() => handleAction(!!activeTopListing)}
              disabled={isRazorpayLoading || !days || amount <= 0}
            >
              {isRazorpayLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                'Proceed to Checkout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simplified Cancel Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold">End Campaign Early?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
              <p className="text-gray-600 leading-relaxed font-medium">
                Are you sure you want to stop this promotion? You will lose your priority ranking immediately.
              </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl flex-1 cursor-pointer" onClick={() => setIsCancelOpen(false)}>
              Keep Campaign
            </Button>
            <Button 
                variant="destructive" 
                className="rounded-xl flex-1 cursor-pointer" 
                onClick={handleCancel}
                disabled={isCancelling}
            >
              {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'End Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </Card>
    </>
  );
};

export default TopListingPlanManagement;
