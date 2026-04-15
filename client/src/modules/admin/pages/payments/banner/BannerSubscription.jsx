// import { useState, useEffect, useContext } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { AuthContext } from '@/modules/landing/context/AuthContext';
// import { useGetAllActiveBannerPaymentsQuery } from '@/redux/api/BannerPaymentApi';
// import { useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import AdminBannerPlanManagement from './BannerPlanManagement';
// import { Edit, X, RefreshCw, Search, IndianRupee } from 'lucide-react';
// import showToast from '@/toast/showToast';
// import {
//   Pagination,
//   PaginationContent,
//   PaginationEllipsis,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination"

// const BannerSubscription = () => {

//   const { user } = useContext(AuthContext);
//   const [searchInput, setSearchInput] = useState('');
//   const [debouncedSearch, setDebouncedSearch] = useState('');
//   const [selectedSeller, setSelectedSeller] = useState(null); // Now holds { user, bannerPayment }
//   const [page, setPage] = useState(1);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [actionMode, setActionMode] = useState(null);
//   const limit = 5;

//   // Debounce search input (1 second = 1000ms)
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       console.log('Debounced search value:', searchInput);
//       setDebouncedSearch(searchInput);
//     }, 1000);
//     return () => clearTimeout(handler);
//   }, [searchInput]);

//   // Search seller by email or phone
//   const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
//     skip: !debouncedSearch || debouncedSearch.length < 3,
//   });
//   useEffect(() => {
//     if (searchResults?.users?.length > 0) {
//       setSelectedSeller(searchResults.users[0]);
//     } else {
//       setSelectedSeller(null);
//     }
//   }, [searchResults]);
//   // Debug search results
//   useEffect(() => {
//     console.log('Search results:', searchResults);
//     console.log('Search error:', searchError);
//   }, [searchResults, searchError]);

//   // Fetch all active banner purchases with pagination
//   const { data: activeBannerPayments, isLoading: isBannerPaymentsLoading, refetch: refetchBannerPayments } = useGetAllActiveBannerPaymentsQuery({ page, limit });

//   const totalPages = activeBannerPayments?.pages || 1;

//   // Handle component refresh
//   const handleRefresh = async () => {
//     setIsRefreshing(true);

//     try {
//       await refetchBannerPayments();
//       setSearchInput('');
//       setDebouncedSearch('');
//       setSelectedSeller(null);

//     } catch (error) {
//       console.error('Refresh error:', error);
//       showToast('Failed to refresh banner data', 'error');
//     } finally {
//       setIsRefreshing(false);
//     }
//   };
//   const getRandomBg = (name) => {
//     const colors = ["#E63946", "#1D3557", "#457B9D", "#A8DADC", "#F4A261", "#2A9D8F", "#8D99AE"];
//     const index = name?.charCodeAt(0) % colors.length;
//     return colors[index];
//   };
//   return (
//     <div className={`flex-1 p-4 transition-all duration-300 `}>
//       <div className="p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-3xl font-bold text-[#0c1f4d]">Manage Banner Subscriptions</h2>
//           <Button
//             onClick={handleRefresh}
//             className="bg-[#0c1f4d] hover:bg-[#0c1f4dd0] cursor-pointer text-white"
//             disabled={isRefreshing}
//           >
//             <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
//             {isRefreshing ? 'Refreshing...' : 'Refresh'}
//           </Button>
//         </div>

//         {/* Search Input */}
//         <div className="mb-6">
//           <Label htmlFor="searchInput" className="text-gray-700">Search Seller by Email or Phone</Label>
//           <div className="relative w-full max-w-md mt-4">
//             {/* Search Icon */}
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

//             {/* Input Field */}
//             <Input
//               id="searchInput"
//               value={searchInput}
//               onChange={(e) => {
//                 setSearchInput(e.target.value);
//                 if (e.target.value.trim()) {
//                   setSelectedSeller({ user: selectedSeller, bannerPayment: null });
//                   setActionMode("purchase");
//                 }
//               }}
//               placeholder="Search voters, volunteers, events..."
//               className="pl-9 pr-3 py-2 rounded-lg focus-visible:ring-gray-200 bg-gray-100 text-sm"
//               disabled={isRefreshing}
//             />

//           </div>
//           {isSearchLoading && <p className="mt-2">Searching...</p>}
//           {searchError && <p className="mt-2 text-red-600">Error searching for seller: {searchError?.data?.message || 'Unknown error'}</p>}
//           {searchResults?.data && (
//             <div className="mt-2">
//               {searchResults.data.length > 0 ? (
//                 <ul className="space-y-2">
//                   {searchResults.data.map((seller) => (
//                     <li
//                       key={seller._id}
//                       className="p-2 border rounded cursor-pointer hover:bg-gray-100"
//                       onClick={() => setSelectedSeller({ user: seller, bannerPayment: null })}
//                     >
//                       {seller.email} | {seller.phone || 'N/A'} {selectedSeller?.user?._id === seller._id && '(Selected)'}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="mt-2 text-gray-600">No sellers found</p>
//               )}
//             </div>
//           )}
//           {selectedSeller?.user && (
//             <div className="p-3 rounded-lg border mt-5 border-gray-300 bg-gray-50">
//               <p className="font-medium">Selected Seller:</p>
//               <p className="text-sm">Email: {selectedSeller.user.email}</p>
//               <p className="text-sm">Phone Number: {selectedSeller.user.phone || 'N/A'}</p>
//               {selectedSeller.bannerPayment && (
//                 <>
//                   <p className="text-sm">Banner Payment ID: {selectedSeller.bannerPayment._id}</p>
//                   <p className="text-sm">Days: {selectedSeller.bannerPayment.days}</p>
//                   <p className="text-sm">Amount: ₹{selectedSeller.bannerPayment.amount}</p>
//                 </>
//               )}
//             </div>
//           )}
//         </div>

//         <AdminBannerPlanManagement
//           user={user}
//           selectedSeller={selectedSeller}
//           refetchBannerPayments={refetchBannerPayments}
//           actionMode={actionMode}
//         />


//         {/* Active Banner Purchases Table */}
//         <div className="mt-8">
//           <h3 className="text-2xl font-bold text-[#0c1f4d] mb-4">Active Banner Purchases</h3>
//           {isBannerPaymentsLoading ? (
//             <p>Loading banner purchases...</p>
//           ) : activeBannerPayments?.data?.length > 0 ? (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Seller Name</TableHead>
//                   <TableHead>Email</TableHead>
//                   <TableHead>Phone</TableHead>
//                   <TableHead>Days</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Created At</TableHead>
//                   <TableHead className="text-center">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {activeBannerPayments.data.map((payment) => {

//                   return (
//                     <TableRow key={payment._id} className="hover:bg-gray-50">

//                       {/* Name with Avatar */}
//                       {/* Name with Avatar */}
//                       <TableCell className="flex items-center gap-3">
//                         <Avatar>
//                           <AvatarFallback
//                             className="text-white font-bold"
//                             style={{
//                               backgroundColor: getRandomBg(payment?.user?.name),
//                             }}
//                           >
//                             {payment.user?.name?.[0]?.toUpperCase() || "N"}
//                           </AvatarFallback>
//                         </Avatar>
//                         <span className="font-medium">{payment.user?.name || "N/A"}</span>
//                       </TableCell>


//                       {/* Email */}
//                       <TableCell>{payment.user.email}</TableCell>

//                       {/* Phone */}
//                       <TableCell>{payment.user.phone || "N/A"}</TableCell>

//                       {/* Days */}
//                       <TableCell>{payment.days}</TableCell>

//                       {/* Amount with Icon */}
//                       <TableCell className="flex items-center gap-1 font-semibold text-green-600">
//                         <IndianRupee className="w-4 h-4" />
//                         {payment.amount}
//                       </TableCell>

//                       {/* Status Badge */}
//                       <TableCell>
//                         <Badge
//                           variant={
//                             payment.payment_status === "paid"
//                               ? "success"
//                               : payment.payment_status === "created"
//                                 ? "secondary"
//                                 : "destructive"
//                           }
//                           className="capitalize"
//                         >
//                           {payment.payment_status}
//                         </Badge>
//                       </TableCell>

//                       {/* Created At */}
//                       <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>

//                       {/* Actions */}
//                       <TableCell className="flex justify-center gap-2">
//                         {/* Upgrade Button */}
//                         <Button
//                           size="icon"
//                           className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dd9] rounded-full p-2"
//                           onClick={() => {
//                             setSelectedSeller({ user: payment.user, bannerPayment: payment });
//                             setActionMode("upgrade");
//                           }}
//                           disabled={isRefreshing}
//                         >
//                           <Edit className="h-4 w-4" />
//                         </Button>

//                         {/* Cancel Button */}
//                         <Button
//                           size="icon"
//                           className="bg-red-500 text-white hover:bg-red-600 rounded-full p-2"
//                           onClick={() => {
//                             setSelectedSeller({ user: payment.user, bannerPayment: payment });
//                             setActionMode("cancel");
//                           }}
//                           disabled={isRefreshing}
//                         >
//                           <X className="h-4 w-4" />
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           ) : (
//             <p>No active banner purchases found.</p>
//           )}
//           {activeBannerPayments?.data?.length > 0 && (
//             <div className="mt-4 float-end">
//               <Pagination>
//                 <PaginationContent>
//                   {/* Previous */}
//                   <PaginationItem>
//                     <PaginationPrevious
//                       href="#"
//                       onClick={(e) => {
//                         e.preventDefault();
//                         if (page > 1 && !isRefreshing) setPage(page - 1);
//                       }}
//                       className={page === 1 || isRefreshing ? "pointer-events-none opacity-50" : ""}
//                     />
//                   </PaginationItem>

//                   {/* Page numbers */}
//                   {Array.from({ length: totalPages }, (_, i) => (
//                     <PaginationItem key={i}>
//                       <PaginationLink
//                         href="#"
//                         isActive={page === i + 1}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           if (!isRefreshing) setPage(i + 1);
//                         }}
//                       >
//                         {i + 1}
//                       </PaginationLink>
//                     </PaginationItem>
//                   ))}

//                   {/* Ellipsis if needed */}
//                   {totalPages > 5 && page < totalPages - 2 && (
//                     <PaginationItem>
//                       <PaginationEllipsis />
//                     </PaginationItem>
//                   )}

//                   {/* Next */}
//                   <PaginationItem>
//                     <PaginationNext
//                       href="#"
//                       onClick={(e) => {
//                         e.preventDefault();
//                         if (page < totalPages && !isRefreshing) setPage(page + 1);
//                       }}
//                       className={page === totalPages || isRefreshing ? "pointer-events-none opacity-50" : ""}
//                     />
//                   </PaginationItem>
//                 </PaginationContent>
//               </Pagination>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BannerSubscription;

import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetAllActiveBannerPaymentsQuery } from '@/redux/api/BannerPaymentApi';
import { useGetUserBySearchQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AdminBannerPlanManagement from './BannerPlanManagement';
import { Edit, X, RefreshCw, Search, IndianRupee } from 'lucide-react';
import showToast from '@/toast/showToast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const BannerSubscription = () => {

  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionMode, setActionMode] = useState(null);
  const limit = 5;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGetUserBySearchQuery(debouncedSearch, {
    skip: !debouncedSearch || debouncedSearch.length < 3,
  });

  useEffect(() => {
    if (searchResults?.users?.length > 0) {
      setSelectedSeller(searchResults.users[0]);
    } else {
      setSelectedSeller(null);
    }
  }, [searchResults]);

  const { data: activeBannerPayments, isLoading: isBannerPaymentsLoading, refetch: refetchBannerPayments } = useGetAllActiveBannerPaymentsQuery({ page, limit });

  const totalPages = activeBannerPayments?.pages || 1;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchBannerPayments();
      setSearchInput('');
      setDebouncedSearch('');
      setSelectedSeller(null);
    } catch (error) {
      showToast('Failed to refresh banner data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRandomBg = (name) => {
    const colors = ["#E63946", "#1D3557", "#457B9D", "#A8DADC", "#F4A261", "#2A9D8F", "#8D99AE"];
    const index = name?.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`flex-1 p-4 transition-all duration-300 `}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#0c1f4d]">Manage Banner Subscriptions</h2>
          <Button
            onClick={handleRefresh}
            className="bg-[#0c1f4d] hover:bg-[#0c1f4dd0] text-white"
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="mb-6">
          <Label htmlFor="searchInput">Search Seller by Email or Phone</Label>
          <div className="relative w-full max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="searchInput"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedSeller({ user: selectedSeller, bannerPayment: null });
                  setActionMode("purchase");
                }
              }}
              placeholder="Search by email or phone..."
              className="pl-9 pr-3 py-2 rounded-lg bg-gray-100"
              disabled={isRefreshing}
            />
          </div>

          {isSearchLoading && <p className="mt-2">Searching...</p>}
          {searchError && <p className="mt-2 text-red-600">Error: {searchError?.data?.message}</p>}

          {selectedSeller?.user && (
            <div className="p-4 mt-6 rounded-lg border bg-gray-50">
              <p className="font-medium">Selected Seller:</p>
              <p>Email: {selectedSeller.user.email}</p>
              <p>Phone: {selectedSeller.user.phone || 'N/A'}</p>
              {selectedSeller.bannerPayment && (
                <>
                  <p>Plan: {selectedSeller.bannerPayment.days} days</p>
                  <p>Amount: ₹{selectedSeller.bannerPayment.amount}</p>
                </>
              )}
            </div>
          )}
        </div>

        <AdminBannerPlanManagement
          user={user}
          selectedSeller={selectedSeller}
          refetchBannerPayments={refetchBannerPayments}
          actionMode={actionMode}
        />

               <div className="mt-8">
          <h3 className="text-2xl font-bold text-[#0c1f4d] mb-4">Active Banner Purchases</h3>
       {isBannerPaymentsLoading ? (
            <p>Loading banner purchases...</p>
          ) : activeBannerPayments?.data?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeBannerPayments.data.map((payment) => {

                  return (
                    <TableRow key={payment._id} className="hover:bg-gray-50">

                      {/* Name with Avatar */}
                      {/* Name with Avatar */}
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback
                            className="text-white font-bold"
                            style={{
                              backgroundColor: getRandomBg(payment?.user?.name),
                            }}
                          >
                            {payment.user?.name?.[0]?.toUpperCase() || "N"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{payment.user?.name || "N/A"}</span>
                      </TableCell>


                      {/* Email */}
                      <TableCell>{payment.user.email}</TableCell>

                      {/* Phone */}
                      <TableCell>{payment.user.phone || "N/A"}</TableCell>

                      {/* Days */}
                      <TableCell>{payment.days}</TableCell>

                      {/* Amount with Icon */}
                      <TableCell className="flex items-center gap-1 font-semibold text-green-600">
                        <IndianRupee className="w-4 h-4" />
                        {payment.amount}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge
                          variant={
                            payment.payment_status === "paid"
                              ? "success"
                              : payment.payment_status === "created"
                                ? "secondary"
                                : "destructive"
                          }
                          className="capitalize"
                        >
                          {payment.payment_status}
                        </Badge>
                      </TableCell>

                      {/* Created At */}
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>

                      {/* Actions */}
                      <TableCell className="flex justify-center gap-2">
                        {/* Upgrade Button */}
                        <Button
                          size="icon"
                          className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dd9] rounded-full p-2"
                          onClick={() => {
                            setSelectedSeller({ user: payment.user, bannerPayment: payment });
                            setActionMode("upgrade");
                          }}
                          disabled={isRefreshing}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Cancel Button */}
                        <Button
                          size="icon"
                          className="bg-red-500 text-white hover:bg-red-600 rounded-full p-2"
                          onClick={() => {
                            setSelectedSeller({ user: payment.user, bannerPayment: payment });
                            setActionMode("cancel");
                          }}
                          disabled={isRefreshing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p>No active banner purchases found.</p>
          )}
          {activeBannerPayments?.data?.length > 0 && (
            <div className="mt-4 float-end">
              <Pagination>
                <PaginationContent>
                  {/* Previous */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1 && !isRefreshing) setPage(page - 1);
                      }}
                      className={page === 1 || isRefreshing ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        isActive={page === i + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isRefreshing) setPage(i + 1);
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {/* Ellipsis if needed */}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages && !isRefreshing) setPage(page + 1);
                      }}
                      className={page === totalPages || isRefreshing ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerSubscription;


