import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PurchaseDialog from './PurchaseDialog';
import { useGetAllPlansQuery, useCreateRazorpayOrderMutation, useVerifyPaymentMutation, useCreateSubscriptionMutation, useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import PurchasedSellersTable from './PurchasedSellersTable';
import { Search } from 'lucide-react';

const BuyPlanPage = () => {
    const { isSidebarOpen } = useSidebar();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { data: plans, isLoading: isPlansLoading } = useGetAllPlansQuery();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
    const [verifyPayment] = useVerifyPaymentMutation();
    const [createSubscription] = useCreateSubscriptionMutation();
    const [debouncedSearch, setDebouncedSearch] = useState("");


    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);
    const { data: searchResults, isLoading, error } = useGetUserBySearchQuery(debouncedSearch, {
        skip: !debouncedSearch, 
    });

    console.log(searchResults, "searchResults");

    useEffect(() => {
        if (searchResults?.users?.length > 0) {
            setSelectedSeller(searchResults.users[0]);
        } else {
            setSelectedSeller(null);
        }
    }, [searchResults]);
    const getPlanType = (price) => {
        if (price <= 1000) return 'Standard Plan';
        if (price > 1000 && price <= 2000) return 'Professional Plan';
        if (price > 2000) return 'Enterprise Plan';
        return 'Custom Plan';
    };

    const handleSelectPlan = (plan) => {
        if (!selectedSeller) {
            showToast('Please select a seller first', 'error');
            return;
        }
        setSelectedPlan(plan);
        setIsPurchaseOpen(true);
    };

    function calculateEndDateFromElements(elements, startDate = new Date()) {
        const durationElement = elements.find(
            el => el.element_name.trim() === "Subscription Duration"
        );

        if (!durationElement) throw new Error('Subscription Duration not found in plan elements');

        const [num, unit] = durationElement.value.split(" ");
        const value = parseInt(num, 10);
        const endDate = new Date(startDate);

        if (unit.toLowerCase().startsWith("year")) {
            endDate.setFullYear(endDate.getFullYear() + value);
        } else if (unit.toLowerCase().startsWith("month")) {
            endDate.setMonth(endDate.getMonth() + value);
        } else if (unit.toLowerCase().startsWith("day")) {
            endDate.setDate(endDate.getDate() + value);
        }

        return endDate.toISOString().split("T")[0];
    }
    const handlePurchase = async (plan) => {
        try {
            if (!plan || !plan.subscription_plan_id || !plan.subscription_plan_id._id || !plan.subscription_plan_id.price) {
                throw new Error('Invalid plan or missing price');
            }

            const userId = selectedSeller?._id;
            if (!userId) throw new Error('No seller selected');

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) throw new Error('Failed to load Razorpay script');

            const payload = {
                user_id: userId,
                subscription_plan_id: plan.subscription_plan_id._id,
                amount: plan.subscription_plan_id.price,
            };

            const { order } = await createRazorpayOrder(payload).unwrap();

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Subscription Payment',
                description: `Purchasing ${plan.subscription_plan_id.plan_name} for seller ${selectedSeller.email}`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        console.log(response, "response from razorpay");

                        const verifyRes = await verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }).unwrap();

                        if (verifyRes.success) {

                            const endDate = calculateEndDateFromElements(plan.elements);

                            await createSubscription({
                                user_id: userId,
                                subscription_plan_id: plan.subscription_plan_id._id,
                                end_date: endDate,
                                amount: plan.subscription_plan_id.price,      
                                razorpay_order_id: order.id,                   
                            }).unwrap();


                            showToast(
                                `Purchased ${plan.subscription_plan_id.plan_name} for ₹${plan.subscription_plan_id.price} for seller ${selectedSeller.email}`,
                                'success'
                            );
                            navigate('/admin/plans/subscription');
                        } else {
                            showToast('Payment verification failed', 'error');
                        }
                    } catch (error) {
                        console.error('Verification failed:', error);
                        showToast('Error verifying payment', 'error');
                    }
                },
                prefill: {
                    email: selectedSeller?.email || 'demo@example.com',
                    contact: selectedSeller?.phone || '9999999999',
                },
                theme: { color: '#0c1f4d' },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Purchase Error:', error);
            showToast(`Something went wrong: ${error.message}`, 'error');
        }
        setIsPurchaseOpen(false);
    };

    if (isPlansLoading) return <div>Loading plans...</div>;

    return (
        <div

        >
            <div className="p-6">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-[#0c1f4d]">Buy Plan for Seller</h2>
                    <p className="text-gray-600 mt-2">
                        Search for a seller by email or phone number to buy a subscription plan.
                    </p>
                </div>

                <div className="mb-6">
                    <Label htmlFor="searchInput" className="text-gray-700">Search Seller by Email or Phone</Label>
                    <div className="relative w-full mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            id="searchInput"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Enter email or phone number"
                           className="pl-9 pr-3 py-2 rounded-lg focus-visible:ring-gray-200 bg-gray-100 text-sm"
                        />
                    </div>
                    {isLoading && <p>Loading...</p>}
                    {error && <p>Error fetching users</p>}

                    {selectedSeller && (
                        <div className="p-3 rounded-lg border mt-5 border-gray-300 bg-gray-50">
                            <p className="font-medium text-[#0c1f4d] ">Selected Seller Info:</p>
                            <p className="text-sm">Email: {selectedSeller.email}</p>
                            <p className="text-sm">Phone Number : {selectedSeller.phone || "N/A"}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans?.data?.map((plan) => {
                        const planType = getPlanType(plan.subscription_plan_id.price);

                        return (
                            <Card key={plan.subscription_plan_id._id} className="flex flex-col h-full">
                                <CardHeader className="text-center">
                                    <div className="flex justify-center mb-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {planType}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl text-[#0c1f4d]">
                                        ₹{(Math.round(plan.subscription_plan_id.price - 1)).toLocaleString('en-IN')}
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-500">Billed Annually</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        {plan.elements.map((elem) => (
                                            <li key={elem.element_id} className="flex items-center">
                                                <span className="mr-2 text-[#0c1f4d]">✔</span>
                                                {elem.element_name}: {elem.value}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="mt-auto">
                                    <Button
                                        className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white cursor-pointer"
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={!selectedSeller}
                                    >
                                        Buy Plan
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
                <PurchaseDialog
                    open={isPurchaseOpen}
                    onOpenChange={setIsPurchaseOpen}
                    plan={selectedPlan}
                    onPurchase={handlePurchase}
                />
                <PurchasedSellersTable />
            </div>
        </div>
    );
};

export default BuyPlanPage;