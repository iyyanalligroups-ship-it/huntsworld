import React, { useState } from "react";
import {
    useGetPostByRequirementsQuery,
    useDeletePostByRequirementMutation,
} from "@/redux/api/PostByRequirementApi";

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
import { Pencil, Trash2 } from "lucide-react";
import DeleteDialog from "@/model/DeleteModel";
import { toast } from "react-toastify";

const PostByRequirementList = ({ onEdit }) => {
    const { data, isLoading, refetch } = useGetPostByRequirementsQuery();
    const [deletePost] = useDeletePostByRequirementMutation();

    const [selectedId, setSelectedId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDeleteClick = (id) => {
        setSelectedId(id);
        setIsDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await deletePost(selectedId).unwrap();
            refetch();
            if (response.success) {
                toast.success(response.message || "Requirement Deleted Successfully");
            } else {
                toast.error(response.message || "Failed to Delete")
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Delete failed", error);
        }
    };

    if (isLoading) return <div className="p-4">Loading...</div>;

    return (
        <TooltipProvider>
            <h2 className="text-xl font-bold mb-4 border-b-2">Details of Post By Requirement</h2>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product / Service</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Supplier Preference</TableHead>
                            <TableHead>States</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.data?.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell>{item.product_or_service}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unit_of_measurement}</TableCell>
                                <TableCell>{item.phone_number}</TableCell>
                                <TableCell>{item.supplier_preference}</TableCell>
                                <TableCell>{item.selected_states?.join(", ") || "N/A"}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="cursor-pointer"
                                                    onClick={() => onEdit(item)}
                                                >
                                                    <Pencil className="w-4 h-4 " />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Edit</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="cursor-pointer"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(item._id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-white" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Delete</p>
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
                title="Delete Requirement?"
                description="This action will permanently remove this requirement post."
            />
        </TooltipProvider>
    );
};

export default PostByRequirementList;
