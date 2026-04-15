import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { validateEmail } from "@/modules/validation/emailvalidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Store,
  Mail,
  Phone,
  Loader2,
  Sprout,
  Wrench,
  Stethoscope,
  ShoppingBasket,
  Megaphone,
  UserCircle2,
  ArrowLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import showToast from "@/toast/showToast";
import Loader from "@/loader/Loader";

function AddRequirement() {
  const { user, token, refetchUser, isLoading: isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shop_name: user?.user?.name || "",
    shop_email: user?.user?.email || "",
    shop_phone_number: user?.user?.phone || "",
    member_type: "",
  });

  const [customType, setCustomType] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // States for dynamic business types
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState(null);

  // Fetch business types from backend
  useEffect(() => {
    const fetchBusinessTypes = async () => {
      if (!token) {
        setTypesError("Not logged in - cannot load categories");
        setLoadingTypes(false);
        return;
      }

      try {
        setLoadingTypes(true);
        setTypesError(null);

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/base-member-types/fetch-all-base-member-types`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setBusinessTypes(response.data.data || []);
        } else {
          setTypesError(response.data.message || "Failed to load categories");
        }
      } catch (err) {
        setTypesError(err.response?.data?.message || "Network error");
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchBusinessTypes();
  }, [token]);

  // Add "Other" as a special option
  const allOptions = [
    ...businessTypes.map((t) => ({ _id: t._id, name: t.name })),
    { _id: "other", name: "Other" },
  ];

  // Validate form whenever relevant data changes
  useEffect(() => {
    validateInputs();
  }, [formData, customType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue =
      name === "shop_phone_number" ? value.replace(/\D/g, "") : value;
    if (name === "shop_phone_number" && cleanedValue.length > 10) return;
    setFormData({ ...formData, [name]: cleanedValue });
  };

  const handleCustomTypeChange = (e) => {
    setCustomType(e.target.value);
  };

  const handleBusinessTypeChange = (value) => {
    setFormData({ ...formData, member_type: value });
    setTouchedFields((prev) => ({ ...prev, member_type: true }));
    // Clear custom type when switching away from "Other"
    if (value !== "other") {
      setCustomType("");
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    validateInputs();
  };

  const validateInputs = () => {
    const errors = {};
    let isValid = true;

    // Shop Name
    if (!formData.shop_name.trim()) {
      errors.shop_name = "Shop name is required";
      isValid = false;
    }

    // Email → now OPTIONAL
    if (formData.shop_email?.trim()) {               // only validate if something is entered
      const emailValidation = validateEmail(formData.shop_email.trim());
      if (!emailValidation.isValid) {
        errors.shop_email = emailValidation.errorMessage;
        isValid = false;
      }
    }

    // Phone (still required)
    const phone = formData.shop_phone_number.trim();
    if (!phone) {
      errors.shop_phone_number = "Phone number is required";
      isValid = false;
    } else if (!/^[0-9]+$/.test(phone)) {
      errors.shop_phone_number = "Only numbers are allowed";
      isValid = false;
    } else if (phone.length !== 10) {
      errors.shop_phone_number = "Phone number must be exactly 10 digits";
      isValid = false;
    }

    // Business Type (required)
    if (!formData.member_type) {
      errors.member_type = "Please select a business type";
      isValid = false;
    } else if (formData.member_type === "other") {
      if (!customType.trim()) {
        errors.custom_type = "Please specify your business type";
        isValid = false;
      } else if (customType.trim().length < 2) {
        errors.custom_type = "Business type is too short";
        isValid = false;
      }
    }

    setValidationErrors(errors);
    setIsFormValid(isValid);
    return isValid;
  };

  // Helper: Ensure the business type exists (create if "Other")
  const ensureBusinessType = async (selectedType, customName) => {
    if (selectedType !== "other") {
      return selectedType; // already an existing ObjectId
    }

    const trimmedName = customName.trim();
    if (!trimmedName) throw new Error("Custom business type is required");

    // Check if it already exists (case-insensitive)
    const existing = businessTypes.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing._id; // reuse existing category
    }

    // Create new type
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/base-member-types/create-base-member-type`,
        { name: trimmedName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const newType = res.data.data;
        // Update local state so newly created type appears in dropdown
        setBusinessTypes((prev) => [...prev, newType]);
        showToast("New business category added successfully!", "success");
        return newType._id;
      } else {
        throw new Error(res.data.message || "Failed to create category");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg.toLowerCase().includes("duplicate")) {
        showToast("This business category already exists", "error");
      } else {
        showToast("Failed to create new business category", "error");
      }
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateInputs();
    if (!isValid) {
      setTouchedFields({
        shop_name: true,
        shop_email: true,
        shop_phone_number: true,
        member_type: true,
        ...(formData.member_type === "other" && { custom_type: true }),
      });
      showToast("Please fix validation errors before submitting.", "error");
      return;
    }

    if (!user || !user.user?._id) {
      showToast("You must be logged in to create a profile.", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Resolve final member_type (always an ObjectId string)
      const finalMemberTypeId = await ensureBusinessType(
        formData.member_type,
        customType
      );

      const payload = {
        shop_name: formData.shop_name.trim(),
        shop_email: formData.shop_email.trim(),
        shop_phone_number: formData.shop_phone_number.trim(),
        member_type: finalMemberTypeId,
        user_id: user.user._id,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/grocery-sellers/create-minimal-grocery`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showToast(response.data.message || "Profile created successfully!", "success");

      // Reset form
      setFormData({
        shop_name: "",
        shop_email: "",
        shop_phone_number: "",
        member_type: "",
      });
      setCustomType("");
      setValidationErrors({});
      setTouchedFields({});

      await refetchUser();
      navigate("/baseMember/settings", { replace: true });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create grocery seller profile",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isOtherSelected = formData.member_type === "other";

  if (isAuthLoading || loadingTypes) {
    return <Loader label={loadingTypes ? "Loading categories..." : "Resolving session..."} />;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 p-4 md:p-8">
      {isLoading && <Loader label="Creating Profile..." />}
      <div className="w-full max-w-6xl  grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Button
          type="button"
          onClick={() => navigate(-1)}
          variant="outline"
          className="hidden md:flex absolute cursor-pointer top-10 left-5 z-40 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {/* LEFT SIDE: INFO SECTION */}
        <div className="space-y-6 mt-16 lg:mt-2 ">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Small Business Network
            </h1>
            <p className="text-slate-500 text-lg">
              Empowering local commerce. Register as a <strong>Base Member</strong> to source requirements and sell products within your community.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="bg-blue-50 p-3 rounded-lg h-fit shrink-0">
                <UserCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">1. Create Digital Profile</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Establish your shop's identity. Verified profiles get 3x more visibility for local requirements.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="bg-emerald-50 p-3 rounded-lg h-fit shrink-0">
                <Store className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">2. Select Business Category</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed mb-2">
                  We customize your dashboard based on your trade:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {businessTypes.length > 0 ? (
                    businessTypes.map((type) => (
                      <span
                        key={type._id}
                        className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md flex items-center gap-1 font-semibold"
                      >
                        {type.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-red-500">No categories available</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="bg-indigo-50 p-3 rounded-lg h-fit shrink-0">
                <Megaphone className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">3. Trade & Request</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Post your daily <strong>requirements</strong> to suppliers or list small <strong>products</strong> to sell to local customers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium px-2 pt-2">
            <CheckCircle2 size={14} /> Local Business SOP • Ver 1.2
          </div>
        </div>

        {/* RIGHT SIDE: FORM SECTION */}
        <Card className="w-full shadow-xl border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2 text-slate-900">
              <Store className="h-6 w-6 text-indigo-900" />
              Create Base Member Profile
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              Join the network for Farmers, Shopkeepers & Service Providers.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info Alert */}
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm">Review your details</p>
                <p className="text-xs mt-1 text-indigo-700 leading-relaxed">
                  We've pre-filled some info from your login. Please ensure your <strong>Phone Number</strong> and <strong>Business Type</strong> are accurate for order alerts.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Shop Name */}
              <div className="space-y-2">
                <Label htmlFor="shop_name" className="flex items-center gap-2 font-semibold text-slate-700">
                  <Store className="h-4 w-4 text-indigo-500" />
                  Shop / Business Name
                </Label>
                <Input
                  type="text"
                  id="shop_name"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Ramesh General Store"
                  className={`border-2 border-slate-300 ${
                    touchedFields.shop_name && validationErrors.shop_name
                      ? "border-red-500"
                      : "focus-visible:ring-indigo-600"
                  }`}
                />
                {touchedFields.shop_name && validationErrors.shop_name && (
                  <p className="text-red-500 text-xs font-medium">
                    {validationErrors.shop_name}
                  </p>
                )}
              </div>

              {/* Shop Email */}
              <div className="space-y-2">
                <Label htmlFor="shop_email" className="flex items-center gap-2 font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-indigo-500" />
                  Business Email <span className="text-slate-400 text-xs font-normal ml-1">(optional)</span>
                </Label>
                <Input
                  type="email"
                  id="shop_email"
                  name="shop_email"
                  value={formData.shop_email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. shop@example.com (optional)"
                  className={`border-2 border-slate-300 ${
                    touchedFields.shop_email && validationErrors.shop_email
                      ? "border-red-500"
                      : "focus-visible:ring-indigo-600"
                  }`}
                />
                {touchedFields.shop_email && validationErrors.shop_email && (
                  <p className="text-red-500 text-xs font-medium">
                    {validationErrors.shop_email}
                  </p>
                )}
              </div>

              {/* Shop Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="shop_phone_number"
                  className="flex items-center gap-2 font-semibold text-slate-700"
                >
                  <Phone className="h-4 w-4 text-indigo-500" />
                  Contact Number
                </Label>
                <Input
                  type="tel"
                  id="shop_phone_number"
                  name="shop_phone_number"
                  value={formData.shop_phone_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 9876543210"
                  className={`border-2 border-slate-300 ${
                    touchedFields.shop_phone_number && validationErrors.shop_phone_number
                      ? "border-red-500"
                      : "focus-visible:ring-indigo-600"
                  }`}
                />
                {touchedFields.shop_phone_number && validationErrors.shop_phone_number && (
                  <p className="text-red-500 text-xs font-medium">
                    {validationErrors.shop_phone_number}
                  </p>
                )}
              </div>

              {/* Business Category */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold text-slate-700">
                  <Wrench className="h-4 w-4 text-indigo-500" />
                  Business Category
                </Label>

                {typesError ? (
                  <div className="text-amber-600 text-sm bg-amber-50 p-3 rounded-md border border-amber-200">
                    {typesError}
                    {typesError.includes("log in") && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/login")}
                          className="text-indigo-600 border-indigo-400 hover:bg-indigo-50"
                        >
                          Log In Now
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Select
                      value={formData.member_type}
                      onValueChange={handleBusinessTypeChange}
                    >
                      <SelectTrigger
                        className={`border-2 border-slate-300 ${
                          touchedFields.member_type && validationErrors.member_type
                            ? "border-red-500"
                            : "focus-visible:ring-indigo-600"
                        }`}
                      >
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {allOptions.map((type) => (
                          <SelectItem key={type._id} value={type._id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isOtherSelected && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        <Label htmlFor="custom_type" className="text-sm font-medium text-slate-700">
                          Specify your business type
                        </Label>
                        <Input
                          id="custom_type"
                          value={customType}
                          onChange={handleCustomTypeChange}
                          onBlur={() => setTouchedFields((prev) => ({ ...prev, custom_type: true }))}
                          placeholder="e.g. Organic Fertilizer Supplier"
                          className={`border-2 border-slate-300 ${
                            touchedFields.custom_type && validationErrors.custom_type
                              ? "border-red-500"
                              : "focus-visible:ring-indigo-600"
                          }`}
                        />
                        {touchedFields.custom_type && validationErrors.custom_type && (
                          <p className="text-red-500 text-xs font-medium">
                            {validationErrors.custom_type}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {touchedFields.member_type && validationErrors.member_type && (
                  <p className="text-red-500 text-xs font-medium">
                    {validationErrors.member_type}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 h-11 text-base shadow-md transition-all hover:shadow-lg mt-4"
                style={{
                  backgroundColor: isFormValid ? "#0c1f4d" : "#9ca3af",
                  cursor: isFormValid ? "pointer" : "not-allowed",
                }}
                disabled={!isFormValid || isLoading || loadingTypes}
              >
                {isLoading ? "Creating Profile..." : "Create Profile & Continue"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center pb-6 pt-0">
            <p className="text-xs text-slate-400 text-center">
              Your data is secure and used for verification only.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default AddRequirement;
