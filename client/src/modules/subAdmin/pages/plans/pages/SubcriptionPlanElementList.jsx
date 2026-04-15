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
  useGetElementsQuery,
  useDeleteElementMutation,
} from "@/redux/api/SubscriptionPlanElementApi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import SubcriptionPlanElementForm from "../forms/SubscriptionPlanElementForm";
import DeleteDialog from "@/model/DeleteModel";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubscriptionPlanElementList = () => {
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
    toast.error("Failed to load user permissions");
  }

  const { data: plans = [], isLoading } = useGetElementsQuery();
  const [deletePlan] = useDeleteElementMutation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAdd = () => {
    if (!isAdmin && !canCreate) {
      toast.error("You do not have permission to create subscription plan elements");
      return;
    }
    setSelectedPlan(null);
    setOpen(true);
  };

  const handleEdit = (plan) => {
    if (!isAdmin && !canEdit) {
      toast.error("You do not have permission to edit subscription plan elements");
      return;
    }
    setSelectedPlan(plan);
    setOpen(true);
  };

  const handleDelete = (id) => {
    if (!isAdmin && !canDelete) {
      toast.error("You do not have permission to delete subscription plan elements");
      return;
    }
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deletePlan(deleteId).unwrap();
      toast.success("Subscription plan element deleted successfully.");
      setIsDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting subscription plan element:", error);
      toast.error(error.data?.message || "Failed to delete subscription plan element.");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Subscription Plans Element List</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={handleAdd}
                className="cursor-pointer"
                title="Add Plan Element"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Plan Element
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Plan Element</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead>Element Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : plans?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No subscription plan elements found
                </TableCell>
              </TableRow>
            ) : (
              plans?.data?.map((plan, index) => (
                <TableRow key={plan._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{plan.element_name || "-"}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <TooltipProvider>
                      <div className="flex space-x-2">
                        {/* Edit Button with Tooltip */}
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEdit(plan)}
                              disabled={!isAdmin && !canEdit}
                              className={`cursor-pointer ${!isAdmin && !canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={!isAdmin && !canEdit ? "You do not have permission to edit subscription plan elements" : "Edit Element"}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{!isAdmin && !canEdit ? "You do not have permission to edit subscription plan elements" : "Edit Element"}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete Button with Tooltip */}
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDelete(plan._id)}
                              disabled={!isAdmin && !canDelete}
                              className={`cursor-pointer ${!isAdmin && !canDelete ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={!isAdmin && !canDelete ? "You do not have permission to delete subscription plan elements" : "Delete Element"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{!isAdmin && !canDelete ? "You do not have permission to delete subscription plan elements" : "Delete Element"}</p>
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

      <SubcriptionPlanElementForm open={open} setOpen={setOpen} plan={selectedPlan} />
      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Subscription Plan Element?"
        description="This action will permanently remove the subscription plan element."
      />
    </div>
  );
};

export default SubscriptionPlanElementList;