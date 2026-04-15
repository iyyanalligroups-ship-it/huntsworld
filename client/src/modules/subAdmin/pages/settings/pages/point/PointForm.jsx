import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAddPointMutation, useUpdatePointMutation } from '@/redux/api/PointApi';
import { Label } from '@/components/ui/label';
import { toast } from "react-toastify";

const PointForm = ({ selectedPoint, onClose }) => {
  const [formData, setFormData] = useState({ 
    point_name: '', 
    point_count: '', 
    point_amount: '' 
  });

  const [addPoint] = useAddPointMutation();
  const [updatePoint] = useUpdatePointMutation();

  useEffect(() => {
    if (selectedPoint) {
      setFormData({
        point_name: selectedPoint.point_name || '',
        point_count: selectedPoint.point_count || '',
        point_amount: selectedPoint.point_amount || '',
      });
    }
  }, [selectedPoint]);

  const handleSubmit = async () => {
    try {
      if (selectedPoint) {
        const response = await updatePoint({ id: selectedPoint._id, ...formData }).unwrap();
        if (response.success) {
          toast.success(response.message || "Point Updated Successfully");
        } else {
          toast.error(response.message || "Failed to update point");
        }
      } else {
        const response = await addPoint(formData).unwrap();
        if (response.success) {
          toast.success(response.message || "Point Added Successfully");
        } else {
          toast.error(response.message || "Failed to add point");
        }
      }
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };
  
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Add Point Count</h2>

      <div className="space-y-2">
        <Label htmlFor="point_name">Enter the Point Name</Label>
        <Input
          id="point_name"
          placeholder="Point Name"
          name="point_name"
          value={formData.point_name}
          onChange={(e) => setFormData({ ...formData, point_name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="point_count">Enter the Point Count</Label>
        <Input
          id="point_count"
          type="number"
          placeholder="Point Count"
          name="point_count"
          value={formData.point_count}
          onChange={(e) => setFormData({ ...formData, point_count: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="point_amount">Enter the Point Amount</Label>
        <Input
          id="point_amount"
          type="number"
          placeholder="Point Amount"
          name="point_amount"
          value={formData.point_amount}
          onChange={(e) => setFormData({ ...formData, point_amount: e.target.value })}
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        {selectedPoint ? "Update Point" : "Add Point"}
      </Button>
    </div>
  );
};

export default PointForm;
