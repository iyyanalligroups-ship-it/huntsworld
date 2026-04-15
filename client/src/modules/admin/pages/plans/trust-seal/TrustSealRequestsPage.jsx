import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetTrustSealRequestsQuery, useUpdateTrustSealRequestStatusMutation } from '@/redux/api/TrustSealRequestApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import showToast from '@/toast/showToast';
import { useSidebar } from "../../../hooks/useSidebar";
import { Eye } from 'lucide-react';

const TrustSealRequestsPage = () => {
  const { requestId } = useParams();
  const [page, setPage] = useState(1);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const getDateRange = (option) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (option) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start.setDate(diffToMonday);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return null;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const rawDateFilter = dateFilter !== "all" ? getDateRange(dateFilter) : undefined;

  const { data, isLoading, isError, error, refetch } = useGetTrustSealRequestsQuery({
    page,
    limit: 10,
    status: statusFilter,
    dateFilter: rawDateFilter,
    requestId,
  });

  const [updateTrustSealRequestStatus] = useUpdateTrustSealRequestStatusMutation();

  useEffect(() => {
    if (isError) {
      console.error('🔴 [TrustSealRequests] Error fetching requests:', error);
      showToast('Failed to load trust seal requests', 'error');
    }
    if (requestId && data?.data) {
      const request = data.data.find((r) => r._id === requestId);
      if (request) {
        setSelectedRequest(request);
        setIsDialogOpen(true);
      }
    }
  }, [requestId, data, isError, error]);

  const handleStatusUpdate = async (status) => {
    try {
      await updateTrustSealRequestStatus({
        request_id: selectedRequest._id,
        status,
        notes,
      }).unwrap();
      showToast(`Trust seal request ${status}`, 'success');
      setIsDialogOpen(false);
      setNotes('');
      refetch();
    } catch (error) {
      console.error('🔴 [TrustSealRequests] Error updating status:', error);
      showToast(`Failed to update trust seal request: ${error.message}`, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'}`}
    >
      <h2 className="text-3xl font-bold text-[#0c1f4d] mb-6">Trust Seal Requests</h2>
      <div className="mb-4 flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
   <Table className="min-w-full border border-gray-200 rounded-lg shadow-sm">
  <TableHeader>
    <TableRow className="bg-gray-50">
      <TableHead className="font-semibold text-[#0c1f4d] px-4 py-3">Merchant</TableHead>
      <TableHead className="font-semibold text-[#0c1f4d] px-4 py-3">Amount</TableHead>
      <TableHead className="font-semibold text-[#0c1f4d] px-4 py-3">Status</TableHead>
      <TableHead className="font-semibold text-[#0c1f4d] px-4 py-3">Created At</TableHead>
      <TableHead className="font-semibold text-[#0c1f4d] px-4 py-3">Picked By</TableHead>
      <TableHead className="font-semibold text-[#0c1f4d] px-4 py-3">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data?.data?.length > 0 ? (
      data.data.map((request) => (
        <TableRow
          key={request._id}
          className={`border-b hover:bg-gray-100 transition-colors ${request._id === requestId ? 'bg-yellow-100' : ''}`}
        >
          <TableCell className="px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]">
            {request.user_id?.name || 'Unknown'}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-700">₹{request.amount.toFixed(2)}</TableCell>
          <TableCell className="px-4 py-3">
            <span
              className={`
                inline-block px-3 py-1 rounded-full text-xs font-semibold
                ${request.status === 'verified' ? 'bg-green-100 text-green-800' : ''}
                ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${request.status === 'student_verified' ? 'bg-blue-100 text-blue-800' : ''}
              `}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
            </span>
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-700">
            {new Date(request.created_at).toLocaleDateString()}
          </TableCell>
          <TableCell className="px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]">
            {request.picked_by?.name || 'N/A'}
          </TableCell>
          <TableCell className="px-4 py-3">
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] mr-2 flex items-center gap-2 text-sm"
              onClick={() => {
                setSelectedRequest(request);
                setIsDialogOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
              Review
            </Button>
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={6} className="text-center text-gray-500 py-4">
          No trust seal requests found
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
      <div className="flex justify-between mt-4">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <Button
          disabled={data?.total <= page * data?.limit}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Trust Seal Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p><strong>Merchant:</strong> {selectedRequest?.user_id?.name || 'Unknown'}</p>
            <p><strong>Amount:</strong> ₹{selectedRequest?.amount.toFixed(2)}</p>
            <p><strong>Status:</strong> {selectedRequest?.status}</p>
            <p><strong>Picked By:</strong> {selectedRequest?.picked_by_name || 'N/A'}</p>
            <p><strong>Created At:</strong> {selectedRequest?.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : 'N/A'}</p>
            {selectedRequest?.images?.length > 0 && (
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc]"
                onClick={() => setIsImageModalOpen(true)}
              >
                View Images
              </Button>
            )}
            <Input
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleStatusUpdate('verified')}
            >
              Verify
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleStatusUpdate('rejected')}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Trust Seal Images</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 h-[400px] w-full overflow-x-auto">
            {selectedRequest?.images?.map((image, index) => (
              <div
                key={image._id}
                className="relative group flex-shrink-0 transition-all w-56 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full"
              >
                <img
                  className="h-full w-full object-cover object-center"
                  src={image.url}
                  alt={`Trust seal image ${index + 1}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrustSealRequestsPage;