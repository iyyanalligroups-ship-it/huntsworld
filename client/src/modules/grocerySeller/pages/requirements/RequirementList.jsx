import React, { useContext, useState } from "react";
import {
  useGetGrocerySellerRequirementsQuery,
  useDeleteGrocerySellerRequirementMutation,
} from "@/redux/api/GrocerySellerRequirementApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Import, Pencil, Trash2,AlertCircle,CheckCircle2,Info } from "lucide-react";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import Loader from "@/loader/Loader";

// --- SOP Component for List Management ---
export const ManagementSOP = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
      <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
        <Info className="w-5 h-5 text-[#0c1f4d]" />
        <h3 className="font-bold text-[#0c1f4d] text-sm">Managing Posts</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Tip 1 */}
        <div className="flex gap-3 items-start">
          <div className="mt-0.5 min-w-[16px]">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">Update Availability</h4>
            <p className="text-xs text-gray-500 mt-1">
              If your stock quantity changes, click the <span className="inline-block bg-blue-50 text-blue-600 p-0.5 rounded"><Pencil className="w-3 h-3 inline"/></span> icon to update the count immediately.
            </p>
          </div>
        </div>

        {/* Tip 2 */}
        <div className="flex gap-3 items-start">
          <div className="mt-0.5 min-w-[16px]">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">Sold Out?</h4>
            <p className="text-xs text-gray-500 mt-1">
              Once a transaction is complete, please delete the post using the <span className="inline-block bg-red-50 text-red-600 p-0.5 rounded"><Trash2 className="w-3 h-3 inline"/></span> icon to stop receiving calls.
            </p>
          </div>
        </div>

        {/* Tip 3 */}
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2 items-start mt-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-snug">
            <strong>Note:</strong> Posts older than 30 days may be automatically archived to ensure freshness.
          </p>
        </div>
      </div>
    </div>
  );
};
const GrocerySellerRequirementList = ({ onEdit }) => {
  const { user } = useContext(AuthContext);

  const { data, isLoading, refetch } = useGetGrocerySellerRequirementsQuery({
    user_id: user?.user?._id,
  });
  const [deletePost] = useDeleteGrocerySellerRequirementMutation();

  const [selectedId, setSelectedId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deletePost(selectedId).unwrap();
      refetch();
      if (response.success) {
        showToast(response.message || "Requirement Deleted Successfully", "success");
      } else {
        showToast(response.message || "Failed to Delete", "error");
      }
      setIsDialogOpen(false);
    } catch (error) {
      showToast(error.message || "Something went wrong", "error");
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[40vh] w-full relative">
        <Loader contained={true} label="Fetching your posts..." />
      </div>
    );
  }




  if (!data?.data || data.data.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl">
        <p className="text-gray-600">No requirements posted yet.</p>
        <p className="text-sm text-gray-500 mt-2">Post your first Buy or Sell requirement!</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {isDeleting && <Loader label="Deleting post..." />}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-[#0c1f4d] mb-6 border-b-2 border-blue-600 inline-block pb-1">
          Your Posted Requirements
        </h2>

  <div className="mb-4">
      <ManagementSOP />
  </div>
        <div className="w-full overflow-x-auto border rounded-xl shadow-sm bg-white">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Product Name</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Quantity</TableHead>
                <TableHead className="font-bold">Unit</TableHead>
                <TableHead className="font-bold">Phone</TableHead>
                <TableHead className="font-bold">Reach</TableHead>
                <TableHead className="font-bold">States</TableHead>
                <TableHead className="font-bold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((item) => (
                <TableRow key={item._id} className="hover:bg-gray-50 transition">
                  {/* Buy/Sell Badge */}
                  <TableCell>
                    <Badge
                      variant="default"
                      className={`font-semibold ${
                        item.requirement_type === "buy"
                          ? "bg-blue-600 text-white"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {item.requirement_type === "buy" ? "BUY" : "SELL"}
                    </Badge>
                  </TableCell>

                  {/* Product Name */}
                  <TableCell className="font-medium">
                    {item.product_name || "N/A"}
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <span className="capitalize">
                      {item.type === "product" ? "Merchant" : "Service"}
                    </span>
                  </TableCell>

                  {/* Quantity */}
                  <TableCell>{item.quantity}</TableCell>

                  {/* Unit */}
                  <TableCell className="uppercase">{item.unit_of_measurement}</TableCell>

                  {/* Phone */}
                  <TableCell>{item.phone_number}</TableCell>

                  {/* Reach */}
                  <TableCell>
                    <Badge variant="outline">
                      {item.supplier_preference}
                    </Badge>
                  </TableCell>

                  {/* States */}
                  <TableCell>
                    {item.selected_states?.length > 0
                      ? item.selected_states.join(", ")
                      : "All India"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-blue-300 hover:bg-blue-50"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="w-4 h-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Post</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(item._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Post</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DeleteDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete This Post?"
          description="This action cannot be undone. The post will be permanently removed."
        />
      </div>
    </TooltipProvider>
  );
};

export default GrocerySellerRequirementList;
