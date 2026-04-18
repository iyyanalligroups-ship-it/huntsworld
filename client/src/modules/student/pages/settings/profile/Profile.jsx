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
  CalendarIcon,
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
import { useLazyGetUserByIdQuery, useUpdateUserMutation } from "@/redux/api/Authapi";
import { useUploadUserProfilePicMutation } from "@/redux/api/UserprofilePicapi";
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
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { refreshUser } = useContext(AuthContext);
const [copied, setCopied] = useState(false);
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
  const [originalPhone, setOriginalPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // OTP States
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'email' or 'phone'
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [emailVerifyCooldown, setEmailVerifyCooldown] = useState(0);
  const [phoneVerifyCooldown, setPhoneVerifyCooldown] = useState(0);

  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
  });

  // RTK Query hooks
  const [fetchUserById, { isLoading, error }] = useLazyGetUserByIdQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [uploadProfileImage, { isLoading: isUploading }] = useUploadUserProfilePicMutation();

  // Countdown timer logic
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
  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchUserById(userId).unwrap();
        setUserDetails(response?.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    if (userId) fetchUser();
  }, [userId, fetchUserById]);

  // Populate form when userDetails loads
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
        user_code: userDetails.user_code || "", // Added
      });
      setProfileImage(userDetails.profile_pic || null);
      setOriginalEmail(userDetails.email || "");
      setOriginalPhone(userDetails.phone || "");

      setVerificationStatus({
        email: userDetails.email_verified === true,
        phone: userDetails.number_verified === true,
      });

      const phoneValidation = validatePhoneNumber(userDetails.phone || "");
      setPhoneError(phoneValidation.errorMessage);
    }
  }, [userDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset verification status in UI if value changes from original
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
      setPhoneError(validation.errorMessage);
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
          newFormData.password === newFormData.confirmPassword ? "" : "Passwords do not match"
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
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);

    const uploadData = new FormData();
    uploadData.append("profile_pic", file);
    uploadData.append("entity_type", "user");
    uploadData.append("user_id", userId);

    try {
      const response = await uploadProfileImage({ formData: uploadData }).unwrap();
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
      showToast(err.data?.message || "Failed to upload image", "error");
      setProfileImage(null);
    }
  };

  const handleCopyReferral = async () => {
    try {
      const link = `${import.meta.env.VITE_CLIENT_URL}/referral-register?ref=${userDetails?.referral_code}`;
      await navigator.clipboard.writeText(link);
      showToast("Referral link copied!", "success");
    } catch (err) {
      showToast("Failed to copy link", "error");
    }
  };

  // Save changes
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
      showToast("Name is required", "error");
      return;
    }
    // if (!formData.email.trim()) {
    //   showToast("Email is required", "error");
    //   return;
    // }

    const emailChanged = formData.email !== originalEmail;
    const phoneChanged = formData.phone !== originalPhone;

    try {
      const updateData = { ...formData };
      if (!formData.password) {
        delete updateData.password;
        delete updateData.confirmPassword;
      } else {
        delete updateData.confirmPassword;
      }

      const response = await updateUser({ id: userId, updatedUser: updateData }).unwrap();

      if (response.requiresVerification || emailChanged || phoneChanged || response.verifyPhone) {
        setShowOtpSection(true);
        startCountdown();

        if (response.verifyPhone || phoneChanged) {
          setVerificationType("phone");
          setPhoneVerifyCooldown(30);
          showToast(response.message || "Verification required for your phone number.", "info");
        } else if (response.verifyEmail || emailChanged) {
          setVerificationType("email");
          setEmailVerifyCooldown(30);
          showToast(response.message || "Verification required for your email.", "info");
        }
        setUserDetails(response.user || userDetails);
        return;
      }

      setIsEditing(false);
      setOriginalEmail(formData.email);
      setOriginalPhone(formData.phone);
      showToast("Profile updated successfully", "success");
      refreshUser();

    } catch (err) {
      showToast(err.data?.message || "Failed to update profile", "error");
    }
  };

  const handleVerifyOtp = async () => {
    const requiredLength = verificationType === "email" ? 4 : 6;
    if (otp.length !== requiredLength) {
      setOtpError(`Please enter ${requiredLength}-digit OTP`);
      return;
    }

    try {
      let url = "";
      let body = {};

      if (verificationType === "email") {
        url = `${import.meta.env.VITE_API_URL}/users/verify-otp`;
        body = { email: formData.email, email_otp: otp };
      } else {
        url = `${import.meta.env.VITE_API_URL}/users/verify-phone-update-otp`;
        body = { phone_otp: otp, user_id: userId };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        if (data.token || (data.data && typeof data.data === "string")) {
          sessionStorage.setItem("token", data.token || data.data);
        }
        showToast(`${verificationType === "email" ? "Email" : "Phone number"} verified successfully!`, "success");
        window.location.reload();
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Try again.");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const field = verificationType === "email" ? "email" : "phone";
      await updateUser({
        id: userId,
        updatedUser: { [field]: formData[field] },
      }).unwrap();

      showToast(`New OTP sent to ${field}!`, "success");
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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg transition-all duration-300">
      <div className="flex flex-col items-center md:flex-row md:items-start gap-8 p-8">
        <div className="relative group">
          <Avatar className="w-32 h-32 border-4 border-white shadow-md transition-transform group-hover:scale-105">
            <AvatarImage src={profileImage || ""} alt="Profile" className="object-cover" />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
              {safeFormData.name ? safeFormData.name.charAt(0).toUpperCase() : "S"}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-800">
            {safeFormData.name || "Student User"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Mail className="w-5 h-5 text-primary" />
              <div className="w-full">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <div className="flex justify-between items-center">
                   <p className="text-gray-800 break-all">{safeFormData.email || "Not provided"}</p>
                   {userDetails?.email_verified ? (
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] ml-2">Verified</Badge>
                   ) : (
                       <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px] ml-2">Unverified</Badge>
                   )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Phone className="w-5 h-5 text-primary" />
              <div className="w-full">
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <div className="flex justify-between items-center">
                    <p className="text-gray-800">{safeFormData.phone || "Not provided"}</p>
                    {userDetails?.number_verified ? (
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] ml-2">Verified</Badge>
                   ) : (
                       <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px] ml-2">Unverified</Badge>
                   )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-gray-800 capitalize">{safeFormData.gender || "Not specified"}</p>
              </div>
            </div>
            {safeFormData.created_at && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <Badge variant="secondary" className="mt-1">
                    {format(new Date(safeFormData.created_at), "PPP")}
                  </Badge>
                </div>
              </div>
            )}
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

      {/* Copy Button */}
      {userDetails?.user_code && (
        <button
          onClick={handleCopy}
          className="p-2 rounded-md cursor-pointer hover:bg-gray-100 transition"
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
            {userDetails?.referral_code && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <Users className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Referral Code</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={userDetails.referral_code}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed text-gray-800"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyReferral}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading || !userDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-white rounded-2xl shadow-sm border border-gray-100">
        <Loader contained={true} label="Loading profile..." />
      </div>
    );
  }

  if (error) return <div className="text-center p-6 text-red-500">Error loading profile</div>;

  return (
    <>
      <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Student Profile</CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(!isEditing)}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                  <AvatarImage src={profileImage || ""} alt="Profile" />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {safeFormData.name ? safeFormData.name.charAt(0) : "S"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary/90"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
                <p className="text-sm text-gray-500">Upload a clear photo</p>
              </div>
            </div>

            <Separator />

            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={safeFormData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="border-2 border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={safeFormData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. student@example.com"
                        className="border-2 border-slate-300 h-10 shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                        required
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
                          placeholder="OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="h-9 text-center font-mono tracking-widest text-lg"
                          maxLength={4}
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
                  <Label htmlFor="phone">Phone Number *</Label>
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
                          placeholder="OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="h-9 text-center font-mono tracking-widest text-lg"
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
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={safeFormData.gender} onValueChange={(v) => handleSelectChange("gender", v)}>
                  <SelectTrigger id="gender" className="w-full border-2 border-slate-300">
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
                    placeholder="e.g. Min 6 characters"
                    className={`border-2 border-slate-300 ${passwordError ? "border-red-500" : ""}`}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {passwordError}
                    </p>
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
                    className={`border-2 border-slate-300 ${confirmPasswordError ? "border-red-500" : ""}`}
                  />
                  {confirmPasswordError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {confirmPasswordError}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isUpdating || !!phoneError || !!passwordError || !!confirmPasswordError}
                className="w-full bg-[#0c1f4d] hover:bg-[#0c204deb] cursor-pointer disabled:opacity-50"
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
      {(isUpdating || isUploading || isResending) && (
        <Loader label={isUpdating ? "Saving Profile..." : isUploading ? "Uploading Image..." : "Resending OTP..."} />
      )}
    </>
  );
};

Profile.propTypes = {
  userId: PropTypes.string.isRequired,
};

const StudentProfile = () => {
  const { user } = useContext(AuthContext);
  return <Profile userId={user?.user?._id} />;
};

export default StudentProfile;
