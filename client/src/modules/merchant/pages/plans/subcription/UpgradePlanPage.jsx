import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, AlertCircle, ShieldCheck, Zap, Star, X } from "lucide-react";
import PurchaseDialog from "./PurchaseDialog";
import {
  useGetAllPlansQuery,
  useUpgradeSubscriptionMutation,
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
} from "@/redux/api/UserSubscriptionPlanApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { loadRazorpayScript } from "@/modules/merchant/utils/Razorpay";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import showToast from "@/toast/showToast";
import { PLAN_CODES, STATUS } from "@/constants/subscriptionConstants";

const UpgradePlanPage = () => {
  const { state } = useLocation();
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { data: plans, isLoading } = useGetAllPlansQuery();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);

  const [upgradeSubscription] = useUpgradeSubscriptionMutation();
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const activePlanId = state?.activePlanId;
  const oldSubscriptionId = state?.oldSubscriptionId;

  // Helper for Plan Icons
  const getPlanIcon = (price) => {
    if (price <= 1000) return <ShieldCheck className="w-6 h-6 text-blue-500" />;
    if (price > 1000 && price <= 2000) return <Zap className="w-6 h-6 text-yellow-500" />;
    return <Star className="w-6 h-6 text-purple-500" />;
  };

  const getPlanType = (price) => {
    if (price <= 1000) return "Standard";
    if (price > 1000 && price <= 2000) return "Professional";
    if (price > 2000) return "Enterprise";
    return "Custom";
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsPurchaseOpen(true);
  };

  const handlePurchase = async (plan) => {
    // Note: The PurchaseDialog now handles the execution logic internally
    // We just need to trigger the closing and navigation here if needed
    setIsPurchaseOpen(false);
    navigate("/merchant/plans/subscription");
  };

  const backToSubscription = () => {
    navigate("/merchant/plans/subscription");
  };

  if (isLoading) {
    return (
      <div className={`flex-1 p-8 bg-slate-50 transition-all duration-300 ${isSidebarOpen ? "ml-0 sm:ml-64" : "ml-0 sm:ml-16"}`}>
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[450px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter available upgrade plans
  const upgradePlans = plans?.data?.filter(
    (plan) =>
      plan.subscription_plan_id._id !== activePlanId &&
      plan.subscription_plan_id.plan_code !== PLAN_CODES.FREE
  ).sort((a, b) => a.subscription_plan_id.price - b.subscription_plan_id.price);

  return (
    <div className={`flex-1 bg-slate-50/50 min-h-screen pb-12 transition-all duration-300 ${isSidebarOpen ? "ml-0 sm:ml-64" : "ml-0 sm:ml-16"}`}>

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <Button variant="ghost" onClick={backToSubscription} className="hidden md:flex text-slate-600 hover:text-[#0c1f4d] hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Change Plan</h1>
        <div className="w-[80px]"></div> {/* Spacer for alignment */}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Error Alert */}
        {purchaseError && (
          <div className="mb-8 max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Upgrade Failed</p>
              <p className="text-sm mt-1">{purchaseError}</p>
              <button onClick={() => setPurchaseError(null)} className="text-xs font-semibold underline mt-2 hover:text-red-900">Dismiss</button>
            </div>
          </div>
        )}

        {/* Hero Text */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Upgrade Your Experience</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Select a new plan to unlock more features. Your billing will be adjusted immediately.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {upgradePlans?.length > 0 ? (
            upgradePlans.map((plan, index) => {
              const price = plan.subscription_plan_id.price;
              const planType = getPlanType(price);
              const isPopular = index === 1; // Highlight middle option

              return (
                <Card
                  key={plan.subscription_plan_id._id}
                  className={`relative flex flex-col h-full border transition-all duration-300 hover:shadow-xl
                    ${isPopular ? 'border-indigo-200 shadow-lg scale-105 z-10' : 'border-slate-200 hover:-translate-y-1'}
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-0 right-0 flex justify-center">
                      <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-0.5 text-xs uppercase">Recommended</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4 border-b border-slate-50 bg-slate-50/50 rounded-t-xl pt-8">
                    <div className="flex justify-center mb-3">
                      <div className="p-2.5 bg-white rounded-full shadow-sm border border-slate-100">
                        {getPlanIcon(price)}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {plan.subscription_plan_id.plan_name}
                    </CardTitle>
                    <div className="mt-3 flex items-baseline justify-center text-[#0c1f4d]">
                      <span className="text-4xl font-extrabold">₹{Math.round(price) > 0 ? (Math.round(price) - 1).toLocaleString("en-IN") : 0}</span>
                      <span className="ml-1 text-sm font-medium text-slate-500">/year</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow pt-6 px-6">
                    <ul className="space-y-3">
                      {plan.elements.map((elem) => {
                        const isEnabled = elem.is_enabled === true;

                        // SAFELY extract display value — always end up with a string or null
                        let displayValue = null;
                        if (isEnabled && elem.value && typeof elem.value === 'object') {
                          if (elem.value.data) {
                            displayValue = elem.value.unit
                              ? `${elem.value.data} ${elem.value.unit}`
                              : elem.value.data;
                          }
                        }

                        return (
                          <li key={elem.feature_id} className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {isEnabled ? (
                                <Check className="h-6 w-6 text-green-600" />
                              ) : (
                                <X className="h-6 w-6 text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className={`font-medium text-base ${isEnabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                {elem.feature_name.replace("Subcription", "Subscription")}
                              </span>
                              {displayValue && (
                                <span className="block text-indigo-600 font-bold text-sm mt-1">
                                  ({displayValue})
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6 pb-8 px-6 bg-slate-50/30 mt-auto">
                    <Button
                      className={`w-full py-6 text-base font-semibold shadow-sm transition-all
                        ${isPopular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#0c1f4d] hover:bg-[#1a2f63]'}
                      `}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      Upgrade to {planType}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500">No upgrade options available at this time.</p>
            </div>
          )}
        </div>
      </div>

      <PurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        plan={selectedPlan}
        activePlan={state?.activePlan}
        oldSubscriptionId={oldSubscriptionId}
        onPaymentSuccess={handlePurchase}
        isLoading={isPurchaseLoading}
      />
    </div>
  );
};

export default UpgradePlanPage;
