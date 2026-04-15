// src/components/DeleteConfirmationModal.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteServiceProviderMutation } from "@/redux/api/ServiceProviderApi";

const DeleteConfirmationModal = ({ isOpen, onClose, provider }) => {
  const [deleteServiceProvider, { isLoading }] = useDeleteServiceProviderMutation();

  const handleDelete = async () => {
    try {
      await deleteServiceProvider(provider._id).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to delete service provider:", error);
    }
  };

  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the service provider with User ID:{" "}
            {provider.user_id?._id || "N/A"} and Email: {provider.email}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;