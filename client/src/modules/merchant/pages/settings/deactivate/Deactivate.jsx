// Frontend: Button component using Shadcn UI with added notes and confirmation dialog
// Assume you have installed shadcn-ui, axios, and react-hot-toast for notifications
// This is a sample component, e.g., DeleteButton.tsx
// For better UX, we've added a confirmation dialog using Shadcn's Dialog component
// and toast notifications for success/error feedback

import { Button } from "@/components/ui/button"; // Shadcn UI Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Shadcn UI Dialog
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import axios from "axios";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "@/loader/Loader";

const DeleteButton = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // For dialog state
  const {user,refetchUser}=useContext(AuthContext);
  const navigate = useNavigate();
  const user_id=user?.user?._id;

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Send DELETE request with user_id in params (URL)
      await axios.delete(`${import.meta.env.VITE_API_URL}/merchants/deactivate-account/${user_id}`);
      console.log("Deactivation successful");
      showToast(
        "Your merchant account has been deactivated and converted to a normal user account.",
       "success",
      );
      // 🔁 REFRESH AUTH STATE (THIS IS THE MAGIC)
    await refetchUser();

    // 🔀 REDIRECT TO MERCHANT DASHBOARD
    navigate("/", { replace: true });
      // Optionally, redirect or refresh the page here, e.g., window.location.reload();
    } catch (error) {
      console.error("Error deactivating:", error);
      showToast(
       "Failed to deactivate your account. Please try again.",
       "error"
      );
    } finally {
      setLoading(false);
      setOpen(false); // Close dialog after action
    }
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-foreground">Deactivate Merchant Account</h3>
      <p className="text-sm text-muted-foreground">
        If you wish to deactivate your merchant account, please note that this action will convert your current account to a standard user account. This means you will lose access to all merchant-specific features, such as managing products, processing payments, and viewing sales analytics. However, your basic user profile, including personal information and any non-merchant related data, will remain intact.
      </p>
      <p className="text-sm text-muted-foreground">
        After deactivation, you can continue using the platform as a regular user. If you decide to become a merchant again in the future, you can easily create a new merchant account from your user dashboard. This process is straightforward and can be initiated at any time. Please ensure this is what you want, as deactivation cannot be undone without contacting support.
      </p>
      <p className="text-sm text-muted-foreground font-medium">
        Important: Before proceeding, make sure to back up any important merchant data, settle outstanding transactions, and inform your customers if necessary.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="cursor-pointer" disabled={loading}>
            {loading ? "Deactivating..." : "Deactivate Account"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your merchant account? This will convert it to a normal user account, and you can create a new merchant account later if needed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" className="cursor-pointer" onClick={handleDelete} disabled={loading}>
              {loading ? "Deactivating..." : "Confirm Deactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {loading && <Loader />}
    </div>
  );
};

export default DeleteButton;
