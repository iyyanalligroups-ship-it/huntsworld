

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
  useGetSubscriptionPlanQuery,
  useGetSubscriptionPlanElementQuery,
  useCreateMappingMutation,
  useUpdateMappingMutation,
} from "@/redux/api/SubscriptionPlanElementMappingApi";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { map } from "lodash";

const SubcriptionPlanElementMappingForm = ({ open, setOpen, mapping }) => {
  const [formData, setFormData] = useState({
    subscription_plan_id: "",
    elements: [], // This will store an array of element-value pairs
  });

  const [createMapping] = useCreateMappingMutation();
  const [updateMapping] = useUpdateMappingMutation();

  // Fetch subscription plans and elements
  const { data: plansData } = useGetSubscriptionPlanQuery();
  const { data: elementsData } = useGetSubscriptionPlanElementQuery();

  // Set initial form data based on the selected mapping or default to the first plan
  useEffect(() => {
    console.log(mapping,"edit");
    
    if (mapping) {
      // Editing an existing mapping
      setFormData({
        subscription_plan_id: mapping?.subscription_plan_id?._id || "",
        elements: mapping?.elements || [], // Populate with the array of element-value pairs from the mapping
      });
    } else if (plansData?.data?.length) {
      // If no mapping exists, set default subscription plan (first plan)
      setFormData({
        subscription_plan_id: plansData?.data[0]._id,
        elements: [], // Start with no element-value pairs
      });
    }
  }, [mapping, plansData]);

  const handleElementChange = (index, field, value) => {
    const updatedElements = [...formData.elements];
    updatedElements[index] = { ...updatedElements[index], [field]: value };
    setFormData((prev) => ({ ...prev, elements: updatedElements }));
  };

  const addElement = () => {
    setFormData((prev) => ({
      ...prev,
      elements: [...prev.elements, { element_id: "", value: "" }],
    }));
  };

  const removeElement = (index) => {
    const updatedElements = [...formData.elements];
    updatedElements.splice(index, 1);
    setFormData((prev) => ({ ...prev, elements: updatedElements }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subscription_plan_id || formData.elements.some((el) => !el.element_id || !el.value)) {
      toast.error("Subscription Plan and Element-Value pairs are required.");
      return;
    }

    let response;
    if (mapping) {
      // Update existing mapping
      response = await updateMapping({
        id: mapping._id,
        subscription_plan_id: formData.subscription_plan_id,
        elements: formData.elements,
      });
    } else {
      // Create new mapping
      response = await createMapping({
        subscription_plan_id: formData.subscription_plan_id,
        elements: formData.elements,
      });
    }
console.log(response,'error');

    if (response.error) {
      toast.error(response?.error?.data?.message || "Something went wrong.");
    } else {
      toast.success(response?.data?.message || `Mapping ${mapping ? "updated" : "created"} successfully.`);
    }

    setFormData({
      subscription_plan_id: "",
      elements: [],
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mapping ? "Edit Mapping" : "Add Mapping"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm mb-1 block">Subscription Plan</label>
            <Select
              value={formData.subscription_plan_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, subscription_plan_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Plan" />
              </SelectTrigger>
              <SelectContent>
                {plansData?.data?.map((plan) => (
                  <SelectItem key={plan._id} value={plan._id}>
                    {plan.plan_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Element-Value Pairs */}
          {formData.elements.map((element, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-1/2">
                <label className="text-sm mb-1 block">Element</label>
                <Select
                  value={element.element_id}
                  onValueChange={(value) => handleElementChange(index, "element_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an Element" />
                  </SelectTrigger>
                  <SelectContent>
                    {elementsData?.data?.map((el) => (
                      <SelectItem key={el._id} value={el._id}>
                        {el.element_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-1/2">
                <label className="text-sm mb-1 block">Value</label>
                <Input
                  placeholder="Enter Value"
                  value={element.value}
                  onChange={(e) => handleElementChange(index, "value", e.target.value)}
                />
              </div>

              <Button
                variant="destructive"
                onClick={() => removeElement(index)}
                className="self-center"
              >
                Remove
              </Button>
            </div>
          ))}

          <Button type="button" onClick={addElement}>
            Add Element-Value Pair
          </Button>

          <Button type="submit" className="w-full">
            {mapping ? "Update Mapping" : "Create Mapping"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubcriptionPlanElementMappingForm;
