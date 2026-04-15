import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Pencil,
  Mail,
  Phone,
  Users,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import Loader from "@/loader/Loader";
import {
  useLazyGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/redux/api/Authapi";
import {
  useUploadUserProfilePicMutation,
  useDeleteUserProfilePicMutation,
} from "@/redux/api/UserprofilePicapi";

const VerificationIndicator = ({ isVerified, isDirty, onVerify, isVerifying }) => {
  if (isVerifying) return null;

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
        className="ml-2 h-7 px-3 text-xs font-semibold text-primary hover:bg-primary/5 border-primary/30"
      >
        Verify
      </Button>
    );
  }

  return null;
};

const Profile = ({ userId }) => {
  const { isSidebarOpen } = useSidebar();
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { refreshUser, refetchUser } = useContext(AuthContext); // Keep refetchUser

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    profile_pic: "",
    created_at: "",
    password: "",
    confirmPassword: "",
    user_code: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [copied, setCopied] = useState(false);

  // Verification status
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
  });

  // OTP related states
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'email' or 'phone'
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [fetchUserById, { isLoading, error }] = useLazyGetUserByIdQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [manualLoading, setManualLoading] = useState(false);
  const [uploadProfileImage, { isLoading: isUploading }] =
    useUploadUserProfilePicMutation();
  const [deleteProfileImage, { isLoading: isDeleting }] =
    useDeleteUserProfilePicMutation();

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
    const fetchUser = async () => {
      try {
        const response = await fetchUserById(userId).unwrap();
        setUserDetails(response?.user);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    if (userId) fetchUser();
  }, [userId, fetchUserById]);

  useEffect(() => {
    if (userDetails) {
      setFormData({
        name: userDetails.name || "",
        email: userDetails.email || "",
        phone: userDetails.phone || "",
        gender: userDetails.gender || "",
        profile_pic: userDetails.profile_pic || "",
        created_at: userDetails.created_at || "",
        password: "",
        confirmPassword: "",
        user_code: userDetails.user_code || "",
      });

      setProfileImage(userDetails.profile_pic || null);
      setOriginalEmail(userDetails.email || "");
      setOriginalPhone(userDetails.phone || "");

      setVerificationStatus({
        email: userDetails.email_verified === true,
        phone: userDetails.number_verified === true,
      });
    }
  }, [userDetails]);

  const handleCopy = async () => {
    if (!userDetails?.user_code) return;
    try {
      await navigator.clipboard.writeText(userDetails.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If email or phone is changed → mark as not verified locally
    if (name === "email" && value.trim() !== (originalEmail || "").trim()) {
      setVerificationStatus((prev) => ({ ...prev, email: false }));
    }
    if (name === "phone" && value.trim() !== (originalPhone || "").trim()) {
      setVerificationStatus((prev) => ({ ...prev, phone: false }));
    }

    if (name === "phone") {
      const validation = validatePhoneNumber(value);
      setPhoneError(validation.isValid ? "" : validation.errorMessage);
    }

    if (name === "password") {
      if (!value.trim()) {
        setPasswordError("");
      } else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(
          value
        )
      ) {
        setPasswordError(
          "Password must be at least 6 characters and include one uppercase letter, one lowercase letter, one number, and one special character"
        );
      } else {
        setPasswordError("");
      }
    }

    if (name === "password" || name === "confirmPassword") {
      const newFormData = { ...formData, [name]: value };
      if (newFormData.password || newFormData.confirmPassword) {
        setConfirmPasswordError(
          newFormData.password === newFormData.confirmPassword
            ? ""
            : "Passwords do not match"
        );
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append("profile_pic", file);
    formDataUpload.append("entity_type", "user");
    formDataUpload.append("user_id", userId);

    try {
      const response = await uploadProfileImage({ formData: formDataUpload }).unwrap();
      const uploadedUrl = response.files[0]?.fileUrl;

      setProfileImage(uploadedUrl);
      setFormData((prev) => ({ ...prev, profile_pic: uploadedUrl }));

      await updateUser({
        id: userId,
        updatedUser: { profile_pic: uploadedUrl },
      }).unwrap();

      const updatedUser = await fetchUserById(userId).unwrap();
      setUserDetails(updatedUser?.user);

      showToast("Profile picture updated successfully", "success");
    } catch (err) {
      showToast(err.data?.message || "Failed to upload profile picture", "error");
    }
  };

  const handleCopyReferral = async () => {
    try {
      const referralLink = `${import.meta.env.VITE_CLIENT_URL}/referral-register?ref=${userDetails?.referral_code}`;
      await navigator.clipboard.writeText(referralLink);
      showToast("Referral link copied to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy referral link. Please try again.", "error");
    }
  };

  const handleSave = async () => {
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.errorMessage);
      showToast(phoneValidation.errorMessage, "error");
      return;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        showToast("Passwords do not match", "error");
        return;
      }
      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(
          formData.password
        )
      ) {
        setPasswordError(
          "Password must be at least 6 characters and include one uppercase letter, one lowercase letter, one number, and one special character"
        );
        showToast("Invalid password format", "error");
        return;
      }
    }

    if (!formData.name.trim()) {
      showToast("Name is required.", "error");
      return;
    }

    try {
      const updateData = { ...formData };
      if (!formData.password) {
        delete updateData.password;
        delete updateData.confirmPassword;
      } else {
        delete updateData.confirmPassword;
      }

      const response = await updateUser({
        id: userId,
        updatedUser: updateData,
      }).unwrap();

      if (response.requiresVerification) {
        setShowOtpSection(true);
        startCountdown();

        if (response.verifyPhone) {
          setVerificationType("phone");
          showToast("OTP sent to your new phone number.", "info");
        } else if (response.verifyEmail) {
          setVerificationType("email");
          showToast("OTP sent to your new email.", "info");
        }
        return;
      }

      // No verification needed → success
      setIsEditing(false);
      setOriginalEmail(formData.email);
      setOriginalPhone(formData.phone);

      if (response.user) {
        setVerificationStatus({
          email: response.user.email_verified === true,
          phone: response.user.number_verified === true,
        });
      }

      showToast("Profile updated successfully", "success");

      // Use refetchUser for fresh context sync
      const freshData = await refetchUser();
      if (freshData?.user) {
        setUserDetails(freshData.user);
      }
    } catch (err) {
      showToast(err.data?.message || "Failed to update user", "error");
      console.error("Failed to update user:", err);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError("Please enter the OTP");
      return;
    }

    setManualLoading(true);
    try {
      let url = "";
      let body = {};

      if (verificationType === "email") {
        url = `${import.meta.env.VITE_API_URL}/users/verify-otp`;
        body = { email: formData.email, email_otp: otp };
      } else if (verificationType === "phone") {
        url = `${import.meta.env.VITE_API_URL}/users/verify-phone-update-otp`;
        body = { user_id: userId, phone_otp: otp };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        const msg = verificationType === "email" ? "Email" : "Phone number";
        showToast(`${msg} verified & updated successfully!`, "success");

        setVerificationStatus((prev) => ({ ...prev, [verificationType]: true }));
        setShowOtpSection(false);
        setIsEditing(false);
        setOtp("");
        setOtpError("");
        setVerificationType(null);
        setOriginalEmail(formData.email);
        setOriginalPhone(formData.phone);

        const freshData = await refetchUser();
        if (freshData?.user) {
          setUserDetails(freshData.user);
        }
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
      console.error(err);
    } finally {
      setManualLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setManualLoading(true);
    setIsResending(true);
    try {
      let url = "";
      let body = {};

      if (verificationType === "email") {
        url = `${import.meta.env.VITE_API_URL}/users/resend-otp`;
        body = { email: formData.email };
      } else if (verificationType === "phone") {
        url = `${import.meta.env.VITE_API_URL}/users/send-number-otp`;
        body = { phone: formData.phone };
      }

      if (!url) {
        showToast("Cannot determine verification type", "error");
        return;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showToast("New OTP sent successfully!", "success");
        setOtp("");
        startCountdown();
      } else {
        showToast(data.message || "Failed to resend OTP", "error");
      }
    } catch (err) {
      showToast("Network error. Failed to resend OTP", "error");
    } finally {
      setIsResending(false);
      setManualLoading(false);
    }
  };

  const safeFormData = {
    name: formData.name || "",
    email: formData.email || "",
    phone: formData.phone || "",
    gender: formData.gender || "",
    profile_pic: formData.profile_pic || "",
    created_at: formData.created_at || "",
  };

  const InfoDisplay = () => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg transition-all duration-300">
      <div className="flex flex-col items-center md:flex-row md:items-start gap-8 lg:p-8">
        <div className="relative group">
          <Avatar className="w-32 h-32 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <AvatarImage src={profileImage || ""} alt="Profile" className="object-cover" />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
              {safeFormData.name ? safeFormData.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-800">
            {safeFormData.name || "Anonymous User"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  Personal Email
                  {verificationStatus.email && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">Verified</Badge>
                  )}
                </p>
                <p className="text-gray-800 break-all">
                  {safeFormData.email || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  Phone
                  {verificationStatus.phone && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">Verified</Badge>
                  )}
                </p>
                <p className="text-gray-800">
                  {safeFormData.phone || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-gray-800 capitalize">
                  {safeFormData.gender || "Not specified"}
                </p>
              </div>
            </div>

            {safeFormData.created_at && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <Badge variant="secondary" className="mt-1">
                    {format(new Date(safeFormData.created_at), "PPP")}
                  </Badge>
                </div>
              </div>
            )}

            {/* User Code */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-gray-800 font-mono tracking-wide">
                    {userDetails?.user_code || "Not available"}
                  </p>
                </div>
              </div>
              {userDetails?.user_code && (
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                  title="Copy User ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* Referral Code */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Users className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Referral Code</p>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="text"
                    value={userDetails?.referral_code || ""}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed text-gray-800"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyReferral}
                    title="Copy referral link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading || isUpdating || isUploading || isDeleting || manualLoading) return <Loader />;
  if (error)
    return <div className="text-center p-6 text-red-500">Error loading user data</div>;

  return (
    <>
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 w-8 cursor-pointer"
          >
            <Pencil className="h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-2 border-primary/20 transition-all duration-300 group-hover:border-primary/50">
                    <AvatarImage src={profileImage || ""} alt="Profile" />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {safeFormData.name ? safeFormData.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-upload"
                    className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-camera"
                    >
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="font-medium">Profile Picture</h3>
                  <p className="text-sm text-gray-500">
                    Upload a clear photo to help others recognize you
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("profile-upload")?.click()}
                    disabled={isUploading}
                  >
                    Upload new image
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className="border-2 border-slate-300 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Personal Email Address</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="e.g. name@example.com"
                          className="border-2 border-slate-300 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          required
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      <VerificationIndicator
                        isVerified={verificationStatus.email}
                        isDirty={safeFormData.email !== originalEmail}
                        onVerify={handleSave}
                        isVerifying={showOtpSection && verificationType === "email"}
                      />
                    </div>
                    {showOtpSection && verificationType === "email" && (
                      <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Verify OTP</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="h-9 text-center font-mono tracking-widest"
                            maxLength={6}
                          />
                          <Button size="sm" onClick={handleVerifyOtp} className="h-9 px-4">Confirm</Button>
                        </div>
                        {otpError && <p className="text-[10px] text-red-500 mt-1">{otpError}</p>}
                        <div className="flex justify-between items-center mt-2">
                          <button onClick={handleResendOtp} disabled={isResending || countdown > 0} className="text-[10px] text-primary hover:underline font-medium">
                            {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                          </button>
                          <button onClick={() => setShowOtpSection(false)} className="text-[10px] text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={safeFormData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g. 9876543210"
                          className={`border-2 border-slate-300 pl-10 h-10 shadow-sm transition-all focus:ring-2 focus:ring-primary/20 ${phoneError ? "border-red-500" : ""}`}
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      <VerificationIndicator
                        isVerified={verificationStatus.phone}
                        isDirty={safeFormData.phone !== originalPhone}
                        onVerify={handleSave}
                        isVerifying={showOtpSection && verificationType === "phone"}
                      />
                    </div>
                    {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
                    {showOtpSection && verificationType === "phone" && (
                      <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Verify OTP</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="h-9 text-center font-mono tracking-widest"
                            maxLength={6}
                          />
                          <Button size="sm" onClick={handleVerifyOtp} className="h-9 px-4">Confirm</Button>
                        </div>
                        {otpError && <p className="text-[10px] text-red-500 mt-1">{otpError}</p>}
                        <div className="flex justify-between items-center mt-2">
                          <button onClick={handleResendOtp} disabled={isResending || countdown > 0} className="text-[10px] text-primary hover:underline font-medium">
                            {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                          </button>
                          <button onClick={() => setShowOtpSection(false)} className="text-[10px] text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={safeFormData.gender}
                    onValueChange={(value) => handleSelectChange("gender", value)}
                  >
                    <SelectTrigger id="gender" className="border-2 border-slate-300">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password (Optional)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="e.g. Enter new password"
                      className="border-2 border-slate-300 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                    {passwordError && (
                      <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="e.g. Confirm new password"
                      className="border-2 border-slate-300 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                    {confirmPasswordError && (
                      <p className="text-sm text-red-500 mt-1">{confirmPasswordError}</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isUpdating || !!phoneError || !!passwordError || !!confirmPasswordError}
                  className="w-full cursor-pointer"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <InfoDisplay />
          )}
        </CardContent>
      </Card>
    </>
  );
};

Profile.propTypes = {
  userId: PropTypes.string.isRequired,
};

const ParentComponent = () => {
  const { user } = useContext(AuthContext);
  return <Profile userId={user?.user?._id} />;
};

export default ParentComponent;
