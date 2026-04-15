import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import axios from "axios";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserDeactivateButton = () => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { user, refetchUser, logout } = useContext(AuthContext);
    const user_id = user?.user?._id;

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/users/deactivate-user-account/${user_id}`
            );

            showToast(
                "Your account has been successfully deactivated. You are no more a user.",
                "success"
            );
            // 🔁 REFRESH AUTH STATE (THIS IS THE MAGIC)
            logout();
            navigate('/')
        } catch (error) {
            console.error("Error deactivating user account:", error);
            showToast(
                "Failed to deactivate your user account. Please try again later.",
                "error"
            );
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-card rounded-lg shadow-md border">
            <h3 className="text-lg ffont-semibold text-destructive">
                Permanently Delete Your Account
            </h3>

            <p className="text-sm text-muted-foreground">
                If you choose to permanently delete your account, your entire account will be removed from our platform. This includes your profile, orders, subscriptions, store data (if any), messages, and all associated information.
            </p>

            <p className="text-sm text-muted-foreground">
                Once deleted, your account cannot be recovered. You will lose access to all services, features, and any stored data permanently.
            </p>

            <p className="text-sm text-muted-foreground">
                If you are a seller or merchant, all your products, store details, phone number access permissions, customer requests, and transaction records will be permanently erased.
            </p>

            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                ⚠ Important: This action is irreversible. Please make sure to download any important data and complete pending transactions before proceeding.
            </p>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" className="cursor-pointer" disabled={loading}>
                        {loading ? "Deleting Account..." : "Delete My Account Permanently"}
                    </Button>
                </DialogTrigger>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Permanent Account Deletion</DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to permanently delete your account?
                            This action cannot be undone. All your data will be permanently removed
                            from our system.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex lg:gap-3 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeactivate}
                            disabled={loading}
                            className="cursor-pointer"
                        >
                            {loading ? "Deleting..." : "Yes, Delete My Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserDeactivateButton;
