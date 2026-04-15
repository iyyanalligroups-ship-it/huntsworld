import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ShoppingCart, Edit, X, User, Package, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { loadRazorpayScript } from '../../../utils/Razorpay';
import { useGetUniqueCitiesQuery, useGetCompetitorProductsQuery } from '@/redux/api/AddressApi';
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';
import showToast from '@/toast/showToast';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const Ebooks = () => {
  const [selectedCities, setSelectedCities] = useState([]);
  const { user } = useContext(AuthContext);
  const user_id = user?.user?._id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState('');
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [activeEbookPayment, setActiveEbookPayment] = useState(null);
  const [page, setPage] = useState(1);
  const recordsPerPage = 10;
  const { data: subscriptionData, } = useCheckUserSubscriptionQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  console.log('User Subscription Data:', subscriptionData);

  const { data: citiesData } = useGetUniqueCitiesQuery();
  const cities = citiesData || [];

  // Fetch competitor products
  const { data: competitorData, isLoading, error } = useGetCompetitorProductsQuery({
    page,
    limit: recordsPerPage,
  });

  const companyDetails = {
    company_name: 'HuntsWorld',
    company_email: 'contact@huntsworld.com',
    company_phone_number: '09345989654',
    address: 'MG Road, Kottakuppam, Pondicherry, India - 607002',
    description: 'HuntsWorld specializes in robotics, connecting businesses with innovative solutions.',
  };

  // Fetch active ebook payment
  useEffect(() => {
    const fetchActivePayment = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/e-book-payment/active-payment?user_id=${user_id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();
        if (data.ebookPayment) {
          setActiveEbookPayment(data.ebookPayment);
        }
      } catch (error) {
        console.error('Fetch Active Payment Error:', error);
        toast.error('Failed to fetch active payment');
      }
    };

    fetchActivePayment();
  }, []);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to fetch competitor products');
    }
  }, [error]);

  const handlePurchase = async (isUpgrade = false, oldEbookPaymentId = null) => {
    try {
      if (!selectedCities.length) throw new Error("Please select at least one city");
      if (!user?.user?._id) throw new Error("User not logged in");
      if (!subscriptionData.subscriptionId) throw new Error("No subscription ID found");
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error("Razorpay key ID is missing");
      if (isUpgrade && !oldEbookPaymentId) throw new Error("No active ebook to upgrade");

      setIsRazorpayLoading(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay script");
      }

      // ✅ Fetch pricePerCity dynamically via RTK Query or API
      const res = await fetch(`${import.meta.env.VITE_API_URL}/common-subscription-plan/ebook-plans`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const plans = await res.json();
      if (!plans.length) throw new Error("No ebook plans found");

      const pricePerCity = plans[0]?.price || 500; // fallback if not found

      // ✅ Dynamic user city check (case-insensitive)
      const userCity = (user?.user?.city || "").trim().toLowerCase();
      const payableCities = selectedCities.filter(
        (city) => city.trim().toLowerCase() !== userCity
      );

      const amount = payableCities.length * pricePerCity;

      const payload = {
        user_id: user.user._id,
        subscription_id: subscriptionData?.subscriptionId,
        locations: selectedCities,
        amount, // send final amount from frontend
        ...(isUpgrade && { old_ebook_payment_id: oldEbookPaymentId }),
      };

      // Create order in backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/e-book-payment/${isUpgrade ? "upgrade" : "create-order"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      if (!response.ok) throw new Error(`Failed to create order: ${responseData.error || "Unknown error"}`);

      const { order } = responseData;

      // ✅ Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: isUpgrade ? "Ebook Upgrade Payment" : "Ebook Purchase Payment",
        description: `${isUpgrade ? "Upgrading" : "Purchasing"} ebook for cities: ${selectedCities.join(", ")}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/e-book-payment/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              showToast(`${isUpgrade ? "Upgraded" : "Purchased"} ebook for ${selectedCities.join(", ")}`, "success");
              setActiveEbookPayment(verifyData.ebookPayment);
              setPage(1);
              setSelectedCities([]);
            } else {
              showToast("Payment verification failed", "error");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            showToast(`Error verifying payment: ${error.message}`, "error");
          } finally {
            setIsModalOpen(false);
            setIsUpgradeModalOpen(false);
          }
        },
        prefill: {
          email: user?.user?.email || "demo@example.com",
          contact: user?.user?.contact || "9999999999",
        },
        theme: {
          color: "#0c1f4d",
        },
      };

      // ✅ Open Razorpay popup immediately in user action context
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);
        showToast(`Payment failed: ${response.error.description || "Please try again"}`, "error");
      });
      razorpay.open();
    } catch (error) {
      console.error("Purchase Error:", error);
      showToast(`Something went wrong: ${error.message}`, "error");
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeEbookPayment) {
      toast.error('No active ebook to cancel.');
      setIsCancelDialogOpen(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/e-book-payment/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ ebook_payment_id: activeEbookPayment._id }),
      });

      if (response.ok) {
        toast.success('Ebook subscription cancelled successfully');
        setActiveEbookPayment(null);
        setPage(1);
      } else {
        throw new Error('Failed to cancel ebook');
      }
    } catch (error) {
      console.error('Cancel Ebook Error:', error);
      toast.error(`Failed to cancel ebook: ${error.message}`);
    } finally {
      setIsCancelDialogOpen(false);
    }
  };

  const handleAddCity = () => {
    if (currentCity && !selectedCities.includes(currentCity)) {
      setSelectedCities([...selectedCities, currentCity]);
      setCurrentCity('');
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h2 className="text-md border border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 m-4 sm:m-14 rounded-r-2xl w-24 font-bold">E-Book</h2>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Left Side: Company Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl font-bold text-red-600 font-montserrat flex items-center">
                  <MapPin className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  {companyDetails.company_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 italic font-roboto text-sm sm:text-base">{companyDetails.description}</p>
                <p className="text-gray-700 mt-4 font-roboto flex items-center text-sm sm:text-base">
                  <User className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {companyDetails.company_email}
                </p>
                <p className="text-gray-700 mt-2 font-roboto flex items-center text-sm sm:text-base">
                  <MapPin className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {companyDetails.address}
                </p>
                <p className="text-gray-700 mt-2 font-roboto flex items-center text-sm sm:text-base">
                  <Phone className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {companyDetails.company_phone_number}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Competitor Details */}
          <div className="lg:col-span-3">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-6">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#0c1f4d] hover:bg-blue-700 text-white font-semibold w-full sm:w-auto"
                disabled={isRazorpayLoading}
              >
                <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Buy E-Book
              </Button>
              {activeEbookPayment && (
                <>
                  <Button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold w-full sm:w-auto"
                    disabled={isRazorpayLoading}
                  >
                    <Edit className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Upgrade E-Book
                  </Button>
                  <Button
                    onClick={() => setIsCancelDialogOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto"
                    disabled={isRazorpayLoading}
                  >
                    <X className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Cancel E-Book
                  </Button>
                </>
              )}
            </div>

            {/* City Selection Modal (Purchase) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Cities for E-Book</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Select value={currentCity} onValueChange={setCurrentCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.data?.map((item) => (
                          <SelectItem key={item.id} value={item.city}>
                            {item.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddCity} className="mt-2 w-full sm:w-auto" disabled={!currentCity}>
                      Add City
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold">Selected Cities:</h3>
                    <ul className="list-disc pl-5">
                      {selectedCities.map((city) => (
                        <li key={city}>
                          {city} {city !== 'pondicherry' ? '(₹500)' : '(Free)'}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold">
                      Total Cost: ₹{selectedCities.filter((city) => city !== 'pondicherry').length * 500}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handlePurchase(false)}
                    disabled={selectedCities.length === 0 || isRazorpayLoading}
                  >
                    {isRazorpayLoading ? 'Processing...' : 'Proceed to Pay'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Upgrade Modal */}
            <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upgrade E-Book Cities</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Select value={currentCity} onValueChange={setCurrentCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.data?.map((item) => (
                          <SelectItem key={item.id} value={item.city}>
                            {item.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddCity} className="mt-2 w-full sm:w-auto" disabled={!currentCity}>
                      Add City
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold">Selected Cities:</h3>
                    <ul className="list-disc pl-5">
                      {selectedCities.map((city) => (
                        <li key={city}>
                          {city} {city !== 'pondicherry' ? '(₹500)' : '(Free)'}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold">
                      Total Cost: ₹{selectedCities.filter((city) => city !== 'pondicherry').length * 500}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handlePurchase(true, activeEbookPayment?._id)}
                    disabled={selectedCities.length === 0 || isRazorpayLoading}
                  >
                    {isRazorpayLoading ? 'Processing...' : 'Proceed to Upgrade'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel E-Book Subscription</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to cancel your e-book subscription? This action cannot be undone.</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                    No, Keep It
                  </Button>
                  <Button onClick={handleCancel} variant="destructive">
                    Yes, Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Competitor Cards */}
            {isLoading ? (
              <p className="text-gray-600 font-roboto text-center py-8">Loading competitors...</p>
            ) : competitorData?.competitors?.length > 0 ? (
              competitorData.competitors.map(({ city, merchant, address, user, products, merchant_id }) => (
                <Card key={merchant_id} className="mb-6 shadow-lg">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="w-full lg:w-auto">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800 font-montserrat flex items-center">
                          <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                          {merchant.company_name} ({city})
                        </CardTitle>
                        <p className="text-gray-600 font-roboto flex items-center mt-1 text-sm sm:text-base">
                          <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">Email:</span> {user?.email}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Company Images - Responsive Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:hidden">
                      {(merchant?.company_images || [])
                        .slice(0, 2)
                        .map((img, index) => (
                          <img
                            key={index}
                            src={img || "https://via.placeholder.com/100"}
                            alt={`${merchant?.name || "Competitor"} profile ${index + 1}`}
                            className="w-full h-24 sm:h-28 object-cover rounded"
                          />
                        ))}
                    </div>

                    {/* Company Details Section */}
                    <div className="space-y-3">
                      <p className="text-gray-600 font-roboto flex items-center text-sm sm:text-base">
                        <User className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-medium">Owner:</span> {user?.name} ({user?.phone})
                      </p>
                      <p className="text-gray-600 font-roboto flex items-center mt-1 text-sm sm:text-base">
                        <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-medium">Company Email:</span> {merchant.company_email}
                      </p>
                      <p className="text-gray-600 font-roboto mt-1 text-sm sm:text-base">
                        <span className="font-medium">Type:</span> {merchant.company_type}
                      </p>
                      <p className="text-gray-600 font-roboto mt-1 text-sm sm:text-base">
                        <span className="font-medium">About:</span> {merchant.description}
                      </p>
                    </div>

                    {/* Company Images - Desktop Only */}
                    <div className="hidden lg:flex gap-2">
                      {(merchant?.company_images || [])
                        .slice(0, 2)
                        .map((img, index) => (
                          <img
                            key={index}
                            src={img || "https://via.placeholder.com/100"}
                            alt={`${merchant?.name || "Competitor"} profile ${index + 1}`}
                            className="w-[100px] h-[100px] object-cover rounded"
                          />
                        ))}
                    </div>

                    {/* Address Section */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 font-montserrat flex items-center">
                        <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        Address
                      </h4>
                      <p className="text-gray-600 font-roboto text-sm sm:text-base mt-2">{address.address_line_1}</p>
                      {address.address_line_2 && (
                        <p className="text-gray-600 font-roboto text-sm sm:text-base">{address.address_line_2}</p>
                      )}
                      <p className="text-gray-600 font-roboto text-sm sm:text-base">
                        {address.city}, {address.state}, {address.country} - {address.pincode}
                      </p>
                    </div>

                    {/* Products Section */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 font-montserrat flex items-center">
                        <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        Products
                      </h4>
                      {products.length > 0 ? (
                        <ul className="list-none text-gray-600 font-roboto mt-2 space-y-2">
                          {products.map((product, i) => (
                            <li key={i} className="border-l-2 border-red-600 pl-3 text-sm sm:text-base">
                              {product}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 font-roboto text-sm sm:text-base mt-2">No products available.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-600 font-roboto text-center py-8 text-sm sm:text-base">No competitor data available.</p>
            )}

            {/* Load More Button */}
            {competitorData?.hasMore && (
              <Button
                onClick={loadMore}
                className="mt-6 bg-[#0c1f4d] hover:bg-blue-700 text-white w-full lg:w-auto"
              >
                Load More
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-600 font-roboto mt-8 px-4">
          {companyDetails.company_name} | {companyDetails.company_email} | {companyDetails.company_phone_number} <br />
          {companyDetails.address}
        </div>
      </div>
    </div>
  );
};

export default Ebooks;