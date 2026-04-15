import { useContext, useState } from "react";
import { useGetPermissionRequestsQuery, useDeletePermissionRequestMutation } from "@/redux/api/PermissionRequestApi";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import DeleteDialog from "@/model/DeleteModel";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";


const PermissionRequestList = ({ setSelectedData, openModal }) => {
  const {user}=useContext(AuthContext);
  const adminId=user?.user?._id
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // Default filter
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId,setDeleteId]=useState(false);

  // Fetching permission requests based on filter
  const { data, isLoading } = useGetPermissionRequestsQuery({ page, filter ,adminId});
  const [deletePermissionRequest,{  isLoading: isDeleting }] = useDeletePermissionRequestMutation();

  const handleDelete = async (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete =async ()=>{
    try {
      await deletePermissionRequest(deleteId).unwrap();
      setIsDialogOpen(false);
      showToast("Deleted Successfully",'success');
    } catch (err) {
      setIsDialogOpen(false);
      console.error(err);
      showToast("Failed to delete",'error');
    }
  }

  const getBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';  // Green background for approved status
      case 'rejected':
        return 'bg-red-500';    // Red background for rejected status
      case 'pending':
        return 'bg-yellow-500'; // Yellow background for pending status
      default:
        return 'bg-gray-500';   // Default gray background if no match
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value); // Update the filter state
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="mt-6">
      {/* Filter Dropdown */}
      <div className="mb-4">
        <Label className="mb-2">Filter by Date</Label>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-50">
            <SelectValue placeholder="Select Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Permission Request Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Permission Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data?.map((item) => (
            <TableRow key={item?._id}>
              <TableCell>{item?.user_id?.name}</TableCell>
              <TableCell>{item?.permission_id?.name}</TableCell>
              <TableCell>
                <Badge className={getBadgeColor(item?.status)}>{item?.status}</Badge>
              </TableCell>

              <TableCell className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => { setSelectedData(item); openModal(); }}>
                  <Pencil size={16} />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => handleDelete(item._id)}>
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
          Prev
        </Button>
        <span>Page {page}</span>
        <Button variant="outline" disabled={!data?.hasMore} onClick={() => setPage((prev) => prev + 1)}>
          Next
        </Button>
      </div>
       <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Permission?"
                description="This action will permanently remove the coupon."
                loading={isDeleting}
              ></DeleteDialog>
    </div>
  );
};

export default PermissionRequestList;
