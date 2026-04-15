
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCreateTrustSealRequestMutation, useUpdateTrustSealRequestStatusMutation, useVerifyTrustSealPaymentMutation } from '@/redux/api/TrustSealRequestApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import { toast } from 'react-toastify';
import { CircleCheck, CircleX, CircleAlert,  } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AdminTrustSealPlanManagement = ({ targetUser, hasSubscription, trustSealRequest, onRefresh, trustSealAmount }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [upgradeAmount, setUpgradeAmount] = useState(trustSealAmount);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);

  const [createTrustSealRequest] = useCreateTrustSealRequestMutation();
  const [updateTrustSealRequestStatus] = useUpdateTrustSealRequestStatusMutation();
  const [verifyTrustSealPayment] = useVerifyTrustSealPaymentMutation();

  const handleAction = async () => {
    try {
      if (action === 'purchase') {
        if (!targetUser?._id || !hasSubscription) {
          throw new Error('User or subscription not found');
        }
        setIsRazorpayLoading(true);
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          throw new Error('Failed to load Razorpay script');
        }

        const { order, trustSealRequest: newRequest } = await createTrustSealRequest({
          user_id: targetUser._id,
          amount: trustSealAmount,
          subscription_id: hasSubscription 
        }).unwrap();

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Trust Seal Purchase',
          description: `Purchasing Trust Seal for ₹${trustSealAmount}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              const verifyRes = await verifyTrustSealPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }).unwrap();

              if (verifyRes.success) {
                toast.success(`Payment for Trust Seal (₹${trustSealAmount}) completed. Awaiting verification.`);
                setIsDialogOpen(false);
                onRefresh();
              } else {
                toast.error('Payment verification failed');
              }
            } catch (error) {
              toast.error(`Error verifying payment: ${error.message}`);
            }
          },
          prefill: {
            email: targetUser?.email || 'demo@example.com',
            contact: targetUser?.phone || '9999999999',
          },
          theme: {
            color: '#0c1f4d',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', () => {
          toast.error('Payment failed. Please try again.');
        });
        razorpay.open();
      } else if (action === 'upgrade') {
        await updateTrustSealRequestStatus({
          request_id: trustSealRequest?._id,
          status: 'verified',
          notes,
          amount: Number(upgradeAmount),
        }).unwrap();
        toast.success(`Trust seal upgraded to ₹${upgradeAmount}`);
        setIsDialogOpen(false);
        setNotes('');
        setUpgradeAmount(trustSealAmount);
        onRefresh();
      } else if (action === 'cancel') {
        await updateTrustSealRequestStatus({
          request_id: trustSealRequest?._id,
          status: 'rejected',
          notes,
        }).unwrap();
        toast.success('Trust seal cancelled');
        setIsDialogOpen(false);
        setNotes('');
        onRefresh();
      }
    } catch (error) {
      toast.error(`Failed to ${action} trust seal: ${error.message}`);
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  const openDialog = (selectedAction) => {
    setAction(selectedAction);
    setIsDialogOpen(true);
  };

  // Map status to badge variants and icons
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
            <CircleCheck className="w-4 h-4" /> Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CircleX className="w-4 h-4" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CircleAlert className="w-4 h-4" /> {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:gap-4">

        
        {trustSealRequest && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Current Status: {getStatusBadge(trustSealRequest.status)}
            </p>
            {trustSealRequest.notes && (
              <p className="text-sm text-gray-600">Notes: {trustSealRequest.notes}</p>
            )}
            <p className="text-sm text-gray-600">
              Amount: ₹{trustSealRequest.amount?.toFixed(2) || trustSealAmount.toFixed(2)}
            </p>
          </div>
        )}
        {hasSubscription && (
          <div className="flex gap-2">
            {!trustSealRequest || trustSealRequest.status === 'rejected' ? (
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white"
                onClick={() => openDialog('purchase')}
                disabled={isRazorpayLoading}
              >
                Purchase Trust Seal
              </Button>
            ) : trustSealRequest.status === 'pending' ? (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => openDialog('verified')}
                >
                  Approve
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => openDialog('cancel')}
                >
                  Reject
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="bg-[#0c1f4d] hover:bg-blue-700 text-white"
                  onClick={() => openDialog('upgrade')}
                >
                  Upgrade Trust Seal
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => openDialog('cancel')}
                >
                  Cancel Trust Seal
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'purchase' ? 'Purchase Trust Seal' : 
               action === 'upgrade' ? 'Upgrade Trust Seal' : 
               action === 'verified' ? 'Approve Trust Seal' : 'Reject/Cancel Trust Seal'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Merchant: {targetUser.name || targetUser.email}
            </p>
            <p className="text-sm text-gray-600">
              Amount: ₹{(action === 'upgrade' ? upgradeAmount : trustSealRequest?.amount || trustSealAmount).toFixed(2)}
            </p>
            {action === 'upgrade' && (
              <Input
                type="number"
                value={upgradeAmount}
                onChange={(e) => setUpgradeAmount(e.target.value)}
                placeholder="Enter new trust seal amount"
                className="w-full"
              />
            )}
            <Input
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className={
                action === 'purchase' ? 'bg-[#0c1f4d] hover:bg-[#0c1f4dcc]' :
                action === 'upgrade' ? 'bg-[#0c1f4d] hover:bg-blue-700' :
                action === 'verified' ? 'bg-green-600 hover:bg-green-700' :
                'bg-red-600 hover:bg-red-700'
              }
              onClick={handleAction}
              disabled={isRazorpayLoading}
            >
              {isRazorpayLoading ? 'Processing...' : 
               action === 'purchase' ? 'Proceed to Payment' : 
               action === 'upgrade' ? 'Confirm Upgrade' : 
               action === 'verified' ? 'Approve' : 'Reject/Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrustSealPlanManagement;
