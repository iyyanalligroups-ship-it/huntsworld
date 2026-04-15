import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { loadRazorpayScript, RAZORPAY_GLOBAL_CONFIG } from '@/modules/merchant/utils/Razorpay';
import {
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useCreateSubscriptionMutation,
} from '@/redux/api/UserSubscriptionPlanApi';
import { useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi'; // New import
import { useContext, useState } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';

const PurchaseDialog = ({ open, onOpenChange, plan, onPurchase, isLoading: parentLoading }) => {
  const { user } = useContext(AuthContext);
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [createUserSubscription] = useCreateSubscriptionMutation();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch GST plan
  const { data: gstPlanData, isLoading: isGSTLoading, error: gstError } = useGetGSTPlanQuery();

  // Calculate GST and total amount
  const baseAmount = plan?.subscription_plan_id?.price || 0;
  const gstPercentage = gstPlanData?.data?.price || 0; // e.g., 18
  const gstAmount = (baseAmount * gstPercentage) / 100;
  const totalAmount = baseAmount + gstAmount;

  // const handlePurchase = async () => {
  //   try {
  //     setIsLoading(true);
  //     if (!plan) {
  //       showToast('Please select a plan', 'error');
  //       return;
  //     }

  //     const userId = user?.user?._id;
  //     if (!userId) {
  //       showToast('User not logged in', 'error');
  //       return;
  //     }

  //     if (gstError) {
  //       showToast('Failed to fetch GST details', 'error');
  //       return;
  //     }

  //     const scriptLoaded = await loadRazorpayScript();
  //     if (!scriptLoaded) {
  //       showToast('Failed to load Razorpay script', 'error');
  //       return;
  //     }

  //     // Create order with base amount (backend will add GST)
  //     const { order, gst } = await createRazorpayOrder({
  //       user_id: userId,
  //       subscription_plan_id: plan?.subscription_plan_id?._id,
  //       amount: plan?.subscription_plan_id?.price, // Send base amount
  //     }).unwrap();

  //     const options = {
  //       key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  //       amount: order.amount, // Total amount (base + GST) from backend
  //       currency: order.currency,
  //       name: 'Subscription Payment',
  //       description: `Paying for ${plan.subscription_plan_id.plan_name}`,
  //       order_id: order.id,
  //       handler: async (response) => {
  //         try {
  //           console.log('🔍 Razorpay Response:', response);

  //           // Verify payment
  //           const verifyRes = await verifyPayment({
  //             razorpay_payment_id: response.razorpay_payment_id,
  //             razorpay_order_id: response.razorpay_order_id,
  //             razorpay_signature: response.razorpay_signature,
  //           }).unwrap();

  //           console.log('✅ Backend Verify Response:', verifyRes);

  //           if (verifyRes.success) {
  //             // Create subscription
  //             await createUserSubscription({
  //               user_id: userId,
  //               subscription_plan_id: plan.subscription_plan_id._id,
  //               amount: plan.subscription_plan_id.price, // Base amount
  //               razorpay_order_id: response.razorpay_order_id,
  //             }).unwrap();

  //             onPurchase(plan);
  //             showToast('Payment Successful!', 'success');
  //           } else {
  //             showToast(verifyRes.message || 'Payment verification failed', 'error');
  //           }
  //         } catch (error) {
  //           console.error('Verification failed:', error);
  //           showToast(error.data?.message || 'Error verifying payment', 'error');
  //         } finally {
  //           setIsLoading(false);
  //         }
  //       },
  //       prefill: {
  //         email: user?.user?.email || 'demo@example.com',
  //         contact: user?.user?.phone || '9999999999',
  //       },
  //       theme: { color: '#0c1f4d' },
  //     };

  //     const razorpay = new window.Razorpay(options);
  //     razorpay.on('payment.failed', () => {
  //       setIsLoading(false);
  //       showToast('Payment failed. Please try again.', 'error');
  //     });
  //     razorpay.open();
  //   } catch (err) {
  //     console.error('Purchase Error:', err);
  //     showToast('Something went wrong. Try again.', 'error');
  //     setIsLoading(false);
  //   }
  // };


const handlePurchase = async () => {
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

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      showToast("Failed to load Razorpay script", "error");
      return;
    }

    // Create order in backend
    const orderResponse = await createRazorpayOrder({
      user_id: userId,
      subscription_plan_id: plan?.subscription_plan_id?._id,
      amount: plan?.subscription_plan_id?.price,
    }).unwrap();

    if (!orderResponse?.order) {
      showToast("Failed to create order", "error");
      return;
    }

    const { order } = orderResponse;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Subscription Payment",
      description: `Paying for ${plan.subscription_plan_id.plan_name}`,
      order_id: order.id,
      handler: async (response) => {
        try {
          console.log("🔍 Razorpay Response:", response);

          // Step 1: Verify payment with backend
          const verifyRes = await verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }).unwrap();

          console.log("✅ Backend Verify Response:", verifyRes);

          if (!verifyRes.success) {
            showToast(verifyRes.message || "Payment verification failed", "error");
            return;
          }

          // Step 2: Create subscription with all required payment details
          const createSubRes = await createUserSubscription({
            user_id: userId,
            subscription_plan_id: plan.subscription_plan_id._id,
            amount: plan.subscription_plan_id.price,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id, // Add this
            razorpay_signature: response.razorpay_signature, // Add this
          }).unwrap();

          console.log("✅ Create Subscription Response:", createSubRes);

          // Call onPurchase and show success toast only after subscription creation
          onPurchase(plan);
          showToast("Payment Successful!", "success");
        } catch (error) {
          console.error("Error in payment handler:", error);
          showToast(error.data?.message || "Error processing payment", "error");
        } finally {
          setIsLoading(false);
        }
      },
      prefill: {
        email: user?.user?.email || "demo@example.com",
        contact: user?.user?.phone || "9999999999",
      },
      theme: { color: "#0c1f4d" },
      config: RAZORPAY_GLOBAL_CONFIG,
      modal: {
        ondismiss: () => {
          setIsLoading(false);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", (response) => {
      console.error("Razorpay Payment Failed:", response);
      setIsLoading(false);
      showToast("Payment failed. Please try again.", "error");
    });
    razorpay.open();
  } catch (err) {
    console.error("Purchase Error:", err);
    showToast(err.data?.message || "Something went wrong. Try again.", "error");
    setIsLoading(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {(isLoading || parentLoading || isGSTLoading) ? (
            <Skeleton className="h-6 w-1/2" />
          ) : (
            <h2>Confirm Purchase</h2>
          )}
        </DialogHeader>
        {(isLoading || parentLoading || isGSTLoading) ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        ) : plan ? (
          <>
            <div className="space-y-2">
              <p>
                <strong>Plan:</strong> {plan.subscription_plan_id.plan_name}
              </p>
              <p>
                <strong>Base Amount:</strong> ₹{baseAmount.toLocaleString('en-IN')}
              </p>
              {gstError ? (
                <p className="text-red-500">Failed to load GST details</p>
              ) : (
                <>
                  <p>
                    <strong>GST ({gstPercentage}%):</strong> ₹{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} disabled={isLoading || parentLoading || isGSTLoading}>
                Cancel
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-400 cursor-pointer"
                onClick={handlePurchase}
                disabled={isLoading || parentLoading || isGSTLoading || gstError}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Purchase
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p>No plan selected. Please select a plan to proceed.</p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} disabled={isLoading || parentLoading || isGSTLoading}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;