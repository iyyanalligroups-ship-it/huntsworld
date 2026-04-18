import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Pencil,
  Trash2,
  Upload,
  Mail,
  School,
  Book,
  User,
  Calendar,
  ImageOff,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import Loader from "@/loader/Loader";
import { Badge } from "@/components/ui/badge";

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

// Default fallback ID card SVG (professional look)
const DefaultIdCardPlaceholder = () => (
  <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center text-blue-600">
    <User className="w-16 h-16 mb-3 opacity-70" />
    <p className="text-sm font-medium">Student ID Card</p>
    <p className="text-xs opacity-75 mt-1">No image uploaded</p>
  </div>
);

const CollegeProfile = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    college_email: "",
    college_name: "",
    university_name: "",
    id_card: "",
    college_start_month_year: "",
    college_end_month_year: "",
    email_verified: false,
  });
  const [studentId, setStudentId] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false); // NEW: upload state
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dateError, setDateError] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");

  // OTP States
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'email'
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
  });
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL
          }/students/fetch-student-user-id/${userId}`
        );
        const studentData = response.data;
        setStudentId(studentData._id);
        setFormData({
          college_email: studentData.college_email || "",
          college_name: studentData.college_name || "",
          university_name: studentData.university_name || "",
          id_card: studentData.id_card || "",
          college_start_month_year: studentData.college_start_month_year
            ? new Date(studentData.college_start_month_year)
              .toISOString()
              .split("T")[0]
            : "",
          college_end_month_year: studentData.college_end_month_year
            ? new Date(studentData.college_end_month_year)
              .toISOString()
              .split("T")[0]
            : "",
          email_verified: studentData.email_verified || false,
        });
        setOriginalEmail(studentData.college_email || "");
        setVerificationStatus({
          email: studentData.email_verified || false,
        });
        setPreviewImage(studentData.id_card || "");
        setLoading(false);
      } catch (error) {
        showToast(
          error.response?.data?.message || "Failed to fetch student data",
          "error"
        );
        setLoading(false);
      }
    };

    if (userId) fetchStudentData();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };

      // Reset verification status in UI if value changes from original
      if (name === 'college_email') {
        const isSame = value.trim().toLowerCase() === (originalEmail || "").trim().toLowerCase();
        setVerificationStatus(prev => ({ ...prev, email: isSame }));
      }

      // Date validation
      if (name === "college_start_month_year" || name === "college_end_month_year") {
        const start = newFormData.college_start_month_year;
        const end = newFormData.college_end_month_year;

        if (start && end && new Date(end) < new Date(start)) {
          setDateError("End date cannot be earlier than start date");
        } else {
          setDateError("");
        }
      }

      return newFormData;
    });
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
    const value = formData.college_email;
    if (!value) return showToast(`Please provide an ${type}`, "error");

    try {
      // For Student model, entityId should be the Student document _id.
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/send-entity-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          entityId: studentId,
          entityType: "Student",
          contactType: type,
          value,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      setVerificationType(type);
      setShowOtpSection(true);
      startCountdown();
      showToast(`OTP sent to your ${type}.`, "info");
    } catch (err) {
      showToast(err.message || "Failed to send OTP", "error");
    }
  };

  // AUTO UPLOAD as soon as file is selected
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setImageError(false);
    setUploading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("id_card_image", file);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/update/${formData.college_name
        }`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const newUrl = response.data.logoUrl;
      setFormData((prev) => ({ ...prev, id_card: newUrl }));
      setPreviewImage(newUrl);
      showToast("ID card uploaded successfully", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to upload ID card",
        "error"
      );
      setPreviewImage(formData.id_card || ""); // revert preview on error
      setImageError(true);
    } finally {
      setUploading(false);
      setSelectedFile(null);
      // Reset input so user can re-upload same file
      e.target.value = "";
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
          entityId: studentId,
          entityType: "Student",
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
        setVerificationStatus({ email: true });
        setFormData(prev => ({ ...prev, email_verified: true }));
        setVerificationType(null);
        setOriginalEmail(formData.college_email);
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm("Are you sure you want to delete the ID card image?"))
      return;

    try {
      setIsProcessing(true);
      await axios.put(
        `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/update/${formData.college_name
        }`
      );
      setPreviewImage("");
      setFormData((prev) => ({ ...prev, id_card: "" }));
      setImageError(false);
      showToast("ID card deleted successfully", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete ID card",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (dateError) {
      showToast(dateError, "error");
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        ...formData,
        college_start_month_year: formData.college_start_month_year
          ? new Date(formData.college_start_month_year)
          : null,
        college_end_month_year: formData.college_end_month_year
          ? new Date(formData.college_end_month_year)
          : null,
      };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/students/update-student/${userId}`,
        payload
      );
      setIsEditing(false);
      showToast("Student details updated successfully", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update details",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-white rounded-2xl shadow-sm border border-gray-100">
        <Loader contained={true} label="Loading profile..." />
      </div>
    );
  }

  const hasImage = previewImage && !imageError;

  const formatMonthYear = (dateString) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "long" });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <School className="w-7 h-7" />
            College Profile
          </CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="hover:bg-white/20 cursor-pointer transition-all"
          >
            <Pencil className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Text Fields */}
          <div className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-5 h-5 text-blue-600" /> College Email
                    {formData.college_email && (
                      <VerificationIndicator 
                        isVerified={verificationStatus.email} 
                        isDirty={formData.college_email.trim().toLowerCase() !== (originalEmail || "").trim().toLowerCase()} 
                        onVerify={() => handleVerifyRequest('email')} 
                        isVerifying={showOtpSection && verificationType === 'email' && isVerifying}
                      />
                    )}
                  </Label>
                  <Input
                    name="college_email"
                    value={formData.college_email || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. name@college.edu"
                    className="border-2 border-slate-300 focus:ring-blue-500"
                  />
                  {showOtpSection && verificationType === 'email' && (
                    <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Verify College Email OTP</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => { setOtp(e.target.value); setOtpError(""); }}
                          className={`h-9 text-center font-mono tracking-widest text-lg ${otpError ? "border-red-500" : ""}`}
                          maxLength={6}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleVerifyOtp} 
                          disabled={isVerifying}
                          className="h-9 px-4 cursor-pointer bg-blue-600"
                        >
                          {isVerifying ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : "Confirm"}
                        </Button>
                      </div>
                      {otpError && <p className="text-[10px] text-red-500 mt-1">{otpError}</p>}
                      <div className="flex justify-between items-center mt-2">
                        <button type="button" onClick={() => handleVerifyRequest('email')} disabled={countdown > 0} className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer">
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                        </button>
                        <button type="button" onClick={() => setShowOtpSection(false)} className="text-[10px] text-gray-500 hover:text-gray-700 font-medium cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700">
                    <School className="w-5 h-5 text-green-600" /> College Name
                  </Label>
                  <Input
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleInputChange}
                    placeholder="e.g. ABC Engineering College"
                    className="border-2 border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700">
                    <Book className="w-5 h-5 text-purple-600" /> University Name
                  </Label>
                  <Input
                    name="university_name"
                    value={formData.university_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Anna University"
                    className="border-2 border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 ">
                    <Label className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-orange-600 cursor-pointer" />{" "}
                      Start Month & Year
                    </Label>
                    <Input
                      type="date"
                      name="college_start_month_year"
                      className="cursor-pointer border-2 border-slate-300"
                      value={formData.college_start_month_year}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-red-600 cursor-pointer" />{" "}
                      End Month & Year
                    </Label>
                    <Input
                      type="date"
                      className={`cursor-pointer border-2 border-slate-300 ${dateError ? 'border-red-500' : ''}`}
                      name="college_end_month_year"
                      value={formData.college_end_month_year}
                      onChange={handleInputChange}
                      min={formData.college_start_month_year}
                      disabled={!formData.college_start_month_year}
                      title={!formData.college_start_month_year ? "Please select a start date first" : ""}
                    />
                  </div>
                </div>
                {dateError && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{dateError}</p>
                )}

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-[#0c1f4d] hover:bg-[#0c204dec] text-white font-medium cursor-pointer"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> College Email
                    </p>
                    {formData.email_verified && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.college_email || "Not provided"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <School className="w-4 h-4" /> College Name
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.college_name || "Not provided"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Book className="w-4 h-4" /> University
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.university_name || "Not provided"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" /> Course
                      Start
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatMonthYear(formData.college_start_month_year)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-600" /> Course End
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatMonthYear(formData.college_end_month_year)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: ID Card Section */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-600" /> Student ID Card
            </Label>

            <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
              {hasImage ? (
                <>
                  <img
                    src={previewImage}
                    alt="Student ID Card"
                    className="w-full h-64 object-cover"
                    onError={() => setImageError(true)}
                  />
                  {uploading && (
                    <Loader contained={true} label="Uploading..." />
                  )}
                </>
              ) : (
                <DefaultIdCardPlaceholder />
              )}
            </div>

            {isEditing && (
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#0c1f4d] file:text-white hover:file:bg-[#0c1f4d] disabled:opacity-60"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                    <span>Uploading your ID card...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {isProcessing && <Loader label="Processing Student Profile..." />}
    </Card>
  );
};

export default CollegeProfile;
