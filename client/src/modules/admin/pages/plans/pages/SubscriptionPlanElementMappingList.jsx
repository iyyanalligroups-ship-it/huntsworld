// import React, { useState } from "react";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Pencil, Trash2, Plus } from "lucide-react";
// import {
//   useGetMappingsQuery,
//   useDeleteMappingMutation,
// } from "@/redux/api/SubscriptionPlanElementMappingApi";
// import SubcriptionPlanElementMappingForm from "../forms/SubscriptionPlanElementMappingForm";
// import DeleteDialog from "@/model/DeleteModel";
// import { toast } from "react-toastify";

// const SubscriptionPlanElementMappingList = () => {
//   const { data: plans = [], isLoading } = useGetMappingsQuery();
//   const [deletePlan] = useDeleteMappingMutation();
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [open, setOpen] = useState(false);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   const handleDelete = (id) => {
//     setDeleteId(id);
//     setIsDialogOpen(true);
//   };

//   const confirmDelete = async () => {
//     const response = await deletePlan(deleteId);
//     if (response.error) {
//       toast.error("Failed to delete plan-element mapping.");
//     } else {
//       toast.success("Mapping deleted successfully.");
//     }
//     setIsDialogOpen(false);
//   };


//   return (
//     <div className="p-4">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold">Subscription Plan Element Mappings</h2>
//         <Button
//           onClick={() => {
//             setSelectedPlan(null);
//             setOpen(true);
//           }}
//         >
//           <Plus className="w-4 h-4 mr-2" /> Add Mapping
//         </Button>
//       </div>

//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>S.No</TableHead>
//               <TableHead>Plan Name</TableHead>
//               <TableHead>Element Name</TableHead>
//               <TableHead>Value</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {plans?.data?.map((plan, index) => (
//               <TableRow key={plan._id}>
//                 <TableCell>{index + 1}</TableCell>
//                 <TableCell>{plan.subscription_plan_id?.plan_name || "-"}</TableCell>
//                 <TableCell>{plan.element_id?.element_name || "-"}</TableCell>
//                 <TableCell>{plan.value || "-"}</TableCell>
//                 <TableCell className="flex justify-end gap-2">
//                   <Button
//                     size="icon"
//                     variant="outline"
//                     onClick={() => {
//                       setSelectedPlan(plan);
//                       setOpen(true);
//                     }}

//                   >
//                     <Pencil className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     size="icon"
//                     variant="destructive"
//                     onClick={() => handleDelete(plan._id)}
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>

//       <SubcriptionPlanElementMappingForm
//         open={open}
//         setOpen={setOpen}
//         mapping={selectedPlan}
//       />

//       <DeleteDialog
//         open={isDialogOpen}
//         onClose={() => setIsDialogOpen(false)}
//         onConfirm={confirmDelete}
//         title="Delete Mapping?"
//         description="This action will permanently remove this plan-element mapping."
//       />
//     </div>
//   );
// };

// export default SubscriptionPlanElementMappingList;


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
import SubcriptionPlanElementMappingForm from "../forms/SubscriptionPlanElementMappingForm";
import DeleteDialog from "@/model/DeleteModel";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";  // Correct imports


const SubscriptionPlanElementMappingList = () => {
  const { data: plans = [], isLoading } = useGetMappingsQuery(); // Fetching plans
  const [deletePlan] = useDeleteMappingMutation(); // Hook for delete
  const [selectedPlan, setSelectedPlan] = useState(null); // State for selected plan
  const [deleteData, setDeleteData] = useState(null); // To store subscription_plan_id and element_id for delete
  const [open, setOpen] = useState(false); // State for modal visibility
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for delete confirmation dialog visibility
  const [isDeleteAll, setIsDeleteAll] = useState(false); // State for total plan deletion

  // Handle Delete button click
  const handleDelete = (plan, elementId = null) => {
    if (elementId) {
      setDeleteData({
        subscription_plan_id: plan?.subscription_plan_id?._id,
        element_id: elementId,
      });
      setIsDeleteAll(false); // Only delete a single element
    } else {
      setDeleteData({
        subscription_plan_id: plan?.subscription_plan_id?._id,
        element_id: null,
      });
      setIsDeleteAll(true); // Deleting all elements in the plan
    }
    setIsDialogOpen(true); // Open the delete confirmation dialog
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (deleteData) {
      const response = await deletePlan(deleteData); // Call the delete mutation with necessary data
      if (response.error) {
        toast.error("Failed to delete plan-element mapping."); // Show error toast
      } else {
        toast.success(isDeleteAll ? "All elements deleted successfully." : "Element deleted successfully."); // Show success toast
      }
    }
    setIsDialogOpen(false); // Close the delete confirmation dialog
  };

  // Loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Subscription Plan Element Mappings</h2>
        <Button
          onClick={() => {
            setSelectedPlan(null);
            setOpen(true);
          }}
             className="cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Mapping
        </Button>
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
            {plans?.data?.map((plan, index) => (
              <TableRow key={plan.subscription_plan_id._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium text-gray-900">
                  {plan.subscription_plan_id?.plan_name}
                </TableCell>

                <TableCell className="space-x-2">
                  {plan.elements.map((el, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      {/* Display the element name and its value */}
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-indigo-500 rounded-full">
                        {el.element_name}
                      </span>

                      {/* Delete button for each element */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon"
                              variant="destructive"
                                 className="cursor-pointer"
                              onClick={() => handleDelete(plan, el.element_id)} // Pass the specific element_id for deletion
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Single Element</p> {/* Tooltip Content */}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </TableCell>

                <TableCell className="space-x-2">
                  {plan?.elements?.map((value, i) => (
                    <span
                      key={i}
                      className="inline-block mb-1 px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full"
                    >
                      {value.value}
                    </span>
                  ))}
                </TableCell>

                <TableCell className="flex justify-end gap-2">
                  <TooltipProvider>
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
                        <p>Edit Plan</p> {/* Tooltip Content */}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          size="icon"
                          variant="destructive"
                             className="cursor-pointer"
                          onClick={() => handleDelete(plan)} // Handle delete all for the plan
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete All Elements</p> {/* Tooltip Content */}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SubcriptionPlanElementMappingForm
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
