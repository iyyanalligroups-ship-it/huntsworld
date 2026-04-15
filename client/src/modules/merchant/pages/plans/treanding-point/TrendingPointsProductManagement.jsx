import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, IndianRupee, Loader2, ChevronsUpDown, Check, Search } from 'lucide-react';
import {
  useGetTrendingPointsWithProductByUserQuery,
  useCreateTrendingPointsMutation,
  useUpdateTrendingPointsMutation,
  useDeleteTrendingPointsMutation,
  useGetUserProductsQuery,
  useGetProductDetailsQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import { toast } from 'react-toastify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRODUCTS_PER_PAGE = 8;

const TrendingPointsProductManagement = ({ user, subscriptionId, activeTrendingPointsPayment, pendingTrendingPointsPayment, refetch }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTrendingPointsId, setSelectedTrendingPointsId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // --- Custom Dropdown States ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef(null);

  // Product pagination states for Add Dialog
  const [productPage, setProductPage] = useState(1);
  const [accumulatedProducts, setAccumulatedProducts] = useState([]);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  const shouldFetchProducts = Boolean(user?.user?._id && isAddDialogOpen);

  const {
    data: currentPageData,
    isLoading: isProductsLoading,
    isFetching: isFetchingProducts,
  } = useGetUserProductsQuery(
    { userId: user?.user?._id, page: productPage, limit: PRODUCTS_PER_PAGE },
    { skip: !shouldFetchProducts }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentPageData?.products) {
      setAccumulatedProducts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const newUnique = currentPageData.products.filter((p) => !seen.has(p._id));
        return [...prev, ...newUnique];
      });

      setHasMoreProducts(currentPageData.hasMore ?? false);
    }
  }, [currentPageData]);

  // Reset product list when add dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setAccumulatedProducts([]);
      setProductPage(1);
      setHasMoreProducts(true);
      setSelectedProductId('');
      setPoints('');
      setDropdownSearch('');
      setIsDropdownOpen(false);
    }
  }, [isAddDialogOpen]);

  const availablePoints = activeTrendingPointsPayment?.points || pendingTrendingPointsPayment?.points || 0;

  const { data: productDetails, isLoading: isProductDetailsLoading } = useGetProductDetailsQuery(selectedProductId, {
    skip: !selectedProductId,
  });

  const {
    data: queryResponse,
    isLoading,
    error,
    refetch: refetchTrendingPoints,
  } = useGetTrendingPointsWithProductByUserQuery(
    {
      userId: user?.user?._id,
      page,
      limit,
      search,
      filter,
    },
    { skip: !user?.user?._id }
  );

  const trendingItems = queryResponse?.data ?? [];
  const totalItems = queryResponse?.total ?? 0;
  const serverPage = queryResponse?.page ?? page;
  const serverLimit = queryResponse?.limit ?? limit;
  const totalPages = serverLimit > 0 ? Math.ceil(totalItems / serverLimit) : 1;

  const [createTrendingPoints] = useCreateTrendingPointsMutation();
  const [updateTrendingPoints] = useUpdateTrendingPointsMutation();
  const [deleteTrendingPoints] = useDeleteTrendingPointsMutation();

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    setPoints('');
    setIsDropdownOpen(false);
    setDropdownSearch('');
  };

  const handlePointsChange = (e) => {
    const inputPoints = parseInt(e.target.value, 10);
    if (!isNaN(inputPoints) && inputPoints > 0 && inputPoints <= availablePoints) {
      setPoints(inputPoints);
    } else {
      setPoints('');
      if (inputPoints !== 0 && inputPoints !== '') {
        toast.error(`Points must be between 1 and ${availablePoints}`);
      }
    }
  };

  const handleAddSubmit = async () => {
    try {
      if (!selectedProductId) throw new Error('Please select a product');
      if (!points) throw new Error('Please specify the number of points');
      if (!user?.user?._id) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');

      const trendingPointsData = {
        user_id: user.user._id,
        product_id: selectedProductId,
        trending_points: points,
        subscription_id: subscriptionId,
        trending_points_payment_id: pendingTrendingPointsPayment?._id || activeTrendingPointsPayment._id,
      };

      await createTrendingPoints(trendingPointsData).unwrap();
      toast.success('Trending points added successfully');
      setIsAddDialogOpen(false);
      refetchTrendingPoints();
      refetch();
    } catch (error) {
      toast.error(`Failed to add trending points: ${error.data?.message || error.message}`);
    }
  };

  const handleUpdateTrendingPoints = (trendingPoint) => {
    setSelectedTrendingPointsId(trendingPoint._id);
    setPoints(trendingPoint.trending_points);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      if (!points) throw new Error('Please specify the number of points');
      const trendingPoint = trendingItems.find((tp) => tp._id === selectedTrendingPointsId);

      const trendingPointsData = {
        trending_points_id: selectedTrendingPointsId,
        user_id: user.user._id,
        product_id: trendingPoint.product_id,
        trending_points: points,
        subscription_id: subscriptionId,
        trending_points_payment_id: pendingTrendingPointsPayment?._id || activeTrendingPointsPayment._id,
      };

      await updateTrendingPoints(trendingPointsData).unwrap();
      toast.success('Trending points updated successfully');
      setIsUpdateDialogOpen(false);
      refetchTrendingPoints();
      refetch();
    } catch (error) {
      toast.error(`Failed to update trending points: ${error.data?.message || error.message}`);
    }
  };

  const handleDeleteTrendingPoints = async () => {
    try {
      await deleteTrendingPoints({ trending_points_id: selectedTrendingPointsId }).unwrap();
      toast.success('Trending points deleted successfully');
      setIsDeleteConfirmOpen(false);
      refetchTrendingPoints();
      refetch();
    } catch (error) {
      toast.error(`Failed to delete trending points: ${error.data?.message || error.message}`);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Local Filter for the Dropdown Search
  const filteredProducts = accumulatedProducts.filter((p) =>
    p.product_name.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <Card className="border-[#0c1f4d] rounded-xl shadow-md mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#0c1f4d]">Trending Points Product Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(activeTrendingPointsPayment || pendingTrendingPointsPayment) && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Available Points: {availablePoints}</p>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#183e96] text-white mt-2"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={isProductsLoading || availablePoints <= 0}
            >
              <IndianRupee className="w-4 h-4 mr-1" />
              Add Points to Product
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-1/2 border-2 border-slate-300"
          />
          <Select value={filter} onValueChange={(val) => { setFilter(val); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-1/4 border-2 border-slate-300">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isLoading && !error && (
          <>
            {trendingItems.length > 0 ? (
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0c1f4d] hover:bg-[#183e96]">
                      <TableHead className="text-white">Product Name</TableHead>
                      <TableHead className="text-white">Points</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trendingItems.map((tp) => (
                      <TableRow key={tp._id}>
                        <TableCell>{tp.product?.product_name || 'N/A'}</TableCell>
                        <TableCell>{tp.trending_points}</TableCell>
                        <TableCell>
                          {tp.last_updated_date || (tp.updatedAt ? new Date(tp.updatedAt).toLocaleDateString('en-IN') : '—')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-end gap-4 mt-6">
                  <Button variant="outline" size="icon" disabled={serverPage <= 1} onClick={() => handlePageChange(serverPage - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">Page {serverPage} of {totalPages}</span>
                  <Button variant="outline" size="icon" disabled={serverPage >= totalPages} onClick={() => handlePageChange(serverPage + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No trending points found.</div>
            )}
          </>
        )}
      </CardContent>

      {/* Add Dialog – Custom Searchable Dropdown Implementation */}
 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
  <DialogContent className="bg-white border border-gray-300 rounded-lg shadow-xl overflow-visible">
    <DialogHeader className="pb-4 border-b">
      <DialogTitle className="text-[#0c1f4d] text-xl font-semibold">
        Add Trending Points
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-6 py-4">
      <div className="space-y-2 relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700">
          Select Product
        </label>

        {/* 🔥 FIXED BUTTON */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-[#0c1f4d] outline-none"
        >
          <span className="min-w-0 flex-1 text-left text-gray-900 font-normal mr-2 break-all">
            {selectedProductId
              ? accumulatedProducts.find(p => p._id === selectedProductId)?.product_name
              : "-- Search or select product --"}
          </span>

          <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
        </button>

        {/* 🔥 DROPDOWN */}
        {isDropdownOpen && (
          <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-md shadow-2xl overflow-hidden">

            {/* Search */}
            <div className="flex items-center border-b px-3 bg-gray-50">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input
                autoFocus
                placeholder="Type to filter..."
                className="w-full py-3 bg-transparent text-sm outline-none"
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <ul className="max-h-[220px] overflow-y-auto py-1">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <li
                    key={product._id}
                    onClick={() => handleProductChange(product._id)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${
                      selectedProductId === product._id
                        ? "bg-blue-50 text-[#0c1f4d] font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="min-w-0 flex-1 break-all">
                      {product.product_name}
                    </span>

                    {selectedProductId === product._id && (
                      <Check className="h-4 w-4 text-[#0c1f4d] shrink-0 ml-2" />
                    )}
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-sm text-gray-500">
                  No products found.
                </li>
              )}

              {hasMoreProducts && (
                <li className="border-t p-2 bg-white sticky bottom-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductPage(prev => prev + 1);
                    }}
                    disabled={isFetchingProducts}
                    className="w-full text-xs font-bold text-[#0c1f4d] py-2 flex items-center justify-center gap-2"
                  >
                    {isFetchingProducts ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Load more products"
                    )}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* 🔥 ACTIVE PRODUCT CARD FIXED */}
      {selectedProductId && productDetails && (
        <div className="bg-[#f8fafc] border border-blue-100 p-4 rounded-lg flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Active Product
              </p>

              <p className="text-sm font-semibold text-[#0c1f4d] break-all">
                {productDetails.product_name}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Points
              </p>
              <p className="text-sm font-bold text-green-600">
                {availablePoints}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Points Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Number of Points
        </label>

        <Input
          type="number"
          placeholder="e.g. 50"
          value={points}
          onChange={handlePointsChange}
          className="w-full px-4 py-6 border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d]"
          disabled={!selectedProductId}
        />
      </div>
    </div>

    <DialogFooter className="pt-4 border-t flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setIsAddDialogOpen(false)}
        className="px-6"
      >
        Cancel
      </Button>

      <Button
        className="bg-[#0c1f4d] hover:bg-[#1e3a8a] text-white px-8"
        disabled={!selectedProductId || !points || isProductDetailsLoading}
        onClick={handleAddSubmit}
      >
        Add Points
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border border-gray-300 rounded-lg shadow-xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-[#0c1f4d] text-xl font-semibold">Update Trending Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Number of Points</label>
              <Input
                type="number"
                value={points}
                onChange={handlePointsChange}
                placeholder="e.g. 50"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-md focus:ring-2 focus:ring-[#0c1f4d]"
                max={availablePoints}
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available Points:</span>
                <span className="font-medium text-gray-900">{availablePoints}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#0c1f4d] hover:bg-[#183e96] text-white px-6" onClick={handleUpdateSubmit} disabled={!points}>
              Update Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete these points? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteTrendingPoints}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TrendingPointsProductManagement;
