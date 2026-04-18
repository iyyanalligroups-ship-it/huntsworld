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
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import {
  useLazyGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/redux/api/Authapi";
import {
  useUploadUserProfilePicMutation,
  useDeleteUserProfilePicMutation,
} from "@/redux/api/UserprofilePicapi";
import { Badge } from "@/components/ui/badge";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";
import Loader from "@/loader/Loader";

const VerificationIndicator = ({ isVerified, isDirty, onVerify, isVerifying, isLoading, cooldown }) => {

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
        disabled={isLoading || cooldown > 0}
        className="ml-2 h-7 px-3 text-xs font-semibold text-primary hover:bg-primary/5 border-primary/30"
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (cooldown > 0 ? `Verify (${cooldown}s)` : "Verify")}
      </Button>
    );
  }

  return null;
};

const Profile = ({ userId }) => {
  const { isSidebarOpen } = useSidebar();
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { refreshUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    profile_pic: "",
    created_at: "",
    password: "",
    confirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState(""); // Track original phone
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [copied, setCopied] = useState(false);
  // OTP States
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
  const [emailVerifyCooldown, setEmailVerifyCooldown] = useState(0);
  const [phoneVerifyCooldown, setPhoneVerifyCooldown] = useState(0);

  const [fetchUserById, { isLoading, error }] = useLazyGetUserByIdQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchUserById(userId).unwrap();
        setUserDetails(response?.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUserById]);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If email or phone is changed → mark as not verified locally
    if (name === "email") {
      const isSame = value.trim().toLowerCase() === (originalEmail || "").trim().toLowerCase();
      setVerificationStatus((prev) => ({ ...prev, email: isSame }));
    }
    if (name === "phone") {
      const isSame = value.trim() === (originalPhone || "").trim();
      setVerificationStatus((prev) => ({ ...prev, phone: isSame }));
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append("profile_pic", file);
      formDataUpload.append("entity_type", "user");
      formDataUpload.append("user_id", userId);

      try {
        const response = await uploadProfileImage({
          formData: formDataUpload,
        }).unwrap();
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
        showToast(
          err.data?.message || "Failed to upload profile picture",
          "error"
        );
      }
    }
  };

  const handleCopyReferral = async () => {
    try {
      const referralLink = `${import.meta.env.VITE_CLIENT_URL
        }/referral-register?ref=${userDetails?.referral_code}`;
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
        formData.password &&
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

    // if (!formData.email.trim()) {
    //   showToast("Email is required.", "error");
    //   return;
    // }

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

      // Check if any verification is required (Email OR Phone)
      if (response.requiresVerification) {
        setShowOtpSection(true);
        startCountdown();

        // Priority logic: If both changed, backend usually sends both,
        // but for UI simplicity, we set state to verify one.
        // If phone changed, prioritize phone, otherwise email.
        if (response.verifyPhone) {
          setVerificationType("phone");
          setPhoneVerifyCooldown(30);
          showToast("OTP sent to your new phone number.", "info");
        } else if (response.verifyEmail) {
          setVerificationType("email");
          setEmailVerifyCooldown(30);
          showToast("OTP sent to your new email.", "info");
        }
        return; // Don't close editing mode yet
      }

      // Success: No critical changes requiring OTP
      setIsEditing(false);
      setOriginalEmail(formData.email);
      setOriginalPhone(formData.phone);
      showToast("Profile updated successfully", "success");

      const updatedUser = await fetchUserById(userId).unwrap();
      setUserDetails(updatedUser?.user);
      refreshUser(response);
    } catch (err) {
      showToast(err.data?.message || "Failed to update user", "error");
      console.error("Failed to update user:", err);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4 && verificationType === 'email') {
      // Assuming email OTP is 4 digits based on previous code (random 1000-9999)
      setOtpError("Please enter 4-digit OTP");
      return;
    }

    // For phone OTP, usually it's 6 digits, but your generator uses 100000-999999 (6 digits)
    if (verificationType === 'phone' && otp.length < 4) {
      setOtpError("Please enter valid OTP");
      return;
    }

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

        setShowOtpSection(false);
        setIsEditing(false);
        setOtp("");
        setOtpError("");
        setVerificationType(null);

        setOriginalEmail(formData.email);
        setOriginalPhone(formData.phone);

        // Update local data
        const updated = await fetchUserById(userId).unwrap();
        setUserDetails(updated?.user);

        // Update context/token if provided in response
        if (data.token) {
          refreshUser(data);
        } else {
          // Fallback if verify endpoint doesn't return full user object
          refreshUser({ user: updated?.user });
        }
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
      console.error(err);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      // Calling updateUser again works because backend logic
      // checks if current input !== verified data and resends OTP
      await updateUser({
        id: userId,
        updatedUser: {
          email: formData.email,
          phone: formData.phone
        },
      }).unwrap();

      showToast("New OTP sent!", "success");
      startCountdown();
    } catch (err) {
      showToast("Failed to resend OTP", "error");
    } finally {
      setIsResending(false);
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
  <div className="bg-gradient-to-br rounded-xl bg-gray-100  transition-all duration-300">
    <div className="flex flex-col items-center  md:flex-row md:items-start gap-8 lg:p-8">
      <div className="relative group">
        <Avatar className="w-32 h-32 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105">
          <AvatarImage
            src={profileImage || ""}
            alt="Profile"
            className="object-cover"
          />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
            {safeFormData.name ? safeFormData.name.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="flex-1 space-y-6 text-center md:text-left">
        <h3 className="text-2xl font-bold text-gray-800">
          {safeFormData.name || "Anonymous User"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email Field with Verification Badge */}
          <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-gray-500">Email</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ml-2 ${userDetails?.email_verified ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
              >
                {userDetails?.email_verified ? "Verified" : "Not Verified"}
              </Badge>
            </div>
            <p className="text-gray-800 pl-8">
              {safeFormData.email || "Not provided"}
            </p>
          </div>

          {/* Phone Field with Verification Badge */}
          <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-gray-500">Phone</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ml-2 ${userDetails?.number_verified ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
              >
                {userDetails?.number_verified ? "Verified" : "Not Verified"}
              </Badge>
            </div>
            <p className="text-gray-800 pl-8">
              {safeFormData.phone || "Not provided"}
            </p>
          </div>

          {/* Gender */}
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="text-gray-800 capitalize">
                {safeFormData.gender || "Not specified"}
              </p>
            </div>
          </div>

          {/* Joined */}
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

          {/* User ID */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 col-span-1 sm:col-span-2">
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
                className="p-2 cursor-pointer rounded-md hover:bg-gray-100 transition"
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
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 col-span-1 sm:col-span-2">
            <Users className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Referral Code</p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={userDetails?.referral_code || ""}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed text-gray-800"
                  aria-label="Referral code (read-only)"
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

  if (error)
    return (
      <div className="text-center p-6 text-red-500">
        Error loading user data
      </div>
    );

  if (isLoading || !userDetails) return (
    <div className="flex justify-center flex-col items-center min-h-[40vh] w-full">
      <Loader contained={true} label="Loading profile..." />
    </div>
  );

  const isProcessingOverlay = isUpdating || isUploading || isDeleting || isResending;

  return (
    <div className="relative">
      {isProcessingOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader label="Processing..." />
        </div>
      )}
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
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("profile-upload")?.click()
                    }
                    className="rounded-md transition-all duration-300 hover:bg-primary/5"
                    disabled={isUploading}
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
                      className="lucide lucide-upload mr-2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload new image
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={safeFormData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={safeFormData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="h-10 shadow-sm text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300"
                      />
                    </div>
                    <VerificationIndicator
                      isVerified={verificationStatus.email}
                      isDirty={safeFormData.email !== originalEmail}
                      onVerify={() => {
                        if (emailVerifyCooldown === 0) {
                          setEmailVerifyCooldown(30);
                          handleSave();
                        }
                      }}
                      isVerifying={showOtpSection && verificationType === "email"}
                      isLoading={isUpdating}
                      cooldown={emailVerifyCooldown}
                    />
                  </div>
                  {showOtpSection && verificationType === "email" && (
                    <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify Email OTP</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="h-9 text-center font-mono tracking-widest text-lg border-2 border-slate-300"
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
                        className={`pl-10 h-10 shadow-sm text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300 ${phoneError ? "border-red-500" : ""}`}
                        required
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <VerificationIndicator
                      isVerified={verificationStatus.phone}
                      isDirty={safeFormData.phone !== originalPhone}
                      onVerify={() => {
                        if (phoneVerifyCooldown === 0) {
                          setPhoneVerifyCooldown(30);
                          handleSave();
                        }
                      }}
                      isVerifying={showOtpSection && verificationType === "phone"}
                      isLoading={isUpdating}
                      cooldown={phoneVerifyCooldown}
                    />
                  </div>
                  {showOtpSection && verificationType === "phone" && (
                    <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify Phone OTP</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="h-9 text-center font-mono tracking-widest text-lg border-2 border-slate-300"
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
                  {phoneError && (
                    <p className="text-sm text-red-500 mt-1">{phoneError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={safeFormData.gender}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger
                    id="gender"
                    className="rounded-md transition-all duration-300 w-full border-2 border-slate-300"
                  >
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      Prefer not to say
                    </SelectItem>
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
                    className={`text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300 ${passwordError ? "border-red-500" : ""
                      }`}
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
                    className={`text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 border-2 border-slate-300 ${confirmPasswordError ? "border-red-500" : ""
                      }`}
                  />
                  {confirmPasswordError && (
                    <p className="text-sm text-red-500 mt-1">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
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
    </div>
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
