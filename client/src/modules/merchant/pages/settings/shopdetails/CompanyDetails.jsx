import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { Edit, Save, X, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { validateAadhar } from '@/modules/validation/aadharValidation';
import { validateDescription } from '@/modules/validation/descriptionValidation';
import { validateEmail } from '@/modules/validation/emailvalidation';
import { validateMSME } from '@/modules/validation/msmeValidation';
import { validateGST } from '@/modules/validation/gstValidation';
import { validatePAN } from '@/modules/validation/panValidation';
import { validatePhoneNumber } from '@/modules/validation/phoneValidation';
import noImage from "@/assets/images/no-image.jpg"
import showToast from '@/toast/showToast';
import axios from 'axios';
import CompanyDetailListPage from './CompanyDetailListPage';
import Loader from '@/loader/Loader';
import { Badge } from '@/components/ui/badge';

const VerificationIndicator = ({ isVerified, isDirty, onVerify, isVerifying, cooldown }) => {
  if (isVerified && !isDirty) {
    return (
      <Badge
        variant="outline"
        className="ml-2.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border-green-300"
      >
        Verified
      </Badge>
    );
  }

  if (isDirty || !isVerified) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onVerify}
        disabled={isVerifying || cooldown > 0}
        className="ml-2 h-7 px-3 text-xs font-semibold text-primary hover:bg-primary/5 border-primary/30"
      >
        {isVerifying ? <Loader2 className="h-3 w-3 animate-spin" /> : (cooldown > 0 ? `Verify (${cooldown}s)` : "Verify")}
      </Button>
    );
  }

  return null;
};

function CompanyDetails() {
  const { user } = useContext(AuthContext);
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({
    company_email: '',
    gst_number: '',
    msme_certificate_number: '',
    pan: '',
    description: '',
    company_phone_number: '',
    aadhar_number: '',
    company_video: '',
    domain_name: '',
  });
  const [companyVideoEnabled, setCompanyVideoEnabled] = useState(false);

  const [showOtpSection, setShowOtpSection] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'email' or 'phone'
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
  });
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailVerifyCooldown, setEmailVerifyCooldown] = useState(0);
  const [phoneVerifyCooldown, setPhoneVerifyCooldown] = useState(0);

  // ─── New states for dynamic company types ───
  const [companyTypes, setCompanyTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);

  useEffect(() => {
    if (user?.user?._id) {
      fetchMerchantDetails();
      fetchCompanyTypes();
    } else {
      setLoading(false);
      setError('User not logged in');
    }
  }, [user]);

  useEffect(() => {
    const checkVideoAccess = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/products/company-video-access`,
          { user_id: user?.user?._id }
        );
        setCompanyVideoEnabled(res.data.company_video || false);
      } catch (err) {
        console.error("Error checking video access:", err);
      }
    };

    if (user?.user?._id) checkVideoAccess();
  }, [user]);

  const normalizeMerchantData = (data) => {
    if (!data) return data;
    const normalized = { ...data };
    if (normalized.company_type && typeof normalized.company_type === 'object') {
      // Use _id if available, fallback to name for legacy/compatibility
      normalized.company_type = normalized.company_type._id || normalized.company_type.value || normalized.company_type.name || normalized.company_type;
    }
    return normalized;
  };

  const fetchMerchantDetails = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/merchants/fetch-merchant-by-user-id?userId=${user.user?._id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch merchant details');
      }

      setMerchantData(data.data);
      setFormData(normalizeMerchantData(data.data));
      setVerificationStatus({
        email: data.data?.email_verified || false,
        phone: data.data?.number_verified || false,
      });
      setOriginalEmail(data.data?.company_email || "");
      setOriginalPhone(data.data?.company_phone_number || "");
      setLoading(false);
    } catch (err) {
      console.error('fetchMerchantDetails Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchCompanyTypes = async () => {
    try {
      setTypesLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/company-types/options`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        }
      );

      if (res.data.success) {
        setCompanyTypes(res.data.data || []);
      } else {
        setCompanyTypes([]);
      }
    } catch (err) {
      console.error("Failed to load company types:", err);
      // Fallback static values in case API fails
      setCompanyTypes([
        { value: "Retailer", label: "Retailer" },
        { value: "Manufacturer", label: "Manufacturer" },
        { value: "Sub_dealer", label: "Sub Dealer" },
        { value: "Service", label: "Services" },
      ]);
    } finally {
      setTypesLoading(false);
    }
  };

  const validateDomain = (value) => {
    if (!value) return { isValid: true, errorMessage: '' };
    const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.[A-Za-z]{2,}$/;
    if (!domainRegex.test(value)) {
      return { isValid: false, errorMessage: 'Please enter a valid domain (example.com)' };
    }
    return { isValid: true, errorMessage: '' };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let validationResult = { isValid: true, errorMessage: '' };
    if (name === 'company_email') {
      validationResult = validateEmail(value);
    } else if (name === 'gst_number' && value) {
      validationResult = validateGST(value);
    } else if (name === 'msme_certificate_number' && value) {
      validationResult = validateMSME(value);
    } else if (name === 'pan' && value) {
      validationResult = validatePAN(value);
    } else if (name === 'description' && value) {
      validationResult = validateDescription(value);
    } else if (name === 'company_phone_number' && value) {
      validationResult = validatePhoneNumber(value);
    } else if (name === 'aadhar_number' && value) {
      validationResult = validateAadhar(value);
    } else if (name === 'domain_name' && value.trim()) {
      validationResult = validateDomain(value.trim());
    }

    setValidationErrors((prev) => ({
      ...prev,
      [name]: validationResult.errorMessage,
    }));

    // Reset verification status in UI if value changes from original
    if (name === 'company_email') {
      const isSame = value.trim().toLowerCase() === (originalEmail || "").trim().toLowerCase();
      setVerificationStatus(prev => ({ ...prev, email: isSame }));
    } else if (name === 'company_phone_number') {
      const isSame = value.trim() === (originalPhone || "").trim();
      setVerificationStatus(prev => ({ ...prev, phone: isSame }));
    }
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, company_type: value }));
  };

  const handleImageFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const existingImagesCount = formData.company_images?.length || 0;
    
    if (files.length + existingImagesCount > 5) {
      const allowedCount = 5 - existingImagesCount;
      showToast(`You can only upload ${allowedCount} more image(s). (Max 5 total)`, 'warning');
      
      // Clear the input to prevent confusion
      e.target.value = '';
      return;
    }
    setImageFiles(files);
  };

  const handleDeleteLogo = async () => {
    try {
      const url = `${import.meta.env.VITE_API_IMAGE_URL}/merchant-images/delete-logo`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({ company_name: formData.company_name }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete logo');
      }

      setFormData((prev) => ({ ...prev, company_logo: null }));
      setMerchantData((prev) => ({ ...prev, company_logo: null }));
    } catch (err) {
      console.error('handleDeleteLogo Error:', err);
      setError(err.message);
    }
  };

  const handleDeleteImage = async (index) => {
    const imageUrl = formData.company_images[index];
    const filename = imageUrl.split('/').pop();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_IMAGE_URL}/merchant-images/delete-company-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          entity_type: 'merchant',
          company_name: formData.company_name,
          filename,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete image');
      }

      setFormData((prev) => ({
        ...prev,
        company_images: prev.company_images.filter((_, i) => i !== index),
      }));
      setMerchantData((prev) => ({
        ...prev,
        company_images: prev.company_images.filter((_, i) => i !== index),
      }));
    } catch (err) {
      console.error('handleDeleteImage Error:', err);
      setError(err.message);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    let timer;
    if (emailVerifyCooldown > 0) {
      timer = setInterval(() => {
        setEmailVerifyCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailVerifyCooldown]);

  useEffect(() => {
    let timer;
    if (phoneVerifyCooldown > 0) {
      timer = setInterval(() => {
        setPhoneVerifyCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phoneVerifyCooldown]);

  const handleVerifyRequest = async (type) => {
    const value = type === 'email' ? formData.company_email : formData.company_phone_number;
    if (!value) return showToast(`Please provide an ${type}`, "error");

    setIsVerifying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/send-entity-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          entityId: merchantData._id,
          entityType: "Merchant",
          contactType: type,
          value,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      setVerificationType(type);
      setShowOtpSection(true);
      startCountdown();

      if (type === 'email') setEmailVerifyCooldown(30);
      else setPhoneVerifyCooldown(30);

      showToast(`OTP sent to your ${type}.`, "info");
    } catch (err) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError("Please enter OTP");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/verify-entity-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          entityId: merchantData._id,
          entityType: "Merchant",
          contactType: verificationType,
          otp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`${verificationType} verified successfully!`, "success");
        setShowOtpSection(false);
        setOtp("");
        setOtpError("");
        
        setVerificationStatus(prev => ({
          ...prev,
          [verificationType]: true
        }));
        setMerchantData(prev => ({
          ...prev,
          [verificationType === 'email' ? 'email_verified' : 'number_verified']: true
        }));
        
        setVerificationType(null);
        if (verificationType === 'email') setOriginalEmail(formData.company_email);
        else setOriginalPhone(formData.company_phone_number);
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const emailValidation = validateEmail(formData.company_email || '');
    let gstValidation = { isValid: true, errorMessage: '' };
    let msmeValidation = { isValid: true, errorMessage: '' };
    let panValidation = { isValid: true, errorMessage: '' };
    let descriptionValidation = { isValid: true, errorMessage: '' };
    let phoneValidation = { isValid: true, errorMessage: '' };
    let aadharValidation = { isValid: true, errorMessage: '' };
    let domainValidation = validateDomain(formData.domain_name || '');

    if (formData.gst_number) {
      gstValidation = validateGST(formData.gst_number);
    }
    if (formData.msme_certificate_number) {
      msmeValidation = validateMSME(formData.msme_certificate_number);
    }
    if (formData.pan) {
      panValidation = validatePAN(formData.pan);
    }
    if (formData.description) {
      descriptionValidation = validateDescription(formData.description);
    }
    if (formData.company_phone_number) {
      phoneValidation = validatePhoneNumber(formData.company_phone_number);
    }
    if (formData.aadhar_number) {
      aadharValidation = validateAadhar(formData.aadhar_number);
    }

    setValidationErrors({
      company_email: emailValidation.errorMessage,
      gst_number: gstValidation.errorMessage,
      msme_certificate_number: msmeValidation.errorMessage,
      pan: panValidation.errorMessage,
      description: descriptionValidation.errorMessage,
      company_phone_number: phoneValidation.errorMessage,
      aadhar_number: aadharValidation.errorMessage,
      domain_name: domainValidation.errorMessage,
      company_video: '',
    });

    if (
      !emailValidation.isValid ||
      !gstValidation.isValid ||
      !msmeValidation.isValid ||
      !panValidation.isValid ||
      !descriptionValidation.isValid ||
      !phoneValidation.isValid ||
      !aadharValidation.isValid ||
      !domainValidation.isValid
    ) {
      setError('Please fix validation errors for provided fields before saving');
      setLoading(false);
      return;
    }

    try {
      let updatedFormData = { ...formData };

      // Ensure company_type is just the ID if it's an object
      if (updatedFormData.company_type && typeof updatedFormData.company_type === 'object') {
        updatedFormData.company_type = updatedFormData.company_type.value || updatedFormData.company_type._id;
      }

      const parseResponse = async (response) => {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      };

      const currentImageCount = updatedFormData.company_images?.length || 0;
      if (currentImageCount + imageFiles.length > 5) {
        showToast('Cannot upload more than 5 images total', 'warning');
        setLoading(false);
        return;
      }

      // Upload logo
      if (logoFile) {
        const formDataLogo = new FormData();
        formDataLogo.append('logo', logoFile);
        formDataLogo.append('company_name', formData.company_name);

        const logoResponse = await fetch(`${import.meta.env.VITE_API_IMAGE_URL}/merchant-images/upload-logo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
          body: formDataLogo,
        });

        const logoData = await parseResponse(logoResponse);
        if (!logoResponse.ok) throw new Error(logoData.message || 'Failed to upload logo');
        updatedFormData.company_logo = logoData.logoUrl;
      }

      // Upload company images
      if (imageFiles.length > 0) {
        const formDataImages = new FormData();
        imageFiles.forEach((file) => formDataImages.append('files', file));
        formDataImages.append('entity_type', 'merchant');
        formDataImages.append('company_name', formData.company_name);

        const imagesResponse = await fetch(`${import.meta.env.VITE_API_IMAGE_URL}/merchant-images/upload-company-image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
          body: formDataImages,
        });

        const imagesData = await parseResponse(imagesResponse);
        if (!imagesResponse.ok) throw new Error(imagesData.message || 'Failed to upload images');
        const newImageUrls = imagesData.files.map((f) => f.fileUrl);
        updatedFormData.company_images = [...(updatedFormData.company_images || []), ...newImageUrls];
      }

      // Update merchant
      const url = `${import.meta.env.VITE_API_URL}/merchants/update-merchant/${merchantData._id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedFormData),
      });

      const merchantDataResponse = await parseResponse(response);
      if (!response.ok) {
        throw new Error(merchantDataResponse.message || 'Failed to update merchant details');
      }

      const rawMerchant = merchantDataResponse.data || merchantDataResponse;
      setMerchantData(rawMerchant);
      setFormData(normalizeMerchantData(rawMerchant));
      setVerificationStatus({
        email: rawMerchant.email_verified || false,
        phone: rawMerchant.number_verified || false,
      });
      setOriginalEmail(rawMerchant.company_email || "");
      setOriginalPhone(rawMerchant.company_phone_number || "");

      showToast('Merchant details updated successfully!', 'success');

      setLogoFile(null);
      setImageFiles([]);
      
      const isEmailVerified = rawMerchant.email_verified;
      const isPhoneVerified = rawMerchant.number_verified;

      setIsEditing(false);

      if ((rawMerchant.company_email && !isEmailVerified) || 
          (rawMerchant.company_phone_number && !isPhoneVerified)) {
        if (!isEmailVerified) showToast("Please verify your email", "info");
        else if (!isPhoneVerified) showToast("Please verify your phone number", "info");
      }
      
      setError(null);
      setValidationErrors({
        company_email: '',
        gst_number: '',
        msme_certificate_number: '',
        pan: '',
        description: '',
        company_phone_number: '',
        aadhar_number: '',
        domain_name: '',
        company_video: '',
      });

    } catch (err) {
      console.error('handleSave Error:', err);

      let errorMessage = 'Something went wrong while saving';

      if (err.message.includes('E11000')) {
        if (err.message.includes('gst_number')) {
          errorMessage = 'GST number already exists. Please use a unique GST.';
          setValidationErrors(prev => ({ ...prev, gst_number: errorMessage }));
        } else if (err.message.includes('company_email')) {
          errorMessage = 'This email is already registered.';
          setValidationErrors(prev => ({ ...prev, company_email: errorMessage }));
        } else if (err.message.includes('pan')) {
          errorMessage = 'PAN number already exists.';
          setValidationErrors(prev => ({ ...prev, pan: errorMessage }));
        } else if (err.message.includes('domain_name')) {
          errorMessage = 'This domain name is already registered.';
          setValidationErrors(prev => ({ ...prev, domain_name: errorMessage }));
        } else {
          errorMessage = 'Duplicate entry found. Please check your details.';
        }
        showToast(errorMessage, 'error');
      } else if (err.message.includes('Cannot upload more than 5 images')) {
        showToast('Maximum 5 images allowed', 'warning');
      } else {
        errorMessage = err.message || 'Failed to save. Please try again.';
        showToast(errorMessage, 'error');
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setFormData(merchantData);
      setLogoFile(null);
      setImageFiles([]);
      setValidationErrors({
        company_email: '',
        gst_number: '',
        msme_certificate_number: '',
        pan: '',
        description: '',
        company_phone_number: '',
        aadhar_number: '',
        domain_name: '',
        company_video: '',
      });
    }
  };

  if (loading) return <Loader />;
  if (!merchantData) return <div className="text-center">No merchant data found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <Card className="relative bg-white shadow-xl rounded-xl border border-gray-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{merchantData.company_name}</h2>
          <Button
            variant="ghost"
            onClick={toggleEdit}
            className="hover:bg-gray-100 flex items-center gap-2 cursor-pointer h-10 px-3"
          >
            {isEditing ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <>
                <Edit className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Edit</span>
              </>
            )}
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name" className="text-sm sm:text-base font-medium text-gray-700">
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name || ''}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    className="mt-1 text-sm sm:text-base border-2 border-slate-300 "
                  />
                </div>

                <div>
                  <div className="flex items-center">
                    <Label htmlFor="company_email" className="text-sm sm:text-base font-medium text-gray-700">
                      Company Email
                    </Label>
                    {formData.company_email && (
                      <VerificationIndicator 
                        isVerified={verificationStatus.email} 
                        isDirty={formData.company_email !== originalEmail} 
                        isVerifying={isVerifying}
                        onVerify={() => {
                          if (emailVerifyCooldown === 0) {
                            handleVerifyRequest('email');
                          }
                        }}
                        cooldown={emailVerifyCooldown}
                      />
                    )}
                  </div>
                  <Input
                    id="company_email"
                    name="company_email"
                    type="email"
                    value={formData.company_email || ''}
                    onChange={handleInputChange}
                    placeholder="example@company.com"
                    className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.company_email ? 'border-red-500' : ''}`}
                  />
                  {showOtpSection && verificationType === 'email' && (
                    <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify Email OTP</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => { setOtp(e.target.value); setOtpError(""); }}
                          className={`h-9 text-center font-mono tracking-widest text-lg border-2 border-slate-300 ${otpError ? "border-red-500" : ""}`}
                          maxLength={6}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleVerifyOtp} 
                          disabled={isVerifying}
                          className="h-9 px-4 cursor-pointer"
                        >
                          {isVerifying && verificationType === 'email' ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : "Confirm"}
                        </Button>
                      </div>
                      {otpError && <p className="text-[10px] text-red-500 mt-1">{otpError}</p>}
                      <div className="flex justify-between items-center mt-2">
                        <button 
                          type="button" 
                          onClick={() => handleVerifyRequest('email')} 
                          disabled={countdown > 0 || isVerifying} 
                          className="text-[10px] text-primary hover:underline font-medium cursor-pointer disabled:opacity-50"
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                        </button>
                        <button type="button" onClick={() => setShowOtpSection(false)} className="text-[10px] text-gray-500 hover:text-gray-700 font-medium cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  )}
                  {validationErrors.company_email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.company_email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="domain_name" className="text-sm sm:text-base font-medium text-gray-700">
                    Domain Name
                  </Label>
                  <Input
                    id="domain_name"
                    name="domain_name"
                    value={formData.domain_name || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. huntsworld.com"
                    className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.domain_name ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.domain_name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.domain_name}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center">
                    <Label htmlFor="company_phone_number" className="text-sm sm:text-base font-medium text-gray-700">
                      Phone
                    </Label>
                    {formData.company_phone_number && (
                      <VerificationIndicator 
                        isVerified={verificationStatus.phone} 
                        isDirty={formData.company_phone_number !== originalPhone} 
                        isVerifying={isVerifying}
                        onVerify={() => {
                          if (phoneVerifyCooldown === 0) {
                            handleVerifyRequest('phone');
                          }
                        }}
                        cooldown={phoneVerifyCooldown}
                      />
                    )}
                  </div>
                  <Input
                    id="company_phone_number"
                    name="company_phone_number"
                    value={formData.company_phone_number || ''}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    className={`mt-1 text-sm sm:text-base border-2  border-slate-300 ${validationErrors.company_phone_number ? 'border-red-500' : ''}`}
                  />
                  {showOtpSection && verificationType === 'phone' && (
                    <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify Phone OTP</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => { setOtp(e.target.value); setOtpError(""); }}
                          className={`h-9 text-center font-mono tracking-widest text-lg border-2 border-slate-300 ${otpError ? "border-red-500" : ""}`}
                          maxLength={6}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleVerifyOtp} 
                          disabled={isVerifying}
                          className="h-9 px-4 cursor-pointer"
                        >
                          {isVerifying && verificationType === 'phone' ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : "Confirm"}
                        </Button>
                      </div>
                      {otpError && <p className="text-[10px] text-red-500 mt-1">{otpError}</p>}
                      <div className="flex justify-between items-center mt-2">
                        <button 
                          type="button" 
                          onClick={() => handleVerifyRequest('phone')} 
                          disabled={countdown > 0 || isVerifying} 
                          className="text-[10px] text-primary hover:underline font-medium cursor-pointer disabled:opacity-50"
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                        </button>
                        <button type="button" onClick={() => setShowOtpSection(false)} className="text-[10px] text-gray-500 hover:text-gray-700 font-medium cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  )}
                  {validationErrors.company_phone_number && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.company_phone_number}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="company_video" className="text-sm sm:text-base font-medium text-gray-700">
                    Company Video
                  </Label>
                  <Input
                    id="company_video"
                    name="company_video"
                    value={formData.company_video || ''}
                    disabled={!companyVideoEnabled}
                    placeholder={
                      companyVideoEnabled
                        ? "Enter YouTube or Video URL"
                        : "Upgrade plan to enable video"
                    }
                    onChange={handleInputChange}
                    className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.company_video ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.company_video && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.company_video}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="company_type" className="text-sm sm:text-base font-medium text-gray-700">
                    Type
                  </Label>

                  {typesLoading ? (
                    <div className="mt-1 text-sm text-gray-500">Loading company types...</div>
                  ) : companyTypes.length === 0 ? (
                    <div className="mt-1 text-sm text-amber-600">No company types available</div>
                  ) : (
                    <Select
                      name="company_type"
                      value={formData.company_type || ''}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger className="mt-1 text-sm sm:text-base border-2 border-slate-300">
                        <SelectValue placeholder="Select company type" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year_of_establishment" className="text-sm sm:text-base font-medium text-gray-700">
                      Established
                    </Label>
                    <Input
                      id="year_of_establishment"
                      name="year_of_establishment"
                      type="number"
                      value={formData.year_of_establishment || ''}
                      onChange={handleInputChange}
                      placeholder="YYYY"
                      className="mt-1 text-sm sm:text-base border-2 border-slate-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number_of_employees" className="text-sm sm:text-base font-medium text-gray-700">
                      Employees
                    </Label>
                    <Input
                      id="number_of_employees"
                      name="number_of_employees"
                      type="number"
                      value={formData.number_of_employees || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 50"
                      className="mt-1 text-sm sm:text-base border-2 border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gst_number" className="text-sm sm:text-base font-medium text-gray-700">
                      GST
                    </Label>
                    <Input
                      id="gst_number"
                      name="gst_number"
                      value={formData.gst_number || ''}
                      onChange={handleInputChange}
                      placeholder="Enter GST Number"
                      className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.gst_number ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.gst_number && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.gst_number}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pan" className="text-sm sm:text-base font-medium text-gray-700">
                      PAN
                    </Label>
                    <Input
                      id="pan"
                      name="pan"
                      value={formData.pan || ''}
                      onChange={handleInputChange}
                      placeholder="Enter PAN Number"
                      className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.pan ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.pan && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.pan}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="msme_certificate_number" className="text-sm sm:text-base font-medium text-gray-700">
                    MSME
                  </Label>
                  <Input
                    id="msme_certificate_number"
                    name="msme_certificate_number"
                    value={formData.msme_certificate_number || ''}
                    onChange={handleInputChange}
                    placeholder="Enter MSME Certificate Number"
                    className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.msme_certificate_number ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.msme_certificate_number && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.msme_certificate_number}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="aadhar_number" className="text-sm sm:text-base font-medium text-gray-700">
                    Aadhar Number
                  </Label>
                  <Input
                    id="aadhar_number"
                    name="aadhar_number"
                    value={formData.aadhar_number || ''}
                    onChange={handleInputChange}
                    placeholder="Enter Aadhar Number"
                    className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.aadhar_number ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.aadhar_number && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.aadhar_number}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm sm:text-base font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Describe your company (e.g. mission, services, key products...)"
                    className={`mt-1 text-sm sm:text-base border-2 border-slate-300 ${validationErrors.description ? 'border-red-500' : ''}`}
                    rows={4}
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                  )}
                </div>

                {/* Logo Upload */}
                <div>
                  <Label className="text-sm sm:text-base font-medium text-gray-700">Company Logo</Label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    <strong>Only JPG/JPEG images allowed</strong>
                  </p>

                  {formData.company_logo && (
                    <div className="relative mt-2">
                      <Zoom>
                        <img
                          src={formData.company_logo}
                          alt="Company Logo"
                          className="h-24 sm:h-32 w-full object-cover rounded-md"
                          onError={(e) => {
                            if (e.currentTarget.src !== noImage) {
                              e.currentTarget.src = noImage;
                            }
                          }}
                        />
                      </Zoom>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDeleteLogo}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  )}

                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="mt-4 text-sm sm:text-base border-2 border-slate-300"
                  />
                </div>

                {/* Company Images Upload */}
                <div>
                  <Label className="text-sm sm:text-base font-medium text-gray-700">
                    Company Images (Max 5)
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    <strong>Only JPG/JPEG images allowed</strong>
                  </p>

                  {formData.company_images && formData.company_images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                      {formData.company_images.map((image, index) => (
                        <div key={index} className="relative">
                          <Zoom>
                            <img
                              src={image}
                              alt={`Company Image ${index + 1}`}
                              className="h-24 sm:h-32 w-full object-cover rounded-md"
                              onError={(e) => {
                                if (e.currentTarget.src !== noImage) {
                                  e.currentTarget.src = noImage;
                                }
                              }}
                            />
                          </Zoom>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteImage(index)}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg"
                    multiple
                    onChange={handleImageFilesChange}
                    className="mt-4 text-sm sm:text-base border-2 border-slate-300"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={toggleEdit}
                    className="w-full cursor-pointer sm:w-auto px-4 py-2 text-sm sm:text-base"
                  >
                    <X className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="w-full cursor-pointer sm:w-auto px-4 py-2 text-sm sm:text-base"
                  >
                    <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <CompanyDetailListPage
                merchantData={merchantData}
                noImage={noImage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CompanyDetails;
