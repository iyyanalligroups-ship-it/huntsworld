import { useState, useContext, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import PurchaseDialog from './subcription/PurchaseDialog';
import ActivePlanCard from './subcription/ActiveCard';
import {
  useGetAllPlansQuery,
  useCreateRazorpayOrderMutation,
  useGetUserActiveSubscriptionQuery,
  useCancelSubscriptionMutation
} from '@/redux/api/UserSubscriptionPlanApi';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import showToast from '@/toast/showToast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { STATUS, PLAN_CODES } from '@/constants/subscriptionConstants';
import { motion } from "framer-motion";
import Loader from "@/loader/Loader";

// Helper: Sort plans by price
const sortPlansByPrice = (plansArray) => {
  return [...(plansArray ?? [])].sort(
    (a, b) => a.subscription_plan_id.price - b.subscription_plan_id.price
  );
};

const SubscriptionPlan = () => {
  const { user } = useContext(AuthContext);
  const { data: plans, isLoading } = useGetAllPlansQuery();
  const {
    data: activeSubscriptionData,
    isLoading: isActiveSubscriptionLoading,
    refetch
  } = useGetUserActiveSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });

  const upgradeSectionRef = useRef(null);
  const { isSidebarOpen } = useSidebar();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const [createUserSubscription] = useCreateRazorpayOrderMutation();
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

  // Local state for instant UI updates
  const [localActivePlan, setLocalActivePlan] = useState(null);
  const [justCancelledLocally, setJustCancelledLocally] = useState(false);

  const [addressBlocked, setAddressBlocked] = useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = useState("");

  // Sync from server — only accept truly active plans
  useEffect(() => {
    const serverPlan = activeSubscriptionData?.subscription;
    const activeStatuses = [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE];
    const isActiveStatus = serverPlan && activeStatuses.includes(serverPlan.status);

    if (isActiveStatus) {
      // Only update local state if we didn't just cancel
      if (!justCancelledLocally) {
        setLocalActivePlan(serverPlan);
      }
    } else {
      // Backend says no active plan (or status is not "active") → clear
      setLocalActivePlan(null);
    }
  }, [activeSubscriptionData, justCancelledLocally]);

  const handleScrollToUpgrade = () => {
    upgradeSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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

  const getPlanTheme = (planCode, index) => {
    switch (planCode) {
      case PLAN_CODES.FREE:
        return {
          bg: "bg-emerald-50/30",
          border: "border-emerald-200/40",
          text: "text-emerald-700",
          accent: "emerald",
          gradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
          shine: "rgba(16, 185, 129, 0.2)"
        };
      case PLAN_CODES.BASIC:
        return {
          bg: "bg-blue-50/30",
          border: "border-blue-200/40",
          text: "text-blue-700",
          accent: "blue",
          gradient: "from-blue-500/15 via-indigo-500/5 to-transparent",
          shine: "rgba(59, 130, 246, 0.2)"
        };
      default:
        const themes = [
          { bg: "bg-indigo-50/30", border: "border-indigo-200/40", text: "text-indigo-700", accent: "indigo", gradient: "from-indigo-500/15 via-purple-500/5 to-transparent", shine: "rgba(99, 102, 241, 0.2)" },
          { bg: "bg-purple-50/30", border: "border-purple-200/40", text: "text-purple-700", accent: "purple", gradient: "from-purple-500/15 via-pink-500/5 to-transparent", shine: "rgba(168, 85, 247, 0.2)" },
          { bg: "bg-violet-50/30", border: "border-violet-200/40", text: "text-violet-700", accent: "violet", gradient: "from-violet-500/15 via-blue-500/5 to-transparent", shine: "rgba(139, 92, 246, 0.2)" }
        ];
        return themes[index % themes.length];
    }
  };

  const getPlanIcon = (price) => {
    if (price <= 1000) return <ShieldCheck className="w-5 h-5 text-indigo-500" />;
    if (price > 1000 && price <= 2000) return <Zap className="w-5 h-5 text-amber-500" />;
    return <Star className="w-5 h-5 text-violet-500" />;
  };

  const handleSelectPlan = async (plan) => {
    try {
      const userId = user?.user?._id;
      if (!userId) {
        showToast("Please login to continue", "error");
        return;
      }

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users/check-email/${userId}`);
      if (!data.hasEmail) {
        showToast("Please update your email before purchasing a plan", "warning");
        return;
      }

      setSelectedPlan(plan);
      setIsPurchaseOpen(true);
    } catch (error) {
      console.error("Check email failed:", error);
      showToast("Something went wrong while checking email", "error");
    }
  };

  const handlePaymentSuccess = async (plan) => {
    showToast(
      `Success! You are now on the ${plan.subscription_plan_id.plan_name} plan.`,
      'success'
    );

    // Optimistic update
    setLocalActivePlan(plan);
    setJustCancelledLocally(false);

    setIsPurchaseOpen(false);
    setIsSyncing(true);
    await refetch(); // keep cache in sync
    setIsSyncing(false);
  };

  const confirmCancel = async () => {
    if (!localActivePlan) return;

    try {
      await cancelSubscription(localActivePlan._id).unwrap();

      showToast("Subscription cancelled successfully", 'success');

      // Optimistic UI update
      setLocalActivePlan(null);
      setJustCancelledLocally(true);

      setIsCancelDialogOpen(false);

      // Refetch from server to get the new default/cancelled state
      setIsSyncing(true);
      await refetch();
      
      // Allow UI to sync from fresh server data immediately
      setJustCancelledLocally(false); 
      
      // Small buffer to ensure rendering completes comfortably
      setTimeout(() => setIsSyncing(false), 300);
    } catch (error) {
      showToast("Failed to cancel subscription", 'error');
      console.error(error);
      setIsSyncing(false);
    }
  };

  if (isLoading || isActiveSubscriptionLoading) {
    return (
      <div className={`flex-1 min-h-[60vh] flex items-center justify-center transition-all duration-300 ${isSidebarOpen ? "ml-0 sm:ml-64" : "ml-0 sm:ml-16"}`}>
        <Loader contained={true} label="Syncing Merchant Infrastructure..." />
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-slate-50 min-h-screen pb-24 transition-all duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-64' : 'ml-0 sm:ml-16'}`}>
      {(isCancelling || isSyncing) && <Loader label="Syncing Subscription Status..." />}
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
                  className="w-full cursor-pointer inline-flex justify-center items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#0a0a0f] pb-32 pt-20 lg:pt-24">
        {/* Simplified Premium Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <Badge variant="outline" className="mb-6 border-indigo-400 text-indigo-300 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full bg-indigo-950/40 backdrop-blur-xl shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] border-indigo-500/30">
            Elite Business Systems
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-white sm:text-7xl mb-8 leading-[1]">
            Accelerate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-300 to-violet-300">
              Global Scale
            </span>
          </h1>
          <p className="text-xl leading-relaxed text-slate-400 max-w-2xl mx-auto font-medium">
            A high-performance infrastructure for merchants who demand precision and scalability. No limits, just exponential growth.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-20 relative z-20">

        {/* Active Plan Banner */}
        {localActivePlan && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ActivePlanCard
              plan={localActivePlan}
              onUpgrade={handleScrollToUpgrade}
              onCancel={() => setIsCancelDialogOpen(true)}
              razorpayOrder={activeSubscriptionData?.razorpayOrder}
              razorpayPayment={activeSubscriptionData?.razorpayPayment}
            />
          </div>
        )}

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch" ref={upgradeSectionRef}>
          {sortPlansByPrice(plans?.data).map((plan, index) => {
            const price = plan.subscription_plan_id.price;
            const strike_amount = plan.subscription_plan_id.strike_amount;
            const planName = plan.subscription_plan_id.plan_name;
            const planCode = plan.subscription_plan_id.plan_code;

            const isActive = localActivePlan?.subscription_plan_id?._id === plan.subscription_plan_id._id;
            const isPopular = index === 1;
            const theme = getPlanTheme(planCode, index);

            return (
              <motion.div
                key={plan.subscription_plan_id._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full flex flex-col"
              >
                <Card
                  className={`
                    relative flex flex-col h-full transition-all duration-300 group
                    ${isPopular && !isActive
                      ? 'border-white/50 shadow-2xl shadow-indigo-500/20 xl:scale-[1.03] z-10 bg-white/40'
                      : 'border-slate-200/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 bg-white/20'
                    }
                    ${isActive ? 'ring-2 ring-emerald-500/50 border-emerald-500/40 bg-emerald-50/10' : ''}
                    rounded-[3rem] backdrop-blur-2xl overflow-visible backdrop-saturate-150
                  `}
                >
                  {/* Decorative Gradient Header */}
                  <div className="absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none z-0">
                    <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b ${theme.gradient} mix-blend-overlay`} />
                  </div>

                  {isPopular && !isActive && (
                    <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-20">
                      <span className="bg-[#1a1c2e] text-white text-[9px] font-black px-5 py-1.5 rounded-full shadow-lg uppercase tracking-[0.25em] border border-white/10">
                        Top Performer
                      </span>
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-20">
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-5 py-1.5 rounded-full shadow-[0_5px_15px_-3px_rgba(16,185,129,0.4)] uppercase tracking-[0.25em] flex items-center gap-1.5 border border-white/20">
                        <Check className="w-3 h-3 stroke-[3px]" /> Current Status
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pt-12 pb-5 border-b border-white/10 px-6 relative z-10">
                    <div className={`mb-4 inline-flex items-center justify-center w-14 h-14 rounded-[1.5rem] ${theme.bg} border ${theme.border} mx-auto shadow-xl backdrop-blur-md transition-all duration-300`} >
                      {getPlanIcon(price)}
                    </div>
                    <CardTitle className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{planName}</CardTitle>
                    {planCode !== planName && (
                      <CardDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 opacity-60">
                        {planCode}
                      </CardDescription>
                    )}
                    <div className="mt-6 flex items-baseline justify-center gap-0.5">
                      <span className="text-sm font-black text-slate-400 align-top mt-1">₹</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">
                        {(price - 1).toLocaleString("en-IN")}
                      </span>
                      {strike_amount && (
                        <span className="text-xs text-slate-300 line-through font-bold ml-2 opacity-50">
                          ₹{(strike_amount - 1).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow p-6 lg:p-7 relative z-10">
                    <ul className="space-y-4">
                      {plan.elements.map((elem) => {
                        const isEnabled = elem.is_enabled;
                        const isDisabled = !isEnabled || elem.value?.data === "No";

                        return (
                          <li key={elem.feature_id} className="flex items-start gap-3 group/item">
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${!isDisabled ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-100 text-slate-300"}`} >
                              {!isDisabled ? (
                                <Check className="w-3 h-3 stroke-[3px]" />
                              ) : (
                                <X className="w-3 h-3 stroke-[3px]" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span
                                className={`text-[14px] leading-snug tracking-tight ${!isDisabled ? "text-slate-700 font-bold" : "text-slate-400 font-medium line-through"}`}
                              >
                                {elem.feature_name}
                              </span>
                              {!isDisabled && elem.value?.data && elem.value.data !== "Enable" && elem.value.data !== "Yes" && (
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 opacity-100 drop-shadow-sm leading-none">
                                  {elem.value.data} {elem.value.unit || ""}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 mt-auto relative z-10">
                    {planCode === PLAN_CODES.FREE ? (
                      <Button
                        size="sm"
                        className="w-full h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-slate-100/50 text-slate-400 cursor-not-allowed border border-white/20 shadow-none backdrop-blur-sm"
                        disabled
                      >
                        Base Infrastructure
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className={`w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 cursor-pointer px-4 group/btn relative overflow-hidden active:scale-95
                          ${isActive && localActivePlan?.auto_renew !== false
                            ? 'bg-slate-100/50 text-slate-400 border border-white/20 shadow-none'
                            : isPopular
                              ? 'bg-[#1a1c2e] hover:bg-indigo-600 text-white shadow-[#1a1c2e]/20 border border-white/10'
                              : 'bg-white/80 border-2 border-slate-100 text-slate-900 hover:border-indigo-500 hover:text-indigo-600 shadow-slate-200/40'
                          }`}
                        onClick={() => (!isActive || localActivePlan?.auto_renew === false) && handleSelectPlan(plan)}
                        disabled={isActive && localActivePlan?.auto_renew !== false}
                      >
                        <Zap className={`w-3 h-3 mr-2 transition-transform duration-300 group-hover/btn:scale-125 ${isPopular ? "text-white" : "text-indigo-500"}`} />
                        <span className="relative z-10 shrink-0">
                          {isActive 
                            ? (localActivePlan?.auto_renew === false ? 'Re-Activate' : 'Current') 
                            : `Unlock ${planName}`}
                        </span>
                        
                        {/* Interactive button glisten */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            Need a custom plan for a large enterprise? <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">Contact our sales team</span>.
          </p>
        </div>
      </div>

      {/* Modals */}
      <PurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        plan={selectedPlan}
        activePlan={localActivePlan}
        oldSubscriptionId={localActivePlan?._id}
        onPaymentSuccess={handlePaymentSuccess}
        isLoading={isPurchaseLoading}
      />

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white p-0 gap-0 overflow-hidden rounded-2xl">
          <div className="p-6 text-center pt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4 animate-in zoom-in duration-300">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-2">Cancel Subscription?</DialogTitle>
            <p className="text-sm text-slate-500 px-4">
              You are about to cancel your{" "}
              <strong className="text-slate-900">
                {localActivePlan?.subscription_plan_id?.plan_name || "current"}
              </strong>{" "}
              plan. You will lose access to premium features at the end of the billing period.
            </p>
          </div>
          <div className="p-6 bg-slate-50 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="flex-1 cursor-pointer bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
            >
              Keep Plan
            </Button>
            <Button
              onClick={confirmCancel}
              className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlan;
