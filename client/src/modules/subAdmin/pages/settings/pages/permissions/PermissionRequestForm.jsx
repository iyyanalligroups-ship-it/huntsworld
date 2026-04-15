import { useState, useEffect, useContext } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdatePermissionRequestMutation } from "@/redux/api/PermissionRequestApi";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const PermissionRequestForm = ({ selectedData, clearSelectedData, onClose }) => {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        permission_id: "",
        status: "pending",
        approved_by: user?.user?._id
    });

    const [updatePermissionRequest] = useUpdatePermissionRequestMutation();

    useEffect(() => {
        if (selectedData) {
            setFormData({
                user_id: selectedData.user_id?._id || selectedData.user_id || "",
                permission_id: selectedData.permission_id?._id || selectedData.permission_id || "",
                status: selectedData.status || "pending",
            });
        }
    }, [selectedData]);

    const handleStatusChange = async (value) => {
        setFormData((prev) => ({
            ...prev,
            status: value,
        }));

        // Call update API on status change
        try {
            if (selectedData) {
                await updatePermissionRequest({ id: selectedData._id, ...formData, status: value }).unwrap();
                showToast("Permission Request Updated",'success');
                onClose(); // Close Modal after Submit
            }
        } catch (error) {
            console.error(error);
            showToast("Something went wrong",'error');
        }
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default PermissionRequestForm;
