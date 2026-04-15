import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import {
    useGetPermissionsQuery,
    useDeletePermissionMutation,
} from "@/redux/api/PermissionApi";
import { toast } from "react-toastify";
import { useState } from "react";
import DeleteDialog from "@/model/DeleteModel";

export default function PermissionList({ setEditData, setOpen }) {
    const { data, isLoading } = useGetPermissionsQuery();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId,setDeleteId]=useState(false);
    const [deletePermission, { isLoading: isDeleting }] = useDeletePermissionMutation();


    const handleDelete = async (id) => {
       setIsDialogOpen(true);
       setDeleteId(id);
    };
 const confirmDelete = async ()=>{
    try {
        const response = await deletePermission(deleteId).unwrap();
        if (response.success) {
            setIsDialogOpen(false);
            toast.success(response.message || "Coupon Deleted Successfully");
        } else {
            setIsDialogOpen(false);
            toast.error(response.message || "Failed to Delete Coupon");
        }
    } catch (error) {
        setIsDialogOpen(false);
        toast.error(error?.data?.message || "Something went wrong");
    }
 }
    if (isLoading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
     <>
        <Card>
            <CardHeader>
                <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/4">Name</TableHead>
                                <TableHead className="w-1/2">Description</TableHead>
                                <TableHead className="text-center w-1/4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.data?.length > 0 ? (
                                data.data.map((permission) => (
                                    <TableRow key={permission._id}>
                                        <TableCell className="font-medium">{permission.name}</TableCell>
                                        <TableCell>{permission.description}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditData(permission);
                                                        setOpen(true);
                                                    }}
                                                >
                                                    <Pencil size={16} />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleDelete(permission._id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No permissions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            
        </Card>
          <DeleteDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Permission?"
          description="This action will permanently remove the coupon."
          loading={isDeleting}
        ></DeleteDialog></>
    );
}
