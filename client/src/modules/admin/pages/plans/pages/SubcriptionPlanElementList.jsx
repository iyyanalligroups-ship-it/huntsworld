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
import SubcriptionPlanElementForm from "../forms/SubscriptionPlanElementForm";
import DeleteDialog from "@/model/DeleteModel";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubscriptionPlanElementList = () => {
  const { data: plans = [], isLoading } = useGetElementsQuery();
  const [deletePlan] = useDeleteElementMutation();
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
        <h2 className="text-xl font-semibold">Subscription Plans Element List</h2>
        <Button
          onClick={() => {
            setSelectedPlan(null);
            setOpen(true);
          }}
             className="cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Plan Element
        </Button>
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
            {plans?.data?.map((plan, index) => (
              <TableRow key={plan._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{plan.element_name}</TableCell>

                <TableCell className="flex justify-end gap-2">
                  <TooltipProvider>
                    <div className="flex space-x-2">
                      {/* Edit Button with Tooltip */}
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="icon"
                            variant="outline"
                               className="cursor-pointer"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Element</p> {/* Tooltip Content */}
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete Button with Tooltip */}
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="icon"
                            variant="destructive"
                               className="cursor-pointer"
                            onClick={() => handleDelete(plan._id)} // Pass the plan ID to handle delete
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Element</p> {/* Tooltip Content */}
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

      <SubcriptionPlanElementForm open={open} setOpen={setOpen} plan={selectedPlan} />
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

export default SubscriptionPlanElementList;
