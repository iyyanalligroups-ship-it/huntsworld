import { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Pencil, Eye } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '@/redux/api/BannerPaymentApi';
import {
  useUploadBannerImageMutation,
  useUploadRectangleLogoMutation,
  useUpdateBannerImageMutation,
  useUpdateRectangleLogoMutation,
  useDeleteBannerImageMutation,
  useDeleteRectangleLogoMutation,
} from '@/redux/api/BannerImageApi';
import { toast } from 'react-toastify';
import FREE_BANNER_POSITION_PATH from "@/assets/images/free-banner-position.png";
import PAID_BANNER_POSITION_PATH from "@/assets/images/paid-banner-position.png";
import { AuthContext } from '@/modules/landing/context/AuthContext';
import axios from 'axios';

const BannerDetailsManagement = ({  subscriptionId, activeBanner, activeBannerPayment, pendingBannerPayment, refetch, isRoyal }) => {
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
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [uploadBannerImage] = useUploadBannerImageMutation();
  const [uploadRectangleLogo] = useUploadRectangleLogoMutation();
  const [updateBannerImage] = useUpdateBannerImageMutation();
  const [updateRectangleLogo] = useUpdateRectangleLogoMutation();
  const [deleteBannerImage] = useDeleteBannerImageMutation();
  const [deleteRectangleLogo] = useDeleteRectangleLogoMutation();
const { user } = useContext(AuthContext);
  const token = user?.token || sessionStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const FREE_BANNER_DIMENSIONS = { width: 200, height: 100 };
  const PAID_BANNER_DIMENSIONS = { width: 1220, height: 274 };

  const sanitizeCompanyName = (name) => name.replace(/[^a-zA-Z0-9\s]/g, '_').trim();

  const validateFile = (file, type) => {
    if (!file) return false;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 200 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type for ${file.name}. Allowed types: JPEG, JPG, PNG, GIF, WebP.`);
      return false;
    }
    if (file.size > maxSize) {
      toast.error(`File ${file.name} exceeds 200MB limit.`);
      return false;
    }
    return true;
  };

  const fetchBusinessName = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/merchants/get-business-name`, // your backend URL
          { user_id: user?.user?._id },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // Send token
            },
          }
        );

        if (response.data.success) {
          console.log(response,'get business name');
          
          setCompanyName(response.data.data.business_name); // { role, business_name }
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

 useEffect(()=>{

    fetchBusinessName();
 },[user,companyName])
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
      console.error('Invalid image type:', type);
      toast.error('Invalid image type provided');
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    if (!file || !validateFile(file, type)) {
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

      console.log(`Deleting ${type} image:`, { company_name: sanitizedCompanyName, image_url: imageUrl });
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
        console.log(`Updating banner after delete with data:`, bannerData);
        await updateBanner(bannerData).unwrap();
        setLocalActiveBanner((prev) => ({
          ...prev,
          [imageField]: '',
          title: bannerTitle || activeBanner.title,
        }));
        console.log(`Updated banner in database: removed ${type} image URL`);
      }

      try {
        const refetchResponse = await refetch();
        console.log('Refetch response after delete:', refetchResponse);
        console.log('Active banner after refetch:', activeBanner);
      } catch (error) {
        console.error('Refetch failed:', error);
        toast.error('Failed to refresh banner data');
      }

      toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} image deleted successfully`);
    } catch (error) {
      console.error(`Delete ${type} Image Error:`, {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to delete ${type === 'free' ? 'free banner' : 'paid banner'} image: ${error.data?.message || error.message}`);
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleBannerDetailsSubmit = async (type) => {
    try {
      if (!bannerTitle) throw new Error('Please provide a banner title');
      if (!companyName) throw new Error('Please provide a company name');
      if (type === 'paid' && !isRoyal && !pendingBannerPayment && !activeBannerPayment) {
        throw new Error('You need to purchase a banner ad or have a Royal plan to upload a paid banner');
      }

      const userId = user?.user?._id;
      if (!userId) throw new Error('User not logged in');
      if (!subscriptionId) throw new Error('No subscription ID found');

      if (isUploading[type]) {
        throw new Error('Submission in progress, please wait');
      }

      console.log('Refetching active banner before submission...');
      console.log('Current activeBanner:', activeBanner ? JSON.stringify(activeBanner) : 'None');
      try {
        const refetchResponse = await refetch();
        console.log('Refetch response:', JSON.stringify(refetchResponse));
        console.log('Active banner after refetch:', activeBanner ? JSON.stringify(activeBanner) : 'None');
      } catch (error) {
        console.error('Pre-submission refetch failed:', error);
        toast.error('Failed to refresh banner data before submission. Please try again.');
        return;
      }

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
        console.log(`Upload ${type} response:`, JSON.stringify(response));
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

      console.log(`Submitting ${type} banner with data:`, JSON.stringify(bannerData));
      console.log(`Using ${activeBanner?._id ? 'updateBanner' : 'createBanner'} for submission`);

      if (activeBanner?._id) {
        bannerData.banner_id = activeBanner._id;
        const response = await updateBanner(bannerData).unwrap();
        console.log(`Update banner response:`, JSON.stringify(response));
        setLocalActiveBanner({
          ...activeBanner,
          ...bannerData,
          _id: activeBanner._id,
        });
        toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} updated successfully`);
      } else {
        const response = await createBanner(bannerData).unwrap();
        console.log(`Create banner response:`, JSON.stringify(response));
        setLocalActiveBanner({
          _id: response.banner_id || response._id,
          ...bannerData,
        });
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
      setCompanyName(user?.user?.company_name || '');

      try {
        const refetchResponse = await refetch();
        console.log('Refetch response after submit:', JSON.stringify(refetchResponse));
        console.log('Active banner after refetch:', activeBanner ? JSON.stringify(activeBanner) : 'None');
      } catch (error) {
        console.error('Refetch failed:', error);
        toast.error('Failed to refresh banner data');
      }
    } catch (error) {
      console.error(`Banner Details Submit Error (${type}):`, {
        message: error.message,
        status: error.status,
        data: error.data,
      });
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
        console.log(`Updating banner after delete with data:`, bannerData);
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

      try {
        const refetchResponse = await refetch();
        console.log('Refetch response after delete banner:', refetchResponse);
        console.log('Active banner after refetch:', activeBanner);
      } catch (error) {
        console.error('Refetch failed:', error);
        toast.error('Failed to refresh banner data');
      }

      toast.success(`${type === 'free' ? 'Free banner' : 'Paid banner'} deleted successfully`);
    } catch (error) {
      console.error(`Delete ${type} Banner Error:`, {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      toast.error(`Failed to delete ${type === 'free' ? 'free banner' : 'paid banner'}: ${error.data?.message || error.message}`);
    } finally {
      setIsDeleteConfirmOpen((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleUpdateBanner = (type) => {
    setIsUpdateMode((prev) => ({ ...prev, [type]: true }));
    setCompanyName(activeBanner?.company_name || user?.user?.company_name || '');
    setBannerTitle(activeBanner?.title || '');
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
    console.log('useEffect triggered with activeBanner:', activeBanner);
    setLocalActiveBanner(activeBanner);
    setCompanyName(user?.user?.company_name || '');
    setBannerTitle(activeBanner?.title || '');
    setBannerImageUrl(activeBanner?.banner_image || '');
    setRectangleLogoUrl(activeBanner?.rectangle_logo || '');
    setBannerPreview(activeBanner?.banner_image || '');
    setRectangleLogoPreview(activeBanner?.rectangle_logo || '');
    setSelectedFile({ free: null, paid: null });
    return () => {
      if (bannerPreview && bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
      if (rectangleLogoPreview && rectangleLogoPreview.startsWith('blob:')) URL.revokeObjectURL(rectangleLogoPreview);
    };
  }, [activeBanner, user]);

  const showPaidBannerSection = isRoyal || !!activeBannerPayment || !!pendingBannerPayment;
  const disableFreeBannerButton = !!activeBanner?.rectangle_logo && !isUpdateMode.free;
  const disablePaidBannerButton = !showPaidBannerSection || (!!activeBanner?.banner_image && !isUpdateMode.paid);

  return (
    <Card className="border-[#0c1f4d] bg-[#f0f4f6] rounded-xl shadow-md mt-6 mx-auto max-w-7xl w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-[#0c1f4d] text-center">Banner Details Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4 sm:px-6">
        {/* Free Banner Section */}
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-[#0c1f4d] mb-2">Free Banner (Rectangle Logo)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Available to all users. Upload a banner (200x100 pixels) to display in the free banner position.
          </p>
          <div className="text-center">
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white px-4 py-2"
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

        {/* Paid Banner Section */}
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-[#0c1f4d] mb-2">Paid Banner (Large Banner)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Available with a Royal plan or purchased banner ad. Upload a banner (1220x274 pixels) to display in the premium banner position.
          </p>
          <div className="text-center">
            {showPaidBannerSection ? (
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white px-4 py-2"
                onClick={() => {
                  setIsUpdateMode((prev) => ({ ...prev, paid: !!activeBanner?.banner_image }));
                  setIsPaidBannerOpen(true);
                }}
                disabled={disablePaidBannerButton}
              >
                {activeBanner?.banner_image ? 'Update Paid Banner' : 'Upload Paid Banner'}
              </Button>
            ) : (
              <p className="text-red-600 text-sm mt-2">
                Please purchase a banner plan first to upload a paid banner.
              </p>
            )}
            {disablePaidBannerButton && showPaidBannerSection && (
              <p className="text-red-600 text-sm mt-2">
                You already have a paid banner. Please update or delete the existing banner.
              </p>
            )}
          </div>
        </div>

        {/* Current Banner Details */}
        {(localActiveBanner || activeBanner) && (
          <div className="mt-6">
            <h3 className="text-lg md:text-xl font-semibold text-[#0c1f4d] mb-2">Current Banner Details</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="group bg-[#0c1f4d] hover:bg-[#183e96]">
                    <TableHead className="text-white text-xs md:text-sm">Type</TableHead>
                    <TableHead className="text-white text-xs md:text-sm">Title</TableHead>
                    <TableHead className="text-white text-xs md:text-sm">Company Name</TableHead>
                    <TableHead className="text-white text-xs md:text-sm min-w-[150px]">Image</TableHead>
                    <TableHead className="text-white text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(localActiveBanner?.rectangle_logo || activeBanner?.rectangle_logo) && (
                    <TableRow>
                      <TableCell className="text-xs md:text-sm">Free Banner</TableCell>
                      <TableCell className="text-xs md:text-sm">{localActiveBanner?.title || activeBanner?.title}</TableCell>
                      <TableCell className="text-xs md:text-sm">{localActiveBanner?.company_name || activeBanner?.company_name}</TableCell>
                      <TableCell>
                        <div className="relative inline-block">
                          <Zoom>
                            <img
                              src={localActiveBanner?.rectangle_logo || activeBanner?.rectangle_logo}
                              alt="Free Banner"
                              className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg"
                            />
                          </Zoom>
                          <div className="absolute top-0 right-0 flex flex-col gap-1">
                            <Button
                              className="bg-[#0c1f4d] text-white hover:bg-blue-700 w-6 h-6"
                              size="icon"
                              onClick={() => handleUpdateBanner('free')}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              className="bg-red-600 text-white hover:bg-red-700 w-6 h-6"
                              size="icon"
                              onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: true }))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dcc] w-8 h-8"
                          size="icon"
                          onClick={() => handleUpdateBanner('free')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          className="bg-red-600 text-white hover:bg-red-700 w-8 h-8"
                          size="icon"
                          onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: true }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  {(localActiveBanner?.banner_image || activeBanner?.banner_image) && (
                    <TableRow>
                      <TableCell className="text-xs md:text-sm">Paid Banner</TableCell>
                      <TableCell className="text-xs md:text-sm">{localActiveBanner?.title || activeBanner?.title}</TableCell>
                      <TableCell className="text-xs md:text-sm">{localActiveBanner?.company_name || activeBanner?.company_name}</TableCell>
                      <TableCell>
                        <div className="relative inline-block">
                          <Zoom>
                            <img
                              src={localActiveBanner?.banner_image || activeBanner?.banner_image}
                              alt="Paid Banner"
                              className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg"
                            />
                          </Zoom>
                          <div className="absolute top-0 right-0 flex flex-col gap-1">
                            <Button
                              className="bg-[#0c1f4d] text-white hover:bg-blue-700 w-6 h-6"
                              size="icon"
                              onClick={() => handleUpdateBanner('paid')}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              className="bg-red-600 text-white hover:bg-red-700 w-6 h-6"
                              size="icon"
                              onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: true }))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          className="bg-[#0c1f4d] text-white hover:bg-[#0c1f4dcc] w-8 h-8"
                          size="icon"
                          onClick={() => handleUpdateBanner('paid')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          className="bg-red-600 text-white hover:bg-red-700 w-8 h-8"
                          size="icon"
                          onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: true }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      {/* Free Banner Dialog */}
      <Dialog open={isFreeBannerOpen} onOpenChange={(open) => {
        setIsFreeBannerOpen(open);
        if (!open) {
          setSelectedFile((prev) => ({ ...prev, free: null }));
          setRectangleLogoPreview(activeBanner?.rectangle_logo || '');
          setRectangleLogoUrl(activeBanner?.rectangle_logo || '');
          setBannerTitle(activeBanner?.title || '');
          setCompanyName(user?.user?.company_name || '');
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
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full"
            />
            <Input
              type="text"
              placeholder="Banner Title"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              className="w-full"
            />
            <Input
              type="file"
              id="free-banner-image"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'free')}
              className="w-full"
              disabled={!companyName || isUploading.free}
            />
            {(rectangleLogoPreview || rectangleLogoUrl || (isUpdateMode.free && activeBanner?.rectangle_logo)) && (
              <div className="relative mt-2">
                <Zoom>
                  <img
                    src={rectangleLogoPreview || rectangleLogoUrl || activeBanner?.rectangle_logo}
                    alt="Free Banner Preview"
                    className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg"
                  />
                </Zoom>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <Button
                    className="bg-[#0c1f4d] text-white hover:bg-blue-700 w-6 h-6"
                    size="icon"
                    onClick={() => document.getElementById('free-banner-image').click()}
                    disabled={isUploading.free}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700 w-6 h-6"
                    size="icon"
                    onClick={() => handleDeleteImage('free', rectangleLogoUrl || activeBanner?.rectangle_logo)}
                    disabled={isUploading.free || !rectangleLogoUrl}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white"
                onClick={() => setIsViewImageOpen((prev) => ({ ...prev, free: true }))}
              >
                <Eye className="h-5 w-5 mr-2" />
                View Banner Position
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFreeBannerOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
              disabled={!bannerTitle || !companyName || isUploading.free}
              onClick={() => handleBannerDetailsSubmit('free')}
            >
              {isUpdateMode.free ? 'Update Free Banner' : 'Submit Free Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paid Banner Dialog */}
      {showPaidBannerSection && (
        <Dialog open={isPaidBannerOpen} onOpenChange={(open) => {
          setIsPaidBannerOpen(open);
          if (!open) {
            setSelectedFile((prev) => ({ ...prev, paid: null }));
            setBannerPreview(activeBanner?.banner_image || '');
            setBannerImageUrl(activeBanner?.banner_image || '');
            setBannerTitle(activeBanner?.title || '');
            setCompanyName(user?.user?.company_name || '');
          }
        }}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>{isUpdateMode.paid ? 'Update Paid Banner' : 'Upload Paid Banner'}</DialogTitle>
              <DialogDescription>
                Upload a banner (1220x274 pixels) to display in the premium banner position. Requires a Royal plan or purchased banner ad.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full"
              />
              <Input
                type="text"
                placeholder="Banner Title"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                className="w-full"
              />
              <Input
                type="file"
                id="paid-banner-image"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'paid')}
                className="w-full"
                disabled={!companyName || isUploading.paid}
              />
              {(bannerPreview || bannerImageUrl || (isUpdateMode.paid && activeBanner?.banner_image)) && (
                <div className="relative mt-2">
                  <Zoom>
                    <img
                      src={bannerPreview || bannerImageUrl || activeBanner?.banner_image}
                      alt="Paid Banner Preview"
                      className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg"
                    />
                  </Zoom>
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Button
                      className="bg-[#0c1f4d] text-white hover:bg-blue-700 w-6 h-6"
                      size="icon"
                      onClick={() => document.getElementById('paid-banner-image').click()}
                      disabled={isUploading.paid}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700 w-6 h-6"
                      size="icon"
                      onClick={() => handleDeleteImage('paid', bannerImageUrl || activeBanner?.banner_image)}
                      disabled={isUploading.paid || !bannerImageUrl}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Button
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white"
                  onClick={() => setIsViewImageOpen((prev) => ({ ...prev, paid: true }))}
                >
                  <Eye className="h-5 w-5 mr-2" />
                  View Banner Position
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaidBannerOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4ddb]"
                disabled={!bannerTitle || !companyName || isUploading.paid}
                onClick={() => handleBannerDetailsSubmit('paid')}
              >
                {isUpdateMode.paid ? 'Update Paid Banner' : 'Submit Paid Banner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Free Banner Position Image Dialog */}
      <Dialog
        open={isViewImageOpen.free}
        onOpenChange={(open) => setIsViewImageOpen((prev) => ({ ...prev, free: open }))}
      >
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Free Banner Position Preview</DialogTitle>
          </DialogHeader>
          <Zoom>
            <img
              src={FREE_BANNER_POSITION_PATH}
              alt="Free Banner Position"
              className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg mx-auto"
            />
          </Zoom>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewImageOpen((prev) => ({ ...prev, free: false }))}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Paid Banner Position Image Dialog */}
      <Dialog
        open={isViewImageOpen.paid}
        onOpenChange={(open) => setIsViewImageOpen((prev) => ({ ...prev, paid: open }))}
      >
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Paid Banner Position Preview</DialogTitle>
          </DialogHeader>
          <Zoom>
            <img
              src={PAID_BANNER_POSITION_PATH}
              alt="Paid Banner Position"
              className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg mx-auto"
            />
          </Zoom>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewImageOpen((prev) => ({ ...prev, paid: false }))}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog for Free Banner */}
      <Dialog open={isDeleteConfirmOpen.free} onOpenChange={(open) => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: open }))}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Confirm Free Banner Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the free banner? This action will remove the banner image from the server and database. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, free: false }))}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleDeleteBanner('free')}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog for Paid Banner */}
      <Dialog open={isDeleteConfirmOpen.paid} onOpenChange={(open) => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: open }))}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Confirm Paid Banner Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the paid banner? This action will remove the banner image from the server and database. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen((prev) => ({ ...prev, paid: false }))}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleDeleteBanner('paid')}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BannerDetailsManagement;