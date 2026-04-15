import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetTrustSealRequestsQuery, useUpdateTrustSealRequestStatusMutation } from '@/redux/api/TrustSealRequestApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import showToast from '@/toast/showToast';

const TrustSealRequestsPage = () => {
  const { requestId } = useParams(); // For single request view
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getDateRange = (filter) => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(now.setDate(now.getDate() - 1));
    startOfYesterday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case 'today':
        return { start: startOfToday, end: new Date() };
      case 'yesterday':
        return { start: startOfYesterday, end: startOfToday };
      case 'week':
        return { start: startOfWeek, end: new Date() };
      case 'month':
        return { start: startOfMonth, end: new Date() };
      default:
        return {};
    }
  };

  const { data, isLoading, refetch } = useGetTrustSealRequestsQuery({
    page,
    limit: 10,
    status: statusFilter,
    dateFilter: getDateRange(dateFilter),
    requestId, // For single request view
  });

  const [updateTrustSealRequestStatus] = useUpdateTrustSealRequestStatusMutation();

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
    <div className="p-6">
      <h2 className="text-3xl font-bold text-[#0c1f4d] mb-6">Trust Seal Requests</h2>
      <div className="mb-4 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data.map((request) => (
            <TableRow key={request._id}>
              <TableCell>{request.user_id?.name || 'Unknown'}</TableCell>
              <TableCell>₹{request.amount.toFixed(2)}</TableCell>
              <TableCell>{request.status}</TableCell>
              <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] mr-2"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsDialogOpen(true);
                  }}
                >
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between mt-4">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <Button disabled={data?.total <= page * data?.limit} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Trust Seal Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Merchant: {selectedRequest?.user_id?.name || 'Unknown'}</p>
            <p>Amount: ₹{selectedRequest?.amount.toFixed(2)}</p>
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
    </div>
  );
};

export default TrustSealRequestsPage;