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
import { CalendarIcon, Pencil, User, Mail, Phone, Users, Clock, Trash2, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { useLazyGetUserByIdQuery, useUpdateUserMutation } from "@/redux/api/Authapi";
import { useUploadUserProfilePicMutation, useDeleteUserProfilePicMutation } from "@/redux/api/UserprofilePicapi";
import { Badge } from "@/components/ui/badge";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const Profile = ({ userId }) => {
  const { isSidebarOpen } = useSidebar();
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    profile_pic: "",
    created_at: "",
    password: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);


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
        date_of_birth: userDetails.date_of_birth || "",
        profile_pic: userDetails.profile_pic || "",
        created_at: userDetails.created_at || "",
      });
      setProfileImage(userDetails.profile_pic || null);
    }
  }, [userDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("profile_pic", file);
      formData.append("entity_type", "user");
      formData.append("user_id", userId);

      try {
        const response = await uploadProfileImage({ formData }).unwrap();
        const uploadedUrl = response.files[0]?.fileUrl;

        setProfileImage(uploadedUrl);
        setFormData((prev) => ({ ...prev, profile_pic: uploadedUrl }));

        await updateUser({
          id: userId,
          updatedUser: { profile_pic: uploadedUrl },
        }).unwrap();

        showToast("Profile picture updated successfully", "success");
      } catch (err) {
        console.error("Failed to upload and update profile image:", err);
        showToast(err.data?.message || "Failed to upload profile picture", "error");
      }
    }
  };

  const handleDeleteImage = async (profile_pic) => {
    if (!profile_pic || typeof profile_pic !== "string") {
      console.error("Invalid image URL for deletion");
      showToast("Invalid image URL for deletion", "error");
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
      showToast("Profile picture deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete profile image:", err);
      showToast(err.data?.message || "Failed to delete profile picture", "error");
    }
  };

  const handleCopyReferral = () => {
    const referralLink = `${import.meta.env.VITE_CLIENT_URL}/referral-register?ref=${userDetails?.referral_code}`;
    navigator.clipboard.write(referralLink);
    showToast("Referral link copied to clipboard!", "success");
  };

  const handleSave = async () => {
    try {
      const response = await updateUser({ id: userId, ...formData }).unwrap();
      setIsEditing(false);
      if (response.success) {
        showToast(response.message || "User Updated Successfully", "success");
      }
    } catch (err) {
      showToast(err.data?.message || "Failed to update user", "error");
      console.error("Failed to update user:", err);
    }
  };

  // Provide fallback values for formData properties
  const safeFormData = {
    name: formData.name || "",
    email: formData.email || "",
    phone: formData.phone || "",
    gender: formData.gender || "",
    date_of_birth: formData.date_of_birth || "",
    profile_pic: formData.profile_pic || "",
    created_at: formData.created_at || "",
  };

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
          {profileImage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteImage(safeFormData?.profile_pic || "")}
              disabled={isDeleting}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-800">{safeFormData.name || "Anonymous User"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800">{safeFormData.email || "Not provided"}</p>
              </div>
            </div>
            {/* Phone */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-800">{safeFormData.phone || "Not provided"}</p>
              </div>
            </div>
            {/* Gender */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-gray-800 capitalize">{safeFormData.gender || "Not specified"}</p>
              </div>
            </div>
            {/* Joined Date */}
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
            {/* Referral Code */}

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <Users className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Referral Code</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={userDetails.referral_code}
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

  if (isLoading) {
    return <div className="text-center p-6">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-6 text-red-500">Error loading user data</div>;
  }

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
                {profileImage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteImage(safeFormData?.profile_pic || "")}
                    disabled={isDeleting}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-gray-500">Upload a clear photo to help others recognize you</p>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("profile-upload")?.click()}
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

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={safeFormData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={safeFormData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="pl-10 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={safeFormData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dob"
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-md transition-all duration-300"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {safeFormData.date_of_birth ? (
                          format(new Date(safeFormData.date_of_birth), "PPP")
                        ) : (
                          <span className="text-gray-500">Select your date of birth</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={safeFormData.date_of_birth ? new Date(safeFormData.date_of_birth) : undefined}
                        onSelect={(newDate) => {
                          setFormData((prev) => ({ ...prev, date_of_birth: newDate }));
                        }}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={safeFormData.gender}
                    onValueChange={(value) => handleSelectChange("gender", value)}
                  >
                    <SelectTrigger id="gender" className="rounded-md transition-all duration-300">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={safeFormData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={safeFormData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button
                type="button"
                onClick={handleSave}
                disabled={isUpdating}
                className="w-full"
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
