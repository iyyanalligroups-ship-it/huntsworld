import { useState } from "react";
import PermissionRequestForm from "./PermissionRequestForm";
import PermissionRequestList from "./PermissionRequestList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const PermissionRequest = () => {
  const [selectedData, setSelectedData] = useState(null);
  const [open, setOpen] = useState(false);

  const clearSelectedData = () => setSelectedData(null);

  const openModal = () => setOpen(true);
  const closeModal = () => {
    setOpen(false);
    clearSelectedData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Permission Requests</h2>
        {/* <Button onClick={openModal}> <Plus className="mr-2 h-4 w-4" />Add Permission Request</Button> */}
      </div>

      <PermissionRequestList setSelectedData={setSelectedData} openModal={openModal} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedData ? "Update Permission Request" : "Add Permission Request"}</DialogTitle>
          </DialogHeader>

          <PermissionRequestForm selectedData={selectedData} clearSelectedData={clearSelectedData} onClose={closeModal} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionRequest;
