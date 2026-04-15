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
  useCreatePlanMutation,
  useUpdatePlanMutation,
} from "@/redux/api/SubcriptionPlanApi";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
const SubcriptionPlanForm = ({ open, setOpen, plan }) => {
  const [formData, setFormData] = useState({
    plan_name: "",
    price: "",
    status: "Active",
    description: "",
  });

  const [createPlan] = useCreatePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();

  useEffect(() => {
    if (plan) {
      setFormData({
        plan_name: plan.plan_name || "",
        price: plan.price || "",
        status: plan.status || "Active",
        description: plan.description || "",
      });
    } else {
      setFormData({
        plan_name: "",
        price: "",
        status: "Active",
        description: "",
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (plan) {
    const response=  await updatePlan({ id: plan._id, ...formData });

    if (response.error) {
        toast.error("Failed to delete subscription plan.");
        setFormData({
            plan_name: "",
            price: "",

            status: "Active",
            description: "",
        })
      } else {
        toast.success("Subscription plan Updated successfully.");
        setFormData({
            plan_name: "",
            price: "",

            status: "Active",
            description: "",
        })
      }
    } else {
     const response= await createPlan(formData);

     if (response.error) {
        toast.error("Failed to delete subscription plan.");
        setFormData({
            plan_name: "",
            price: "",

            status: "Active",
            description: "",
        })
      } else {
        toast.success("Subscription plan Added successfully.");
        setFormData({
            plan_name: "",
            price: "",

            status: "Active",
            description: "",
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
            name="plan_name"
            placeholder="Plan Name"
            value={formData.plan_name}
            onChange={handleChange}
          />
          <Input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
          />
         
         <div>
         <Select
            value={formData.status}
            onValueChange={handleStatusChange}
            className="w-full border p-2 rounded"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
         </div>

          <Textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <Button type="submit" className="w-full">
            {plan ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubcriptionPlanForm;
