
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, IndianRupee, TrendingUp } from 'lucide-react';
import {
  useGetTrendingPointsWithProductByUserQuery,
  useCreateTrendingPointsMutation,
  useUpdateTrendingPointsMutation,
  useDeleteTrendingPointsMutation,
  useGetUserProductsQuery,
  useGetProductDetailsQuery,
} from '@/redux/api/UserTrendingPointSubscriptionApi';
import { toast } from 'react-toastify';

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

  const availablePoints = activeTrendingPointsPayment?.points || pendingTrendingPointsPayment?.points || 0;

  const { data: products, isLoading: isProductsLoading } = useGetUserProductsQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });

  const { data: productDetails, isLoading: isProductDetailsLoading } = useGetProductDetailsQuery(selectedProductId, {
    skip: !selectedProductId,
  });

  const { data, isLoading, error, refetch: refetchTrendingPoints } = useGetTrendingPointsWithProductByUserQuery(
    {
      userId: user?.user?._id,
      page,
      limit,
      search,
      filter,
    },
    { skip: !user?.user?._id }
  );
  console.log(data, 'treand');

  const [createTrendingPoints] = useCreateTrendingPointsMutation();
  const [updateTrendingPoints] = useUpdateTrendingPointsMutation();
  const [deleteTrendingPoints] = useDeleteTrendingPointsMutation();

  const handleProductChange = (value) => {
    setSelectedProductId(value);
    setPoints('');
  };

  const handlePointsChange = (e) => {
    const inputPoints = parseInt(e.target.value, 10);
    if (!isNaN(inputPoints) && inputPoints > 0 && inputPoints <= availablePoints) {
      setPoints(inputPoints);
    } else {
      setPoints('');
      toast.error(`Points must be between 1 and ${availablePoints}`);
    }
  };

  const handleAddSubmit = async () => {
    try {
      if (!selectedProductId) throw new Error('Please select a product');
      if (!points) throw new Error('Please specify the number of points');
      if (!user?.user?._id) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!activeTrendingPointsPayment && !pendingTrendingPointsPayment) throw new Error('No active or pending trending points payment');

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
      setPoints('');
      setSelectedProductId('');
      refetchTrendingPoints();
      refetch();
    } catch (error) {
      console.error('Add Trending Points Error:', {
        message: error.message,
        status: error.status,
        data: error.data,
      });
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
      if (!user?.user?._id) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!activeTrendingPointsPayment && !pendingTrendingPointsPayment) throw new Error('No active or pending trending points payment');

      const trendingPointsData = {
        trending_points_id: selectedTrendingPointsId,
        user_id: user.user._id,
        product_id: data.data.find((tp) => tp._id === selectedTrendingPointsId)?.product_id,
        trending_points: points,
        subscription_id: subscriptionId,
        trending_points_payment_id: pendingTrendingPointsPayment?._id || activeTrendingPointsPayment._id,
      };

      await updateTrendingPoints(trendingPointsData).unwrap();
      toast.success('Trending points updated successfully');
      setIsUpdateDialogOpen(false);
      setPoints('');
      setSelectedTrendingPointsId(null);
      refetchTrendingPoints();
      refetch();
    } catch (error) {
      console.error('Update Trending Points Error:', {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to update trending points: ${error.data?.message || error.message}`);
    }
  };

  const handleDeleteTrendingPoints = async () => {
    try {
      if (!selectedTrendingPointsId) throw new Error('No trending points selected for deletion');
      await deleteTrendingPoints({ trending_points_id: selectedTrendingPointsId }).unwrap();
      toast.success('Trending points deleted successfully');
      setIsDeleteConfirmOpen(false);
      setSelectedTrendingPointsId(null);
      refetchTrendingPoints();
      refetch();
    } catch (error) {
      console.error('Delete Trending Points Error:', {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to delete trending points: ${error.data?.message || error.message}`);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 on search
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1); // Reset to page 1 on filter change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  useEffect(() => {
    if (!isAddDialogOpen) {
      setSelectedProductId('');
      setPoints('');
    }
  }, [isAddDialogOpen]);

  return (
    <Card className="border-[#0c1f4d]  rounded-xl shadow-md mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#0c1f4d]">Trending Points Product Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(activeTrendingPointsPayment || pendingTrendingPointsPayment) && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Available Points: {availablePoints}</p>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#183e96] cursor-pointer text-white mt-2"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={isProductsLoading || availablePoints <= 0}
            >  <IndianRupee className="w-4 h-4" />
              Add Points to Product
            </Button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by product name"
            value={search}
            onChange={handleSearchChange}
            className="w-full sm:w-1/2"
          />
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-1/4">
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
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">Error: {error.data?.message || 'Failed to load data'}</p>}
        {data?.data?.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#0c1f4d]">Current Trending Points</h3>
            <Table>
              <TableHeader>
                <TableRow className="group bg-[#0c1f4d] hover:bg-[#183e96]">
                  <TableHead className="text-white">Product Name</TableHead>
                  <TableHead className="text-white">Points</TableHead>
                  <TableHead className="text-white">Date</TableHead>
              
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((tp) => (
                  <TableRow key={tp._id}>
                    <TableCell>{tp.product?.product_name || 'N/A'}</TableCell>
                    <TableCell>{tp.trending_points}</TableCell>
                    <TableCell>{tp.last_updated_date || 'N/A'}</TableCell>
                    <TableCell className="flex gap-2">
                      {/* <Button
                        className="bg-[#0c1f4d] text-white cursor-pointer hover:bg-[#183e96]"
                        onClick={() => handleUpdateTrendingPoints(tp)}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Update
                      </Button> */}
                      {/* <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => {
                          setSelectedTrendingPointsId(tp._id);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        Delete
                      </Button> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex gap-4 justify-end items-center mt-4">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="bg-[#0c1f4d] hover:bg-[#08205acc] text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm font-medium">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="bg-[#0c1f4d] hover:bg-[#183e96] text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600">No trending points found.</p>
        )}
      </CardContent>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#0c1f4d]">Add Trending Points to Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={handleProductChange} value={selectedProductId} disabled={isProductsLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.product_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProductId && !isProductDetailsLoading && productDetails && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Product: {productDetails.product_name}</p>
                <p className="text-sm text-gray-600">Available Points: {availablePoints}</p>
              </div>
            )}
            <Input
              type="number"
              placeholder="Number of Points"
              value={points}
              onChange={handlePointsChange}
              className="w-full"
              min="1"
              max={availablePoints}
              disabled={!selectedProductId}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className={`bg-[#0c1f4d] hover:bg-[#0c1f4ddb] text-white ${!selectedProductId || !points || isProductDetailsLoading
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
                }`}
              disabled={!selectedProductId || !points || isProductDetailsLoading}
              onClick={handleAddSubmit}
            >
              Add Points
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#0c1f4d]" >Update Trending Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Number of Points"
              value={points}
              onChange={handlePointsChange}
              className="w-full"
              min="1"
              max={availablePoints}
            />
            <p className="text-sm text-gray-600">Available Points: {availablePoints}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className={`bg-[#0c1f4d]  hover:bg-[#0c1f4ddb] text-white ${points ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              disabled={!points}
              onClick={handleUpdateSubmit}
            >
              Update Points
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete these trending points? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteTrendingPoints}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TrendingPointsProductManagement;
