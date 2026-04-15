import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import showToast from '@/toast/showToast';
import { useAddCouponMutation, useUpdateCouponMutation } from '@/redux/api/CouponApi';

const CouponForm = ({ selectedCoupon, onClose }) => {
  const [formData, setFormData] = useState({ coupon_name: '' });
  const [addCoupon] = useAddCouponMutation();
  const [updateCoupon] = useUpdateCouponMutation();

  useEffect(() => {
    if (selectedCoupon) {
      setFormData({ coupon_name: selectedCoupon.coupon_name });
    }
  }, [selectedCoupon]);

  const handleSubmit = async () => {
    try {
      if (selectedCoupon) {
        const response = await updateCoupon({ id: selectedCoupon._id, ...formData }).unwrap();
        if (response.success) {
          showToast("Coupon Updated Successfully",'success');
        } else {
          showToast("Failed to update coupon",'error');
        }
      } else {
        const response = await addCoupon(formData).unwrap();
        if (response.success) {
          showToast("Coupon Added Successfully",'success');
        } else {
          showToast("Failed to add coupon",'error');
        }
      }
      onClose();
    } catch (error) {
      showToast(`Something went wrong: ${error}`,'error');
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* <h2 className="text-xl font-bold">{selectedCoupon ? "Edit Coupon" : "Add Coupon"}</h2> */}
      <Label htmlFor="coupon_name" className="mb-2">Enter Coupon Name</Label>
      <Input
        name="coupon_name"
        value={formData.coupon_name}
        onChange={(e) => setFormData({ ...formData, coupon_name: e.target.value })}
        placeholder="Coupon Name"
      />
      <Button onClick={handleSubmit}>
        {selectedCoupon ? "Update Coupon" : "Add Coupon"}
      </Button>
    </div>
  );
};

export default CouponForm;
