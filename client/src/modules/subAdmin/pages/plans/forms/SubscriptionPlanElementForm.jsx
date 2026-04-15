import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useCreateElementMutation,
  useUpdateElementMutation,
} from "@/redux/api/SubscriptionPlanElementApi";
import showToast from "@/toast/showToast";



const SubcriptionPlanElementForm = ({ open, setOpen, plan }) => {
  const [formData, setFormData] = useState({
    element_name: "",

  });

  const [createPlan] = useCreateElementMutation();
  const [updatePlan] = useUpdateElementMutation();

  useEffect(() => {
    if (plan) {
      setFormData({
        element_name: plan.element_name || "",
  
      });
    } else {
      setFormData({
        element_name: "",
    
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (plan) {
    const response=  await updatePlan({ id: plan._id, ...formData });

    if (response.error) {
        showToast("Failed to delete subscription plan.",'error');
        setFormData({
            element_name: "",
         
        })
      } else {
        showToast("Subscription plan Updated successfully.",'success');
        setFormData({
            element_name: "",
       
        })
      }
    } else {
     const response= await createPlan(formData);

     if (response.error) {
        showToast("Failed to delete subscription plan.",'error');
        setFormData({
            element_name: "",
   
        })
      } else {
        showToast("Subscription plan Added successfully.",'success');
        setFormData({
            element_name: "",

        })
      }
     
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Add Plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="element_name"
            placeholder="Element Name"
            value={formData.element_name}
            onChange={handleChange}
          />
         
          <Button type="submit" className="w-full">
            {plan ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubcriptionPlanElementForm;
