import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { validatePhoneNumber } from "@/modules/validation/phoneValidation";
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
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Store,
  SkipForward,
  TrendingUp,
  ArrowLeft,
  FileText,
  BadgeCent
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import showToast from "@/toast/showToast";
import Loader from "@/loader/Loader";


const SellProduct = () => {
  const { user, refetchUser, isLoading: isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    company_phone_number: "",
    gst_number: "",
    msme_certificate_number: "",
  });
  const [registrationType, setRegistrationType] = useState("skip"); // gst, msme, skip
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);


  useEffect(() => {
    const fetchUserBasicDetails = async () => {
      if (!user?.user?._id) return;
      setIsFetchingDetails(true);

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/users/get-user-basic-details`,
          { user_id: user.user._id }
        );

        if (res.data.success) {
          const { name, email, phone } = res.data.data;

          setFormData({
            company_name: name || "",
            company_email: email || "",
            company_phone_number: phone || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user details", error);
      } finally {
        setIsFetchingDetails(false);
      }
    };

    fetchUserBasicDetails();
  }, [user]);

  // 🔹 Validation handler
  const validateField = (name, value) => {
    if (name === "company_name") {
      if (!value.trim()) return "Company name is required";
    }
    if (name === "company_email") {
      const { isValid, errorMessage } = validateEmail(value);
      if (!isValid) return errorMessage;
    }
    if (name === "company_phone_number") {
      if (!/^\d*$/.test(value)) return "Only numbers are allowed";
      if (value.length !== 10) return "Phone number must be 10 digits";
      const { isValid, errorMessage } = validatePhoneNumber(value);
      if (!isValid) return errorMessage;
    }
    if (name === "gst_number" && registrationType === "gst") {
      if (!value.trim()) return "GST number is required";
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(value.trim())) return "Invalid GST format (e.g., 22AAAAA0000A1Z5)";
    }
    if (name === "msme_certificate_number" && registrationType === "msme") {
      if (!value.trim()) return "MSME Certificate Number is required";
      // Allow general format checking or UDYAM format. For this use case, 
      // let's ensure it's not just random characters, typically UDYAM-XX-00-0000000
      const msmeRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i; // Added 'i' for case-insensitivity
      if (!msmeRegex.test(value.trim())) return "Invalid MSME format (e.g., UDYAM-XX-00-0000000)";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "company_phone_number" && !/^\d*$/.test(value)) return;

    // Force uppercase for GST and MSME
    let formattedValue = value;
    if (name === "gst_number" || name === "msme_certificate_number") {
      formattedValue = value.toUpperCase();
    }
    
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    if (touched[name]) {
      const errorMessage = validateField(name, formattedValue);
      setErrors((prev) => ({ ...prev, [name]: errorMessage }));
    }
  };

  const handleRegistrationTypeChange = (val) => {
    setRegistrationType(val);
    setErrors((prev) => ({ ...prev, gst_number: "", msme_certificate_number: "" }));
    setTouched((prev) => ({ ...prev, gst_number: false, msme_certificate_number: false }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMessage = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMessage }));
  };

  // 🔹 Check if all fields are valid
  const isAllValid =
    Object.keys(formData).every(
      (key) => !validateField(key, formData[key])
    ) && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      newErrors[key] = validateField(key, formData[key]);
    });

    setErrors(newErrors);
    setTouched({
      company_name: true,
      company_email: true,
      company_phone_number: true,
      ...(registrationType === "gst" && { gst_number: true }),
      ...(registrationType === "msme" && { msme_certificate_number: true }),
    });

    const hasErrors = Object.values(newErrors).some((err) => err);
    if (hasErrors) {
      showToast(
        <div className="flex items-center">
          Please fix the validation errors before submitting
        </div>,
        "error"
      );
      setLoading(false);
      return;
    }

    if (!user || !user?.user?._id) {
      showToast(
        <div className="flex items-center">
          You must be logged in to create a merchant profile
        </div>,
        "error"
      );
      setLoading(false);
      return;
    }

    try {
      const payload = {
        user_id: user?.user?._id,
        company_name: formData.company_name,
        company_email: formData.company_email,
        company_phone_number: formData.company_phone_number,
      };

      if (registrationType === "gst" && formData.gst_number) {
        payload.gst_number = formData.gst_number;
      } else if (registrationType === "msme" && formData.msme_certificate_number) {
        payload.msme_certificate_number = formData.msme_certificate_number;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/merchants/create-minimal-merchant`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      // 🚀 SUCCESS
      showToast(
        <div className="flex items-center">
          {/* <CheckCircle2 className="h-5 w-5 mr-2" /> */}
          Merchant profile created successfully!
        </div>,
        "success"
      );

      // 🔁 REFRESH AUTH STATE (THIS IS THE MAGIC)
      await refetchUser();

      // 🔀 REDIRECT TO MERCHANT DASHBOARD
      navigate("/merchant/dashboard", { replace: true });

      // optional reset
      setFormData({
        company_name: "",
        company_email: "",
        company_phone_number: "",
        gst_number: "",
        msme_certificate_number: "",
      });
      setRegistrationType("skip");
      setErrors({});
      setTouched({});
    } catch (err) {
      showToast(
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {err.response?.data?.message || "Failed to create merchant profile"}
        </div>,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };


  // 🔹 Loader while loading user context or fetching details
  if (isAuthLoading || isFetchingDetails) {
    return <Loader label={isFetchingDetails ? "Fetching your details..." : "Resolving session..."} />;
  }

  return (
    <div className="min-h-screen flex items-center relative justify-center bg-slate-50 p-4 md:p-8">
      {loading && <Loader label="Creating Merchant Profile..." />}

      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="hidden md:flex absolute cursor-pointer top-5 left-2 z-40 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {/* Container Layout: Splits into 2 columns on medium screens */}
      <div className="w-full mt-12 lg:mt-0 max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* LEFT SIDE: SOP / INFO SECTION */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Merchant Partnership
            </h1>
            <p className="text-slate-500 text-lg">
              Join our network of verified suppliers. Follow the standard onboarding protocol below to begin digitizing your business.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-50 p-3 rounded-lg h-fit shrink-0">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">1. Entity Verification</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Complete the registration form to establish your <strong>Official Merchant Profile</strong>. This creates your trusted identity in our ecosystem.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-amber-50 p-3 rounded-lg h-fit shrink-0">
                <Store className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">2. Catalog Digitization</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Once registered, access your dashboard to <strong>list products and services</strong>. Categorize your inventory to ensure accurate visibility.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 p-3 rounded-lg h-fit shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">3. Requirement Fulfillment</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Receive <strong>inbound requirements</strong> directly from verified buyers. Match your capabilities with user needs to generate qualified leads.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium px-2 pt-2">
            <CheckCircle2 size={14} /> SOP Version 2.4 • Updated for Compliance
          </div>
        </div>

        {/* RIGHT SIDE: FORM SECTION */}
        <Card className="w-full shadow-xl border-slate-200">
          <CardHeader className="space-y-1 relative">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2 text-slate-900">
              <Building2 className="h-6 w-6 text-indigo-900" />
              Create Merchant Profile
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              Enter your official company details to generate your credentials.
            </CardDescription>

            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="absolute top-1 right-5 flex items-center gap-2 bg-[#0c1f4d] text-white hover:text-white hover:bg-[#0c1f4d] transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 " noValidate>
              {/* Company Name */}
              <div className="space-y-2 ">

                <Label htmlFor="company_name" className="flex items-center gap-2 font-semibold text-slate-700">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  Company Name
                </Label>
                <Input
                  id="company_name"
                  type="text"
                  name="company_name"
                  placeholder="e.g. Luffy Private Limited"
                  value={formData.company_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border-2 border-slate-300 ${errors.company_name ? "border-red-500" : "focus-visible:ring-indigo-600"}`}
                />
                {touched.company_name && errors.company_name && (
                  <p className="text-red-500 text-xs">{errors.company_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="company_email" className="flex items-center gap-2 font-semibold text-slate-700">
                  <Mail className="h-4 w-4 text-indigo-500" />
                  Official Email Address
                </Label>
                <Input
                  id="company_email"
                  type="email"
                  name="company_email"
                  placeholder="e.g. admin@company.com"
                  value={formData.company_email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border-2 border-slate-300 ${errors.company_email ? "border-red-500" : "focus-visible:ring-indigo-600"}`}
                />
                {touched.company_email && errors.company_email && (
                  <p className="text-red-500 text-xs">{errors.company_email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="company_phone_number" className="flex items-center gap-2 font-semibold text-slate-700">
                  <Phone className="h-4 w-4 text-indigo-500" />
                  Business Contact Number
                </Label>
                <Input
                  id="company_phone_number"
                  type="tel"
                  name="company_phone_number"
                  placeholder="e.g. 9876543210"
                  value={formData.company_phone_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border-2 border-slate-300 ${errors.company_phone_number ? "border-red-500" : "focus-visible:ring-indigo-600"}`}
                  maxLength={10}
                />
                {touched.company_phone_number && errors.company_phone_number && (
                  <p className="text-red-500 text-xs">
                    {errors.company_phone_number}
                  </p>
                )}
              </div>

              {/* Registration Type Toggle */}
              <div className="space-y-3 pt-2">
                <Label className="font-semibold text-slate-700">Business Registration (Optional)</Label>
                <RadioGroup 
                  defaultValue="skip" 
                  value={registrationType}
                  onValueChange={handleRegistrationTypeChange}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 bg-white hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="skip" id="r-skip" />
                    <Label htmlFor="r-skip" className="cursor-pointer font-medium w-full">I'll do this later</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 bg-white hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="gst" id="r-gst" />
                    <Label htmlFor="r-gst" className="cursor-pointer font-medium w-full flex items-center gap-1">
                      <BadgeCent className="w-4 h-4 text-indigo-500" /> GST
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 bg-white hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="msme" id="r-msme" />
                    <Label htmlFor="r-msme" className="cursor-pointer font-medium w-full flex items-center gap-1">
                      <FileText className="w-4 h-4 text-indigo-500" /> MSME
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Conditional Fields */}
              {registrationType === "gst" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="gst_number" className="flex items-center gap-2 font-semibold text-slate-700">
                    <BadgeCent className="h-4 w-4 text-indigo-500" />
                    GST Number
                  </Label>
                  <Input
                    id="gst_number"
                    type="text"
                    name="gst_number"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={formData.gst_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={15}
                    className={`uppercase border-2 border-slate-300 ${errors.gst_number ? "border-red-500" : "focus-visible:ring-indigo-600"}`}
                  />
                  {touched.gst_number && errors.gst_number ? (
                    <p className="text-red-500 text-xs">{errors.gst_number}</p>
                  ) : (
                    <p className="text-slate-400 text-xs">Standard 15-character GSTIN format.</p>
                  )}
                </div>
              )}

              {registrationType === "msme" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="msme_certificate_number" className="flex items-center gap-2 font-semibold text-slate-700">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    MSME/Udyam Registration Number
                  </Label>
                  <Input
                    id="msme_certificate_number"
                    type="text"
                    name="msme_certificate_number"
                    placeholder="e.g. UDYAM-XX-00-0000000"
                    value={formData.msme_certificate_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`border-2 border-slate-300 ${errors.msme_certificate_number ? "border-red-500" : "focus-visible:ring-indigo-600"}`}
                  />
                  {touched.msme_certificate_number && errors.msme_certificate_number && (
                    <p className="text-red-500 text-xs">{errors.msme_certificate_number}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full flex items-center cursor-pointer justify-center gap-2 h-11 text-base font-medium shadow-md transition-all hover:shadow-lg"
                style={{ backgroundColor: "#0c1f4d" }}
                disabled={!isAllValid}
              >
                {loading ? "Creating Profile..." : "Register & Proceed to Dashboard"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-center text-xs text-slate-500 bg-slate-50/50 pt-6 rounded-b-xl border-t">

            <p>By clicking Register, you agree to our <span className="underline cursor-pointer hover:text-indigo-600" onClick={() => { navigate("/terms-condition") }} >Vendor Terms of Service</span>.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SellProduct;
