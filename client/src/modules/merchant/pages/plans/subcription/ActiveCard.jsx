import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  CalendarClock,
  Receipt,
  CreditCard,
  Zap,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetUserActiveSubscriptionQuery, useToggleAutoPayMutation } from "@/redux/api/UserSubscriptionPlanApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useState, useContext, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import showToast from "@/toast/showToast";
import { STATUS, PLAN_CODES } from "@/constants/subscriptionConstants";
import { cn } from "@/lib/utils";
import Loader from "@/loader/Loader";

const ActivePlanCard = ({ onCancel, onUpgrade, plan: propPlan }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [toggleAutoPay, { isLoading: isToggling }] = useToggleAutoPayMutation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReenableOpen, setIsReenableOpen] = useState(false);
  const [targetToggleState, setTargetToggleState] = useState(false);

  const {
    data: fetchedData,
    isLoading,
    isFetching,
    error,
    isError,
  } = useGetUserActiveSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id || !!propPlan, // Skip if plan is already passed as prop
  });

  const data = propPlan ? { subscription: propPlan } : fetchedData;

  // Only hide the entire card during initial data fetch
  if ((isLoading || !user) && !propPlan) {
    return (
      <Loader label="Preparing Subscription Details..." />
    );
  }

  // Error state or no subscription data at all
  if (isError || error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-red-600 bg-[#f0f4f6] rounded-xl border border-red-200">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Failed to load subscription details</p>
        <p className="text-sm text-gray-600 mt-2">
          Please try again later or contact support if the issue persists.
        </p>
        {process.env.NODE_ENV === "development" && error && (
          <p className="text-xs text-gray-500 mt-4 break-all">
            Error: {error?.message || JSON.stringify(error)}
          </p>
        )}
      </div>
    );
  }

  // No active subscription returned by backend
  if (!data?.subscription) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-red-600 bg-[#f0f4f6] rounded-xl border border-red-200">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">No active subscription found.</p>
        <p className="text-sm text-gray-600 mt-2">
          Please purchase a plan to access premium features.
        </p>
      </div>
    );
  }

  const plan = data.subscription;
  const razorpayOrder = data.razorpayOrder;
  const razorpayPayment = data.razorpayPayment;

  // DEBUG: log plan data to understand end_date situation
  console.log('[ActiveCard] plan data:', {
    plan_name: plan?.subscription_plan_id?.plan_name,
    plan_code: plan?.subscription_plan_id?.plan_code,
    status: plan?.status,
    end_date: plan?.end_date,
    paid_at: plan?.paid_at,
  });

  // Robust free plan detection: check plan_code, plan_name, and price
  const isFreePlan =
    plan.subscription_plan_id?.plan_code === PLAN_CODES.FREE ||
    plan.subscription_plan_id?.plan_name?.toUpperCase().includes("FREE") ||
    (plan.subscription_plan_id?.price === 0 && plan.amount === 0);

  const isMerchantPlan = plan.subscription_plan_id?.business_type === "merchant";

  // Safety check: warn if status is not "paid" or "active_renewal"
  const isTrulyActive = [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE].includes(plan.status);
  const statusWarning = !isTrulyActive
    ? `Warning: Plan status is "${plan.status}"`
    : null;

  // Use features_snapshot
  const snapshotFeatures = plan.features_snapshot || [];

  const features = snapshotFeatures.reduce((acc, elem) => {
    if (elem.feature_name) {
      if (elem.is_enabled) {
        const val = elem.value;
        let displayValue = "Enabled";
        if (val && val.data !== undefined) {
          displayValue = val.unit ? `${val.data} ${val.unit}` : val.data;
        }
        acc[elem.feature_name] = displayValue;
      } else {
        acc[elem.feature_name] = "No";
      }
    }
    return acc;
  }, {});

  const renewalDate = plan.end_date ? new Date(plan.end_date) : null;
  const isComputedDate = !!plan.end_date_computed; // date was estimated from plan_snapshot
  const paidDate = new Date(plan.paid_at || plan.created_at || plan.createdAt);

  const daysRemaining = renewalDate
    ? Math.max(0, Math.ceil((renewalDate - new Date()) / (1000 * 60 * 60 * 24)))
    : Infinity;

  const showRenewAlert = renewalDate && daysRemaining <= 10 && daysRemaining > 0;

  const handleUpgrade = () => {
    onUpgrade(); // scroll to plans section
  };

  const handleToggleClick = (checked) => {
    setTargetToggleState(checked);
    if (!checked) {
      // Prompt for confirmation when turning OFF
      setIsConfirmOpen(true);
    } else {
      // Prompt for re-enable (requires new checkout)
      setIsReenableOpen(true);
    }
  };

  const executeToggle = async (newState) => {
    try {
      const res = await toggleAutoPay({ id: plan._id, auto_renew: newState }).unwrap();
      showToast(res.message, "success");
      setIsConfirmOpen(false);
    } catch (err) {
      showToast(err?.data?.message || err?.message || "Failed to toggle Auto-Pay", "error");
      setIsConfirmOpen(false);
    }
  };

  const DetailCard = ({ icon: Icon, label, value, colorClass = "text-slate-900" }) => (
    <div className="bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-xs font-black truncate", colorClass)}>{value}</p>
    </div>
  );

  return (
    <div className="relative overflow-hidden border border-indigo-100 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 p-6 lg:p-8">
      {(isToggling || isFetching) && <Loader label="Refreshing Subscription Status..." />}
      {/* Background Decorative Elements - Static */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                  Truly Active
                </Badge>
                {statusWarning && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5 animate-pulse">
                    Status Alert
                  </Badge>
                )}
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Active Subscription</h3>
            </div>
          </div>

          {isFreePlan ? (
            <div className="flex items-center gap-4 bg-emerald-50/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-emerald-200/60 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">Free Plan</span>
                <span className="text-xs font-bold text-emerald-700">Lifetime Access</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-slate-50/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-200/60 shadow-inner">
              <div className="flex flex-col mr-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Auto-Renewal</span>
                <span className={cn("text-xs font-bold", plan.auto_renew ? "text-emerald-600" : "text-amber-600")}>
                  {plan.auto_renew ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              <Switch
                checked={plan.auto_renew}
                onCheckedChange={handleToggleClick}
                disabled={isToggling}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Status warning */}
        {statusWarning && (
          <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl text-amber-800 text-xs font-semibold flex items-center gap-3 overflow-hidden shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            {statusWarning}
          </div>
        )}

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Plan Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform duration-700">
                <Zap className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-3">Current Plan</p>
                <p className="text-4xl font-black mb-6 tracking-tighter">{plan.subscription_plan_id.plan_name}</p>

                {!isFreePlan && (
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-lg font-bold text-indigo-200">₹</span>
                    <span className="text-5xl font-black tracking-tighter">
                      {(Math.round(plan.amount / 100) - 1).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-2">Plan Amount</span>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-6 border-t border-white/10 text-slate-400">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Validity</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {renewalDate
                        ? isFreePlan
                          ? "Lifetime Access"
                          : isComputedDate
                            ? `~${daysRemaining} Days Left`
                            : `${daysRemaining} Days Left`
                        : isFreePlan
                          ? "Lifetime Access"
                          : "See Plan Duration"}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Expiry</span>
                    <span className="text-xs font-bold text-indigo-300 mt-1">
                      {renewalDate
                        ? isFreePlan
                          ? "No Expiry"
                          : `${renewalDate.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}${isComputedDate ? " (~est.)" : ""}`
                        : isFreePlan
                          ? "No Expiry"
                          : "Contact Support"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Renewal Alert */}
            {showRenewAlert && (
              <div className="bg-amber-50/80 backdrop-blur-sm border-2 border-amber-200 p-5 rounded-[1.5rem] flex items-start gap-4 shadow-lg shadow-amber-500/5">
                <div className="bg-amber-100 p-2 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-amber-900 text-sm uppercase tracking-tight">Expiring Soon!</p>
                  <p className="text-amber-800 text-xs mt-1 leading-relaxed font-medium">
                    Your premium access ends in <strong>{daysRemaining}</strong> days. Renew now to avoid service interruption.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Features & Transaction History */}
          <div className="lg:col-span-7 space-y-8">
            {/* Features Snippet */}
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Active Privileges
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} className="bg-slate-50/50 hover:bg-white transition-colors border border-slate-100 px-4 py-3 rounded-2xl flex justify-between items-center shadow-sm">
                    <span className="text-[13px] font-semibold text-slate-600">{key}</span>
                    <Badge className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-lg border-none",
                      value === "No" || value === "Disabled" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5" /> Order Insights
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <DetailCard icon={Receipt} label="Order ID" value={razorpayOrder?.id || plan.razorpay_order_id} />
                  <DetailCard icon={Receipt} label="Status" value={plan.status === STATUS.ACTIVE_RENEWAL ? "Active (Auto-Renew)" : (razorpayOrder?.status || plan.status)} colorClass="text-emerald-600" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" /> Billing Info
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <DetailCard icon={CreditCard} label="Payment ID" value={razorpayPayment?.id || plan.razorpay_payment_id || "N/A"} />
                  <DetailCard icon={CreditCard} label="Method" value={razorpayPayment?.method?.toUpperCase() || "N/A"} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
          <Button
            className="group flex-1 cursor-pointer h-14 bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-indigo-600/20 transition-all duration-300"
            onClick={handleUpgrade}
          >
            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            {isFreePlan ? "Upgrade Plan" : "Manage or Upgrade Plan"}
          </Button>
          {!isFreePlan && (
            <Button
              variant="outline"
              className="flex-1 cursor-pointer h-14 border-2 border-rose-100 text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest rounded-2xl transition-all duration-300"
              onClick={onCancel}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Terminate Subscription
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white p-0 gap-0 overflow-hidden rounded-2xl">
          <div className="p-6 text-center pt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-2">Disable Auto-Pay?</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 px-4">
              Are you sure you want to disable Auto-Pay? Your subscription will not renew automatically at the end of the current billing cycle, and you will lose access to premium features unless you renew manually.
            </DialogDescription>
          </div>
          <div className="p-6 bg-slate-50 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 cursor-pointer bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
              disabled={isToggling}
            >
              Keep Auto-Pay
            </Button>
            <Button
              onClick={() => executeToggle(false)}
              className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              disabled={isToggling}
            >
              {isToggling ? "Disabling..." : "Yes, Disable"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReenableOpen} onOpenChange={setIsReenableOpen}>
        <DialogContent className="sm:max-w-md bg-white p-0 gap-0 overflow-hidden rounded-2xl">
          <div className="p-6 text-center pt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
              <RefreshCw className="h-8 w-8 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-2">Re-Enable Auto-Pay</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 px-4">
              To re-enable Auto-Pay, Razorpay requires a new payment authorization. Please click &apos;Renew Plan&apos; to purchase your plan again and set up auto-debit.
            </DialogDescription>
          </div>
          <div className="p-6 bg-slate-50 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsReenableOpen(false)}
              className="flex-1 cursor-pointer bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsReenableOpen(false);
                onUpgrade(); // This scrolls to the plan grid
              }}
              className="flex-1 cursor-pointer bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white"
            >
              Renew Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivePlanCard;
