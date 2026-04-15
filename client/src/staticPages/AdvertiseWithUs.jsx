import React, { useContext, useState } from "react";
import { useGetPlansWithDetailsQuery } from "@/redux/api/SubcriptionPlanApi";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  ArrowLeft,
  ChevronUp,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import showToast from "@/toast/showToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// --- Components ---

const InfoAlert = ({ onClose }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-[100] px-4 pt-4 animate-in slide-in-from-top-2 fade-in">
      <Alert className="bg-blue-50/95 backdrop-blur-sm border-blue-200 shadow-xl rounded-xl flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center">
          <ShieldCheck className="h-6 w-6 text-[#0c1f4d] mr-4" />
          <div>
            <AlertTitle className="text-[#0c1f4d] font-bold text-base">
              Account Required
            </AlertTitle>
            <AlertDescription className="text-blue-800/80 text-sm mt-1">
              To buy a plan, you need to create an account as a Merchant or
              Service Provider.
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-blue-600 hover:text-[#0c1f4d] hover:bg-blue-100 rounded-full"
        >
          <XCircle className="h-5 w-5" />
        </Button>
      </Alert>
    </div>
  );
};

const AdvertiseWithUs = () => {
  const { data: plans, error, isLoading } = useGetPlansWithDetailsQuery();
  console.log("plans", plans);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [blockedRole, setBlockedRole] = useState(null);

  // --- UNIQUE TRACKING STATE ---
  // Tracks expansion per plan ID: { "id123": true, "id456": false }
  const [expandedPlans, setExpandedPlans] = useState({});


  const [showAlert, setShowAlert] = useState(
    location.state?.showAlert || false
  );

  const toggleExpand = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };


  const roleConfig = {
    STUDENT: {
      title: "Want to become a Product Seller?",
      profile: "Student Profile",
      description:
        "You are logged in with a Student Profile. To sell products, please follow the SOP below.",
    },
    GROCERY_SELLER: {
      title: "Upgrade to Merchant Profile",
      profile: "Base Member Profile",
      description:
        "You are currently using a Base Member profile. To purchase a plan, you must upgrade to a Merchant profile.",
    },
  };

  const handleBuyPlan = (planId) => {
    if (!user?.user) {
      navigate("/login", { state: { showAlert: true } });
      return;
    }

    const role = user?.user?.role?.role;

    if (role === "MERCHANT") {
      navigate("/merchant/plans/subscription");
      return;
    }
    if (role === "USER") {
      navigate("/sell-product");
      return;
    }

    if (role === "SERVICE_PROVIDER") {
      navigate("/service-provider/plans/subscription");
      return;
    }
    if (role === "GROCERY_SELLER") {
      navigate("/baseMember/plans");
      return;
    }
    if (role === "STUDENT") {
      setBlockedRole(role);
      setShowRoleDialog(true);
      return;
    }

    showToast("Access denied", "info");
  };

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0c1f4d]"></div>
        <p className="mt-4 text-[#0c1f4d] font-medium animate-pulse">Loading Plans...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center py-10 px-6 bg-white shadow-lg rounded-xl border border-red-100">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Unable to load plans</h3>
          <p className="text-gray-500 mt-2">{error.message}</p>
        </div>
      </div>
    );

  // Filter out plans that have 0 visible features
  const filteredAndSortedPlans = (plans?.data || [])
    .map((plan) => {
      const features = (plan.elements || [])
        // We now show all features that have a valid name
        .filter(
          (f) =>
            f.element_name &&
            f.element_name.trim() !== ""
        );
      return { ...plan, visibleFeatures: features };
    })
    .filter((plan) => plan.visibleFeatures.length > 0) // At least 1 feature must exist
    .sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-5 z-40 hidden md:flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {showAlert && <InfoAlert onClose={() => setShowAlert(false)} />}

      <div className="container mx-auto py-20 px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-[#0c1f4d] text-xs font-bold tracking-wider uppercase">
            Flexible Pricing
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0c1f4d] tracking-tight">
            Advertise With Us
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Boost your visibility and reach more customers with our tailored membership plans.
          </p>
        </div>

        {/* Role Upgrade Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <DialogTitle className="text-xl font-bold text-gray-900">{roleConfig[blockedRole]?.title}</DialogTitle>
                <DialogDescription className="text-center text-gray-500">
                  {roleConfig[blockedRole]?.description}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Steps to upgrade:</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Go to <span className="font-semibold text-[#0c1f4d]">Settings</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Deactivate <strong>{roleConfig[blockedRole]?.profile}</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Create a new Merchant profile</span>
                </li>
              </ul>
            </div>

            <DialogFooter className="mt-6 sm:justify-between gap-3">
              <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="w-full">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowRoleDialog(false);
                  navigate("/settings");
                }}
                className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4d]/90"
              >
                Go to Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pricing Tabs */}
        <Tabs defaultValue="membership" className="w-full max-w-7xl mx-auto">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-white/50 backdrop-blur border border-gray-200 p-1 rounded-full h-auto shadow-sm">
              <TabsTrigger
                value="membership"
                className="px-8 py-3 rounded-full text-sm font-medium transition-all data-[state=active]:bg-[#0c1f4d] data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Membership Plans
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="membership" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">

              {filteredAndSortedPlans.map((plan, index) => {
                const isPopular = index === 1;
                const currentPrice = plan.price;
                const strikePrice = plan.strike_amount;

                // Handle unique expansion logic per card
                const isExpanded = expandedPlans?.[plan._id] === true;
                const displayFeatures = isExpanded
                  ? [...plan.visibleFeatures]
                  : plan.visibleFeatures.slice(0, 5);


                return (
                  <div
                    key={plan._id}
                    className={`
    relative group flex flex-col p-8 rounded-[2rem]
    transition-all duration-300
    self-start
    ${isPopular
                        ? "bg-white border-2 border-[#0c1f4d] shadow-2xl scale-100 lg:scale-105 z-10"
                        : "bg-white border border-gray-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 lg:mt-4"
                      }
  `}
                  >

                    {isPopular && (
                      <div className="absolute -top-5 left-0 right-0 flex justify-center">
                        <div className="bg-[#0c1f4d] text-white text-xs font-bold uppercase tracking-widest py-2 px-6 rounded-full shadow-lg flex items-center gap-2">
                          <Zap size={14} className="fill-current" /> Most Popular
                        </div>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="mb-6">
                      <h3 className={`text-2xl font-bold mb-2 ${isPopular ? "text-[#0c1f4d]" : "text-gray-800"}`}>
                        {plan.plan_name}
                      </h3>
                      <p className="text-sm text-gray-500 min-h-[40px] leading-relaxed">
                        {plan.description || "Everything you need to grow your business effectively."}
                      </p>
                    </div>

                    {/* Price Tag */}
                    <div className="flex items-baseline gap-1 mb-8 pb-8 border-b border-gray-100">
                      <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        ₹{(currentPrice - 1).toLocaleString("en-IN")}
                      </span>
                      <span className="text-slate-500 font-medium text-lg">/year</span>

                      {strikePrice && strikePrice > currentPrice && (
                        <div className="ml-auto flex flex-col items-end">
                          <span className="text-sm text-gray-400 line-through">
                            ₹{(strikePrice - 1).toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                            SAVE {Math.round(((strikePrice - currentPrice) / strikePrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features List Section */}
                    <div className="flex-1">
                      <ul className="space-y-4 mb-4">
                        {displayFeatures.map((feature, i) => {
                          const isEnabled = feature.is_enabled;
                          const isNo = feature.value?.data?.toLowerCase() === "no" || !isEnabled;
                          const valueText =
                            feature.value?.data !== "Enable" &&
                            feature.value?.data !== "Yes" &&
                            feature.value?.data !== "No"
                              ? `${feature.value?.data || ""} ${feature.value?.unit || ""}`.trim()
                              : "";

                          return (
                            <li
                              key={`${plan._id}-${i}`}
                              className={`flex items-start gap-3 transition-opacity duration-300 ${
                                isNo ? "opacity-40" : "opacity-100"
                              }`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {isNo ? (
                                  <div className="bg-slate-100 text-slate-400 p-0.5 rounded-full border border-slate-200">
                                    <XCircle className="w-3.5 h-3.5 stroke-[3px]" />
                                  </div>
                                ) : (
                                  <div className={`p-0.5 rounded-full border shadow-sm ${
                                    isPopular 
                                      ? "bg-blue-50 text-[#0c1f4d] border-blue-100" 
                                      : "bg-green-50 text-green-600 border-green-100"
                                  }`}>
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col leading-tight">
                                <span className={`text-sm tracking-tight ${!isNo ? "text-slate-800 font-bold" : "text-slate-400 font-semibold line-through decoration-slate-300"}`}>
                                  {feature.element_name !== "Unknown" ? feature.element_name : "Plan Feature"}
                                </span>
                                {!isNo && valueText && (
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1 drop-shadow-sm leading-none">
                                    {valueText}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Read More / Less Toggle Button */}
                      {plan.visibleFeatures.length > 5 && (
                        <button
                          onClick={() => toggleExpand(plan._id)}
                          className="flex cursor-pointer items-center gap-1 text-sm font-bold text-[#0c1f4d] hover:underline transition-all mt-4 mb-6"
                        >
                          {isExpanded ? (
                            <><ChevronUp size={16} /> Show Less</>
                          ) : (
                            <><ChevronDown size={16} /> Read {plan.visibleFeatures.length - 5} More Features</>
                          )}
                        </button>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="mt-auto pt-6">
                      <Button
                        onClick={() => handleBuyPlan(plan._id)}
                        className={`
                          w-full h-12 rounded-xl text-base font-semibold transition-all duration-300
                          ${isPopular
                            ? "bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white shadow-lg shadow-blue-900/20"
                            : "bg-white border-2 border-slate-200 text-slate-700 hover:border-[#0c1f4d] hover:text-white cursor-pointer"
                          }
                        `}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isPopular ? "Get Started Now" : "Choose Plan"}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvertiseWithUs;
