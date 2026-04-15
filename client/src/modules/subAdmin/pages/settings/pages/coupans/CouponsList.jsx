import React, { useState } from 'react';
import { useGetCouponsQuery, useDeleteCouponMutation } from '@/redux/api/CouponApi';
import { useGetUserByIdQuery } from '@/redux/api/SubAdminAccessRequestApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Pencil } from 'lucide-react';
import DeleteDialog from '@/model/DeleteModel';
import showToast from '@/toast/showToast';
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CouponsList = ({ onEdit }) => {
  const { user } = React.useContext(AuthContext);
  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "/subAdmin/payments/coupons";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;
  const isAdmin = user?.user?.role?.role === "ADMIN";

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  const { data: coupons, isLoading: isLoadingCoupons } = useGetCouponsQuery();
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleEdit = (coupon) => {
    if (!isAdmin && !canEdit) {
      showToast("You do not have permission to edit coupons", "error");
      return;
    }
    onEdit(coupon);
  };

  const handleDelete = (id) => {
    if (!isAdmin && !canDelete) {
      showToast("You do not have permission to delete coupons", "error");
      return;
    }
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteCoupon(deleteId).unwrap();
      showToast(response.message || "Coupon deleted successfully", "success");
      setIsDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      showToast(error?.data?.message || "Failed to delete coupon", "error");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {isLoadingCoupons ? (
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
      ) : coupons?.data?.length === 0 ? (
        <div className="text-center text-muted-foreground">No coupons found</div>
      ) : (
        coupons?.data?.map((coupon) => (
          <div key={coupon._id} className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-semibold">{coupon.coupon_name || "-"}</p>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(coupon)}
                      disabled={!isAdmin && !canEdit}
                      className={`cursor-pointer ${!isAdmin && !canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={!isAdmin && !canEdit ? "You do not have permission to edit coupons" : "Edit Coupon"}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!isAdmin && !canEdit ? "You do not have permission to edit coupons" : "Edit Coupon"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(coupon._id)}
                      disabled={!isAdmin && !canDelete}
                      className={`cursor-pointer ${!isAdmin && !canDelete ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={!isAdmin && !canDelete ? "You do not have permission to delete coupons" : "Delete Coupon"}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!isAdmin && !canDelete ? "You do not have permission to delete coupons" : "Delete Coupon"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))
      )}

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Coupon?"
        description="This action will permanently remove the coupon."
        loading={isDeleting}
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