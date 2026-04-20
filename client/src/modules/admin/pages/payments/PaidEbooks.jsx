
import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Edit, X, RefreshCw, MapPin, Calendar, Search } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetUserBySearchQuery, useGetAllActiveEbookPaymentsQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetUniqueCitiesQuery } from '@/redux/api/AddressApi';
import { loadRazorpayScript } from '@/modules/merchant/utils/Razorpay';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from "@/components/ui/pagination";

const PaidEbooks = () => {
  const { isSidebarOpen } = useSidebar();
  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [currentCity, setCurrentCity] = useState('');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeEbookPayment, setActiveEbookPayment] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 5; 

  const { data: citiesData, refetch: refetchCities } = useGetUniqueCitiesQuery();
  const cities = citiesData?.data || [];


  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('Debounced search value:', searchInput); 
      setDebouncedSearch(searchInput);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });


  useEffect(() => {
    console.log('Search results:', searchResults);
    console.log('Search error:', searchError);
  }, [searchResults, searchError]);

  const { data: subscriptionData } = useCheckUserSubscriptionQuery(selectedSeller?._id, {
    skip: !selectedSeller?._id,
  });

  useEffect(() => {
    if (searchResults?.users?.length > 0) {
      setSelectedSeller(searchResults.users[0]);
    } else {
      setSelectedSeller(null);
    }
  }, [searchResults]);

  const { data: activeEbookPayments, isLoading: isEbookPaymentsLoading, refetch: refetchEbookPayments } = useGetAllActiveEbookPaymentsQuery({ page, limit });


  const payments = activeEbookPayments?.data || [];
  const pagination = activeEbookPayments?.pagination || {};
  const { total = 0, totalPages = 1, hasNextPage, hasPrevPage } = pagination;


  const handleAddCity = () => {
    if (currentCity && !selectedCities.includes(currentCity)) {
      setSelectedCities([...selectedCities, currentCity]);
      setCurrentCity('');
    }
  };


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
 
      await Promise.all([refetchEbookPayments(), refetchCities()]);
  
      setSearchInput('');
      setDebouncedSearch('');
      setSelectedSeller(null);
      setSelectedCities([]);
      setCurrentCity('');
      setActiveEbookPayment(null);
      setIsPurchaseModalOpen(false);
      setIsUpgradeModalOpen(false);
      setIsCancelDialogOpen(false);
      setPage(1); 
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('Failed to refresh e-book data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };


  const handlePurchase = async (isUpgrade = false, oldEbookPaymentId = null) => {
    try {
      if (!selectedCities.length) throw new Error('Please select at least one city');
      if (!selectedSeller?._id) throw new Error('No seller selected');
      if (!subscriptionData?.subscriptionId) throw new Error('No subscription ID found. Please purchase a plan first.');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');
      if (isUpgrade && !oldEbookPaymentId) throw new Error('No active ebook to upgrade');

      setIsRazorpayLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay script');
      }


      const res = await fetch(`${import.meta.env.VITE_API_URL}/common-subscription-plan/ebook-plans`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const plans = await res.json();
      if (!plans.length) throw new Error('No ebook plans found');

      const pricePerCity = plans[0]?.price || 500;
      const amount = selectedCities.length * pricePerCity;

      const payload = {
        user_id: selectedSeller._id,
        subscription_id: subscriptionData?.subscriptionId,
        locations: selectedCities,
        amount,
        ...(isUpgrade && { old_ebook_payment_id: oldEbookPaymentId }),
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/e-book-payment/${isUpgrade ? 'upgrade' : 'create-order'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      if (!response.ok) throw new Error(`Failed to create order: ${responseData.error || 'Unknown error'}`);

      const { order } = responseData;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: isUpgrade ? 'Ebook Upgrade Payment' : 'Ebook Purchase Payment',
        description: `${isUpgrade ? 'Upgrading' : 'Purchasing'} ebook for seller ${selectedSeller.email} in cities: ${selectedCities.join(', ')}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/e-book-payment/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
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
              showToast(`${isUpgrade ? 'Upgraded' : 'Purchased'} ebook for ${selectedCities.join(', ')}`, 'success');
              setActiveEbookPayment(verifyData.ebookPayment);
              setSelectedCities([]);
              setPage(1);
              await refetchEbookPayments();
            } else {
              showToast('Payment verification failed', 'error');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            showToast(`Error verifying payment: ${error.message}`, 'error');
          } finally {
            setIsPurchaseModalOpen(false);
            setIsUpgradeModalOpen(false);
          }
        },
        prefill: {
          email: selectedSeller?.email || 'demo@example.com',
          contact: selectedSeller?.phone || '9999999999',
        },
        theme: {
          color: '#0c1f4d',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        showToast(`Payment failed: ${response.error.description || 'Please try again'}`, 'error');
      });
      razorpay.open();
    } catch (error) {
      console.error('Purchase Error:', error);
      showToast(`Something went wrong: ${error.message}`, 'error');
    } finally {
      setIsRazorpayLoading(false);
    }
  };


  const handleCancel = async (ebookPaymentId) => {
    try {
      if (!ebookPaymentId) throw new Error('No e-book payment ID provided');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/e-book-payment/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ ebook_payment_id: ebookPaymentId }),
      });

      if (response.ok) {
        showToast('E-book subscription cancelled successfully', 'success');
        setActiveEbookPayment(null);
        setPage(1); 
        await refetchEbookPayments();
      } else {
        throw new Error('Failed to cancel e-book');
      }
    } catch (error) {
      console.error('Cancel Ebook Error:', error);
      showToast(`Failed to cancel e-book: ${error.message}`, 'error');
    } finally {
      setIsCancelDialogOpen(false);
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const randomNameColor = () => {
    const colors = [
      "bg-red-600",
      "bg-[#0c1f4d]",
      "bg-green-600",
      "bg-purple-600",
      "bg-orange-600",
      "bg-pink-600",
      "bg-teal-600",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };


  const priceBadgeVariant = (amount) => {
    const a = Number(amount) || 0;
    if (a >= 100 && a <= 999) return "bg-emerald-100 text-emerald-700"; 
    if (a >= 1000 && a <= 2999) return "bg-amber-100 text-amber-700";
    if (a >= 3000) return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Manage E-Book Subscriptions</h2>
          <Button
            onClick={handleRefresh}
            className="bg-gray-600 hover:bg-gray-700 text-white"
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="mb-6">
          <Label htmlFor="searchInput" className="text-gray-700">Search Seller by Email or Phone</Label>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="searchInput"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.trim())}
              placeholder="Enter email or phone number"
              className="pl-9 mt-1"
              disabled={isRefreshing}
            />
          </div>
          {isSearchLoading && <p className="mt-2">Searching...</p>}
          {searchError && <p className="mt-2 text-red-600">Error searching for seller: {searchError?.data?.message || 'Unknown error'}</p>}
          {searchResults?.data && (
            <div className="mt-2">
              {searchResults.data.length > 0 ? (
                <ul className="space-y-2">
                  {searchResults.data.map((seller) => (
                    <li
                      key={seller._id}
                      className="p-2 border rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedSeller(seller)}
                    >
                      {seller.email} | {seller.phone || 'N/A'} {selectedSeller?._id === seller._id && '(Selected)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-gray-600">No sellers found</p>
              )}
            </div>
          )}
          {selectedSeller && (
            <div className="p-3 rounded-lg border mt-5 border-gray-300 bg-gray-50">
              <p className="font-medium text-[#0c1f4d]">Selected Seller:</p>
              <p className="text-sm">Email: {selectedSeller.email}</p>
              <p className="text-sm">Phone Number: {selectedSeller.phone || 'N/A'}</p>
            </div>
          )}
        </div>


        {selectedSeller && (
          <div className="flex space-x-4 mb-6">
            <Button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="bg-[#0c1f4d] hover:bg-blue-700 text-white"
              disabled={isRazorpayLoading || isRefreshing}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Buy E-Book
            </Button>
            {activeEbookPayment && (
              <>
                <Button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isRazorpayLoading || isRefreshing}
                >
                  <Edit className="mr-2 h-5 w-5" />
                  Upgrade E-Book
                </Button>
                <Button
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isRazorpayLoading || isRefreshing}
                >
                  <X className="mr-2 h-5 w-5" />
                  Cancel E-Book
                </Button>
              </>
            )}
          </div>
        )}

        <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase E-Book for Seller</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Select value={currentCity} onValueChange={setCurrentCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((item) => (
                      <SelectItem key={item.id} value={item.city}>
                        {item.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddCity} className="mt-2" disabled={!currentCity || isRefreshing}>
                  Add City
                </Button>
              </div>
              <div>
                <h3 className="font-semibold">Selected Cities:</h3>
                <ul className="list-disc pl-5">
                  {selectedCities.map((city) => (
                    <li key={city}>{city}</li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">Total Cost: ₹{selectedCities.length * 500}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)} disabled={isRefreshing}>
                Cancel
              </Button>
              <Button
                onClick={() => handlePurchase(false)}
                disabled={selectedCities.length === 0 || isRazorpayLoading || isRefreshing}
              >
                {isRazorpayLoading ? 'Processing...' : 'Proceed to Pay'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade E-Book for Seller</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Select value={currentCity} onValueChange={setCurrentCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((item) => (
                      <SelectItem key={item.id} value={item.city}>
                        {item.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddCity} className="mt-2" disabled={!currentCity || isRefreshing}>
                  Add City
                </Button>
              </div>
              <div>
                <h3 className="font-semibold">Selected Cities:</h3>
                <ul className="list-disc pl-5">
                  {selectedCities.map((city) => (
                    <li key={city}>{city}</li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">Total Cost: ₹{selectedCities.length * 500}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)} disabled={isRefreshing}>
                Cancel
              </Button>
              <Button
                onClick={() => handlePurchase(true, activeEbookPayment?._id)}
                disabled={selectedCities.length === 0 || isRazorpayLoading || isRefreshing}
              >
                {isRazorpayLoading ? 'Processing...' : 'Proceed to Upgrade'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel E-Book Subscription</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to cancel the e-book subscription for {selectedSeller?.email}?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isRefreshing}>
                No, Keep It
              </Button>
              <Button onClick={() => handleCancel(activeEbookPayment?._id)} variant="destructive" disabled={isRefreshing}>
                Yes, Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    
        {isEbookPaymentsLoading ? (
          <p>Loading e-book purchases...</p>
        ) : payments.length > 0 ? (
          <>
            <h2 className="text-3xl font-bold text-[#0c1f4d] mb-4">E-Book Purchased Seller List</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`uppercase text-white ${randomNameColor()}`}>
                          {getInitial(payment.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{payment.user?.name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">{payment.user?.role || "Seller"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{payment.user?.email}</TableCell>
                    <TableCell>{payment.user?.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className="px-3 py-1 font-medium">
                        {payment.subscription?.plan_name || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${priceBadgeVariant(payment.amount)}`}>
                        <span className="font-semibold">₹{payment.amount}</span>
                        <span className="text-[11px] opacity-80">{payment.subscription?.interval || "one-time"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(payment.locations) && payment.locations.length > 0 ? (
                          payment.locations.slice(0, 3).map((loc, i) => (
                            <Badge key={i} className="px-2 py-1">
                              <MapPin className="mr-1 h-3 w-3 inline-block align-text-bottom" />
                              <span className="text-xs">{loc}</span>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {Array.isArray(payment.locations) && payment.locations.length > 3 && (
                          <Badge className="px-2 py-1 text-xs">+{payment.locations.length - 3} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedSeller(payment.user);
                          setActiveEbookPayment(payment);
                          setIsUpgradeModalOpen(true);
                        }}
                        disabled={isRefreshing}
                        variant="ghost"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Upgrade</span>
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedSeller(payment.user);
                          setActiveEbookPayment(payment);
                          setIsCancelDialogOpen(true);
                        }}
                        disabled={isRefreshing}
                        variant="destructive"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-end">
                <Pagination>
                  <PaginationContent>
                
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (hasPrevPage) setPage(page - 1);
                        }}
                        className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
               
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={page === pageNum}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                   
                    {totalPages > 5 && page < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
               
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (hasNextPage) setPage(page + 1);
                        }}
                        className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <p>No active e-book purchases found.</p>
        )}
      </div>
    </div>
  );
};

export default PaidEbooks;