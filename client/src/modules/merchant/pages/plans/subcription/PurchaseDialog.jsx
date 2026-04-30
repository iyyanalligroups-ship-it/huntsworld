import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { loadRazorpayScript, RAZORPAY_GLOBAL_CONFIG } from '@/modules/merchant/utils/Razorpay';
import {
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useUpgradeSubscriptionMutation,
} from '@/redux/api/UserSubscriptionPlanApi';
import { useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import { useContext, useState, useRef } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';
import axios from 'axios';
import Loader from '@/loader/Loader';

const PurchaseDialog = ({
  open,
  onOpenChange,
  plan,
  activePlan,
  oldSubscriptionId,
  onPaymentSuccess,
  isLoading: parentLoading,
}) => {
  const { user } = useContext(AuthContext);
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [upgradeSubscription] = useUpgradeSubscriptionMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);

  const { data: gstPlanData, isLoading: isGSTLoading, error: gstError } = useGetGSTPlanQuery();

  const baseAmount = plan?.subscription_plan_id?.price || 0;
  const gstPercentage = gstPlanData?.data?.price || 0;

  const paymentInProgressRef = useRef(false);

  const checkAddressForPayment = async (user_id) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/address/check-address-for-payment`,
      { user_id }
    );
    return response.data;
  };

  const handlePurchase = async () => {
    if (paymentInProgressRef.current) return;
    paymentInProgressRef.current = true;

    try {
      setIsLoading(true);

      if (!plan) {
        showToast("Please select a plan", "error");
        return;
      }

      const userId = user?.user?._id;
      if (!userId) {
        showToast("User not logged in", "error");
        return;
      }

      await checkAddressForPayment(userId);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast("Razorpay SDK failed to load", "error");
        return;
      }

      const orderRes = await createRazorpayOrder({
        user_id: userId,
        subscription_plan_id: plan.subscription_plan_id._id,
        amount: plan.subscription_plan_id.price,
        auto_renew: autoRenew,
      }).unwrap();

      const { razorpayData, auto_renew } = orderRes;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,

        ...(auto_renew
          ? { subscription_id: razorpayData.id }
          : { order_id: razorpayData.id }
        ),

        name: "Subscription Payment",
        description: plan.subscription_plan_id.plan_name,

        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id || null,
              razorpay_subscription_id: response.razorpay_subscription_id || null,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: userId,
              subscription_plan_id: plan.subscription_plan_id._id,
              amount: plan.subscription_plan_id.price,
            }).unwrap();

            if (activePlan) {
              try {
                // Handle Upgrade logic
                await upgradeSubscription({
                  user_id: userId,
                  subscription_plan_id: plan.subscription_plan_id._id,
                  old_subscription_id: oldSubscriptionId,
                  amount: plan.subscription_plan_id.price,
                  razorpay_order_id: response.razorpay_order_id || null,
                  razorpay_subscription_id: response.razorpay_subscription_id || null,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }).unwrap();
                showToast("Plan upgraded successfully 🎉", "success");
                onPaymentSuccess(plan);
              } catch (upgradeErr) {
                console.error("Upgrade error:", upgradeErr);
                showToast("Payment verified, but plan activation failed. Support has been notified.", "error");
              }
            } else {
              showToast("Subscription activated successfully 🎉", "success");
              onPaymentSuccess(plan);
            }
          } catch (err) {
            console.error("Verification error:", err);
            showToast(err?.data?.message || "Payment verification failed", "error");
          } finally {
            paymentInProgressRef.current = false;
            setIsLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            paymentInProgressRef.current = false;
            setIsLoading(false);
          },
        },

        prefill: {
          email: user.user.email,
          contact: user.user.phone,
        },

        theme: { color: "#0c1f4d" },
        config: RAZORPAY_GLOBAL_CONFIG,
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        paymentInProgressRef.current = false;
        setIsLoading(false);
        showToast("Payment failed", "error");
      });

      razorpay.open();
    } catch (err) {
      console.error("Purchase Error:", err);
      const message = err?.response?.data?.message || "Something went wrong";
      showToast(message, "error");
    } finally {
      paymentInProgressRef.current = false;
      setIsLoading(false);
    }
  };

  const isAnyLoading = isLoading || parentLoading || isGSTLoading;
  const isButtonDisabled = isAnyLoading || gstError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isLoading && <Loader label="Processing payment securely..." />}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {isAnyLoading ? (
            <Skeleton className="h-6 w-1/2" />
          ) : (
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {activePlan ? "Change Subscription Plan" : "Confirm Purchase"}
            </h2>
          )}
        </DialogHeader>

        {isAnyLoading ? (
          <Loader contained={true} />
        ) : plan ? (
          <>
            <div className="space-y-6 py-2">
              {activePlan && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-900">
                      <p className="font-bold mb-1">Plan Switch Warning</p>
                      <p className="opacity-90 leading-snug">
                        Your current <strong>{activePlan.plan_name || 'Active'}</strong> plan features will be
                        <span className="font-semibold text-red-600"> disabled immediately</span>.<br />
                        The new <strong>{plan.subscription_plan_id.plan_name}</strong> plan will apply right away.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Updated price display with -1 reduction ── */}
              <div className="bg-slate-50 p-5 rounded-lg border-2 border-slate-300 space-y-3 text-sm shadow-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">New Plan</span>
                  <span>{plan.subscription_plan_id.plan_name}</span>
                </div>

                {(() => {
                  const originalBase = baseAmount;
                  const reducedBase = originalBase > 0 ? originalBase - 1 : originalBase;
                  const reducedGst = (reducedBase * gstPercentage) / 100;
                  const reducedTotal = reducedBase + reducedGst;

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Amount</span>
                        <span>₹{reducedBase.toLocaleString('en-IN')}</span>
                      </div>

                      {gstError ? (
                        <p className="text-red-500 text-xs pt-1">Failed to load GST details</p>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-slate-500">GST ({gstPercentage}%)</span>
                          <span>₹{reducedGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="border-t pt-3 mt-1 flex justify-between text-base font-bold text-slate-900">
                        <span>Total Amount</span>
                        <span>₹{reducedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  );
                })()}
              </div>



              {/* Auto-renew option */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="auto-renew"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  disabled={isAnyLoading || baseAmount === 0 || !plan?.subscription_plan_id?.razorpay_plan_id}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <label
                  htmlFor="auto-renew"
                  className={`text-sm cursor-pointer select-none leading-snug ${(!plan?.subscription_plan_id?.razorpay_plan_id && baseAmount > 0) ? 'text-slate-400' : 'text-slate-600'}`}
                >
                  Enable auto-renewal (automatic payment next cycle) <br />
                  <span className="text-xs text-slate-500">
                    {(!plan?.subscription_plan_id?.razorpay_plan_id && baseAmount > 0) ? (
                      <span className="text-amber-600 font-medium">⚠️ This plan is not yet configured for auto-pay in the database.</span>
                    ) : (
                      "Your card will be charged automatically at the end of this period"
                    )}
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-4 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isAnyLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204dec] text-white flex-1 sm:flex-none"
                onClick={handlePurchase}
                disabled={isButtonDisabled}
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {activePlan ? "Agree & Switch Plan" : "Confirm & Pay"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8">
            <p className="text-center text-slate-500">No plan selected.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
