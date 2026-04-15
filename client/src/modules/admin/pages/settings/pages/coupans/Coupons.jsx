import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import CouponForm from './CouponsForm';
import CouponList from './CouponsList';

const Coupons = () => {
  const [open, setOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const handleAddNew = () => {
    setSelectedCoupon(null);
    setOpen(true);
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Coupon Names</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="flex gap-2 items-center">
              <PlusCircle className="w-4 h-4" /> Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="text-lg font-semibold">
              {selectedCoupon ? "Edit Coupon" : "Add Coupon"}
            </DialogTitle>
            <CouponForm selectedCoupon={selectedCoupon} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <CouponList onEdit={handleEdit} />
    </div>
  );
};

export default Coupons;
