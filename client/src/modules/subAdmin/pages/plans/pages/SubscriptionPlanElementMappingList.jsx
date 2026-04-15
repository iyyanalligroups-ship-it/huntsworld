
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
import { useGetMappingsQuery, useDeleteMappingMutation } from "@/redux/api/SubscriptionPlanElementMappingApi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import SubscriptionPlanElementMappingForm from "../forms/SubscriptionPlanElementMappingForm";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubscriptionPlanElementMappingList = () => {
  const { user } = React.useContext(AuthContext);
  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "/subAdmin/payments/subscriptions";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;
  const isAdmin = user?.user?.role?.role === "ADMIN";

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  const { data: plans = [], isLoading } = useGetMappingsQuery();
  const [deletePlan] = useDeleteMappingMutation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAll, setIsDeleteAll] = useState(false);

  const handleEdit = (plan) => {
    if (!isAdmin && !canEdit) {
      showToast("You do not have permission to edit subscription plan mappings", "error");
      return;
    }
    setSelectedPlan(plan);
    setOpen(true);
  };

  const handleDelete = (plan, elementId = null) => {
    if (!isAdmin && !canDelete) {
      showToast("You do not have permission to delete subscription plan mappings", "error");
      return;
    }
    if (elementId) {
      setDeleteData({
        subscription_plan_id: plan?.subscription_plan_id?._id,
        element_id: elementId,
      });
      setIsDeleteAll(false);
    } else {
      setDeleteData({
        subscription_plan_id: plan?.subscription_plan_id?._id,
        element_id: null,
      });
      setIsDeleteAll(true);
    }
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePlan(deleteData).unwrap();
      showToast(isDeleteAll ? "All elements deleted successfully." : "Element deleted successfully.", "success");
      setIsDialogOpen(false);
      setDeleteData(null);
      setIsDeleteAll(false);
    } catch (error) {
      console.error("Error deleting subscription plan mapping:", error);
      showToast(error.data?.message || "Failed to delete subscription plan mapping.", "error");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Subscription Plan Element Mappings</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={() => {
                  setSelectedPlan(null);
                  setOpen(true);
                }}
                className="cursor-pointer"
                title="Add Mapping"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Mapping
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Mapping</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead>Element Name</TableHead>
              <TableHead>Value</TableHead>
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
                  No subscription plan mappings found
                </TableCell>
              </TableRow>
            ) : (
              plans?.data?.map((plan, index) => (
                <TableRow key={plan.subscription_plan_id._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {plan.subscription_plan_id?.plan_name || "-"}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {plan.elements?.length ? (
                      plan.elements.map((el, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-indigo-500 rounded-full">
                            {el.element_name || "-"}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => handleDelete(plan, el.element_id)}
                                  disabled={!isAdmin && !canDelete}
                                  className={`cursor-pointer ${!isAdmin && !canDelete ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title={!isAdmin && !canDelete ? "You do not have permission to delete subscription plan mappings" : "Delete Single Element"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{!isAdmin && !canDelete ? "You do not have permission to delete subscription plan mappings" : "Delete Single Element"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {plan.elements?.length ? (
                      plan.elements.map((value, i) => (
                        <span
                          key={i}
                          className="inline-block mb-1 px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full"
                        >
                          {value.value || "-"}
                        </span>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <TooltipProvider>
                      <div className="flex space-x-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEdit(plan)}
                              disabled={!isAdmin && !canEdit}
                              className={`cursor-pointer ${!isAdmin && !canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={!isAdmin && !canEdit ? "You do not have permission to edit subscription plan mappings" : "Edit Plan"}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{!isAdmin && !canEdit ? "You do not have permission to edit subscription plan mappings" : "Edit Plan"}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDelete(plan)}
                              disabled={!isAdmin && !canDelete}
                              className={`cursor-pointer ${!isAdmin && !canDelete ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={!isAdmin && !canDelete ? "You do not have permission to delete subscription plan mappings" : "Delete All Elements"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{!isAdmin && !canDelete ? "You do not have permission to delete subscription plan mappings" : "Delete All Elements"}</p>
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

      <SubscriptionPlanElementMappingForm
        open={open}
        setOpen={setOpen}
        mapping={selectedPlan}
      />

      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title={isDeleteAll ? "Delete All Elements?" : "Delete Element?"}
        description={isDeleteAll ? "This action will permanently remove all elements in this plan." : "This action will permanently remove this plan-element mapping."}
      />
    </div>
  );
};

export default SubscriptionPlanElementMappingList;
