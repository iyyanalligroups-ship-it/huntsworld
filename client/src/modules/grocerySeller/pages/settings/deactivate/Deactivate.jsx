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

const GrocerySellerDeactivateButton = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, refetchUser } = useContext(AuthContext);
  const user_id = user?.user?._id;

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/deactivate-account/${user_id}`
      );

      showToast(
        "Your base member account has been successfully deactivated. You are now a regular user.",
        "success"
      );
   // 🔁 REFRESH AUTH STATE (THIS IS THE MAGIC)
    await refetchUser();

    // 🔀 REDIRECT TO MERCHANT DASHBOARD
    navigate("/", { replace: true });
    } catch (error) {
      console.error("Error deactivating Base Member account:", error);
      showToast(
        "Failed to deactivate your Base Member account. Please try again later.",
        "error"
      );
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-foreground">
        Deactivate Base Member Account
      </h3>

      <p className="text-sm text-muted-foreground">
        If you no longer wish to sell groceries on the platform, you can deactivate your Base Member account. This will remove your seller privileges and convert your account back to a standard user account.
      </p>

      <p className="text-sm text-muted-foreground">
        Upon deactivation, you will lose access to all Base Member features, including managing your store, adding/editing products, viewing orders, processing deliveries, inventory management, and sales reports. Your personal profile and login details will remain intact.
      </p>

      <p className="text-sm text-muted-foreground">
        After deactivation, you can continue using the platform as a regular buyer/user. If you want to start selling groceries again in the future, you can easily create a new Base Member account from your user dashboard (subject to any approval process if applicable).
      </p>

      <p className="text-sm text-muted-foreground font-medium dark:text-orange-400">
        Important: Before proceeding, please fulfill any pending orders, withdraw earnings if available, download sales records or invoices, and inform your regular customers about the closure of your store.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="cursor-pointer" disabled={loading}>
            {loading ? "Deactivating..." : "Deactivate Base Member Account"}
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Base Member Account Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your Base Member account? This will remove all seller privileges and convert your account to a regular user. You can create a new seller account later if needed. This action cannot be undone automatically.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className=" flex lg:gap-3 sm:gap-0">
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
              {loading ? "Deactivating..." : "Confirm Deactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrocerySellerDeactivateButton;
