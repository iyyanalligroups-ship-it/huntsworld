import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
    useGetActiveTopListingQuery,
    useCreateTopListingOrderMutation,
    useVerifyTopListingPaymentMutation,
} from '@/redux/api/TopListingApi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import showToast from '@/toast/showToast';
import { Zap, Crown, Info, ArrowRight, Loader2 } from "lucide-react";
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import TopListingPlanManagement from './TopListingPlanManagement';
import { useCheckUserSubscriptionAndPlanQuery } from '@/redux/api/BannerPaymentApi';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import axios from 'axios';
import Loader from '@/loader/Loader';

const TopListingSubscription = () => {
    const { user } = useContext(AuthContext);
    const userId = user?.user?._id;

    const [days, setDays] = useState('');
    const [amount, setAmount] = useState(0);
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
    const [version, setVersion] = useState(0);

    // Config States
    const [price, setPrice] = useState(0);
    const [duration, setDuration] = useState(0);
    const [durationType, setDurationType] = useState('');
    const [configLoading, setConfigLoading] = useState(true);
    const [gst, setGst] = useState(null);

    const { isSidebarOpen } = useSidebar();

    // API Queries
    const { data: subData, isLoading: isSubLoading } = useCheckUserSubscriptionAndPlanQuery(userId, {
        skip: !userId,
    });

    const { data: topData, isLoading: isTopLoading, refetch } = useGetActiveTopListingQuery(userId, {
        skip: !userId,
    });

    const [createOrder] = useCreateTopListingOrderMutation();
    const [verifyPayment] = useVerifyTopListingPaymentMutation();

    // Fetch Configs
    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const [gstRes, configRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/top-listing-plan-payment/gst-config`),
                    axios.get(`${import.meta.env.VITE_API_URL}/top-listing-plan-payment/top-listing-config`)
                ]);

                if (gstRes.data.success) setGst(gstRes.data.data.gstPercentage);
                if (configRes.data.success) {
                    setPrice(configRes.data.data.pricePerMonth || 0);
                    setDuration(configRes.data.data.durationValue || 0);
                    setDurationType(configRes.data.data.durationType || '');
                }
            } catch (err) {
                console.error("Config fetch failed", err);
            } finally {
                setConfigLoading(false);
            }
        };

        if (userId) fetchConfigs();
    }, [userId]);

    const handleDaysChange = (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1) {
            setDays(val);
            setAmount(val * price);
        } else {
            setDays('');
            setAmount(0);
        }
    };

    const handleRefresh = async () => {
        await refetch();
        setVersion((v) => v + 1);
    };

    const handlePurchase = async () => {
        if (!days || amount <= 0) {
            showToast('Please enter valid number of days', 'error');
            return;
        }

        try {
            setIsPurchaseOpen(false);
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded || !window.Razorpay) {
                throw new Error('Razorpay SDK failed to load');
            }

            const payload = {
                user_id: userId,
                days,
                amount,
                subscription_id: subData?.subscriptionId,
            };

            const { order } = await createOrder(payload).unwrap();

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Top Listing Activation',
                description: `Activate for ${days} days`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }).unwrap();

                        if (verifyRes.success) {
                            showToast(`Top listing activated for ${days} days!`, 'success');
                            handleRefresh();
                        } else {
                            showToast('Payment verification failed', 'error');
                        }
                    } catch (err) {
                        showToast('Verification error: ' + err.message, 'error');
                    }
                },
                prefill: {
                    name: user?.user?.name || '',
                    email: user?.user?.email || '',
                    contact: user?.user?.phone || '',
                },
                theme: { color: '#0c1f4d' },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', () => showToast('Payment failed', 'error'));
            razorpay.open();
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Failed to start payment', 'error');
        }
    };



    // 1. Loading State
    if (isSubLoading || isTopLoading || configLoading) {
        return <Loader />;
    }

    // 2. No Subscription State
    if (!subData?.hasSubscription) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-12 text-center bg-white rounded-[2.5rem] shadow-2xl border border-gray-100">
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Crown className="text-red-500 w-10 h-10" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Premium Membership Required</h2>
                <p className="text-gray-500 mb-10 text-lg leading-relaxed">
                    Top Listing visibility is a premium feature. To unlock the ability to rank higher, please activate a main subscription plan first.
                </p>
                <Button className="bg-[#0c1f4d] hover:bg-[#1a3575] px-10 py-7 rounded-2xl text-lg font-semibold transition-all shadow-lg hover:shadow-[#0c1f4d]/20">
                    View Subscription Plans
                </Button>
            </div>
        );
    }

    // 3. Main UI
    return (
        <div className={`transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} min-h-screen bg-[#f8fafc] p-4 lg:p-10`}>
            <div className="max-w-6xl mx-auto">

                {/* Visual Header Card */}
                <div className="relative overflow-hidden rounded-[2rem] bg-[#0c1f4d] p-8 lg:p-14 text-white mb-10 shadow-2xl shadow-blue-900/20">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-500/30">
                                <Zap className="w-3 h-3 fill-current" /> Priority Placement
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Top Listing</h1>
                            <p className="text-blue-100/70 text-lg max-w-md font-medium">
                                Dominate the marketplace. Get your products seen by every visitor.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white/20 shadow-2xl min-w-[200px]">
                            <p className="text-xs text-blue-200 uppercase tracking-widest mb-1 font-bold">Standard Rate</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black">₹{price?.toFixed(0) || 0}</span>
                                <span className="text-blue-200/60 font-medium">/ {durationType || 'day'}</span>
                            </div>
                        </div>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 lg:p-8 transition-all hover:shadow-md">
                    <TopListingPlanManagement
                        key={version}
                        user={user}
                        gst={gst}
                        hasSubscription={subData.hasSubscription}
                        subscriptionId={subData.subscriptionId}
                        planCode={subData?.planCode}
                        activeTopListing={topData?.activeTopListing}
                        pendingTopListing={topData?.pendingTopListing}
                        onRefresh={handleRefresh}
                        ratePerDay={price}
                    />
                </div>

                {/* Purchase Dialog */}
                <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
                    <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-[#0c1f4d] p-8 text-white relative">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                                    <div className="bg-yellow-400 p-2 rounded-xl text-black">
                                        <Zap className="w-6 h-6 fill-current" />
                                    </div>
                                    New Campaign
                                </DialogTitle>
                            </DialogHeader>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Crown className="w-24 h-24" />
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">How many days?</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 30"
                                    className="h-14 rounded-2xl border-2 border-slate-300 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#0c1f4d] text-xl font-semibold px-6 transition-all"
                                    value={days}
                                    onChange={handleDaysChange}
                                    min="1"
                                />
                            </div>

                            <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 space-y-4">
                                <div className="flex justify-between items-center text-gray-500 font-medium">
                                    <span>Base Price</span>
                                    <span>₹{amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="border-t border-blue-200/50 pt-4 flex justify-between items-end">
                                    <span className="text-gray-900 font-bold">Payable Amount</span>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-[#0c1f4d]">₹{amount.toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Plus Applicable GST</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                                    Campaigns are queued. If you have an active one, this will start immediately after it expires.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="p-8 pt-0 grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-14 rounded-2xl border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all"
                                onClick={() => setIsPurchaseOpen(false)}
                            >
                                Discard
                            </Button>
                            <Button
                                className="h-14 rounded-2xl bg-[#0c1f4d] hover:bg-[#162e63] font-bold text-white shadow-lg shadow-blue-900/30 gap-2 transition-all active:scale-95"
                                onClick={handlePurchase}
                                disabled={!days || amount <= 0}
                            >
                                Pay Now <ArrowRight className="w-5 h-5" />
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default TopListingSubscription;
