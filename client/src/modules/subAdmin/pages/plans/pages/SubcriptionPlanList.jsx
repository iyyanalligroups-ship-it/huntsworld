import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  useGetPlansQuery,
  useDeletePlanMutation,
} from "@/redux/api/SubcriptionPlanApi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import SubscriptionPlanForm from "../forms/SubcriptionPlanFrom";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubscriptionPlanlist = () => {
  const { user } = React.useContext(AuthContext);
  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "/subAdmin/payments/subscriptions";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  // Default to true for create, edit, and delete, restrict only if explicitly absent
  const canCreate = pagePermissions ? pagePermissions.actions.includes("create") : true;
  const canEdit = pagePermissions ? pagePermissions.actions.includes("edit") : true;
  const canDelete = pagePermissions ? pagePermissions.actions.includes("delete") : true;
  const isAdmin = user?.user?.role?.role === "ADMIN";

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  const { data: plans = [], isLoading } = useGetPlansQuery();
  const [deletePlan] = useDeletePlanMutation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAdd = () => {
    if (!isAdmin && !canCreate) {
      showToast("You do not have permission to create subscription plans", "error");
      return;
    }
    setSelectedPlan(null);
    setOpen(true);
  };

  const handleEdit = (plan) => {
    if (!isAdmin && !canEdit) {
      showToast("You do not have permission to edit subscription plans", "error");
      return;
    }
    setSelectedPlan(plan);
    setOpen(true);
  };

  const handleDelete = (id) => {
    if (!isAdmin && !canDelete) {
      showToast("You do not have permission to delete subscription plans", "error");
      return;
    }
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePlan(deleteId).unwrap();
      showToast("Subscription plan deleted successfully.", "success");
      setIsDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      showToast(error.data?.message || "Failed to delete subscription plan.", "error");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Subscription Plans</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={handleAdd}
             
              
                title={ "Add Plan"}
              >
                <Plus className="w-4 h-4 mr-2 cursor-pointer" /> Add Plan
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Plan</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : plans?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No subscription plans found
                </TableCell>
              </TableRow>
            ) : (
              plans?.data?.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell>{plan.plan_name || "-"}</TableCell>
                  <TableCell>{plan.price ? `₹ ${plan.price - 1}` : "-"}</TableCell>
                  <TableCell>{plan.status || "-"}</TableCell>
                  <TableCell>{plan.description || "-"}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <TooltipProvider>
                      <div className="flex space-x-2">
                        {/* Edit Plan Button with Tooltip */}
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEdit(plan)}
                              disabled={!isAdmin && !canEdit}
                              className={`cursor-pointer ${!isAdmin && !canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={!isAdmin && !canEdit ? "You do not have permission to edit subscription plans" : "Edit Plan"}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{!isAdmin && !canEdit ? "You do not have permission to edit subscription plans" : "Edit Plan"}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete Plan Button with Tooltip */}
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDelete(plan._id)}
                              disabled={!isAdmin && !canDelete}
                              className={`cursor-pointer ${!isAdmin && !canDelete ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={!isAdmin && !canDelete ? "You do not have permission to delete subscription plans" : "Delete Plan"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{!isAdmin && !canDelete ? "You do not have permission to delete subscription plans" : "Delete Plan"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SubscriptionPlanForm open={open} setOpen={setOpen} plan={selectedPlan} />
      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Subscription Plan?"
        description="This action will permanently remove the subscription plan."
      />
    </div>
  );
};

export default SubscriptionPlanlist;