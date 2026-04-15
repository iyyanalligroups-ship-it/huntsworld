import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Pencil, Mail, Phone, Users, Clock, Trash2, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { useLazyGetUserByIdQuery, useUpdateUserMutation } from "@/redux/api/Authapi";
import { useUploadUserProfilePicMutation, useDeleteUserProfilePicMutation } from "@/redux/api/UserprofilePicapi";
import { Badge } from "@/components/ui/badge";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
// Import the validation function
import { validatePhoneNumber } from "@/modules/validation/phoneValidation"; // Adjust the path as needed

const VerificationIndicator = ({ isVerified, isDirty, onVerify, isVerifying }) => {
  if (isVerifying) return null;

  if (isVerified && !isDirty) {
    return (
      <Badge
        variant="outline"
        className="ml-2.5 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border-green-200 shadow-sm"
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
        className="ml-2 h-7 px-3 text-[10px] uppercase tracking-wider font-bold text-primary hover:bg-primary/5 border-primary/30 rounded-full"
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
  const [validationErrors, setValidationErrors] = useState({});
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
  const [manualLoading, setManualLoading] = useState(false);

  // RTK Query hooks
  const [fetchUserById, { isLoading, error }] = useLazyGetUserByIdQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [uploadProfileImage, { isLoading: isUploading }] = useUploadUserProfilePicMutation();
  const [deleteProfileImage, { isLoading: isDeleting }] = useDeleteUserProfilePicMutation();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchUserById(userId).unwrap();
        setUserDetails(response?.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        showToast.error("Failed to fetch user details");
      }
    };
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUserById]);

  // Update formData when userDetails changes
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
      setValidationErrors({}); // Clear errors when loading new data
      setVerificationStatus({
        email: userDetails.email_verified === true,
        phone: userDetails.number_verified === true,
      });
    }
  }, [userDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Track dirty verification state
    if (name === "email" && value.trim() !== (originalEmail || "").trim()) {
      setVerificationStatus((prev) => ({ ...prev, email: false }));
    }
    if (name === "phone" && value.trim() !== (originalPhone || "").trim()) {
      setVerificationStatus((prev) => ({ ...prev, phone: false }));
    }

    // Clear specific field error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};

    // Phone validation
    if (formData.phone) {
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.errorMessage;
      }
    }

    // Password validation (only if password is being changed)
    if (formData.password) {
      if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters long";
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
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

        showToast.success("Profile picture updated successfully");
      } catch (err) {
        console.error("Failed to upload and update profile image:", err);
        showToast.error(err.data?.message || "Failed to upload profile picture");
      }
    }
  };

  const handleDeleteImage = async (profile_pic) => {
    if (!profile_pic || typeof profile_pic !== "string") {
      console.error("Invalid image URL for deletion");
      showToast.error("Invalid image URL for deletion");
      return;
    }

    try {
      await deleteProfileImage({
        user_id: userId,
        entity_type: "user",
        profile_pic,
      }).unwrap();

      setProfileImage(null);
      setFormData((prev) => ({ ...prev, profile_pic: "" }));
      showToast.success("Profile picture deleted successfully");
    } catch (err) {
      console.error("Failed to delete profile image:", err);
      showToast.error(err.data?.message || "Failed to delete profile picture");
    }
  };

  const handleCopyReferral = () => {
    const referralLink = `${import.meta.env.VITE_API_URL}/referral-register?ref=${userDetails?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    showToast.success("Referral link copied to clipboard!");
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      showToast.error("Please fix the errors before saving");
      return;
    }

    // Prepare data to send (exclude confirmPassword and empty password)
    const dataToUpdate = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      profile_pic: formData.profile_pic,
    };

    // Only include password if it's not empty
    if (formData.password) {
      dataToUpdate.password = formData.password;
    }

    try {
      const response = await updateUser({ 
        id: userId, 
        updatedUser: dataToUpdate 
      }).unwrap();

      if (response.requiresVerification) {
        setShowOtpSection(true);
        setCountdown(60); // Simple countdown start
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        if (response.verifyPhone) {
          setVerificationType("phone");
          showToast.info("OTP sent to your phone number.");
        } else if (response.verifyEmail) {
          setVerificationType("email");
          showToast.info("OTP sent to your email.");
        }
        return;
      }

      setIsEditing(false);
      setOriginalEmail(formData.email);
      setOriginalPhone(formData.phone);
      setValidationErrors({}); // Clear errors on successful save
      if (response.success) {
        showToast.success(response.message || "User Updated Successfully");
      }
    } catch (err) {
      showToast.error(err.data?.message || "Failed to update user");
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
        showToast.success(`${verificationType === "email" ? "Email" : "Phone"} verified successfully!`);
        setShowOtpSection(false);
        setIsEditing(false);
        setOtp("");
        setOtpError("");
        setVerificationType(null);
        setOriginalEmail(formData.email);
        setOriginalPhone(formData.phone);
        
        const freshUser = await fetchUserById(userId).unwrap();
        setUserDetails(freshUser?.user);
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed.");
    } finally {
      setManualLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      await updateUser({ id: userId, updatedUser: dataToUpdate }).unwrap();
      showToast.success("New OTP sent!");
      setCountdown(60);
    } catch (err) {
      showToast.error("Failed to resend OTP");
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

  // InfoDisplay component
  const InfoDisplay = () => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg transition-all duration-300">
      <div className="flex flex-col items-center md:flex-row md:items-start gap-8 p-8">
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar className="w-32 h-32 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <AvatarImage src={profileImage || ""} alt="Profile" className="object-cover" />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
              {safeFormData.name ? safeFormData.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          {/* {profileImage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteImage(safeFormData?.profile_pic || "")}
              disabled={isDeleting}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )} */}
          <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-800">{safeFormData.name || "Anonymous User"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <div className="flex items-center">
                  <p className="text-gray-800">{safeFormData.email || "Not provided"}</p>
                  {verificationStatus.email && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 shadow-sm text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Verified</Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Phone */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <div className="flex items-center">
                  <p className="text-gray-800">{safeFormData.phone || "Not provided"}</p>
                  {verificationStatus.phone && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 shadow-sm text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Verified</Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Gender */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-gray-800 capitalize">{safeFormData.gender || "Not specified"}</p>
              </div>
            </div>
            {/* Joined Date */}
            {safeFormData.created_at && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <Badge variant="secondary" className="mt-1">
                    {format(new Date(safeFormData.created_at), "PPP")}
                  </Badge>
                </div>
              </div>
            )}
            {/* Referral Code */}
            {userDetails?.referral_code && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <Users className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Referral Code</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={userDetails?.referral_code}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed text-gray-800"
                      aria-label="Referral code (read-only)"
                    />
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      size="icon"
                      onClick={handleCopyReferral}
                      title="Copy referral link"
                    >
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

  if (isLoading || manualLoading) return <div className="text-center p-6 bg-white/50 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error loading user data</div>;

  return (
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
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={safeFormData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
              )}
            </div>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={safeFormData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`pl-10 h-10 shadow-sm transition-all focus:ring-2 focus:ring-primary/20 ${validationErrors.email ? "border-red-500" : ""}`}
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
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify OTP</p>
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
              {validationErrors.email && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
            </div>
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="phone"
                    name="phone"
                    value={safeFormData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className={`pl-10 h-10 shadow-sm transition-all focus:ring-2 focus:ring-primary/20 ${validationErrors.phone ? "border-red-500" : ""}`}
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
              {validationErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
              )}
            </div>
            {/* Gender */}
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                onValueChange={(value) => handleSelectChange("gender", value)}
                value={safeFormData.gender}
              >
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Profile Picture */}
            <div>
              <Label htmlFor="profile_pic">Profile Picture</Label>
              <Input
                id="profile_pic"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
            {/* Password */}
            <div>
              <Label htmlFor="password">New Password (leave empty to keep current)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password"
                className={validationErrors.password ? "border-red-500" : ""}
              />
              {validationErrors.password && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
              )}
            </div>
            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm new password"
                className={validationErrors.confirmPassword ? "border-red-500" : ""}
              />
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
            {/* Save/Cancel Buttons */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <InfoDisplay />
        )}
      </CardContent>
    </Card>
  );
};

Profile.propTypes = {
  userId: PropTypes.string.isRequired,
};

// Parent Component
const ParentComponent = () => {
  const { user } = useContext(AuthContext);
  return <Profile userId={user?.user?._id} />;
};

export default ParentComponent;