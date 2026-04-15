import { useState } from "react";
import PermissionForm from "./PermissionForm";
import PermissionList from "./PermissionList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import PermissionRequest from "./PermissionRequest";

export default function Permission() {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleAdd = () => {
    setEditData(null);
    setOpen(true);
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Permissions</h2>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Permission
          </Button>
        </div>
        <PermissionList setEditData={setEditData} setOpen={setOpen} />
        <PermissionForm open={open} setOpen={setOpen} editData={editData} />
      </div>
      <div>
      <PermissionRequest />
      </div></>
  );
}
