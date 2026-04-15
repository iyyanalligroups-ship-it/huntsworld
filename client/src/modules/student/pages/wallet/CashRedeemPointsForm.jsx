import { useContext, useState } from 'react';
import { useRedeemPointsMutation } from '@/redux/api/couponsNotificationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import showToast from '@/toast/showToast';
import { Loader2, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useUploadRedeemLetterMutation, useDeleteRedeemLetterMutation } from '@/redux/api/StudentImageApi';
import Loader from '@/loader/Loader';

const RedeemPointsForm = ({ merchantId, walletPoints, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    redeem_point: '',
    reason: '',
    letter_image_url: '',
    letter_file_name: '',
  });

  const [redeemPoints, { isLoading }] = useRedeemPointsMutation();
  const [uploadRedeemLetter, { isLoading: isUploading }] = useUploadRedeemLetterMutation();
  const [deleteRedeemLetter, { isLoading: isDeleting }] = useDeleteRedeemLetterMutation();
  const userId = user?.user?._id || user?._id;

  // Eligibility check
  if (walletPoints < 2500) {
    return (
      <div className="text-center p-4 bg-red-100 text-red-700 rounded">
        You need at least 2500 points to be eligible to redeem points.
      </div>
    );
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(file.type)) {
      showToast('Only image files (JPEG, PNG, GIF, WebP) are allowed', 'error');
      return;
    }

    const imageFormData = new FormData();
    imageFormData.append('letter_image', file);
    imageFormData.append('user_id', userId);

    try {
      const res = await uploadRedeemLetter(imageFormData).unwrap();
      setFormData({ ...formData, letter_image_url: res.url, letter_file_name: res.file_name });
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      showToast(error?.data?.message || 'Failed to upload image', 'error');
    }
  };

  const handleDelete = async () => {
    if (!userId || !formData.letter_file_name) return;

    try {
      await deleteRedeemLetter({ user_id: userId, file_name: formData.letter_file_name }).unwrap();

      // Clear state immediately
      setFormData(prev => ({ ...prev, letter_image_url: '', letter_file_name: '' }));
      showToast('Image deleted successfully', 'success');
    } catch (error) {
      showToast(error?.data?.message || 'Failed to delete image', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.redeem_point || !formData.reason) {
      showToast('Points and reason are required', 'error');
      return;
    }
    if (formData.redeem_point < 500) {
      showToast('Redeem points must be at least 500', 'error');
      return;
    }
    if (formData.redeem_point > walletPoints) {
      showToast('Insufficient wallet points', 'error');
      return;
    }
    if (!userId) {
      showToast('User not logged in or missing user ID', 'error');
      return;
    }

    try {
      await redeemPoints({
        user_id: userId,
        redeem_point: parseInt(formData.redeem_point),
        coupon_code: `COUPON-${uuidv4()}`,
        reason: formData.reason,
        letter_image_url: formData.letter_image_url || null,
      }).unwrap();

      showToast('Points redeemed successfully!', 'success');
      onSuccess();
    } catch (error) {
      showToast(error.data?.message || 'Failed to redeem points', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="e.g. I want to redeem my points for cash..."
          className="border-2 border-slate-300"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Upload Letter Image</label>

        {formData.letter_image_url ? (
          <div className="relative mt-2 inline-block">
            <img
              src={formData.letter_image_url}
              alt="Redeem Letter Preview"
              className="w-50 h-60 object-cover rounded-lg shadow-md border border-gray-200"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/200x240/eeeeee/999999?text=No+Image";
              }}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className="border-2 border-slate-300"
          />
        )}

        {isUploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#0c1f4d] text-white text-sm py-2 rounded hover:bg-[#0c1f4dd0] transition cursor-pointer"
        disabled={isLoading}
      >
        Submit
      </Button>

      {(isLoading || isUploading || isDeleting) && (
        <Loader label={isLoading ? "Processing redemption..." : (isUploading ? "Uploading letter..." : "Deleting image...")} />
      )}
    </form>
  );
};

export default RedeemPointsForm;