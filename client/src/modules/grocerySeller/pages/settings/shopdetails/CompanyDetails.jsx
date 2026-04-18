import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import axios from "axios";
import {
  Edit,
  Save,
  X,
  Trash2,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Building2,
  CreditCard,
  Image as ImageIcon,
  Upload,
  User,
  Briefcase,
  Store,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import Loader from "@/loader/Loader";

import noImage from "@/assets/images/no-image.jpg";
import "react-medium-image-zoom/dist/styles.css";
import { validateDescription } from "@/modules/validation/descriptionValidation";
import { validateEmail } from "@/modules/validation/emailvalidation";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";
import { validateMSME } from "@/modules/validation/msmeValidation";
import { validateGST } from "@/modules/validation/gstValidation";
import { validatePAN } from "@/modules/validation/panValidation";
import { validateAadhar } from "@/modules/validation/aadharValidation";

const API_URL = import.meta.env.VITE_API_URL;
const API_IMAGE_URL = import.meta.env.VITE_API_IMAGE_URL;

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

const CompanyDetails = () => {
  const { user, token } = useContext(AuthContext);
  const [seller, setSeller] = useState(null);
  const [memberTypes, setMemberTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentLogo, setCurrentLogo] = useState("");
  const [editedImages, setEditedImages] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // OTP States
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'email' or 'phone'
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
  });
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.user?._id || !token) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [typesRes, sellerRes] = await Promise.all([
          axios.get(`${API_URL}/base-member-types/fetch-all-base-member-types`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/grocery-sellers/fetch-by-userid-grocery-seller/${user.user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (typesRes.data.success) {
          setMemberTypes(typesRes.data.data || []);
        }

        if (sellerRes.data.success) {
          const data = sellerRes.data.data;
          setSeller(data);

          setFormData({
            shop_name: data.shop_name || "",
            shop_email: data.shop_email || "",
            shop_phone_number: data.shop_phone_number || "",
            msme_certificate_number: data.msme_certificate_number || "",
            gst_number: data.gst_number || "",
            pan: data.pan || "",
            aadhar: data.aadhar || "",
            member_type: data.member_type?._id || "",
            domain_name: data.domain_name || "",
          });

          setVerificationStatus({
            email: data.email_verified || false,
            phone: data.number_verified || false,
          });
          setOriginalEmail(data.shop_email || "");
          setOriginalPhone(data.shop_phone_number || "");

          setCurrentLogo(data.company_logo || "");
          setEditedImages(data.company_images || []);
        } else {
          setError(sellerRes.data.message || "Failed to fetch seller details");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue = name === "shop_phone_number" ? value.replace(/[\s-]/g, "") : value;
    setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));

    // Reset verification status in UI if value changes from original
    if (name === 'shop_email') {
      const isSame = cleanedValue.trim().toLowerCase() === (originalEmail || "").trim().toLowerCase();
      setVerificationStatus(prev => ({ ...prev, email: isSame }));
    } else if (name === 'shop_phone_number') {
      const isSame = cleanedValue.trim() === (originalPhone || "").trim();
      setVerificationStatus(prev => ({ ...prev, phone: isSame }));
    }
  };

  const handleMemberTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, member_type: value }));
    setValidationErrors((prev) => ({ ...prev, member_type: "" }));
  };

  const validateInputs = () => {
    const errors = {};

    if (!formData.shop_name?.trim()) {
      errors.shop_name = "Shop name is required";
    }

    if (!formData.member_type) {
      errors.member_type = "Please select a business type";
    }

    const phoneValidation = validatePhoneNumber(formData.shop_phone_number);
    if (!phoneValidation.isValid) {
      errors.shop_phone_number = phoneValidation.errorMessage;
    }

    if (formData.shop_email?.trim()) {
      const emailValidation = validateEmail(formData.shop_email);
      if (!emailValidation.isValid) {
        errors.shop_email = emailValidation.errorMessage;
      }
    }

    if (formData.domain_name?.trim()) {
      const domain = formData.domain_name.trim().toLowerCase();
      if (!/^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)) {
        errors.domain_name = "Invalid domain format (example: myshop.in or freshkart.co)";
      }
    }

    if (formData.msme_certificate_number?.trim()) {
      const msmeValidation = validateMSME(formData.msme_certificate_number);
      if (!msmeValidation.isValid) {
        errors.msme_certificate_number = msmeValidation.errorMessage;
      }
    }

    if (formData.gst_number?.trim()) {
      const gstValidation = validateGST(formData.gst_number);
      if (!gstValidation.isValid) {
        errors.gst_number = gstValidation.errorMessage;
      }
    }

    if (formData.pan?.trim()) {
      const panValidation = validatePAN(formData.pan);
      if (!panValidation.isValid) {
        errors.pan = panValidation.errorMessage;
      }
    }

    if (formData.aadhar?.trim()) {
      const aadharValidation = validateAadhar(formData.aadhar);
      if (!aadharValidation.isValid) {
        errors.aadhar = aadharValidation.errorMessage;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeleteLogo = async () => {
    if (!currentLogo) return;

    try {
      setIsSubmitting(true);
      const parsedUrl = new URL(currentLogo);
      const pathname = parsedUrl.pathname;
      const parts = pathname.split("/");
      const filename = parts.pop();
      const shop_name = formData.shop_name
        ? formData.shop_name.replace(/\s+/g, "_").toLowerCase()
        : "";

      const deleteData = {
        entity_type: "grocery-seller-images",
        shop_name,
        filename,
      };

      await axios.delete(
        `${API_IMAGE_URL}/grocery-seller-images/delete-company-image`,
        {
          data: deleteData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCurrentLogo("");
      setLogoFile(null);
    } catch (err) {
      setError("Failed to delete logo");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImage = async (index) => {
    const url = editedImages[index];
    if (!url) return;

    try {
      setIsSubmitting(true);
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const parts = pathname.split("/");
      const filename = parts.pop();
      const shop_name = parts.pop();

      const deleteData = {
        entity_type: "grocery-seller-images",
        shop_name,
        filename,
      };

      await axios.delete(
        `${API_IMAGE_URL}/grocery-seller-images/delete-company-image`,
        {
          data: deleteData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newImages = editedImages.filter((_, i) => i !== index);
      setEditedImages(newImages);
    } catch (err) {
      setError("Failed to delete image");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
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

  const handleVerifyRequest = async (type) => {
    const value = type === 'email' ? formData.shop_email : formData.shop_phone_number;
    if (!value) return setError(`Please provide an ${type}`);

    try {
      const res = await axios.post(`${API_URL}/users/send-entity-otp`, {
        entityId: seller._id,
        entityType: "GrocerySeller",
        contactType: type,
        value,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data.success) throw new Error(res.data.message);
      
      setVerificationType(type);
      setShowOtpSection(true);
      startCountdown();
      setSuccessMessage(`OTP sent to your ${type}.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send OTP");
    }
  };
  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError("Please enter OTP");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await axios.post(`${API_URL}/users/verify-entity-otp`, {
        entityId: seller._id,
        entityType: "GrocerySeller",
        contactType: verificationType,
        otp,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSuccessMessage(`${verificationType} verified successfully!`);
        setShowOtpSection(false);
        setOtp("");
        setOtpError("");
        
        setVerificationStatus(prev => ({
          ...prev,
          [verificationType]: true
        }));
        
        setSeller(prev => ({
          ...prev,
          [verificationType === 'email' ? 'email_verified' : 'number_verified']: true
        }));
        
        setVerificationType(null);
        if (verificationType === 'email') setOriginalEmail(formData.shop_email);
        else setOriginalPhone(formData.shop_phone_number);
      } else {
        setOtpError(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      setError("Please fix the validation errors before saving.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let newLogoUrl = currentLogo;

      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("logo", logoFile);
        logoFormData.append("shop_name", formData.shop_name);

        const logoResponse = await axios.put(
          `${API_IMAGE_URL}/grocery-seller-images/update-logo`,
          logoFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        newLogoUrl = logoResponse.data.logoUrl || currentLogo;
      }

      let newCompanyImages = [...editedImages];

      if (newImageFiles.length > 0) {
        const imagesFormData = new FormData();
        newImageFiles.forEach((file) => imagesFormData.append("files", file));
        imagesFormData.append("entity_type", "grocery-seller-images");
        imagesFormData.append("shop_name", formData.shop_name);

        const imagesResponse = await axios.post(
          `${API_IMAGE_URL}/grocery-seller-images/upload-company-image`,
          imagesFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (imagesResponse.data.files) {
          const addedUrls = imagesResponse.data.files.map((f) => f.fileUrl);
          newCompanyImages = [...newCompanyImages, ...addedUrls];
        }
      }

      const updateData = {
        ...formData,
        company_logo: newLogoUrl,
        company_images: newCompanyImages,
      };

      const response = await axios.put(
        `${API_URL}/grocery-sellers/update-grocery-seller/${seller._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const refreshedRes = await axios.get(
          `${API_URL}/grocery-sellers/fetch-by-userid-grocery-seller/${user.user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (refreshedRes.data.success) {
          const freshSeller = refreshedRes.data.data;
          setSeller(freshSeller);
          setCurrentLogo(freshSeller.company_logo || "");
          setEditedImages(freshSeller.company_images || []);

          setFormData({
            shop_name: freshSeller.shop_name || "",
            shop_email: freshSeller.shop_email || "",
            shop_phone_number: freshSeller.shop_phone_number || "",
            msme_certificate_number: freshSeller.msme_certificate_number || "",
            gst_number: freshSeller.gst_number || "",
            pan: freshSeller.pan || "",
            aadhar: freshSeller.aadhar || "",
            member_type: freshSeller.member_type?._id || "",
            domain_name: freshSeller.domain_name || "",
          });

          setLogoFile(null);
          setNewImageFiles([]);
          
          const isEmailVerified = freshSeller.email_verified;
          const isPhoneVerified = freshSeller.number_verified;

          setIsEditing(false);
          if ((freshSeller.shop_email && !isEmailVerified) || 
              (freshSeller.shop_phone_number && !isPhoneVerified)) {
            setError(null);
            setSuccessMessage(`Profile updated. Please verify your ${!isEmailVerified ? 'email' : 'phone number'}.`);
          } else {
            setSuccessMessage("Company details updated successfully!");
          }
          
          setVerificationStatus({
            email: isEmailVerified || false,
            phone: isPhoneVerified || false,
          });
          setOriginalEmail(freshSeller.shop_email || "");
          setOriginalPhone(freshSeller.shop_phone_number || "");
        }
      } else {
        setError(response.data.message || "Failed to update");
      }
    } catch (err) {
      console.error("Update failed:", err);
      setError(err.response?.data?.message || "Error updating shop details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
    setLogoFile(null);
    setNewImageFiles([]);
    setValidationErrors({});

    if (seller) {
      setFormData({
        shop_name: seller.shop_name || "",
        shop_email: seller.shop_email || "",
        shop_phone_number: seller.shop_phone_number || "",
        msme_certificate_number: seller.msme_certificate_number || "",
        gst_number: seller.gst_number || "",
        pan: seller.pan || "",
        aadhar: seller.aadhar || "",
        member_type: seller.member_type?._id || "",
        domain_name: seller.domain_name || "",
      });
      setCurrentLogo(seller.company_logo || "");
      setEditedImages(seller.company_images || []);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[60vh] w-full">
        <Loader contained={true} label="Loading company profile..." />
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="text-center py-12 text-destructive font-medium">
        {error}
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No shop details found. Please try again later.
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 relative">
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader label="Processing..." />
        </div>
      )}
      <Card className="border shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                {seller.shop_name || "My Shop"}
              </CardTitle>
              <CardDescription className="mt-1.5 text-base">
                Manage your grocery business profile, legal details and images
              </CardDescription>
            </div>

            <Button
              variant={isEditing ? "outline" : "default"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSubmitting}
              className="gap-2 min-w-[140px]"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4" /> Cancel Editing
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" /> Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-10">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              {successMessage}
            </div>
          )}

          {isEditing ? (
            <form className="space-y-10">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-8">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2.5 text-xl">
                        <Store className="h-5 w-5 text-primary" />
                        Business Identity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          Business Type <span className="text-red-500 text-base">*</span>
                        </Label>
                        {memberTypes.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-2">Loading types...</div>
                        ) : (
                          <Select
                            value={formData.member_type}
                            onValueChange={handleMemberTypeChange}
                            disabled={true}
                          >
                            <SelectTrigger className="h-11 border-2 border-slate-300">
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              {memberTypes.map((type) => (
                                <SelectItem key={type._id} value={type._id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {validationErrors.member_type && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.member_type}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shop_name" className="flex items-center gap-1.5">
                          Shop Name <span className="text-red-500 text-base">*</span>
                        </Label>
                        <Input
                          id="shop_name"
                          name="shop_name"
                          placeholder="e.g. Sri Ganesh Supermarket"
                          value={formData.shop_name || ""}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className={`h-11 border-2 border-slate-300 ${validationErrors.shop_name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {validationErrors.shop_name && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.shop_name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="domain_name" className="flex items-center gap-1.5">
                          Custom Domain <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                          <div className="bg-muted px-3 py-2.5 text-sm text-muted-foreground border-r">
                            https://
                          </div>
                          <Input
                            id="domain_name"
                            name="domain_name"
                            placeholder="e.g. yourshop.in"
                            value={formData.domain_name || ""}
                            onChange={handleInputChange}
                            disabled={isSubmitting}
                            className="border-0 focus-visible:ring-0 h-11 rounded-none border-2 border-slate-300"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Used for your custom shop URL (e.g. yourshop.in). Must be unique.
                        </p>
                        {validationErrors.domain_name && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.domain_name}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label>Company Logo</Label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          <div className="relative shrink-0">
                            <div className="w-28 h-28 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/30 overflow-hidden flex items-center justify-center">
                              {logoFile ? (
                                <img
                                  src={URL.createObjectURL(logoFile)}
                                  alt="New logo preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : currentLogo ? (
                                <img
                                  src={currentLogo}
                                  alt="Current logo"
                                  className="w-full h-full object-cover"
                                  onError={(e) => (e.target.src = noImage)}
                                />
                              ) : (
                                <ImageIcon className="h-10 w-10 text-muted-foreground/60" />
                              )}
                            </div>

                            {(currentLogo || logoFile) && (
                              <button
                                type="button"
                                onClick={handleDeleteLogo}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 shadow-md hover:bg-destructive/90 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                              disabled={isSubmitting}
                              className="cursor-pointer border-2 border-slate-300"
                            />
                            <p className="text-xs text-muted-foreground">
                              Recommended size: 512 × 512 pixels • PNG or JPG
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2.5 text-xl">
                        <Phone className="h-5 w-5 text-green-600" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Label htmlFor="shop_email">Email Address</Label>
                          {formData.shop_email && (
                            <VerificationIndicator 
                              isVerified={verificationStatus.email} 
                              isDirty={formData.shop_email !== originalEmail} 
                              onVerify={() => handleVerifyRequest('email')} 
                            />
                          )}
                        </div>
                        <Input
                          id="shop_email"
                          name="shop_email"
                          type="email"
                          placeholder="e.g. contact@yourshop.com"
                          value={formData.shop_email || ""}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className={`h-11 border-2 border-slate-300 ${validationErrors.shop_email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {showOtpSection && verificationType === 'email' && (
                          <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify Shop Email OTP</p>
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
                        {validationErrors.shop_email && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.shop_email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Label htmlFor="shop_phone_number" className="flex items-center gap-1.5">
                            Phone Number <span className="text-red-500 text-base">*</span>
                          </Label>
                          {formData.shop_phone_number && (
                            <VerificationIndicator 
                              isVerified={verificationStatus.phone} 
                              isDirty={formData.shop_phone_number !== originalPhone} 
                              onVerify={() => handleVerifyRequest('phone')} 
                            />
                          )}
                        </div>
                        <Input
                          id="shop_phone_number"
                          name="shop_phone_number"
                          placeholder="e.g. 98765 43210"
                          value={formData.shop_phone_number || ""}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className={`h-11 border-2 border-slate-300 ${validationErrors.shop_phone_number ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {showOtpSection && verificationType === 'phone' && (
                          <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify Shop Phone OTP</p>
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
                        {validationErrors.shop_phone_number && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.shop_phone_number}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-8">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2.5 text-xl">
                        <FileText className="h-5 w-5 text-violet-600" />
                        Legal & Tax Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gst_number">GST Number</Label>
                        <Input
                          id="gst_number"
                          name="gst_number"
                          placeholder="e.g. 22AAAAA0000A1Z5"
                          value={formData.gst_number?.toUpperCase() || ""}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className={`h-11 uppercase border-2 border-slate-300 ${validationErrors.gst_number ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {validationErrors.gst_number && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.gst_number}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pan">PAN Number</Label>
                        <Input
                          id="pan"
                          name="pan"
                          placeholder="e.g. ABCDE1234F"
                          value={formData.pan?.toUpperCase() || ""}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className={`h-11 uppercase border-2 border-slate-300 ${validationErrors.pan ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {validationErrors.pan && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.pan}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aadhar">Aadhaar Number</Label>
                        <Input
                          id="aadhar"
                          name="aadhar"
                          placeholder="e.g. 1234 5678 9012"
                          value={formData.aadhar || ""}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className={`h-11 border-2 border-slate-300 ${validationErrors.aadhar ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {validationErrors.aadhar && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.aadhar}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="msme_certificate_number">MSME / UDYAM Number</Label>
                        <Input
                          id="msme_certificate_number"
                          name="msme_certificate_number"
                          placeholder="e.g. UDYAM-TN-01-0123456"
                          value={formData.msme_certificate_number || ""}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          className="h-11 border-2 border-slate-300"
                        />
                        {validationErrors.msme_certificate_number && (
                          <p className="text-sm text-destructive pt-1">{validationErrors.msme_certificate_number}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2 pt-4">
                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
                          <span className="font-medium text-muted-foreground">Verification Status</span>
                          <Badge variant={seller.verified_status ? "default" : "secondary"} className="text-sm px-4 py-1.5">
                            {seller.verified_status ? "Verified" : "Pending Verification"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2.5 text-xl">
                        <ImageIcon className="h-5 w-5 text-amber-600" />
                        Shop Gallery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(editedImages.length > 0 || newImageFiles.length > 0) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {/* Existing Images */}
                          {editedImages.map((img, idx) => (
                            <div
                              key={`existing-${idx}`}
                              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/30 hover:shadow-md transition-shadow"
                            >
                              <img
                                src={img}
                                alt={`Shop image ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => (e.target.src = noImage)}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(idx)}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          {/* New Previews */}
                          {newImageFiles.map((file, idx) => (
                            <div
                              key={`new-${idx}`}
                              className="group relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 bg-primary/5 hover:shadow-md transition-shadow"
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`New upload preview ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary text-[10px] text-white font-bold rounded uppercase">
                                New
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteNewImage(idx)}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {editedImages.length + newImageFiles.length < 5 ? (
                        <div className="border-2 border-dashed border-muted-foreground/40 rounded-xl p-10 text-center hover:border-primary/60 hover:bg-primary/5 transition-colors">
                          <label className="cursor-pointer block">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                const total = editedImages.length + newImageFiles.length + selectedFiles.length;
                                if (total > 5) {
                                  setError("You can only upload a maximum of 5 shop images.");
                                  const allowedCount = 5 - (editedImages.length + newImageFiles.length);
                                  if (allowedCount > 0) {
                                    setNewImageFiles((prev) => [...prev, ...selectedFiles.slice(0, allowedCount)]);
                                  }
                                } else {
                                  setNewImageFiles((prev) => [...prev, ...selectedFiles]);
                                }
                              }}
                              className="hidden"
                              disabled={isSubmitting}
                            />
                            <div className="flex flex-col items-center gap-4">
                              <div className="p-5 bg-primary/10 text-primary rounded-full">
                                <Upload className="h-8 w-8" />
                              </div>
                              <div>
                                <p className="font-semibold text-lg text-primary">Click to upload new images</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  PNG, JPG, GIF • Max 5 images total ({editedImages.length + newImageFiles.length}/5)
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-green-200 bg-green-50/50 rounded-xl p-6 text-center">
                          <p className="font-medium text-green-700 flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> Image limit reached (5/5)
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Delete existing images to upload new ones.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="min-w-36 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-44 h-11 gap-2 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <Card className="border shadow-sm overflow-hidden">
                <CardContent className="pt-8 pb-8 px-6 md:px-8">
                  <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="shrink-0">
                      {currentLogo ? (
                        <Zoom>
                          <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-background shadow-lg">
                            <img
                              src={currentLogo}
                              alt="Shop logo"
                              className="w-full h-full object-cover"
                              onError={(e) => (e.target.src = noImage)}
                            />
                          </div>
                        </Zoom>
                      ) : (
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-muted flex items-center justify-center shadow-md">
                          <Building2 className="h-14 w-14 text-muted-foreground/70" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                          {seller.shop_name || "Shop Name"}
                        </h2>
                        {seller.verified_status ? (
                          <Badge className="text-sm px-4 py-1.5 gap-1.5 bg-green-600 hover:bg-green-600/90">
                            <CheckCircle2 className="h-4 w-4" /> Verified Seller
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-sm px-4 py-1.5 gap-1.5">
                            <ShieldAlert className="h-4 w-4" /> Verification Pending
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-8 gap-y-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{seller.member_type?.name || "Not specified"}</span>
                        </div>
                        {seller.shop_phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{seller.shop_phone_number}</span>
                          </div>
                        )}
                        {seller.domain_name && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <a
                              href={`https://${seller.domain_name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {seller.domain_name}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-start gap-4 p-4 bg-muted/40 rounded-lg border">
                      <div className="p-3 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Email Address</p>
                          {seller.email_verified && (
                            <Badge variant="outline" className="h-4 p-0 px-1.5 text-[8px] bg-green-50 text-green-600 border-green-200">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium break-all">{seller.shop_email || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-muted/40 rounded-lg border">
                      <div className="p-3 bg-green-100 text-green-700 rounded-lg shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone Number</p>
                          {seller.number_verified && (
                            <Badge variant="outline" className="h-4 p-0 px-1.5 text-[8px] bg-green-50 text-green-600 border-green-200">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{seller.shop_phone_number || "Not provided"}</p>
                      </div>
                    </div>

                    {seller.domain_name && (
                      <div className="flex items-start gap-4 p-4 bg-muted/40 rounded-lg border">
                        <div className="p-3 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Custom Domain</p>
                          <a
                            href={`https://${seller.domain_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline break-all"
                          >
                            {seller.domain_name}
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle>Legal & Tax Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">GST Number</p>
                      <p className="font-medium">{seller.gst_number || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">PAN Number</p>
                      <p className="font-medium uppercase">{seller.pan || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Aadhaar Number</p>
                      <p className="font-medium">{seller.aadhar || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">MSME / UDYAM</p>
                      <p className="font-medium">{seller.msme_certificate_number || "—"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Shop Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  {editedImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {editedImages.map((img, idx) => (
                        <Zoom key={idx}>
                          <div className="aspect-square rounded-lg overflow-hidden border bg-muted/30 shadow-sm hover:shadow-md transition-shadow">
                            <img
                              src={img}
                              alt={`Gallery image ${idx + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => (e.target.src = noImage)}
                            />
                          </div>
                        </Zoom>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border border-dashed rounded-xl bg-muted/30">
                      <p className="text-muted-foreground text-lg font-medium">
                        No shop images uploaded yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Add beautiful photos of your store when editing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDetails;
