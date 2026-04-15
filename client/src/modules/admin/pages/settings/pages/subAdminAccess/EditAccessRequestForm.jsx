import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import showToast from "@/toast/showToast";

const EditAccessRequestForm = ({ open, onClose, onSubmit, requestedPermissions = [], initialData = [] }) => {
  const [permissions, setPermissions] = useState(
    requestedPermissions.map((reqPerm) => ({
      page: reqPerm.page,
      actions: initialData.find((p) => p.page === reqPerm.page)?.actions || [],
    }))
  );

  const handleActionChange = (page, action, checked) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.page === page
          ? {
              ...p,
              actions: checked ? [...p.actions, action] : p.actions.filter((a) => a !== action),
            }
          : p
      )
    );
  };

  const handleSubmit = () => {
    const updatedPermissions = permissions.filter((p) => p.actions.length > 0);
    if (updatedPermissions.length === 0 && permissions.some(p => p.actions.length > 0)) {
      showToast("At least one page must have selected actions", "error");
      return;
    }
    onSubmit(updatedPermissions);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Access Permissions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {requestedPermissions.map((reqPerm) => (
            <div key={reqPerm.page} className="flex items-center justify-between">
              <Label>{reqPerm.page}</Label>
              <div className="flex gap-4">
                {reqPerm.actions.map((action) => (
                  <div key={action} className="flex items-center gap-2">
                    <Checkbox
                      id={`${reqPerm.page}-${action}`}
                      checked={permissions.find((p) => p.page === reqPerm.page)?.actions.includes(action)}
                      onCheckedChange={(checked) => handleActionChange(reqPerm.page, action, checked)}
                    />
                    <Label htmlFor={`${reqPerm.page}-${action}`}>{action}</Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccessRequestForm;