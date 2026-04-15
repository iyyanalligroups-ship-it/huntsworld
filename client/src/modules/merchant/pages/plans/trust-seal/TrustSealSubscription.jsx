import { useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { loadRazorpayScript, RAZORPAY_GLOBAL_CONFIG } from '@/modules/merchant/utils/Razorpay';
import { toast } from 'react-toastify';
import {
  useCheckUserSubscriptionQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import { useNavigate } from 'react-router-dom';
import {
  useCreateTrustSealRequestMutation,
  useVerifyTrustSealPaymentMutation,
  useGetUserTrustSealStatusQuery,
  useGetTrustSealPriceQuery,
  useGetMerchantTrustSealDetailsQuery,
} from '@/redux/api/TrustSealRequestApi';
import { useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import { Eye, Shield, CheckCircle, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import TrustSealCertificate from './TrustSealCertificate';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import axios from 'axios';
import Loader from '@/loader/Loader';

const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/trust-seal-notifications`, {
  withCredentials: true,
  transports: ['websocket'],
});

const TrustSealSubscription = () => {
  const { user } = useContext(AuthContext);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [trustSealStatus, setTrustSealStatus] = useState(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const [addressBlocked, setAddressBlocked] = useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = useState("");
  const { data: configData, isLoading: isConfigLoading } = useGetTrustSealPriceQuery();
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  const { data: trustSealData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetUserTrustSealStatusQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  const { data: merchantDetails, isLoading: isMerchantDetailsLoading } = useGetMerchantTrustSealDetailsQuery(
    { userId: user?.user?._id },
    {
      skip: !user?.user?._id || !isCertificateOpen || trustSealStatus?.effectiveStatus !== 'verified',
    }
  );
  const { data: gstPlanData } = useGetGSTPlanQuery();

  const [createTrustSealRequest] = useCreateTrustSealRequestMutation();
  const [verifyTrustSealPayment] = useVerifyTrustSealPaymentMutation();

  // Determine effective status: auto-detect expired even if DB not updated yet
  useEffect(() => {
    if (trustSealData?.trustSealRequest) {
      const request = trustSealData.trustSealRequest;

      let effectiveStatus = request.status;

      // If verified but expiry date has passed → treat as expired
      if (
        request.status === 'verified' &&
        request.expiryDate &&
        new Date(request.expiryDate) < new Date()
      ) {
        effectiveStatus = 'expired';
      }

      setTrustSealStatus({
        ...request,
        effectiveStatus,
      });
    } else {
      setTrustSealStatus(null);
    }

    // Socket connection and real-time updates
    socket.on('connect', () => {
      console.log('Trust Seal Socket connected:', socket.id);
      socket.emit('join', user?.user?._id);
    });

    socket.on('trustSealRequestUpdated', (notification) => {
      let updatedStatus = notification.status;

      if (
        notification.status === 'verified' &&
        notification.expiryDate &&
        new Date(notification.expiryDate) < new Date()
      ) {
        updatedStatus = 'expired';
      }

      setTrustSealStatus({
        ...notification,
        effectiveStatus: updatedStatus,
      });

      showToast(
        `Trust Seal ${updatedStatus === 'verified' ? 'Verified' : updatedStatus.charAt(0).toUpperCase() + updatedStatus.slice(1)}!`,
        'success'
      );

      refetchStatus(); // Sync with backend
    });

    return () => {
      socket.off('trustSealRequestUpdated');
      socket.off('connect');
    };
  }, [trustSealData, user, refetchStatus]);

  const trustSealAmount = configData?.data?.price || 500;
  const duration = configData?.data?.duration || 1;
  const unit = configData?.data?.unit || 'year';
  const displayUnit = duration === 1 ? unit : unit + 's'; // "year" → "year", "years" → "years"
  const gstPercentage = gstPlanData?.data?.price || 0;
  const gstAmount = (trustSealAmount * gstPercentage) / 100;
  const totalAmount = trustSealAmount + gstAmount;


  useEffect(() => {
    const checkAddressOnLoad = async () => {
      const userId = user?.user?._id;
      if (!userId) return;

      try {
        await checkAddressForPayment(userId);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          "Please complete your address details before purchasing a plan";
        setAddressErrorMessage(message);
        setAddressBlocked(true);
      }
    };

    checkAddressOnLoad();
  }, [user]);
  const checkAddressForPayment = async (user_id) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/address/check-address-for-payment`,
      { user_id }
    );
    return response.data;
  };

  const handlePurchase = async () => {
    try {
      const userId = user?.user?._id;
      const subscriptionId = subscriptionData?.subscriptionId;
      const hasFreeTrustSeal = subscriptionData?.features?.trust_seal === true;

      if (!userId) throw new Error("User not logged in");
      if (!subscriptionId) throw new Error("No active subscription found");

      setIsRazorpayLoading(true);

      /* -----------------------------------------
         🟢 CASE 1: Trust Seal already included
      ------------------------------------------ */
      if (hasFreeTrustSeal) {
        await createTrustSealRequest({
          user_id: userId,
          amount: 0,
          subscription_id: subscriptionId,
          is_free: true,
        }).unwrap();

        showToast(
          <div className="flex items-center gap-3">
          
            <div>
              <p className="font-semibold">Request Submitted!</p>
              <p className="text-sm">Trust Seal request submitted without payment.</p>
            </div>
          </div>,
          "success"
        );

        setIsPurchaseOpen(false);
        refetchStatus();
        return; // ⛔ STOP here (no Razorpay)
      }

      /* -----------------------------------------
         🔵 CASE 2: Paid Trust Seal (Razorpay)
      ------------------------------------------ */

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay");
      }

      const response = await createTrustSealRequest({
        user_id: userId,
        amount: trustSealAmount,
        subscription_id: subscriptionId,
      }).unwrap();

      const { order } = response;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "HuntsWorld Trust Seal",
        description: `Trust Seal for ${duration} ${displayUnit} – ₹${totalAmount.toFixed(
          2
        )}`,
        order_id: order.id,

        handler: async (response) => {
          try {
            const verifyRes = await verifyTrustSealPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              showToast(
                <div className="flex items-center gap-3">
                
                  <div>
                    <p className="font-semibold">Payment Successful!</p>
                    <p className="text-sm">Your request is under verification.</p>
                  </div>
                </div>,
                "success"
              );
              setIsPurchaseOpen(false);
              refetchStatus();
            }
          } catch {
            showToast("Payment verification failed", "error");
          }
        },

        prefill: {
          name: user?.user?.name || "",
          email: user?.user?.email || "",
          contact: user?.user?.phone || "",
        },

        theme: { color: "#0c1f4d" },
        config: RAZORPAY_GLOBAL_CONFIG,
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () =>
        showToast("Payment failed. Please try again.", "error")
      );
      razorpay.open();
    } catch (error) {
      console.error("Trust Seal Purchase Error:", error);

      if (error?.data?.missing_fields) {
        showToast(
          <div>
            <p className="font-bold">Incomplete Profile</p>
            <p>Please update: {error.data.missing_fields.join(", ")}</p>
            <a
              href="/merchant/settings"
              className="underline text-blue-600"
            >
              Go to Business Profile →
            </a>
          </div>,
          "error"
        );
      } else {
        showToast(error.message || "Failed to initiate payment", "error");
      }
    } finally {
      setIsRazorpayLoading(false);
    }
  };


  if (isConfigLoading || isSubscriptionLoading || isStatusLoading || !user) {
    return (
      <Loader />
    );
  }

  const hasSubscription = subscriptionData?.hasSubscription;
  const effectiveStatus = trustSealStatus?.effectiveStatus || 'none';

  const isVerified = effectiveStatus === 'verified';
  const isExpired = effectiveStatus === 'expired';
  const isPending = ['pending', 'in_process', 'student_verified'].includes(effectiveStatus);

  const getStatusBadge = () => {
    if (isVerified) return <Badge className="text-base bg-green-100 text-green-800">Verified</Badge>;
    if (isExpired) return <Badge variant="destructive" className="text-base">Expired</Badge>;
    if (isPending) return <Badge variant="secondary" className="text-base">Pending Verification</Badge>;
    return <Badge variant="outline" className="text-base">Not Purchased</Badge>;
  };

  const getActionButtonText = () => {
    if (isExpired) return "Renew Trust Seal";
    if (isVerified) return "Active";
    if (isPending) return "Verification Pending";
    return "Purchase Trust Seal";
  };

  const isPurchaseDisabled = isPending || (isVerified && !isExpired);

  return (
    <div className={`p-6 ${isSidebarOpen ? 'lg:ml-56' : 'lg:ml-16'} transition-all duration-300`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {addressBlocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border-t-4 border-red-600">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Action Required</h3>
                    <p className="mt-2 text-sm text-gray-600">{addressErrorMessage}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => navigate("/merchant/settings")}
                    className="w-full cursor-pointer inline-flex justify-center items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
                  >
                    Go to Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0c1f4d]">Trust Seal Verification</h1>
          <p className="text-gray-600 mt-3 text-lg">Build customer trust with a verified business badge</p>
        </div>

        {isRazorpayLoading && <Loader label="Processing Request..." />}

        {subscriptionData?.planCode === "FREE" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-amber-900 leading-tight">Paid Plan Required</h4>
              <p className="text-sm text-amber-700 mt-1.5 leading-relaxed">
                The Trust Seal feature is exclusively available for merchants on a paid subscription (Basic, Royal, or Premium). 
                Please upgrade your main business plan to apply for verification.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 cursor-pointer border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => navigate('/merchant/plans/subscription')}
              >
                View Plans
              </Button>
            </div>
          </div>
        )}

        {/* Why Trust Seal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Shield className="w-8 h-8 text-[#0c1f4d]" />
              Why Get a Trust Seal?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-gray-700 text-base">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Increases customer trust and conversions by up to 42%</p>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Reduces cart abandonment due to lack of trust</p>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Displays verified GST, company name, and address</p>
            </div>
          </CardContent>
        </Card>

        {/* Status & Pricing Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getStatusBadge()}
              {isVerified && trustSealStatus?.expiryDate && (
                <p className="text-sm text-gray-600">
                  Valid until: <strong>{new Date(trustSealStatus.expiryDate).toLocaleDateString('en-IN')}</strong>
                </p>
              )}
              {isExpired && (
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your Trust Seal has expired. Renew to restore the badge.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pricing ({duration} {displayUnit})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-base">
                <span>Base Amount</span>
                <span>₹{trustSealAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span>GST ({gstPercentage}%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 font-bold text-xl flex justify-between">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          {/* View Certificate Button */}
          {hasSubscription && isVerified && (
            <Button variant="outline" size="lg" onClick={() => setIsCertificateOpen(true)}>
              <Eye className="w-5 h-5 mr-2" />
              View Certificate
            </Button>
          )}

          {/* Main Action Button */}
          {hasSubscription ? (
            <Button
              size="lg"
              className={`min-w-[220px] cursor-pointer ${subscriptionData?.features?.trust_seal
                ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
                : isExpired
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-[#0c1f4d] hover:bg-[#0c1f4dcc]'
                }`}
              onClick={() => setIsPurchaseOpen(true)}
              disabled={isPurchaseDisabled || subscriptionData?.features?.trust_seal || subscriptionData?.planCode === "FREE"}  // Disable if already has trust seal or FREE plan
            >
              {/* Icon */}
              {isExpired && <RefreshCw className="w-5 h-5 mr-2" />}

              {/* Dynamic Text */}
              {subscriptionData?.features?.trust_seal ? (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  You already have Trust Seal
                </>
              ) : (
                getActionButtonText()
              )}
            </Button>
          ) : (
            <Alert className="max-w-md">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                You need an active subscription to purchase a Trust Seal.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Purchase/Renew Dialog */}
        <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
          {isRazorpayLoading && <Loader label="Processing Payment Securely..." />}
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {isExpired ? 'Renew' : 'Purchase'} Trust Seal
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="flex justify-between text-lg">
                <span>Base Amount</span>
                <span>₹{trustSealAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>GST ({gstPercentage}%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 font-bold text-2xl flex justify-between">
                <span>Total Payable</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Validity: {duration} {displayUnit} from approval date
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => setIsPurchaseOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#0c1f4d] cursor-pointer"
                onClick={handlePurchase}
                disabled={isRazorpayLoading}
              >
                {isRazorpayLoading ? 'Processing...' : 'Pay Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Certificate View Dialog */}
        {/* Certificate View Dialog */}
        <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] p-0 overflow-y-auto bg-slate-50">
            <DialogHeader className="p-6 pb-0 bg-slate-50 sticky top-0 z-20">
              <DialogTitle className="text-2xl">Your Trust Seal Certificate</DialogTitle>
            </DialogHeader>

            {isMerchantDetailsLoading ? (
              <Loader />
            ) : (
              <div className="p-4 flex justify-center">
                <TrustSealCertificate
                  companyName={merchantDetails?.companyName || user?.user?.name || 'N/A'}
                  address={merchantDetails?.address?.fullAddress || 'N/A'}
                  director={merchantDetails?.director || 'N/A'}
                  gstin={merchantDetails?.gstin || 'N/A'}
                  mobile={merchantDetails?.companyPhone || user?.user?.phone || 'N/A'}
                  email={merchantDetails?.companyEmail || user?.user?.email || 'N/A'}
                  issueDate={trustSealStatus?.issueDate ? new Date(trustSealStatus.issueDate) : new Date()}
                  expiryDate={trustSealStatus?.expiryDate ? new Date(trustSealStatus.expiryDate) : new Date()}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TrustSealSubscription;