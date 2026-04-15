import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreatePermissionMutation, useUpdatePermissionMutation } from "@/redux/api/PermissionApi";
import { useState, useEffect } from "react";
import showToast from "@/toast/showToast";

export default function PermissionForm({ open, setOpen, editData }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const [createPermission] = useCreatePermissionMutation();
    const [updatePermission] = useUpdatePermissionMutation();

    useEffect(() => {
        if (editData) {
            setName(editData.name);
            setDescription(editData.description);
        } else {
            setName('');
            setDescription('');
        }
    }, [editData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editData) {
                const response = await updatePermission({ id: editData._id, name, description }).unwrap();
                if (response.success) {
                    showToast("Permission Updated Successfully",'success');
                } else {
                    showToast("Failed to update Permission",'error');
                }
            } else {
                const response = await createPermission({ name, description }).unwrap();
                console.log(response, "ajndaskjndask");

                if (response.success) {
                    showToast("Coupon Created Successfully",'success');
                } else {
                    showToast("Failed to Create coupon",'error');
                }
            }
            setOpen(false);
        } catch (error) {
            showToast(`Failed to Create coupon :${error}`,'error');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editData ? "Edit Permission" : "Add Permission"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Permission Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Input
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Button type="submit" className="w-full">
                        {editData ? "Update" : "Create"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
