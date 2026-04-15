import { useContext, useState } from 'react';
import { useRedeemPointsMutation } from '@/redux/api/couponsNotificationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import showToast from '@/toast/showToast';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const RedeemPointsForm = ({ merchantId, coupons, walletPoints, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    coupon_id: '',
    redeem_point: '',
    reason: '',
  });
  const [redeemPoints, { isLoading }] = useRedeemPointsMutation();
  const userId = user?._id || user?.user?._id;

  // Check eligibility for minimum 2500 points
  if (walletPoints < 2500) {
    return (
      <div className="text-center p-4 bg-red-100 text-red-700 rounded">
        You need at least 2500 points to be eligible to redeem points.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.coupon_id || !formData.redeem_point || !formData.reason) {
        showToast("Coupon, points, and reason are required", "error");
        return;
      }
      if (formData.redeem_point < 500) {
        showToast("Redeem points must be at least 500", "error");
        return;
      }
      if (formData.redeem_point > walletPoints) {
        showToast("Insufficient wallet points", "error");
        return;
      }
      if (!userId) {
        return showToast('User not logged in or missing user ID', 'error');
      }

      await redeemPoints({
        user_id: userId,
        coupon_id: formData.coupon_id,
        redeem_point: parseInt(formData.redeem_point),
        coupon_code: `COUPON-${uuidv4()}`,
        reason: formData.reason,
      }).unwrap();

      showToast("Points redeemed successfully!", "success");
      onSuccess();
    } catch (error) {
      showToast(error.data?.message || "Failed to redeem points", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Select Coupon</label>
        <Select
          value={formData.coupon_id}
          onValueChange={(value) => setFormData({ ...formData, coupon_id: value })}
        >
          <SelectTrigger className="border-2 border-slate-300">
            <SelectValue placeholder="Select a coupon" />
          </SelectTrigger>
          <SelectContent>
            {coupons.map((coupon) => (
              <SelectItem key={coupon._id} value={coupon._id}>
                {coupon.coupon_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Redeem Points</label>
        <Input
          type="number"
          value={formData.redeem_point}
          onChange={(e) => setFormData({ ...formData, redeem_point: e.target.value })}
          placeholder="e.g. 500"
          className="border-2 border-slate-300"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Reason</label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="e.g. For marketing expenses"
          className="border-2 border-slate-300"
        />
      </div>
      <Button
        type="submit"
        className="flex-1 bg-[#0c1f4d] text-white text-sm py-2 rounded hover:bg-[#0c1f4dd0] transition cursor-pointer"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
      </Button>
    </form>
  );
};

export default RedeemPointsForm;