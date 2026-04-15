import React, { useState } from 'react';
import { useGetCouponsQuery, useDeleteCouponMutation } from '@/redux/api/CouponApi'; // Import the get and delete mutation hooks
import { Button } from "@/components/ui/button";
import { Trash2, Loader2,Pencil } from 'lucide-react';
import DeleteDialog from '@/model/DeleteModel';
import { toast } from "react-toastify";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming Skeleton component exists

const CouponsList = ({onEdit}) => {
  const { data: coupons, isLoading: isLoadingCoupons } = useGetCouponsQuery(); // Get coupons query hook
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation(); // Destructure isLoading from mutation hook
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteCoupon(deleteId).unwrap();
      if (response.success) {
        toast.success(response.message || "Coupon Deleted Successfully");
      } else {
        toast.error(response.message || "Failed to Delete Coupon");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong");
    } finally {
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {isLoadingCoupons ? (
        // Skeleton loading state while fetching coupons
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-md">
              <div className="w-3/4">
                <Skeleton className="h-4" />
              </div>
              <div className="w-16">
                <Skeleton className="h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        coupons?.data?.length === 0 ? (
          <div className="text-center text-muted-foreground">No Coupons Found</div>
        ) : (
          coupons?.data?.map((coupon) => (
            <div key={coupon._id} className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="font-semibold">{coupon.coupon_name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" className="cursor-pointer" onClick={() => onEdit(coupon)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="cursor-pointer" onClick={() => handleDelete(coupon._id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )
      )}

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Coupon?"
        description="This action will permanently remove the coupon."
        loading={isDeleting} // Pass the isLoading state to the dialog
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

export default CouponsList;
