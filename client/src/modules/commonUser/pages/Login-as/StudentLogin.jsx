import React, { useState, useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "@/modules/validation/emailvalidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Building2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import showToast from "@/toast/showToast";
import Loader from "@/loader/Loader";

function StudentLogin() {
  const { user, refetchUser, isLoading: isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);

  const [formData, setFormData] = useState({
    college_email: "",
    college_name: "",
    university_name: "",
    college_start_month_year: "",
    college_end_month_year: "",
    id_card: "",
  });

  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState({
    college_email: "",
    college_name: "",
    university_name: "",
    college_start_month_year: "",
    college_end_month_year: "",
    id_card: "",
  });

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateDates = (start, end) => {
    if (!start)
      return { isValid: false, errorMessage: "Start date is required" };
    if (!end) return { isValid: false, errorMessage: "End date is required" };

    const startDate = new Date(start);
    const endDate = new Date(end);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (startDate > currentDate) {
      return {
        isValid: false,
        errorMessage: "Start date cannot be in the future",
      };
    }
    if (endDate < startDate) {
      return {
        isValid: false,
        errorMessage: "End date cannot be before start date",
      };
    }
    return { isValid: true, errorMessage: "" };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let error = "";

    if (name === "college_email" && value && !validateEmail(value).isValid) {
      error = "Invalid email format";
    } else if (name === "college_name" && !value.trim()) {
      error = "College name is required";
    } else if (name === "university_name" && !value.trim()) {
      error = "University name is required";
    } else if (
      name === "college_start_month_year" ||
      name === "college_end_month_year"
    ) {
      const start =
        name === "college_start_month_year"
          ? value
          : formData.college_start_month_year;
      const end =
        name === "college_end_month_year"
          ? value
          : formData.college_end_month_year;
      if (start && end) {
        const validation = validateDates(start, end);
        if (!validation.isValid) {
          error = validation.errorMessage;
          setErrors((prev) => ({
            ...prev,
            college_start_month_year:
              name === "college_start_month_year"
                ? error
                : prev.college_start_month_year,
            college_end_month_year:
              name === "college_end_month_year"
                ? error
                : prev.college_end_month_year,
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            college_start_month_year: "",
            college_end_month_year: "",
          }));
        }
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Upload ID Card
  const handleFileChange = async (e) => {
    if (!formData.college_name) {
      showToast("College name is required before uploading an image.", "info");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Only JPG, PNG, WebP images allowed", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }

    setUploading(true);
    setErrors((prev) => ({ ...prev, id_card: "" }));

    const tempPreview = URL.createObjectURL(file);
    setPreview(tempPreview);

    const formDataToSend = new FormData();
    formDataToSend.append("id_card_image", file);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/update/${formData.college_name || "temp"
        }`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const imageUrl =
        response.data.logoUrl || response.data.imageUrl || response.data.url;
      setFormData((prev) => ({ ...prev, id_card: imageUrl }));
      setPreview(imageUrl);
      showToast("ID card uploaded successfully", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to upload ID card",
        "error"
      );
      setPreview("");
      setErrors((prev) => ({ ...prev, id_card: "Upload failed" }));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Delete ID Card Image
  const handleDeleteImage = async () => {

    setDeleting(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/delete`,
        {
          college_name: formData.college_name,
        }
      );

      setFormData((prev) => ({ ...prev, id_card: "" }));
      setPreview("");
      showToast("ID card removed successfully", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete ID card",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!user || !user.user?._id) {
      showToast("Please log in first", "error");
      setLoading(false);
      return;
    }

    const newErrors = {
      college_name: !formData.college_name.trim()
        ? "College name is required"
        : "",
      university_name: !formData.university_name.trim()
        ? "University name is required"
        : "",
      college_start_month_year: !formData.college_start_month_year
        ? "Start date is required"
        : "",
      college_end_month_year: !formData.college_end_month_year
        ? "End date is required"
        : "",
      id_card: !formData.id_card ? "ID card image is required" : "",
      college_email:
        formData.college_email && !validateEmail(formData.college_email).isValid
          ? "Invalid email"
          : "",
    };

    const dateValidation = validateDates(
      formData.college_start_month_year,
      formData.college_end_month_year
    );
    if (!dateValidation.isValid) {
      newErrors.college_start_month_year = dateValidation.errorMessage;
      newErrors.college_end_month_year = dateValidation.errorMessage;
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      showToast("Please fix the errors above", "error");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/students/create-student-profile`,
        {
          user_id: user.user._id,
          college_email: formData.college_email || null,
          college_name: formData.college_name,
          university_name: formData.university_name,
          college_start_month_year: formData.college_start_month_year,
          college_end_month_year: formData.college_end_month_year,
          id_card: formData.id_card,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      showToast("Profile created successfully!", "success");

      // 🔁 REFRESH AUTH STATE (THIS IS THE MAGIC)
      await refetchUser();

      // 🔀 REDIRECT TO HOME DASHBOARD
      navigate("/", { replace: true });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return <Loader label="Resolving session..." />;
  }

  return (
    <div className="min-h-screen flex justify-center py-8 bg-gray-50">
      {loading && <Loader label="Requesting Student Profile..." />}
      {uploading && <Loader label="Uploading ID Card..." />}
      {deleting && <Loader label="Removing ID Card..." />}
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <GraduationCap className="h-8 w-8" />
              Student Profile Creation
            </CardTitle>
            <CardDescription>
              Complete your student verification
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* College Email (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="college_email"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    College Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="college_email"
                    type="email"
                    name="college_email"
                    value={formData.college_email}
                    onChange={handleChange}
                    placeholder="e.g. name@college.edu"
                    className={`border-2 border-slate-300 ${errors.college_email ? "border-red-500" : ""}`}
                  />
                  {errors.college_email && (
                    <p className="text-red-500 text-xs">
                      {errors.college_email}
                    </p>
                  )}
                </div>

                {/* College & University Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      College Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="college_name"
                      value={formData.college_name}
                      onChange={handleChange}
                      placeholder="e.g. St. Xavier's College"
                      className={`border-2 border-slate-300 ${errors.college_name ? "border-red-500" : ""}`}
                    />
                    {errors.college_name && (
                      <p className="text-red-500 text-xs">
                        {errors.college_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      University Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="university_name"
                      value={formData.university_name}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai University"
                      className={`border-2 border-slate-300 ${errors.university_name ? "border-red-500" : ""}`}
                    />
                    {errors.university_name && (
                      <p className="text-red-500 text-xs">
                        {errors.university_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      name="college_start_month_year"
                      value={formData.college_start_month_year}
                      onChange={handleChange}
                      className={`border-2 border-slate-300 ${
                        errors.college_start_month_year ? "border-red-500" : ""
                      }`}
                    />
                    {errors.college_start_month_year && (
                      <p className="text-red-500 text-xs">
                        {errors.college_start_month_year}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      name="college_end_month_year"
                      value={formData.college_end_month_year}
                      onChange={handleChange}
                      min={formData.college_start_month_year}
                      disabled={!formData.college_start_month_year}
                      title={!formData.college_start_month_year ? "Please select a start date first" : ""}
                      className={`border-2 border-slate-300 ${
                        errors.college_end_month_year ? "border-red-500" : ""
                      }`}
                    />
                    {errors.college_end_month_year && (
                      <p className="text-red-500 text-xs">
                        {errors.college_end_month_year}
                      </p>
                    )}
                  </div>
                </div>

                {/* ID Card Upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Upload className="h-4 w-4" />
                    Upload ID Card <span className="text-red-500">*</span>
                  </Label>

                  <div
                    className={`
      border-2 border-dashed rounded-xl p-6 text-center relative transition
      ${preview ? "border-[#0c1f4d]" : "border-gray-300 hover:border-[#0c1f4d]"}
    `}
                  >
                    {/* Show Preview */}
                    {preview ? (
                      <div className="relative inline-block">
                        <img
                          src={preview}
                          alt="ID Card Preview"
                          className="max-h-64 rounded-lg shadow-lg mx-auto object-cover"
                        />

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          disabled={deleting}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-md transition"
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>

                        {/* Change Image Button */}
                        <label
                          htmlFor="id_card_input"
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow-md cursor-pointer hover:bg-white transition flex items-center gap-2 text-sm font-medium"
                        >
                          <Upload className="h-4 w-4" />

                        </label>
                      </div>
                    ) : (
                      /* Default Upload UI */
                      <div className="space-y-3 py-6">
                        <Upload className="h-14 w-14 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">
                          Click below to upload your college ID card
                        </p>

                        <label
                          htmlFor="id_card_input"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c1f4d] text-white rounded-lg cursor-pointer hover:bg-[#0c204de9] transition"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Choose Image
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading || deleting}
                      className="hidden"
                      id="id_card_input"
                    />
                  </div>

                  {errors.id_card && (
                    <p className="text-red-500 text-xs">{errors.id_card}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full text-lg py-6 cursor-pointer"
                  style={{ backgroundColor: "#0c1f4d" }}
                  disabled={loading || uploading || deleting}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Requesting Profile...
                    </>
                  ) : (
                    "Request Student Profile"
                  )}
                </Button>
              </form>
          </CardContent>

          <CardFooter className="text-center text-sm text-gray-600">
            Make sure your ID card is clear and all details are correct before
            submitting.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default StudentLogin;
