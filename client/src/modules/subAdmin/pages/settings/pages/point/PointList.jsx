import React, { useState } from 'react';
import { useGetPointsQuery, useDeletePointMutation } from '@/redux/api/PointApi';
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DeleteDialog from '@/model/DeleteModel';
import { Skeleton } from "@/components/ui/skeleton";
import showToast from '@/toast/showToast';

const PointList = ({ onEdit }) => {
  const { data: points, isLoading } = useGetPointsQuery();
  const [deletePoint, { isLoading: isDeleting }] = useDeletePointMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      const response = await deletePoint(deleteId).unwrap();
      if (response.success) {
        showToast(response.message || "Point Deleted Successfully",'success');
      } else {
        showToast(response.message || "Failed to Delete Point",'error');
      }
    } catch (error) {
      showToast(error?.data?.message || "Something went wrong",'error');
    } finally {
      setIsDialogOpen(false);
    }
  };

  if (isLoading) {
    // Skeleton Loader while fetching points
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((_, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {points?.data?.length === 0 ? (
        <div className="text-center text-muted-foreground">No Points Found</div>
      ) : (
        points?.data?.map((point) => (
          <div key={point._id} className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-semibold">{point.point_name}</p>
              <p className="text-sm text-muted-foreground">{point.point_count} points</p>
              <Badge>₹ {point.point_amount}</Badge> {/* <-- Added Amount */}
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="cursor-pointer" onClick={() => onEdit(point)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="cursor-pointer" onClick={() => handleDelete(point._id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Treanding Point?"
        description="This action will permanently remove the point."
        loading={isDeleting} // Pass loading state
      >
        {isDeleting && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </DeleteDialog>
    </div>
  );
};

export default PointList;
