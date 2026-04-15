import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ShoppingCart, X, Package, Building2, AlertCircle, Mail, Phone, Globe, Loader2, ChevronDown, Crown } from 'lucide-react';
import showToast from '@/toast/showToast';
import { loadRazorpayScript, RAZORPAY_GLOBAL_CONFIG } from '../../../utils/Razorpay';
import { useGetUniqueCitiesQuery, useGetCompetitorProductsQuery, useGetAddressByIdQuery } from '@/redux/api/AddressApi';
import { useCheckUserSubscriptionAndPlanQuery } from '@/redux/api/BannerPaymentApi';
import { useGetEbookSubscriptionPlansQuery, useGetGSTPlanQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from '@/loader/Loader';

const Ebooks = () => {
  const { user } = useContext(AuthContext);
  const user_id = user?.user?._id;
  const token = sessionStorage.getItem("token");

  // ── Original states (paid extra cities) ───────────────────────────
  const [selectedCities, setSelectedCities] = useState([]);
  const [currentCity, setCurrentCity] = useState('');
  const [allCompetitors, setAllCompetitors] = useState([]);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [activeEbookRecord, setActiveEbookRecord] = useState([]);
  const navigate = useNavigate();
  // ── NEW states for plan-based free quota ──────────────────────────
  const [dbStatus, setDbStatus] = useState(null);
  const [freeSelectedCities, setFreeSelectedCities] = useState([]);
  const [currentFreeCity, setCurrentFreeCity] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(false);

  // ── Original queries (unchanged) ─────────────────────────────────
  const { data: userAddresses } = useGetAddressByIdQuery(user_id);
  const { data: ebookPlanData } = useGetEbookSubscriptionPlansQuery();
  const { data: gstPlanData } = useGetGSTPlanQuery();
  const { data: allCitiesData } = useGetUniqueCitiesQuery();
  const { data: competitorData, isFetching, refetch: refetchCompetitors } = useGetCompetitorProductsQuery({ page, limit: 10 });
  const { data: subscriptionData } = useCheckUserSubscriptionAndPlanQuery(user_id);

  // Fetch active paid ebook records (your original)
  const fetchPurchased = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/e-book-payment/active-payment?user_id=${user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveEbookRecord(data);
        console.log(data, 'data value');

      }
    } catch (err) {
      showToast(`Failed to fetch purchased ebook records:${err}`, 'error');
    }
  };
  console.log(competitorData, 'here is the compitator');

  // NEW: Fetch Digital Book Plan Quota Status
  const fetchDigitalBookStatus = async () => {


    if (!user_id || !token) return;
    setLoadingStatus(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/e-book-payment/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(res, 'edit');

      if (res.data.success) {
        setDbStatus(res.data);
        console.log(res.data, 'kaHJDHFJHJSDFJS');

        if (res.data.selectedCities) {
          setFreeSelectedCities(res.data.selectedCities);
        }
      }


    } catch (err) {
      console.error("Failed to fetch digital book status:", err);
      showToast("Could not load your plan's digital book details", 'error');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (user_id && token) {
      fetchPurchased();
      fetchDigitalBookStatus();
    }
  }, [user_id, token]);

  // Original competitor data sync (unchanged)
  useEffect(() => {
    if (competitorData?.competitors) {
      setAllCompetitors(prev => {
        if (page === 1) return competitorData.competitors;

        const existingIds = new Set(prev.map(c => c._id));
        const newCompetitors = competitorData.competitors.filter(
          c => !existingIds.has(c._id)
        );

        return [...prev, ...newCompetitors];
      });
    }
  }, [competitorData, page]);


  const companyProfile = useMemo(() => userAddresses?.find(a => a.address_type === 'company'), [userAddresses]);
  const userHomeCity = companyProfile?.city || "Pondicherry";
  const purchasedCities = useMemo(() => activeEbookRecord?.purchasedCities || [], [activeEbookRecord]);

  const hasDuplicateSelection = useMemo(() => {
    return selectedCities.some(city => purchasedCities.includes(city));
  }, [selectedCities, purchasedCities]);

  const pricePerCity = ebookPlanData?.data?.[0]?.price || 1200;
  const gstRate = gstPlanData?.data?.price || 0;
  const totalAmount = (selectedCities.length * pricePerCity) * (1 + gstRate / 100);

  // NEW: Add free city using plan quota
  const handleAddFreeCity = async () => {
    if (!currentFreeCity) return;

    const maxAllowed = dbStatus?.maxCities || 0;
    if (maxAllowed !== "Unlimited" && freeSelectedCities.length >= maxAllowed) {
      showToast(`You can select maximum ${maxAllowed} free cities only`, 'warning');
      return;
    }

    if (freeSelectedCities.includes(currentFreeCity) ||
      currentFreeCity.toLowerCase() === userHomeCity.toLowerCase() ||
      purchasedCities.includes(currentFreeCity)) {
      showToast("City already selected, is your home city, or already purchased", 'info');
      return;
    }

    // Optimistic UI update
    setFreeSelectedCities(prev => [...prev, currentFreeCity]);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/e-book-payment/select-free-cities`,
        { cities: [currentFreeCity] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        showToast("City added to your free quota!", 'success');
        setDbStatus(prev => ({
          ...prev,
          remainingCities: res.data.remainingCities,
          selectedCities: res.data.selectedCities
        }));
        setPage(1);
        setTimeout(() => refetchCompetitors(), 100);
      }
    } catch (err) {
      // Rollback on failure
      setFreeSelectedCities(prev => prev.filter(c => c !== currentFreeCity));
      showToast(err.response?.data?.message || "Failed to add free city", 'error');
    } finally {
      setCurrentFreeCity('');
    }
  };

  // Your original purchase handler (paid extra cities) - completely unchanged
  const handlePurchase = async () => {
    try {
      setIsRazorpayLoading(true);
      await loadRazorpayScript();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/e-book-payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            user_id,
            subscription_id: subscriptionData?.subscriptionId,
            locations: selectedCities,
          }),
        }
      );

      const data = await res.json();

      // ❌ ERROR HANDLING (FIXED)
      if (!res.ok) {
        if (data?.duplicateCities?.length > 0) {
          showToast(
            `These cities are already unlocked: ${data.duplicateCities.join(", ")}`, 'warning'
          );
        } else {
          showToast(data?.error || "Failed to create order", 'error');
        }

        setIsRazorpayLoading(false);
        return; // ⛔ IMPORTANT
      }

      // ✅ SUCCESS FLOW
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const v = await fetch(
              `${import.meta.env.VITE_API_URL}/e-book-payment/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify(response),
              }
            );

            if (v.ok) {
              showToast("Payment Successful! Cities unlocked.", 'success');
              window.location.reload();
            } else {
              showToast("Payment verification failed. Please contact support.", 'error');
              setIsRazorpayLoading(false);
            }
          } catch (error) {
            console.error("Verification error:", error);
            showToast("Error verifying payment", 'error');
            setIsRazorpayLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsRazorpayLoading(false);
          },
        },
        theme: { color: "#0c1f4d" },
        config: RAZORPAY_GLOBAL_CONFIG,
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setIsRazorpayLoading(false);
        showToast("Payment failed", "error");
      });
      rzp.open();
    } catch (err) {
      console.error("Purchase error:", err);
      showToast("Network error. Please try again.", 'error');
      setIsRazorpayLoading(false);
    }
  };

  // ── RENDER LOGIC ──────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <Loader />
    );
  }

  // Case 2: Premium plan with free quota
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#0c1f4d]">Competitor E-Book</h1>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#0c1f4d]" disabled={subscriptionData?.planCode === "FREE"}>
          <ShoppingCart className="mr-2 h-4 w-4" /> Buy Extra Cities
        </Button>
      </div>

      {subscriptionData?.planCode === "FREE" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-start gap-4 shadow-sm">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-amber-900 leading-tight">Paid Plan Required</h4>
            <p className="text-sm text-amber-700 mt-1.5 leading-relaxed">
              Competitor E-books and city expansion features are exclusively available for merchants on a paid subscription (Basic, Royal, or Premium).
              Please upgrade your main business plan to unlock these features.
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

      {allCompetitors.length === 0 && !isFetching && (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
          <Globe className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">No competitors found in your unlocked cities.</p>
        </div>
      )}

      {/* Free Quota Section - NEW */}
      <Card className="mb-8 border-t-4 border-[#0c1f4d] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-indigo-600" />
            Your Free City Quota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Maximum Free Cities</p>
              <p className="text-3xl font-bold text-indigo-700">{dbStatus?.maxCities}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-3xl font-bold text-green-600">{dbStatus?.remainingCities}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Selected</p>
              <p className="text-3xl font-bold">{freeSelectedCities?.length}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select
              onValueChange={setCurrentFreeCity}
              value={currentFreeCity}
              disabled={(dbStatus?.maxCities !== "Unlimited" && freeSelectedCities?.length >= dbStatus?.maxCities) || dbStatus?.remainingCities === 0}
            >
              <SelectTrigger className="w-full sm:w-96 border-2 border-slate-300">
                <SelectValue placeholder="Choose a city (free quota)" />
              </SelectTrigger>
              <SelectContent>
                {allCitiesData
                  ?.filter(c =>
                    !freeSelectedCities.includes(c.city) &&
                    c.city !== userHomeCity &&
                    !purchasedCities.includes(c.city)
                  )
                  .map(c => (
                    <SelectItem key={c.city} value={c.city}>
                      {c.city}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>

            <Button
              onClick={handleAddFreeCity}
              disabled={
                !currentFreeCity ||
                (dbStatus?.maxCities !== "Unlimited" && freeSelectedCities.length >= dbStatus?.maxCities) ||
                dbStatus?.remainingCities === 0 ||
                subscriptionData?.planCode === "FREE"
              }
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Add Free City
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-gray-50 rounded-lg border border-dashed">
            {freeSelectedCities.length === 0 ? (
              <p className="text-gray-400 m-auto text-sm">No free cities selected yet</p>
            ) : (
              freeSelectedCities.map(city => (
                <span
                  key={city}
                  className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium shadow-sm"
                >
                  {city}
                </span>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Your original layout: User Card + Competitor List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* User Card - completely unchanged */}
        <Card className="lg:col-span-1 h-fit border-t-4 border-[#0c1f4d]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Building2 className="mr-2 h-4 w-4" /> My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="pb-2 border-b">
              <p className="font-bold text-lg">{user?.user?.name}</p>
              <p className="text-gray-500 mt-1 flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-1 text-red-500 shrink-0" />
                {companyProfile ? `${companyProfile.address_line_1}, ${companyProfile.city}` : "Address not set"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Current Unlocked Cities</p>
              <div className="flex flex-wrap gap-1">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold border border-green-200">
                  {userHomeCity} (HOME)
                </span>
                {purchasedCities.map(c => (
                  <span key={c} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-200">
                    {c} (paid)
                  </span>
                ))}
                {/* NEW: Show free selected cities here too */}
                {freeSelectedCities.map(c => (
                  <span key={`free-${c}`} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-200">
                    {c} (Free)
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitor List - completely unchanged */}
        <div className="lg:col-span-3 space-y-4">
          {allCompetitors.length === 0 && !isFetching && (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
              <Globe className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No competitors found in your unlocked cities.</p>
            </div>
          )}

          {allCompetitors.map((comp) => (
            <Card key={comp._id} className="border-l-4 border-[#0c1f4d] hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-bold text-xl text-[#0c1f4d]">
                        {comp.merchant?.company_name || "Unknown Business"}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1 text-red-500" />
                        {comp.address ? `${comp.address.address_line_1}, ${comp.address.city}` : "Address not available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        <Mail className="h-3 w-3 text-[#0c1f4d]" />
                        <span className="truncate">{comp.user?.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        <Phone className="h-3 w-3 text-[#0c1f4d]" />
                        <span>{comp.user?.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {comp.merchant?.company_images?.length > 0 ? (
                      comp.merchant.company_images.slice(0, 2).map((img, idx) => (
                        <img key={idx} src={img} className="w-20 h-20 object-cover rounded-lg border shadow-sm" alt="company logo" />
                      ))
                    ) : (
                      <div className="w-20 h-20 bg-gray-50 rounded-lg border border-dashed flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-400 mb-3 uppercase tracking-widest">Available Products</p>
                  <div className="flex flex-wrap gap-2">
                    {comp.products && comp.products.length > 0 ? (
                      comp.products.map((p, idx) => (
                        <div key={idx} className="bg-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-100 shadow-sm flex items-center gap-2">
                          <Package className="h-3 w-3 text-blue-500" />
                          <span>{typeof p === 'string' ? p : p.name || p}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No products listed</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {competitorData?.hasMore === true && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                className="w-full max-w-md"
                onClick={() => setPage(prev => prev + 1)}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>
                    Load More Competitors
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Original Paid Purchase Modal - completely unchanged */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {isRazorpayLoading && <Loader label="Processing Payment Securely..." />}
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Unlock New Cities</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Select onValueChange={setCurrentCity} value={currentCity}>
                <SelectTrigger className="w-full border-2 border-slate-300">
                  <SelectValue placeholder="Search Cities" />
                </SelectTrigger>
                <SelectContent>
                  {allCitiesData?.filter(c =>
                    !purchasedCities.includes(c.city) &&
                    c.city !== userHomeCity
                  ).map(c => (
                    <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (currentCity) {
                    setSelectedCities([...new Set([...selectedCities, currentCity])]);
                    setCurrentCity('');
                  }
                }}
                className="bg-[#0c1f4d]"
              >
                Add
              </Button>
            </div>

            <div className="min-h-[100px] border-2 border-dashed rounded-xl p-3 bg-gray-50 flex flex-wrap gap-2 content-start">
              {selectedCities.length === 0 && <p className="text-gray-400 text-xs m-auto">No cities selected yet</p>}
              {selectedCities.map(c => (
                <span key={c} className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center border shadow-sm bg-white">
                  {c} <X className="ml-2 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setSelectedCities(selectedCities.filter(sc => sc !== c))} />
                </span>
              ))}
            </div>

            {hasDuplicateSelection && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center text-xs gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                One or more cities are already purchased.
              </div>
            )}

            <div className="bg-[#0c1f4d] text-white p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between text-xs opacity-80 mb-1">
                <span>Selected Cities:</span><span>{selectedCities.length}</span>
              </div>
              <div className="flex justify-between text-xs opacity-80">
                <span>Price per City (+GST):</span><span>₹{pricePerCity}</span>
              </div>
              <div className="flex justify-between font-bold text-2xl border-t border-white/20 mt-3 pt-3">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handlePurchase}
              disabled={selectedCities.length === 0 || isRazorpayLoading || hasDuplicateSelection}
              className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-md"
            >
              {isRazorpayLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Securing Payment...
                </>
              ) : (
                "Purchase Access Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ebooks;
