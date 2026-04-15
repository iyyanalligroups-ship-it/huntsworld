// Frontend: Student Deactivate Account Button Component
// This component allows a logged-in student to deactivate their student account
// It converts the account back to a normal user (removes student privileges)
// Uses Shadcn UI Dialog for confirmation, custom showToast for notifications

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

const StudentDeactivateButton = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // Controls dialog open/close
  const navigate = useNavigate();
  const { user, refetchUser } = useContext(AuthContext);
  const user_id = user?.user?._id;

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/students/deactivate-account/${user_id}`
      );

      showToast(
        "Your student account has been successfully deactivated. You are now a regular user.",
        "success"
      );
      // 🔁 REFRESH AUTH STATE (THIS IS THE MAGIC)
      await refetchUser();

      // 🔀 REDIRECT TO MERCHANT DASHBOARD
      navigate("/", { replace: true });

    } catch (error) {
      console.error("Error deactivating student account:", error);
      showToast(
        "Failed to deactivate your student account. Please try again later.",
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
        Deactivate Student Account
      </h3>

      <p className="text-sm text-muted-foreground">
        If you no longer wish to maintain your student status on the platform, you can deactivate your student account. This action will remove your student privileges and convert your account back to a standard user account.
      </p>

      <p className="text-sm text-muted-foreground">
        You will lose access to student-specific features such as course enrollments, assignment submissions, grade viewing, learning progress tracking, and any educational resources tied to your student role. Your personal profile, login credentials, and basic account information will remain intact.
      </p>

      <p className="text-sm text-muted-foreground">
        After deactivation, you can continue using the platform as a regular user. If you want to become a student again in the future, you can re-apply or request student access through your user dashboard (subject to approval, if applicable).
      </p>

      <p className="text-sm  font-medium text-orange-600 dark:text-orange-400">
        Important: Before deactivating, please download any important course materials, certificates, or records you may need, as access to them will be removed.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="cursor-pointer" disabled={loading}>
            {loading ? "Deactivating..." : "Deactivate Student Account"}
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Student Account Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your student account? This will remove all student privileges and convert your account to a regular user. You can re-apply for student access later if needed. This action cannot be undone automatically.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex lg:gap-3 sm:gap-0">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeactivate}
              disabled={loading}
            >
              {loading ? "Deactivating..." : "Confirm Deactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDeactivateButton;
