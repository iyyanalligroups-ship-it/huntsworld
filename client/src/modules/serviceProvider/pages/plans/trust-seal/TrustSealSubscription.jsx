import { useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { loadRazorpayScript, RAZORPAY_GLOBAL_CONFIG } from '@/modules/serviceProvider/utils/Razorpay';
import { toast } from 'react-toastify';
import {
  useCheckUserSubscriptionQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import {
  useCreateTrustSealRequestMutation,
  useVerifyTrustSealPaymentMutation,
  useGetUserTrustSealStatusQuery,
  useGetTrustSealPriceQuery,
  useGetMerchantTrustSealDetailsQuery,
} from '@/redux/api/TrustSealRequestApi';
import { useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import { Eye } from 'lucide-react';
import TrustSealCertificate from './TrustSealCertificate';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

const socket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/trust-seal-notifications`, {
  withCredentials: true,
  transports: ['websocket'],
});

const TrustSealSubscription = () => {
  const { user } = useContext(AuthContext);
   const { isSidebarOpen } = useSidebar();
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [trustSealStatus, setTrustSealStatus] = useState(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const { data: configData, isLoading: isConfigLoading } = useGetTrustSealPriceQuery();
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  const { data: trustSealData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetUserTrustSealStatusQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  const { data: merchantDetails, isLoading: isMerchantDetailsLoading } = useGetMerchantTrustSealDetailsQuery({userId:user?.user?._id}, {
    skip: !user?.user?._id || !isCertificateOpen || trustSealStatus?.status !== 'verified',
  });
  const { data: gstPlanData, isLoading: isGSTLoading, error: gstError } = useGetGSTPlanQuery();

  const [createTrustSealRequest] = useCreateTrustSealRequestMutation();
  const [verifyTrustSealPayment] = useVerifyTrustSealPaymentMutation();

  useEffect(() => {
    if (trustSealData?.trustSealRequest) {
      setTrustSealStatus(trustSealData.trustSealRequest);
    }

    socket.on('connect', () => {
      console.log('Merchant Socket connected:', socket.id);
      socket.emit('join', user?.user?._id);
    });

    socket.on('trustSealRequestUpdated', (notification) => {
      console.log('Received trustSealRequestUpdated:', notification);
      setTrustSealStatus(notification);
      toast.success(`Trust Seal Request ${notification.status}`);
      refetchStatus();
    });

    return () => {
      socket.off('trustSealRequestUpdated');
      socket.off('connect');
    };
  }, [trustSealData, user, refetchStatus]);

  const trustSealAmount = configData?.data?.price || 500;
  const gstPercentage = gstPlanData?.data?.price || 0;
  const gstAmount = (trustSealAmount * gstPercentage) / 100;
  const totalAmount = trustSealAmount + gstAmount;

  const handlePurchase = async () => {
    try {
      const userId = user?.user?._id;
      const subscriptionId = subscriptionData?.subscriptionId;
      if (!userId) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No active subscription found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }

      const { order, trustSealRequest } = await createTrustSealRequest({
        user_id: userId,
        amount: trustSealAmount,
        subscription_id: subscriptionId,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Trust Seal Request Payment',
        description: `Purchasing Trust Seal for ₹${totalAmount.toFixed(2)}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyTrustSealPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              toast.success(`Payment for Trust Seal (₹${totalAmount.toFixed(2)}) completed. Awaiting admin verification.`);
              setIsPurchaseOpen(false);
              refetchStatus();
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
        config: RAZORPAY_GLOBAL_CONFIG,
      };

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

  if (isConfigLoading || isSubscriptionLoading || isStatusLoading || !user) {
    return (
      <div className="flex justify-center items-center p-6 bg-[#f0f4f6] rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
        <span className="ml-3 text-gray-700 text-lg font-medium">Loading trust seal subscription...</span>
      </div>
    );
  }

  const hasSubscription = subscriptionData?.hasSubscription;

  return (

    <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'}`}>
      <div className="text-center mb-10">
        <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-36 font-bold">Trust Seal Subscription</h2>
        
        {isGSTLoading ? (
          <p className="text-gray-600 mt-2">Loading GST details...</p>
        ) : gstError ? (
          <p className="text-red-600 mt-2">Failed to load GST details</p>
        ) : (
          <>
            <p className="text-gray-600 mt-2">Purchase a Trust Seal to enhance your store's credibility.</p>
            <p className="text-gray-600 mt-2">Base Cost: ₹{trustSealAmount.toFixed(2)}</p>
            <p className="text-gray-600 mt-2">GST ({gstPercentage}%): ₹{gstAmount.toFixed(2)}</p>
            <p className="text-gray-600 mt-2 font-bold">Total Cost: ₹{totalAmount.toFixed(2)}</p>
          </>
        )}
        {!hasSubscription && (
          <p className="text-red-600 mt-2">You need an active subscription to purchase a trust seal.</p>
        )}
        {trustSealStatus && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Status: <span className={`font-medium ${trustSealStatus.status === 'verified' ? 'text-green-600' : trustSealStatus.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{trustSealStatus.status}</span>
            </p>
            {trustSealStatus.notes && (
              <p className="text-sm text-gray-600">Notes: {trustSealStatus.notes}</p>
            )}
          </div>
        )}
      </div>
      {hasSubscription && trustSealStatus?.status === 'verified' && (
        <div className="flex flex-col items-center md:absolute md:top-6 lg:mt-10 md:right-6 md:flex-row md:items-start">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCertificateOpen(true)}
            className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white mb-4 md:mb-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )}
      {hasSubscription ? (
        <div className="text-center">
          <Button
            className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white"
            onClick={() => setIsPurchaseOpen(true)}
            disabled={trustSealStatus?.status === 'pending' || trustSealStatus?.status === 'verified' || isGSTLoading || gstError}
          >
            Purchase Trust Seal
          </Button>
        </div>
      ) : (
        <p className="text-red-600 text-center">Please subscribe to a plan to purchase a trust seal.</p>
      )}

      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Trust Seal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              value={trustSealAmount}
              disabled
              className="w-full"
            />
            {isGSTLoading ? (
              <p className="text-sm text-gray-600">Loading GST...</p>
            ) : gstError ? (
              <p className="text-sm text-red-600">Failed to load GST details</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">Base Cost: ₹{trustSealAmount.toFixed(2)}</p>
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
              disabled={isRazorpayLoading || isGSTLoading || gstError}
              onClick={handlePurchase}
            >
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen} maxWidth="4xl">
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Trust Seal Certificate</DialogTitle>
          </DialogHeader>
          {isMerchantDetailsLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
            </div>
          ) : (
            <TrustSealCertificate
              companyName={merchantDetails?.companyName || user?.user?.name}
              address={merchantDetails?.address?.fullAddress || 'N/A'}
              director={merchantDetails?.director || 'N/A'}
              gstin={merchantDetails?.gstin || 'N/A'}
              iec={merchantDetails?.iec || 'N/A'}
              mobile={merchantDetails?.companyPhone || user?.user?.phone || 'N/A'}
              email={merchantDetails?.companyEmail || user?.user?.email || 'N/A'}
              issueDate={trustSealStatus?.issueDate || new Date()}
              expiryDate={trustSealStatus?.expiryDate || new Date()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrustSealSubscription;