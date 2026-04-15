import { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Pencil, Eye, ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useCreateBannerOrderMutation,
  useVerifyBannerPaymentMutation,
  useUpgradeBannerMutation,
  useCancelBannerMutation,

} from '@/redux/api/BannerPaymentApi';
import {
  useUploadBannerImageMutation,
  useUploadRectangleLogoMutation,
  useUpdateBannerImageMutation,
  useUpdateRectangleLogoMutation,
  useDeleteBannerImageMutation,
  useDeleteRectangleLogoMutation,
} from '@/redux/api/BannerImageApi';
import { useGetGSTPlanQuery, useFetchBannerAdAmountQuery } from '@/redux/api/CommonSubscriptionPlanApi';
import { loadRazorpayScript, RAZORPAY_GLOBAL_CONFIG } from '../../../utils/Razorpay';
import { toast } from 'react-toastify';
import FREE_BANNER_POSITION_PATH from "@/assets/images/paid-banner-position.png";
import PAID_BANNER_POSITION_PATH from "@/assets/images/free-banner-position.png";
import { AuthContext } from '@/modules/landing/context/AuthContext';
import axios from 'axios';
import noImage from '@/assets/images/no-image.jpg'
import BannerExpiryInfo from './BannerExpireInfo';
import Loader from '@/loader/Loader';

const BannerDetailsManagement = ({ subscriptionId,
  planCode,
  activeBanner,
  activeBannerPayment,
  pendingBannerPayment,
  refetch,
  isRoyal,
  features,
  tracking,
  purchaseHistory }) => {
  const [isFreeBannerOpen, setIsFreeBannerOpen] = useState(false);
  const [isPaidBannerOpen, setIsPaidBannerOpen] = useState(false);
  const [isViewImageOpen, setIsViewImageOpen] = useState({ free: false, paid: false });
  const [isUploading, setIsUploading] = useState({ free: false, paid: false });
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [rectangleLogoUrl, setRectangleLogoUrl] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [rectangleLogoPreview, setRectangleLogoPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState({ free: null, paid: null });
  const [companyName, setCompanyName] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState({ free: false, paid: false });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState({ free: false, paid: false });
  const [localActiveBanner, setLocalActiveBanner] = useState(activeBanner);
  const [fetchedBusinessName, setFetchedBusinessName] = useState('');

  // Banner Plan Management States
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [days, setDays] = useState('');
  const [amount, setAmount] = useState(0);

  const { user } = useContext(AuthContext);
  const token = user?.token || sessionStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const FREE_BANNER_DIMENSIONS = { width: 200, height: 100 };
  const PAID_BANNER_DIMENSIONS = { width: 1220, height: 274 };
  const [bannerExpireData, setBannerExpireData] = useState('');
  // Mutations
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [uploadBannerImage] = useUploadBannerImageMutation();
  const [uploadRectangleLogo] = useUploadRectangleLogoMutation();
  const [updateBannerImage] = useUpdateBannerImageMutation();
  const [updateRectangleLogo] = useUpdateRectangleLogoMutation();
  const [deleteBannerImage] = useDeleteBannerImageMutation();
  const [deleteRectangleLogo] = useDeleteRectangleLogoMutation();

  // Banner Payment Mutations
  const [createBannerOrder] = useCreateBannerOrderMutation();
  const [verifyBannerPayment] = useVerifyBannerPaymentMutation();
  const [upgradeBanner] = useUpgradeBannerMutation();
  const [cancelBanner] = useCancelBannerMutation();
  const { data: bannerAmountData, isLoading: isBannerAmountLoading } =
    useFetchBannerAdAmountQuery();

  const perDayAmount = bannerAmountData?.data?.price ?? 0;

  // GST Query
  const { data: gstPlanData, isLoading: isGSTLoading, error: gstError } = useGetGSTPlanQuery();

  // Calculate GST and total
  const gstPercentage = gstPlanData?.data?.data?.price ?? 0;

  const gstAmount = (amount * gstPercentage) / 100;
  const totalAmount = amount + gstAmount;


  const sanitizeCompanyName = (name) => name.replace(/[^a-zA-Z0-9\s]/g, '_').trim();

  const validateFile = (file) => {
    if (!file) return false;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 200 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: JPEG, JPG, PNG, GIF, WebP.`);
      return false;
    }
    if (file.size > maxSize) {
      toast.error(`File exceeds 200MB limit.`);
      return false;
    }
    return true;
  };
  const getBannerExpireDate = async (userId) => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/banner-payment/banner/expire-date/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  };
  const fetchBusinessName = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/merchants/get-business-name`,
        { user_id: user?.user?._id },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const bName = response?.data?.data?.business_name || '';
        setFetchedBusinessName(bName);
        setCompanyName(activeBanner?.company_name || bName || user?.user?.company_name || '');
        setBannerTitle(activeBanner?.title || activeBanner?.company_name || bName || user?.user?.company_name || '');
      } else {
        setError(response.data.message || 'Failed to fetch');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBusinessName();


  }, [user]);

  useEffect(() => {
    const fetchExpireDate = async () => {
      try {
        const data = await getBannerExpireDate(
          user?.user?._id,
          token
        );
        setBannerExpireData(data.expires_at);
      } catch (err) {
        console.error("Failed to fetch banner expiry", err);
      }
    };

    if (user?.user?._id) {
      fetchExpireDate();
    }
  }, [activeBanner, activeBannerPayment, pendingBannerPayment]);

  const validateImageDimensions = (file, type) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const requiredDimensions = type === 'free' ? FREE_BANNER_DIMENSIONS : PAID_BANNER_DIMENSIONS;
        if (img.width !== requiredDimensions.width || img.height !== requiredDimensions.height) {
          toast.error(
            `${type === 'free' ? 'Free banner' : 'Paid banner'} image must be exactly ${requiredDimensions.width}x${requiredDimensions.height} pixels.`
          );
          resolve(false);
        } else {
          resolve(true);
        }
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        toast.error(`Failed to load image ${file.name} for dimension validation.`);
        resolve(false);
      };
    });
  };

  const handleImageChange = async (e, type) => {
    if (!['free', 'paid'].includes(type)) {
      toast.error('Invalid image type provided');
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    if (!file || !validateFile(file)) {
      e.target.value = '';
      return;
    }
    if (!companyName) {
      toast.error('Please provide a company name before selecting an image.');
      e.target.value = '';
      return;
    }

    const isValidDimensions = await validateImageDimensions(file, type);
    if (!isValidDimensions) {
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedFile((prev) => ({ ...prev, [type]: file }));
    if (type === 'free') {
      setRectangleLogoPreview(previewUrl);
      setRectangleLogoUrl('');
    } else {
      setBannerPreview(previewUrl);
      setBannerImageUrl('');
    }
    e.target.value = '';
  };

  const handleDeleteImage = async (type, imageUrl) => {
    if (!imageUrl) {
      toast.error(`No ${type === 'free' ? 'free banner' : 'paid banner'} image to delete`);
      return;
    }
    if (!companyName) {
      toast.error('Please provide a company name before deleting images');
      return;
    }

    const sanitizedCompanyName = sanitizeCompanyName(companyName);
    setIsUploading((prev) => ({ ...prev, [type]: true }));
    try {
      let deleteMutation, setImageUrl, setImagePreview, imageField;
      if (type === 'free') {
        deleteMutation = deleteRectangleLogo;
        setImageUrl = setRectangleLogoUrl;
        setImagePreview = setRectangleLogoPreview;
        imageField = 'rectangle_logo';
      } else {
        deleteMutation = deleteBannerImage;
        setImageUrl = setBannerImageUrl;
        setImagePreview = setBannerPreview;
        imageField = 'banner_image';
      }

      await deleteMutation({ company_name: sanitizedCompanyName, image_url: imageUrl }).unwrap();
      setImageUrl('');
      setImagePreview('');
      setSelectedFile((prev) => ({ ...prev, [type]: null }));

      if (activeBanner?._id) {
        const bannerData = {
          banner_id: activeBanner._id,
          user_id: user?.user?._id,
          subscription_id: subscriptionId,
          banner_payment_id: type === 'paid' ? (pendingBannerPayment?._id || activeBannerPayment?._id) || null : activeBanner?.banner_payment_id || null,
          title: bannerTitle || activeBanner.title,
          company_name: sanitizedCompanyName,
          banner_image: type === 'paid' ? '' : activeBanner?.banner_image || '',
          rectangle_logo: type === 'free' ? '' : activeBanner?.rectangle_logo || '',
        };
        await updateBanner(bannerData).unwrap();
        setLocalActiveBanner((prev) => ({
          ...prev,
          [imageField]: '',
          title: bannerTitle || activeBanner.title,
        }));
      }

      await refetch();
      toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} image deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete ${type === 'free' ? 'free banner' : 'paid banner'} image: ${error.data?.message || error.message}`);
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleBannerDetailsSubmit = async (type) => {
    try {
      if (!bannerTitle) throw new Error('Please provide a banner title');
      if (!companyName) throw new Error('Please provide a company name');
      // if (type === 'paid' && !isRoyal && !pendingBannerPayment && !activeBannerPayment) {
      //   throw new Error('You need to purchase a banner ad or have a Royal plan to upload a paid banner');
      // }

      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');

      if (isUploading[type]) throw new Error('Submission in progress, please wait');

      await refetch();

      const sanitizedCompanyName = sanitizeCompanyName(companyName);
      let imageUrl = type === 'free' ? rectangleLogoUrl : bannerImageUrl;
      const file = selectedFile[type];

      if (file) {
        setIsUploading((prev) => ({ ...prev, [type]: true }));
        const uploadMutation = type === 'free'
          ? (isUpdateMode.free && activeBanner?.rectangle_logo ? updateRectangleLogo : uploadRectangleLogo)
          : (isUpdateMode.paid && activeBanner?.banner_image ? updateBannerImage : uploadBannerImage);

        const response = await uploadMutation({
          file,
          company_name: sanitizedCompanyName,
          old_image_url: isUpdateMode[type] ? activeBanner?.[type === 'free' ? 'rectangle_logo' : 'banner_image'] : undefined,
        }).unwrap();
        imageUrl = response.imageUrl;
        toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} image uploaded successfully`);
      }

      const bannerData = {
        user_id: userId,
        subscription_id: subscriptionId,
        banner_payment_id: type === 'paid' ? (pendingBannerPayment?._id || activeBannerPayment?._id) || null : activeBanner?.banner_payment_id || null,
        title: bannerTitle,
        company_name: sanitizedCompanyName,
        banner_image: type === 'paid' ? imageUrl : activeBanner?.banner_image || '',
        rectangle_logo: type === 'free' ? imageUrl : activeBanner?.rectangle_logo || '',
      };

      if (activeBanner?._id) {
        bannerData.banner_id = activeBanner._id;
        await updateBanner(bannerData).unwrap();
        setLocalActiveBanner((prev) => ({ ...prev, ...bannerData, _id: activeBanner._id }));
        toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} updated successfully`);
      } else {
        const response = await createBanner(bannerData).unwrap();
        const newBanner = response.banner || response;
        setLocalActiveBanner((prev) => ({ ...newBanner, ...bannerData, _id: newBanner._id || newBanner.banner_id }));
        toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} created successfully`);
      }


      if (type === 'free') {
        setRectangleLogoUrl(imageUrl || '');
        setRectangleLogoPreview(imageUrl || '');
        setSelectedFile((prev) => ({ ...prev, free: null }));
        setIsFreeBannerOpen(false);
      } else {
        setBannerImageUrl(imageUrl || '');
        setBannerPreview(imageUrl || '');
        setSelectedFile((prev) => ({ ...prev, paid: null }));
        setIsPaidBannerOpen(false);
      }

      setBannerTitle('');
      await refetch();
    } catch (error) {
      toast.error(`Failed to submit ${type === 'free' ? 'free banner' : 'paid banner'} details: ${error.data?.message || error.message}`);
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDeleteBanner = async (type) => {
    try {
      if (!activeBanner) throw new Error('No banner to delete');
      const sanitizedCompanyName = sanitizeCompanyName(companyName || activeBanner.company_name);

      if (type === 'free' && activeBanner.rectangle_logo) {
        await deleteRectangleLogo({ company_name: sanitizedCompanyName, image_url: activeBanner.rectangle_logo }).unwrap();
      }
      if (type === 'paid' && activeBanner.banner_image) {
        await deleteBannerImage({ company_name: sanitizedCompanyName, image_url: activeBanner.banner_image }).unwrap();
      }

      if (
        (type === 'free' && !activeBanner.banner_image) ||
        (type === 'paid' && !activeBanner.rectangle_logo)
      ) {
        await deleteBanner(activeBanner._id).unwrap();
        setLocalActiveBanner(null);
        setBannerImageUrl('');
        setRectangleLogoUrl('');
        setBannerPreview('');
        setRectangleLogoPreview('');
        setSelectedFile({ free: null, paid: null });
        setBannerTitle('');
        setCompanyName('');
      } else {
        const bannerData = {
          banner_id: activeBanner._id,
          user_id: user?.user?._id,
          subscription_id: subscriptionId,
          banner_payment_id: type === 'paid' ? null : activeBanner.banner_payment_id || null,
          title: bannerTitle || activeBanner.title,
          company_name: sanitizedCompanyName,
          banner_image: type === 'paid' ? '' : activeBanner.banner_image,
          rectangle_logo: type === 'free' ? '' : activeBanner.rectangle_logo,
        };
        await updateBanner(bannerData).unwrap();
        setLocalActiveBanner((prev) => ({
          ...prev,
          [type === 'free' ? 'rectangle_logo' : 'banner_image']: '',
          title: bannerTitle || activeBanner.title,
        }));
        if (type === 'free') {
          setRectangleLogoUrl('');
          setRectangleLogoPreview('');
          setSelectedFile((prev) => ({ ...prev, free: null }));
        } else {
          setBannerImageUrl('');
          setBannerPreview('');
          setSelectedFile((prev) => ({ ...prev, paid: null }));
        }
      }

      await refetch();
      toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete ${type === 'free' ? 'free banner' : 'paid banner'}: ${error.data?.message || error.message}`);
    } finally {
      setIsDeleteConfirmOpen((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleUpdateBanner = (type) => {
    setIsUpdateMode((prev) => ({ ...prev, [type]: true }));
    setCompanyName(activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
    setBannerTitle(activeBanner?.title || activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
    if (type === 'free') {
      setRectangleLogoUrl(activeBanner?.rectangle_logo || '');
      setRectangleLogoPreview(activeBanner?.rectangle_logo || '');
      setIsFreeBannerOpen(true);
    } else {
      setBannerImageUrl(activeBanner?.banner_image || '');
      setBannerPreview(activeBanner?.banner_image || '');
      setIsPaidBannerOpen(true);
    }
  };

  useEffect(() => {
    // Only update automatically from props if the prop has data.
    // This allows us to maintain local state (set after upload) until the server data is fresh.
    if (activeBanner) {
      setLocalActiveBanner(activeBanner);
    }
    
    // These defaults should still be set even if activeBanner is null
    setCompanyName(activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
    setBannerTitle(activeBanner?.title || activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
    setBannerImageUrl(activeBanner?.banner_image || '');
    setRectangleLogoUrl(activeBanner?.rectangle_logo || '');
    setBannerPreview(activeBanner?.banner_image || '');
    setRectangleLogoPreview(activeBanner?.rectangle_logo || '');
    setSelectedFile({ free: null, paid: null });

    return () => {
      if (bannerPreview && bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
      if (rectangleLogoPreview && rectangleLogoPreview.startsWith('blob:')) URL.revokeObjectURL(rectangleLogoPreview);
    };
  }, [activeBanner, user, fetchedBusinessName]);


  // Banner Plan Functions
  const handleDaysChange = (e) => {
    const inputDays = parseInt(e.target.value, 10);

    if (!isNaN(inputDays) && inputDays > 0) {
      setDays(inputDays);
      setAmount(inputDays * perDayAmount);
    } else {
      setDays('');
      setAmount(0);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error('Razorpay key ID is missing');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) throw new Error('Failed to load Razorpay script');

      const { order } = await createBannerOrder({
        user_id: userId,
        days,
        amount,
        subscription_id: subscriptionId,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Subscription Payment',
        description: `Purchasing banner for ${days} days`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyBannerPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              toast.success(`Payment for ${days} days (₹${totalAmount.toFixed(2)}) completed. You can now upload your paid banner.`);
              await refetch();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error(`Error verifying payment: ${error.message}`);
          }
        },
        prefill: {
          email: user?.user?.email || 'demo@example.com',
          contact: user?.user?.contact || '9999999999',
        },
        theme: { color: '#0c1f4d' },
        config: RAZORPAY_GLOBAL_CONFIG,
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
      razorpay.open();
    } catch (error) {
      toast.error(`Something went wrong: ${error.message}`);
    } finally {
      setIsRazorpayLoading(false);
      setIsPurchaseOpen(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!days || !amount) throw new Error('Please specify the number of days');
      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');
      if (!activeBannerPayment) throw new Error('No active banner to upgrade');

      setIsRazorpayLoading(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) throw new Error('Failed to load Razorpay script');

      const { order } = await upgradeBanner({
        user_id: userId,
        old_banner_payment_id: activeBannerPayment._id,
        days,
        amount,
        subscription_id: subscriptionId,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Banner Upgrade Payment',
        description: `Upgrading banner for ${days} days`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyBannerPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyRes.success) {
              toast.success(`Banner upgraded for ${days} days for ₹${totalAmount.toFixed(2)}`);
              await refetch();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error(`Error verifying upgrade payment: ${error.message}`);
          }
        },
        prefill: {
          email: user?.user?.email || 'demo@example.com',
          contact: user?.user?.contact || '9999999999',
        },
        theme: { color: '#0c1f4d' },
        config: RAZORPAY_GLOBAL_CONFIG,
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => toast.error('Upgrade payment failed. Please try again.'));
      razorpay.open();
    } catch (error) {
      toast.error(`Something went wrong: ${error.message}`);
    } finally {
      setIsRazorpayLoading(false);
      setIsUpgradeOpen(false);
    }
  };

  const handleCancel = async () => {
    if (!activeBannerPayment?._id) {
      toast.error('No active paid banner plan found to cancel.');
      setIsCancelDialogOpen(false);
      return;
    }

    try {
      console.log('Attempting to cancel banner payment ID:', activeBannerPayment._id);
      await cancelBanner(activeBannerPayment._id).unwrap();
      toast.success('Paid banner plan cancelled successfully!');
      await refetch();
    } catch (error) {
      console.error('Cancel banner failed:', error);
      toast.error(`Failed to cancel plan: ${error?.data?.message || error.message || 'Server error'}`);
    } finally {
      setIsCancelDialogOpen(false);
    }
  };

  const hasBannerFeature = features?.banner === true;

  const showPaidBannerSection =
    hasBannerFeature || isRoyal || !!activeBannerPayment || !!pendingBannerPayment;

  const disablePaidBannerButton =
    !hasBannerFeature && !isRoyal && !activeBannerPayment && !pendingBannerPayment;

  const disableFreeBannerButton = !!activeBanner?.rectangle_logo && !isUpdateMode.free;

  // Show table if ANY banner (free or paid) exists
  const hasAnyBanner =
    (localActiveBanner?.banner_image || activeBanner?.banner_image) ||
    (localActiveBanner?.rectangle_logo || activeBanner?.rectangle_logo);

  if (loading || isBannerAmountLoading) {
    return <Loader />;
  }

  return (
    <Card className="border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md mt-6 w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-[#0c1f4d] text-center">Banner Details Management</CardTitle>
      </CardHeader>
      {(isRazorpayLoading || isBannerAmountLoading || isGSTLoading || Object.values(isUploading).some(v => v)) && (
        <Loader label="Processing banner request..." />
      )}
      <CardContent className="space-y-6 px-4 sm:px-6">

        {/* Paid Banner Section - Upload Button at Top */}

        <div>
          <h3 className="text-lg md:text-xl font-semibold text-[#0c1f4d] mb-2">
            Paid Banner (Large Banner)
          </h3>

          {bannerExpireData && (
            <BannerExpiryInfo expiresAt={bannerExpireData} />
          )}

          <p className="text-sm text-gray-600 mb-4">
            Upload a banner (1220x274 pixels) to display in the premium banner position.
          </p>

          <div className="text-center">

            {/* ✅ IF PLAN EXISTS → SHOW UPLOAD BUTTON */}
            {bannerExpireData ? (
              <Button
                className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4dcc] text-white px-4 py-2"
                onClick={() => {
                  setIsUpdateMode((prev) => ({
                    ...prev,
                    paid: !!activeBanner?.banner_image,
                  }));
                  setIsPaidBannerOpen(true);
                }}
              >
                {activeBanner?.banner_image
                  ? "Update Paid Banner"
                  : "Upload Paid Banner"}
              </Button>
            ) : planCode === "FREE" ? (
              /* 🚫 FREE PLAN → DISABLE PURCHASE AND SHOW WARNING */
              <div className="flex flex-col items-center gap-3">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-left font-medium">
                    Premium Paid Banners are only available for Paid Subscription users. 
                    Please upgrade your base plan to BASIC or higher to enable this feature.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  disabled
                >
                  Purchase Banner Ad (Disabled)
                </Button>
              </div>
            ) : (
              /* ❌ NO PLAN → SHOW PURCHASE BUTTON */
              <Button
                className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4dcc] text-white px-4 py-2"
                onClick={() => setIsPurchaseOpen(true)}
              >
                Purchase Banner Ad
              </Button>
            )}
          </div>

          {/* ✅ If Plan Exists → Show Upgrade & Cancel */}
          {bannerExpireData && activeBannerPayment && (
            <div className="mt-6 border-t pt-6 space-y-4">

              <h4 className="text-md font-semibold text-[#0c1f4d]">
                Active Paid Banner Plan
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Duration</p>
                  <p className="font-semibold">{activeBannerPayment.days} days</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Base Amount</p>
                  <p className="font-semibold">₹{activeBannerPayment.amount}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">GST</p>
                  <p className="font-semibold">
                    ₹{activeBannerPayment.gst_amount || 0}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Total Paid</p>
                  <p className="font-bold text-green-700">
                    ₹
                    {(
                      (activeBannerPayment.amount || 0) +
                      (activeBannerPayment.gst_amount || 0)
                    ).toFixed(2)}
                  </p>
                </div>

              </div>

              {/* 🔥 Lifetime Tracking Summary */}
              {tracking && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                  <h5 className="font-semibold text-blue-800">
                    Banner Investment Summary
                  </h5>

                  <p className="text-sm">
                    Total Base Spent: ₹{tracking.totalSpent}
                  </p>

                  <p className="text-sm">
                    Total GST Paid: ₹{tracking.totalGST}
                  </p>

                  <p className="font-bold text-blue-900">
                    Total Invested: ₹{tracking.totalWithGST}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dcc]"
                  onClick={() => setIsUpgradeOpen(true)}
                >
                  Buy Banner Ad
                </Button>

                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => setIsCancelDialogOpen(true)}
                >
                  Cancel Plan
                </Button>
              </div>
            </div>
          )}

        </div>


        {/* Free Banner Section */}
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-[#0c1f4d] mb-2">Free Banner (Rectangle Logo)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Available to all users. Upload a banner (200x100 pixels) to display in the free banner position.
          </p>
          <div className="text-center">
            <Button
              className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4dcc] text-white px-4 py-2"
              onClick={() => {
                setIsUpdateMode((prev) => ({ ...prev, free: !!activeBanner?.rectangle_logo }));
                setIsFreeBannerOpen(true);
              }}
              disabled={disableFreeBannerButton}
            >
              {activeBanner?.rectangle_logo ? 'Update Free Banner' : 'Upload Free Banner'}
            </Button>
            {disableFreeBannerButton && (
              <p className="text-red-600 text-sm mt-2">
                You already have a free banner. Please update or delete the existing banner.
              </p>
            )}
          </div>
        </div>


          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#0c1f4d]">Current Banners</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* FREE BANNER CARD */}
                <div className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  {/* Header / Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 text-xs font-semibold tracking-wide text-blue-800 bg-blue-100 border border-blue-200 rounded-full shadow-sm">
                      Free Position
                    </span>
                  </div>

                  {/* Action Buttons (Top Right) */}
                  <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-white/90 text-gray-700 hover:text-blue-700 hover:bg-white shadow-sm backdrop-blur-sm"
                      onClick={() => handleUpdateBanner('free')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {(localActiveBanner?.rectangle_logo || activeBanner?.rectangle_logo) && (
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-white/90 text-gray-700 hover:text-red-600 hover:bg-white shadow-sm backdrop-blur-sm"
                        onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: true }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Image Area */}
                  <div className="w-full h-48 bg-gray-50 flex items-center justify-center p-4">
                    <Zoom>
                      <img
                        src={(localActiveBanner?.rectangle_logo || activeBanner?.rectangle_logo) || noImage}
                        alt="Free Banner"
                        className="max-h-full max-w-full object-contain drop-shadow-sm transform group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          if (e.currentTarget.src !== noImage) e.currentTarget.src = noImage;
                        }}
                      />
                    </Zoom>
                  </div>

                  {/* Details Footer */}
                  <div className="p-5 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Title</p>
                        <p className="text-sm font-semibold text-gray-800 truncate" title={localActiveBanner?.title || activeBanner?.title}>
                          {localActiveBanner?.title || activeBanner?.title || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Company</p>
                        <p className="text-sm font-semibold text-gray-800 truncate" title={localActiveBanner?.company_name || activeBanner?.company_name}>
                          {localActiveBanner?.company_name || activeBanner?.company_name || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Mobile-only Action Bar (visible if hover isn't possible) */}
                    <div className="mt-4 flex gap-3 sm:hidden pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        className="flex-1 h-9 text-xs"
                        onClick={() => handleUpdateBanner('free')}
                      >
                        <Pencil className="w-3 h-3 mr-2" /> Edit
                      </Button>
                      {(localActiveBanner?.rectangle_logo || activeBanner?.rectangle_logo) && (
                        <Button
                          variant="outline"
                          className="flex-1 h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                          onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: true }))}
                        >
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

              {/* PAID BANNER CARD */}
                <div className="group relative bg-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ring-1 ring-amber-100/50">
                  {/* Header / Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 text-xs font-semibold tracking-wide text-amber-800 bg-amber-100 border border-amber-200 rounded-full shadow-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Premium Position
                    </span>
                  </div>

                  {/* Action Buttons (Top Right) */}
                  <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-white/90 text-gray-700 hover:text-blue-700 hover:bg-white shadow-sm backdrop-blur-sm"
                      onClick={() => handleUpdateBanner('paid')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {(localActiveBanner?.banner_image || activeBanner?.banner_image) && (
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-white/90 text-gray-700 hover:text-red-600 hover:bg-white shadow-sm backdrop-blur-sm"
                        onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: true }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Image Area */}
                  <div className="w-full h-48 bg-gray-50 flex items-center justify-center p-4">
                    <Zoom>
                      <img
                        src={(localActiveBanner?.banner_image || activeBanner?.banner_image) || noImage}
                        alt="Paid Banner"
                        className="max-h-full max-w-full object-contain drop-shadow-sm transform group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          if (e.currentTarget.src !== noImage) e.currentTarget.src = noImage;
                        }}
                      />
                    </Zoom>
                  </div>

                  {/* Details Footer */}
                  <div className="p-5 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Title</p>
                        <p className="text-sm font-semibold text-gray-800 truncate" title={localActiveBanner?.title || activeBanner?.title}>
                          {localActiveBanner?.title || activeBanner?.title || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Company</p>
                        <p className="text-sm font-semibold text-gray-800 truncate" title={localActiveBanner?.company_name || activeBanner?.company_name}>
                          {localActiveBanner?.company_name || activeBanner?.company_name || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Mobile-only Action Bar */}
                    <div className="mt-4 flex gap-3 sm:hidden pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        className="flex-1 h-9 text-xs"
                        onClick={() => handleUpdateBanner('paid')}
                      >
                        <Pencil className="w-3 h-3 mr-2" /> Edit
                      </Button>
                      {(localActiveBanner?.banner_image || activeBanner?.banner_image) && (
                        <Button
                          variant="outline"
                          className="flex-1 h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                          onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: true }))}
                        >
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

            </div>
          </div>

      </CardContent>

      {/* Free Banner Dialog */}
      <Dialog open={isFreeBannerOpen} onOpenChange={(open) => {
        setIsFreeBannerOpen(open);
        if (!open) {
          setSelectedFile((prev) => ({ ...prev, free: null }));
          setRectangleLogoPreview(activeBanner?.rectangle_logo || '');
          setRectangleLogoUrl(activeBanner?.rectangle_logo || '');
          setCompanyName(activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
          setBannerTitle(activeBanner?.title || activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
        }
      }}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>{isUpdateMode.free ? 'Update Free Banner' : 'Upload Free Banner'}</DialogTitle>
            <DialogDescription>
              Upload a banner (200x100 pixels) to display in the free banner position.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Company Name"
              value={companyName}
              readOnly
              className="w-full bg-gray-100 text-gray-500 cursor-not-allowed opacity-75 focus-visible:ring-0 border-2 border-slate-300"
            />

            <Input
              type="text"
              placeholder="Banner Title"
              value={bannerTitle}
              readOnly
              className="w-full bg-gray-100 text-gray-500 cursor-not-allowed opacity-75 focus-visible:ring-0 border-2 border-slate-300"
            />
            <Input type="file" id="free-banner-image" accept="image/*" onChange={(e) => handleImageChange(e, 'free')} className="w-full cursor-pointer" disabled={!companyName || isUploading.free} />
            {/* Custom Upload UI */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Banner Image</label>

              {(rectangleLogoPreview || rectangleLogoUrl || (isUpdateMode.free && activeBanner?.rectangle_logo)) ? (
                // PREVIEW MODE
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                  <Zoom>
                    <img
                      src={rectangleLogoPreview || rectangleLogoUrl || activeBanner?.rectangle_logo}
                      alt="Free Banner Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        if (e.currentTarget.src !== noImage) {
                          e.currentTarget.src = noImage;
                        }
                      }}
                    />
                  </Zoom>

                  {/* Overlay Actions */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      className="bg-[#0c1f4d] text-white hover:bg-blue-700 h-8 w-8 shadow-md"
                      size="icon"
                      onClick={() => document.getElementById('free-banner-image').click()}
                      disabled={isUploading.free}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700 h-8 w-8 shadow-md"
                      size="icon"
                      onClick={() => {
                        if (selectedFile.free && !rectangleLogoUrl && !activeBanner?.rectangle_logo) {
                          setSelectedFile((prev) => ({ ...prev, free: null }));
                          setRectangleLogoPreview('');
                        } else {
                          handleDeleteImage('free', rectangleLogoUrl || activeBanner?.rectangle_logo);
                        }
                      }}
                      disabled={isUploading.free || !(rectangleLogoUrl || activeBanner?.rectangle_logo || rectangleLogoPreview)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // UPLOAD MODE (Custom Design)
                <div
                  onClick={() => {
                    if (companyName && !isUploading.free) {
                      document.getElementById('free-banner-image').click()
                    }
                  }}
                  className={`
        relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-200 group
        ${(!companyName || isUploading.free) ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' : 'border-gray-300 bg-white hover:bg-blue-50/50 hover:border-[#0c1f4d] cursor-pointer'}
      `}
                >
                  <div className="p-4 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors mb-3">
                    <UploadCloud className="h-6 w-6 text-gray-500 group-hover:text-[#0c1f4d]" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Click to upload banner
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PNG, JPG, JPEG
                  </p>

                  {/* HINT for Free Banner */}
                  <div className="mt-4 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded text-[11px] text-yellow-700 font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    <span>Recommended Size: 200 x 100 px</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4dcc] text-white" onClick={() => setIsViewImageOpen((prev) => ({ ...prev, free: true }))}>
                <Eye className="h-5 w-5 mr-2" />
                View Banner Position
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsFreeBannerOpen(false)}>Cancel</Button>
            <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4ddb]" disabled={!bannerTitle || !companyName || isUploading.free} onClick={() => handleBannerDetailsSubmit('free')}>
              {isUpdateMode.free ? 'Update Free Banner' : 'Submit Free Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {showPaidBannerSection && (
        <Dialog open={isPaidBannerOpen} onOpenChange={(open) => {
          setIsPaidBannerOpen(open);
          if (!open) {
            setSelectedFile((prev) => ({ ...prev, paid: null }));
            setBannerPreview(activeBanner?.banner_image || '');
            setBannerImageUrl(activeBanner?.banner_image || '');
            setCompanyName(activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
            setBannerTitle(activeBanner?.title || activeBanner?.company_name || fetchedBusinessName || user?.user?.company_name || '');
          }
        }}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>{isUpdateMode.paid ? 'Update Paid Banner' : 'Upload Paid Banner'}</DialogTitle>
              <DialogDescription>
                Upload a banner to display in the premium position.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Text Inputs */}
              {/* Company Name - Read Only / Patched */}
              <Input
                type="text"
                placeholder="Company Name"
                value={companyName}
                // removed onChange if you strictly don't want them to edit it manually
                readOnly
                className="w-full bg-gray-100 text-gray-600 cursor-not-allowed focus-visible:ring-0 opacity-80 border-2 border-slate-300"
                tabIndex="-1" // Prevents tab focus if you want to skip it
              />

              {/* Banner Title - Read Only / Patched */}
              <Input
                type="text"
                placeholder="Banner Title"
                value={bannerTitle}
                // removed onChange
                readOnly
                className="w-full bg-gray-100 text-gray-600 cursor-not-allowed focus-visible:ring-0 opacity-80 border-2 border-slate-300"
                tabIndex="-1"
              />

              {/* Hidden File Input - Triggered by the custom UI below */}
              <input
                type="file"
                id="paid-banner-image"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, 'paid')}
                disabled={!companyName || isUploading.paid}
              />

              {/* Custom Upload UI */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Banner Image</label>

                {(bannerPreview || bannerImageUrl || (isUpdateMode.paid && activeBanner?.banner_image)) ? (
                  // PREVIEW MODE (When image is selected)
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                    <Zoom>
                      <img
                        src={bannerPreview || bannerImageUrl || activeBanner?.banner_image}
                        alt="Paid Banner Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          if (e.currentTarget.src !== noImage) {
                            e.currentTarget.src = noImage;
                          }
                        }}
                      />
                    </Zoom>

                    {/* Overlay Actions */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        className="bg-[#0c1f4d] text-white hover:bg-blue-700 h-8 w-8 shadow-md"
                        size="icon"
                        onClick={() => document.getElementById('paid-banner-image').click()}
                        disabled={isUploading.paid}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700 h-8 w-8 shadow-md"
                        size="icon"
                        onClick={() => {
                          if (selectedFile.paid && !bannerImageUrl && !activeBanner?.banner_image) {
                            setSelectedFile((prev) => ({ ...prev, paid: null }));
                            setBannerPreview('');
                          } else {
                            handleDeleteImage('paid', bannerImageUrl || activeBanner?.banner_image);
                          }
                        }}
                        disabled={isUploading.paid || !(bannerImageUrl || activeBanner?.banner_image || bannerPreview)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // UPLOAD MODE (Custom Design)
                  <div
                    onClick={() => {
                      if (companyName && !isUploading.paid) {
                        document.getElementById('paid-banner-image').click()
                      }
                    }}
                    className={`
        relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-200 group
        ${(!companyName || isUploading.paid) ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' : 'border-gray-300 bg-white hover:bg-blue-50/50 hover:border-[#0c1f4d] cursor-pointer'}
      `}
                  >
                    <div className="p-4 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors mb-3">
                      <UploadCloud className="h-6 w-6 text-gray-500 group-hover:text-[#0c1f4d]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      Click to upload banner
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PNG, JPG, JPEG
                    </p>

                    {/* HINT for Paid Banner */}
                    <div className="mt-4 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded text-[11px] text-yellow-700 font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Recommended Size: 1220 x 274 px</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4dcc] text-white w-full sm:w-auto" onClick={() => setIsViewImageOpen((prev) => ({ ...prev, paid: true }))}>
                  <Eye className="h-5 w-5 mr-2" />
                  View Banner Position
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => setIsPaidBannerOpen(false)}>Cancel</Button>
              <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4ddb]" disabled={!bannerTitle || !companyName || isUploading.paid} onClick={() => handleBannerDetailsSubmit('paid')}>
                {isUpdateMode.paid ? 'Update Paid Banner' : 'Submit Paid Banner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Free Banner Position */}
      <Dialog open={isViewImageOpen.free} onOpenChange={(open) => setIsViewImageOpen((prev) => ({ ...prev, free: open }))}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader><DialogTitle>Free Banner Position Preview</DialogTitle></DialogHeader>
          <Zoom><img src={FREE_BANNER_POSITION_PATH} alt="Free Banner Position" className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg mx-auto" /></Zoom>
          <DialogFooter><Button variant="outline" className="cursor-pointer" onClick={() => setIsViewImageOpen((prev) => ({ ...prev, free: false }))}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Paid Banner Position */}
      <Dialog open={isViewImageOpen.paid} onOpenChange={(open) => setIsViewImageOpen((prev) => ({ ...prev, paid: open }))}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader><DialogTitle>Paid Banner Position Preview</DialogTitle></DialogHeader>
          <Zoom><img src={PAID_BANNER_POSITION_PATH} alt="Paid Banner Position" className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg mx-auto" /></Zoom>
          <DialogFooter><Button variant="outline" className="cursor-pointer" onClick={() => setIsViewImageOpen((prev) => ({ ...prev, paid: false }))}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation - Free */}
      <Dialog open={isDeleteConfirmOpen.free} onOpenChange={(open) => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: open }))}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader><DialogTitle>Confirm Free Banner Deletion</DialogTitle></DialogHeader>
          <DialogDescription>Are you sure you want to delete the free banner? This action will remove the banner image from the server and database. This cannot be undone.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: false }))}>Cancel</Button>
            <Button className="bg-red-600 cursor-pointer text-white hover:bg-red-700" onClick={() => handleDeleteBanner('free')}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation - Paid */}
      <Dialog open={isDeleteConfirmOpen.paid} onOpenChange={(open) => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: open }))}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader><DialogTitle>Confirm Paid Banner Deletion</DialogTitle></DialogHeader>
          <DialogDescription>Are you sure you want to delete the paid banner? This action will remove the banner image from the server and database. This cannot be undone.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: false }))}>Cancel</Button>
            <Button className="bg-red-600 text-white cursor-pointer hover:bg-red-700" onClick={() => handleDeleteBanner('paid')}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Purchase Banner Ad</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input type="number" placeholder="e.g. 30" value={days} onChange={handleDaysChange} className="w-full border-2 border-slate-300" min="1" />
            {isGSTLoading ? (
              <p className="text-sm text-gray-600">Loading GST...</p>
            ) : gstError ? (
              <p className="text-sm text-red-600">Failed to load GST details</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Base Cost: ₹{amount} (₹{perDayAmount} per day)
                </p>

                <p className="text-sm text-gray-600">GST ({gstPercentage}%): ₹{gstAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 font-bold">Total Cost: ₹{totalAmount.toFixed(2)}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsPurchaseOpen(false)}>Cancel</Button>
            <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4ddb]" disabled={!days || amount <= 0 || isRazorpayLoading || isGSTLoading || gstError} onClick={handlePurchase}>
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upgrade Banner Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input type="number" placeholder="e.g. 30" value={days} onChange={handleDaysChange} className="w-full border-2 border-slate-300" min="1" />
            {isGSTLoading ? (
              <p className="text-sm text-gray-600">Loading GST...</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Base Cost: ₹{amount} (₹{perDayAmount} per day)
                </p>
                <p className="text-sm text-gray-600">GST ({gstPercentage}%): ₹{gstAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 font-bold">Total Cost: ₹{totalAmount.toFixed(2)}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsUpgradeOpen(false)}>Cancel</Button>
            <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c1f4ddb]" disabled={!days || amount <= 0 || isRazorpayLoading || isGSTLoading} onClick={handleUpgrade}>
              {isRazorpayLoading ? 'Loading Payment...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Cancellation</DialogTitle></DialogHeader>
          <p>Are you sure you want to cancel your paid banner subscription?</p>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsCancelDialogOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 cursor-pointer text-white hover:bg-red-700" onClick={handleCancel}>Okay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BannerDetailsManagement;
