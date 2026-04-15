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
import SubcriptionPlanForm from "../forms/SubcriptionPlanFrom";
import DeleteDialog from "@/model/DeleteModel";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubscriptionPlanlist = () => {
  const { data: plans = [], isLoading } = useGetPlansQuery();
  const [deletePlan] = useDeletePlanMutation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };
  const confirmDelete = async () => {
    const response = await deletePlan(deleteId);
    if (response.error) {
      toast.error("Failed to delete subscription plan.");
      setIsDialogOpen(false);
    } else {
      toast.success("Subscription plan deleted successfully.");
      setIsDialogOpen(false);
    }

  };
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Subscription Plans</h2>
        <Button
          onClick={() => {
            setSelectedPlan(null);
            setOpen(true);
          }}
          className="cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2 cursor-pointer" /> Add Plan
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Auto-Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.data?.map((plan) => (
              <TableRow key={plan._id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-xs font-semibold">{plan.plan_code}</TableCell>
                <TableCell className="font-medium">{plan.plan_name}</TableCell>
                <TableCell className="capitalize text-xs">{plan.business_type || "merchant"}</TableCell>
                <TableCell>₹{plan.price}</TableCell>
                <TableCell>
                  {plan.razorpay_plan_id ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 border border-green-200">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                      Manual
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                    plan.status === 'Active' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {plan.status}
                  </span>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <TooltipProvider>
                    <div className="flex space-x-2">
                      {/* Edit Plan Button with Tooltip */}
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setOpen(true);
                            }}
                               className="cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Plan</p> {/* Tooltip Content for Edit Plan */}
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete Plan Button with Tooltip */}
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(plan._id)}
                               className="cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Plan</p> {/* Tooltip Content for Delete Plan */}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SubcriptionPlanForm open={open} setOpen={setOpen} plan={selectedPlan} />
      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete SubcriptionPlan?"
        description="This action will permanently remove the SubcriptionPlan."
      />
    </div>
  );
};

export default SubscriptionPlanlist;
