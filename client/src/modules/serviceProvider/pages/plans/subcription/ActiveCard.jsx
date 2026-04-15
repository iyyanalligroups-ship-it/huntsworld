import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  CalendarClock,
  Receipt,
  CreditCard,
  IndianRupee,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetUserActiveSubscriptionQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useContext } from 'react';

const ActivePlanCard = ({ onCancel }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useGetUserActiveSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });

  // Debug query states
  console.log('Query States:', { isLoading, isFetching, error, userId: user?.user?._id, data });

  // Skeleton loader
  if (isLoading || isFetching || !user) {
    return (
      <div className="border border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (error || !data?.subscription) {
    return (
      <div className="flex justify-center items-center p-6 text-red-600 bg-[#f0f4f6] rounded-xl">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <p className="text-lg font-medium">No active subscription found.</p>
      </div>
    );
  }

  const plan = data.subscription;
  const razorpayOrder = data.razorpayOrder;
  const razorpayPayment = data.razorpayPayment;
  const isFreePlan = plan.subscription_plan_id.plan_code === 'FREE';

  console.log('Plan:', plan);

  const features = plan.elements.reduce((acc, elem) => {
    acc[elem.element_name] = elem.value;
    return acc;
  }, {});

  const subscriptionDuration = features['Subscription Duration']
    ? parseInt(features['Subscription Duration']) || 1
    : 1;

  const renewalDate = new Date(plan.created_at);
  renewalDate.setFullYear(renewalDate.getFullYear() + subscriptionDuration);

  const daysRemaining = Math.ceil((renewalDate - new Date()) / (1000 * 60 * 60 * 24));
  const showRenewAlert = daysRemaining <= 10;

  const handleUpgrade = () => {
    navigate('/service/plans/upgrade-plan', {
      state: {
        activePlanId: plan.subscription_plan_id._id,
        oldSubscriptionId: plan._id,
      },
    });
  };

  return (
    <div className="border border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md p-6 space-y-4">
      <div className="flex items-center gap-2 text-[#0c1f4d]">
        <ShieldCheck className="w-5 h-5" />
        <h3 className="text-xl font-bold">Active Subscription Plan</h3>
      </div>

      <div>
        <p className="text-lg font-semibold flex items-center gap-2">
          {plan.subscription_plan_id.plan_name}
          {!isFreePlan && (
            <>
              <IndianRupee className="w-4 h-4 text-gray-700" />
              {(plan.subscription_plan_id.price / 100).toFixed(2)}
            </>
          )}
        </p>
        <p className="text-sm text-gray-600">Billed Annually | {features['Subscription Duration'] || '1 Year'}</p>
      </div>

      <div>
        <ul className="space-y-1 text-sm text-gray-800">
          {Object.entries(features).map(([key, value]) => (
            <li key={key} className="flex justify-start gap-3">
              <span>{key}:</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-700">
        <CalendarClock className="w-4 h-4" />
        Renewal Date: <span className="font-medium">{renewalDate.toLocaleDateString()}</span>
      </div>

      {showRenewAlert && (
        <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500 p-3 rounded-md flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Your plan will renew in {daysRemaining} day(s). Consider upgrading or cancelling.</span>
        </div>
      )}

      <div>
        <h4 className="flex items-center gap-2 font-semibold text-gray-700">
          <Receipt className="w-4 h-4" /> Order Details
        </h4>
        <div className="grid grid-cols-2 text-sm mt-2 text-gray-700">
          <p><strong>Order ID:</strong> {razorpayOrder?.id || plan.razorpay_order_id}</p>
          <p><strong>Receipt:</strong> {razorpayOrder?.receipt || plan.receipt}</p>
          {!isFreePlan && (
            <p><strong>Amount:</strong> ₹{((razorpayOrder?.amount || plan.amount) / 100).toFixed(2)}</p>
          )}
          <p><strong>Status:</strong> {razorpayOrder?.status || plan.status}</p>
        </div>
      </div>

      <div>
        <h4 className="flex items-center gap-2 font-semibold text-gray-700">
          <CreditCard className="w-4 h-4" /> Payment Details
        </h4>
        <div className="grid grid-cols-2 text-sm mt-2 text-gray-700">
          <p><strong>Payment ID:</strong> {razorpayPayment?.id || plan.razorpay_payment_id || 'N/A'}</p>
          <p><strong>Method:</strong> {razorpayPayment?.method || 'N/A'}</p>
          <p><strong>UPI ID:</strong> {razorpayPayment?.vpa || 'N/A'}</p>
          <p><strong>Status:</strong> {razorpayPayment?.status || 'N/A'}</p>
          <p><strong>Email:</strong> {razorpayPayment?.email || 'N/A'}</p>
          <p><strong>Contact:</strong> {razorpayPayment?.contact || 'N/A'}</p>
          <p><strong>Paid At:</strong> {plan.paid_at ? new Date(plan.paid_at).toLocaleString() : 'N/A'}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4d]/80 cursor-pointer" onClick={handleUpgrade}>
          <RefreshCw className="mr-2 h-4 w-4" /> Upgrade Plan
        </Button>
        <Button className="bg-red-600 text-white hover:bg-red-700 cursor-pointer" onClick={onCancel}>
          <XCircle className="mr-2 h-4 w-4" /> Cancel Plan
        </Button>
      </div>
    </div>
  );
};

export default ActivePlanCard;