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
  const initialFormState = {
    plan_code: "",
    plan_name: "",
    price: "",
    status: "Active",
    business_type: "merchant",
    description: "",
    razorpay_plan_id: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const [createPlan] = useCreatePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();

  useEffect(() => {
    if (plan) {
      setFormData({
        plan_code: plan.plan_code || "",
        plan_name: plan.plan_name || "",
        price: plan.price || "",
        status: plan.status || "Active",
        business_type: plan.business_type || "merchant",
        description: plan.description || "",
        razorpay_plan_id: plan.razorpay_plan_id || "",
      });
    } else {
      setFormData(initialFormState);
    }
  }, [plan, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (plan) {
        response = await updatePlan({ id: plan._id, ...formData }).unwrap();
        toast.success("Subscription plan updated successfully.");
      } else {
        response = await createPlan(formData).unwrap();
        toast.success("Subscription plan added successfully.");
      }
      setFormData(initialFormState);
      setOpen(false);
    } catch (error) {
      console.error("Plan form error:", error);
      toast.error(error?.data?.message || "Failed to save subscription plan.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Add Plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Name</label>
              <Input
                name="plan_name"
                placeholder="PRO PLAN"
                value={formData.plan_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Code (UPPERS)</label>
              <Input
                name="plan_code"
                placeholder="PRO_PLAN"
                value={formData.plan_code}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                type="number"
                name="price"
                placeholder="2300"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Type</label>
              <Select
                value={formData.business_type}
                onValueChange={(val) => handleSelectChange("business_type", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Target Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merchant">Merchant</SelectItem>
                  <SelectItem value="grocery_seller">Grocery Seller</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Razorpay Plan ID (for Auto-Pay)</label>
            <Input
              name="razorpay_plan_id"
              placeholder="plan_P1abc123"
              value={formData.razorpay_plan_id}
              onChange={handleChange}
            />
            <p className="text-[10px] text-muted-foreground italic">
              Leave blank if this plan does not support automatic renewal.
            </p>
          </div>
         
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={formData.status}
              onValueChange={(val) => handleSelectChange("status", val)}
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              name="description"
              placeholder="Features and details..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            {plan ? "Update Plan" : "Create Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubcriptionPlanForm;
