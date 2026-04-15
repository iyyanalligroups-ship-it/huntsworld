import { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import showToast from "@/toast/showToast";
import registerBg from "@/assets/images/register-banner.jpg";
import { useNavigate } from "react-router-dom";
import {
  useRegisterUserMutation,
  useResendOtpMutation,
  useVerifyEmailOtpMutation,
  useCompleteRegistrationMutation,
} from "@/redux/api/Authapi";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../context/AuthContext";
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Smartphone, ShieldCheck, Zap, Globe, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";


const Register = () => {
  const { user, login } = useContext(AuthContext);
  const [registerType, setRegisterType] = useState(null); // Changed: starts as null
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterUserMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [verifyEmailOtp, { isLoading: isVerifyingOtp }] = useVerifyEmailOtpMutation();
  const [completeRegistration, { isLoading: isCompleting }] = useCompleteRegistrationMutation();

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneOtpShow, setPhoneOtpShow] = useState(false);
  const [emailOtpShow, setEmailOtpShow] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);

  const otpRef = useRef(null);
  const phoneOtpInputRef = useRef(null);
  const emailOtpInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneOtp: "",
    emailOtp: "",
  });
  const passwordRules = {
    length: formData.password.length >= 6,
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    symbol: /[^A-Za-z0-9]/.test(formData.password),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const [errors, setErrors] = useState({});
  const [isOtpShow, setIsOtpShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ────── OTP RESEND TIMER (60 seconds) ──────
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const intervalRef = useRef(null);
  const OTP_COOLDOWN_KEY = (key) => `otpCooldown_${key}`;

  const startCooldown = (key) => {
    const now = Date.now();
    sessionStorage.setItem(OTP_COOLDOWN_KEY(key), now.toString());

    setTimer(60);
    setIsResendDisabled(true);

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsResendDisabled(false);
          sessionStorage.removeItem(OTP_COOLDOWN_KEY(key));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Restore timer on page refresh
  useEffect(() => {
    if (!isOtpShow) return;

    const key = registerType === "email" ? formData.email : formData.phone;
    const saved = sessionStorage.getItem(OTP_COOLDOWN_KEY(key));
    if (saved) {
      const elapsed = Math.floor((Date.now() - Number(saved)) / 1000);
      const left = 60 - elapsed;
      if (left > 0) {
        setTimer(left);
        setIsResendDisabled(true);

        intervalRef.current = setInterval(() => {
          setTimer((t) => {
            if (t <= 1) {
              clearInterval(intervalRef.current);
              setIsResendDisabled(false);
              sessionStorage.removeItem(OTP_COOLDOWN_KEY(key));
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOtpShow, registerType, formData.email, formData.phone]);

  // ────── OTP AUTO FOCUS ──────
  useEffect(() => {
    if (isOtpShow && otpRef.current) {
      const focusTimer = setTimeout(() => {
        otpRef.current.focus();
      }, 150); // Delay for animation
      return () => clearTimeout(focusTimer);
    }
  }, [isOtpShow]);

  useEffect(() => {
    if (phoneOtpShow && phoneOtpInputRef.current) {
      phoneOtpInputRef.current.focus();
    }
  }, [phoneOtpShow]);

  useEffect(() => {
    if (emailOtpShow && emailOtpInputRef.current) {
      emailOtpInputRef.current.focus();
    }
  }, [emailOtpShow]);


  // Redirect based on user role
  useEffect(() => {
    if (user?.user?.role?.role === "MERCHANT") {
      navigate("/merchant/products");
    } else if (user?.user?.role?.role === "SERVICE_PROVIDER") {
      navigate("/service/products");
    } else if (user?.user?.role?.role === "USER") {
      navigate("/sell-product");
    }
  }, [user, navigate]);
  const handleBack = () => {
    if (isOtpShow) {
      setIsOtpShow(false);
      setFormData((prev) => ({ ...prev, otp: "" }));
      return;
    }

    if (step > 1) {
      setStep((prev) => prev - 1);
      return;
    }

    navigate("/login");
  };

  // Validate form inputs
  const validate = () => {
    let newErrors = {};

    if (step === 1) {
      if (!registerType) {
        showToast("Please select a registration mode", "warning");
        return false;
      }
    } else if (step === 2) {
      if (!phoneVerified) {
        showToast("Please verify your phone number", "warning");
        return false;
      }
      if (formData.email && !emailVerified) {
        showToast("Please verify your email address", "warning");
        return false;
      }
    } else if (step === 3) {
      if (!formData.name.trim()) {
        newErrors.name = "Username is required";
      }
    } else if (step === 4 && registerType === "email") {
      if (!isPasswordValid) {
        newErrors.password = "Password must meet all the required conditions";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // Handle OTP change
  const handleOtpChange = (value) => {
    setFormData({ ...formData, otp: value });
    setErrors({ ...errors, otp: "" });
  };

  // Handle next step
  const handleNext = () => {
    if (validate()) {
      if (registerType === "otp" && step === 3) {
        handleRegister();
      } else if (registerType === "email" && step === 4) {
        handleRegister();
      } else {
        setStep(step + 1);
      }
    }
  };

  // Reset form when switching type
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    });
    setErrors({});
    setStep(1); // Selection step
    setRegisterType(null);
    setIsOtpShow(false);
  };

  // Handle final registration
  const handleRegister = async () => {
    if (isCompleting) return; // Prevent double-clicks

    if (validate()) {
      try {
        const payload = {
          phone: formData.phone.trim(),
          email: formData.email ? formData.email.trim().toLowerCase() : "",
          name: formData.name.trim(),
          password: formData.password,
        };

        const response = await completeRegistration(payload).unwrap();

        if (response.success) {
          showToast(response.message || "Registration successful!", "success");
          
          const token = response.data; // JWT token from completeRegistration
          if (token) {
            sessionStorage.setItem("token", token);
            const decoded = jwtDecode(token);
            const userId = decoded?.userId;

            if (userId) {
              const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const userData = await res.json();
              if (userData?.success) {
                login(
                  {
                    success: true,
                    message: "User fetched successfully",
                    user: userData.user,
                  },
                  token
                );
              }
            }
          }
          navigate("/");
        }
      } catch (err) {
        showToast(err?.data?.message || "Registration failed", "error");
      }
    }
  };

  // ────── INTERACTIVE VERIFICATION HANDLERS ──────
  const handleVerifyPhoneInitiate = async () => {
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      setErrors({ ...errors, phone: "Enter a valid 10-digit phone number" });
      return;
    }
    try {
      const response = await registerUser({ 
        phone: formData.phone.trim(), 
        email: formData.email ? formData.email.trim().toLowerCase() : undefined 
      }).unwrap();
      if (response.success) {
        showToast("Phone OTP sent!", "success");
        setPhoneOtpShow(true);
        startCooldown(formData.phone);
      }
    } catch (err) {
      showToast(err?.data?.message || "Failed to send OTP", "error");
    }
  };

  const handleConfirmPhoneOtp = async () => {
    if (!formData.phoneOtp || formData.phoneOtp.length < 4) {
      showToast("Please enter the full OTP", "warning");
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/verify-number-otp`, {
        phone: formData.phone,
        otp: formData.phoneOtp,
      });
      if (response.data.success) {
        showToast("Phone verified!", "success");
        setPhoneVerified(true);
        setPhoneOtpShow(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Verification failed", "error");
    }
  };

  const handleVerifyEmailInitiate = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ ...errors, email: "Enter a valid email address" });
      return;
    }
    try {
      const response = await resendOtp({ email: formData.email, phone: formData.phone }).unwrap();
      if (response.success) {
        showToast("Email OTP sent!", "success");
        setEmailOtpShow(true);
        startCooldown(formData.email);
      }
    } catch (err) {
      showToast(err?.data?.message || "Failed to send OTP", "error");
    }
  };

  const handleConfirmEmailOtp = async () => {
    if (!formData.emailOtp || formData.emailOtp.length < 4) {
      showToast("Please enter the full OTP", "warning");
      return;
    }
    try {
      const response = await verifyEmailOtp({
        email: formData.email,
        email_otp: formData.emailOtp,
        phone: formData.phone,
      }).unwrap();
      if (response.success) {
        showToast("Email verified!", "success");
        setEmailVerified(true);
        setEmailOtpShow(false);
      }
    } catch (err) {
      showToast(err?.data?.message || "Verification failed", "error");
    }
  };

  // Send OTP to phone (for OTP register)
  const handleSendOtp = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/send-number-otp`,
        {
          phone: formData.phone,
        }
      );
      if (response.data.success) {
        showToast("OTP sent successfully to phone", "success");
        setFormData({ ...formData, otp: "" });
        setErrors({});
        setIsOtpShow(true);
        startCooldown(formData.phone);
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      showToast(
        err.response?.data?.message || err.message || "Failed to send OTP",
        "error"
      );
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const expectedOtpLength = registerType === "email" ? 4 : 6;
    if (formData.otp.length !== expectedOtpLength) {
      showToast(`Please enter a valid ${expectedOtpLength}-digit OTP`, "error");
      return;
    }

    try {
      setIsVerifying(true);
      let token = null;

      // ───────── EMAIL OTP VERIFY ─────────
      if (registerType === "email") {
        const response = await verifyEmailOtp({
          email: formData.email.toLowerCase(),
          email_otp: formData.otp,
        }).unwrap();

        token = response.data; // 👈 JWT token
        showToast(response.message || "Email verified", "success");
      }

      // ───────── PHONE OTP VERIFY ─────────
      else {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/users/verify-number-otp`,
          {
            phone: formData.phone,
            otp: formData.otp,
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "OTP verification failed");
        }

        token = response.data.data; // 👈 JWT token
        showToast(response.data.message || "Phone verified", "success");
      }

      // ───────── AUTO LOGIN FLOW ─────────
      if (token) {
        sessionStorage.setItem("token", token);

        const decoded = jwtDecode(token);
        const userId = decoded?.userId;

        if (userId) {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/users/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const userData = await res.json();

          if (userData?.success) {
            login(
              {
                success: true,
                message: "User fetched successfully",
                user: userData.user,
              },
              token
            );
          }
        }
      }

      // ✅ Redirect directly to home
      navigate("/");
      return;

    } catch (err) {
      console.error("OTP Verification Error:", err);

      const errorMessage = 
        err?.data?.message || 
        err?.response?.data?.message || 
        err?.message || 
        "OTP verification failed";

      showToast(errorMessage, "error");

      setFormData({ ...formData, otp: "" });
      otpRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };


  // Resend OTP with timer guard
  const handleResendOtp = async () => {
    if (timer > 0) {
      showToast(`Please wait ${timer}s before resending`, "warning");
      return;
    }

    try {
      if (registerType === "email") {
        const response = await resendOtp({
          email: formData.email.toLowerCase(),
        }).unwrap();
        showToast(
          response.message || "OTP resent successfully to email",
          "success"
        );
        startCooldown(formData.email.toLowerCase());
      } else {
        await handleSendOtp(); // already starts cooldown
      }
      setFormData({ ...formData, otp: "" });
    } catch (err) {
      showToast(
        err?.data?.message ||
        err.response?.data?.message ||
        "Failed to resend OTP",
        "error"
      );
    }
  };
  const slotClass =
    "border border-gray-500 text-gray-800 font-bold \
   data-[active]:border-gray-600 data-[active]:ring-gray-600 \
   data-[active]:text-gray-600";

  return (
    <div className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${registerBg})`,
          filter: "brightness(40%)",
        }}
      ></div>
      <Button
        type="button"
        onClick={() => navigate('/')}
        variant="outline"
        className="hidden md:flex absolute cursor-pointer top-8 left-8 z-40 gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-md rounded-xl px-5 h-12 font-bold transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </Button>
      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-2xl p-8 sm:p-12 rounded-[40px] shadow-2xl border border-white/20 mb-8 lg:mb-0 lg:mr-16 transform transition-all duration-500">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <span className="px-4 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
              Step {step} of {registerType === "otp" ? "3" : "4"}
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                (s <= (registerType === "otp" ? 3 : 4)) && (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? "w-10 bg-red-600" : s < step ? "w-4 bg-red-200" : "w-1.5 bg-gray-200"}`}
                  />
                )
              ))}
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-3">
            {step === 1 ? "Create Account" : "Enter Details"}
          </h2>
          <p className="text-gray-500 text-base font-medium">
            {step === 1 ? "Choose how you want to register" : "Please provide your basic information"}
          </p>
        </div>

        {step === 1 && !isOtpShow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-5">
              <motion.div
                whileHover={{ scale: 1.02, translateY: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRegisterType("email");
                  setStep(2);
                }}
                className={`group cursor-pointer p-7 rounded-[28px] border-2 transition-all flex items-center gap-6 ${registerType === "email" ? "border-red-600 bg-red-50/50 shadow-xl shadow-red-500/10" : "border-gray-50 bg-gray-50/30 hover:border-red-100 hover:bg-white shadow-sm"}`}
              >
                <div className={`p-5 rounded-2xl transition-all duration-300 ${registerType === "email" ? "bg-red-600 text-white shadow-lg shadow-red-500/40 rotate-12" : "bg-white text-gray-400 group-hover:text-red-500 group-hover:bg-red-50 shadow-sm"}`}>
                  <Mail size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">Email Address</h3>
                  <p className="text-sm text-gray-500 font-medium">Verify using your email</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, translateY: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRegisterType("otp");
                  setStep(2);
                }}
                className={`group cursor-pointer p-7 rounded-[28px] border-2 transition-all flex items-center gap-6 ${registerType === "otp" ? "border-red-600 bg-red-50/50 shadow-xl shadow-red-500/10" : "border-gray-50 bg-gray-50/30 hover:border-red-100 hover:bg-white shadow-sm"}`}
              >
                <div className={`p-5 rounded-2xl transition-all duration-300 ${registerType === "otp" ? "bg-red-600 text-white shadow-lg shadow-red-500/40 rotate-12" : "bg-white text-gray-400 group-hover:text-red-500 group-hover:bg-red-50 shadow-sm"}`}>
                  <Smartphone size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">Phone Number</h3>
                  <p className="text-sm text-gray-500 font-medium">Quick registration using phone</p>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin text-red-500 h-12 w-12"></div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center mb-4 font-bold text-sm">
            {error?.data?.message || "Something went wrong"}
          </div>
        )}

        {/* FORM STEPS */}
        <AnimatePresence mode="wait">
          {!isOtpShow ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* PHONE VERIFICATION SECTION */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 italic flex justify-between">
                          <span>Phone Number (Required)</span>
                          {phoneVerified && <ShieldCheck className="w-4 h-4 text-green-500" />}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            className={`flex-1 h-14 rounded-2xl border-gray-100 bg-gray-50 font-semibold ${phoneVerified ? 'bg-green-50 border-green-200' : ''}`}
                            disabled={isLoading || phoneVerified}
                          />
                          {!phoneVerified && (
                             <Button 
                               onClick={handleVerifyPhoneInitiate}
                               disabled={isLoading || (phoneOtpShow && timer > 0) || !formData.phone || formData.phone.length < 10}
                               className="h-14 px-6 rounded-2xl bg-black text-white hover:bg-gray-800 text-xs font-bold uppercase tracking-widest cursor-pointer"
                             >
                               {phoneOtpShow ? (timer > 0 ? `Resend (${timer}s)` : "Resend") : "Verify"}
                             </Button>
                          )}
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{errors.phone}</p>}
                        
                        {phoneOtpShow && !phoneVerified && (
                           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                              <div className="flex gap-2">
                                <Input
                                  name="phoneOtp"
                                  placeholder="Enter Phone OTP"
                                  value={formData.phoneOtp}
                                  onChange={handleChange}
                                  className="flex-1 h-12 rounded-xl bg-red-50/30 border-red-100 font-bold text-center tracking-[0.5em] focus:ring-red-500"
                                  maxLength={6}
                                  ref={phoneOtpInputRef}
                                  autoFocus
                                />
                                <Button onClick={handleConfirmPhoneOtp} className="h-12 px-6 rounded-xl bg-red-600 text-white font-bold uppercase text-[10px] cursor-pointer">
                                  Confirm
                                </Button>
                              </div>
                           </motion.div>
                        )}
                    </div>

                    {registerType === "email" && (
                      <div className="space-y-2">
                        <div className="h-[1px] bg-gray-100 my-4" />
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 italic flex justify-between">
                          <span>Email Address <small className="text-gray-300 font-normal">(! Verify phone first)</small></span>
                          {emailVerified && <Mail className="w-4 h-4 text-green-500" />}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={phoneVerified ? "e.g. alex@example.com" : "Verify phone to unlock"}
                            className={`flex-1 h-14 rounded-2xl border-gray-100 bg-gray-50 font-semibold transition-all duration-300 ${!phoneVerified ? 'opacity-50' : 'opacity-100'} ${emailVerified ? 'bg-green-50 border-green-200' : ''}`}
                            disabled={!phoneVerified || isResending || emailVerified}
                          />
                          {formData.email && !emailVerified && (
                             <Button 
                               onClick={handleVerifyEmailInitiate}
                               disabled={!phoneVerified || isResending || (emailOtpShow && timer > 0)}
                               className="h-14 px-6 rounded-2xl bg-black text-white hover:bg-gray-800 text-xs font-bold uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {emailOtpShow ? (timer > 0 ? `Resend (${timer}s)` : "Resend") : "Verify Email"}
                             </Button>
                          )}
                        </div>
                        {errors.email && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{errors.email}</p>}

                        {emailOtpShow && !emailVerified && (
                           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                              <div className="flex gap-2">
                                <Input
                                  name="emailOtp"
                                  placeholder="Enter Email OTP"
                                  value={formData.emailOtp}
                                  onChange={handleChange}
                                  className="flex-1 h-12 rounded-xl bg-red-50/30 border-red-100 font-bold text-center tracking-[0.5em] focus:ring-red-500"
                                  maxLength={6}
                                  ref={emailOtpInputRef}
                                  autoFocus
                                />
                                <Button onClick={handleConfirmEmailOtp} className="h-12 px-6 rounded-xl bg-red-600 text-white font-bold uppercase text-[10px] cursor-pointer">
                                  Confirm
                                </Button>
                              </div>
                           </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="ghost" 
                      onClick={handleBack} 
                      className="flex-1 h-16 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest text-xs cursor-pointer"
                    >
                      Back
                    </Button>
                    <Button 
                      className={`flex-[2] h-16 rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-[0.2em] cursor-pointer ${(!phoneVerified || (registerType === "email" && formData.email && !emailVerified)) ? 'bg-gray-200 text-gray-400' : 'bg-red-600 hover:bg-black text-white shadow-red-500/20'}`} 
                      onClick={handleNext} 
                      disabled={!phoneVerified || (registerType === "email" && formData.email && !emailVerified)}
                    >
                      Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all font-semibold"
                      disabled={isLoading}
                    />
                    {errors.name && <p className="text-red-500 text-xs font-bold mt-1 pl-1">{errors.name}</p>}
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button 
                      variant="ghost" 
                      onClick={handleBack} 
                      className="flex-1 h-16 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest text-xs cursor-pointer"
                    >
                      Back
                    </Button>
                    <Button 
                      className="flex-[2] bg-red-600 hover:bg-black text-white h-16 rounded-2xl font-black shadow-2xl shadow-red-500/20 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] cursor-pointer" 
                      onClick={handleNext} 
                      disabled={isLoading}
                    >
                      {registerType === "otp" ? (isLoading ? "Please wait..." : "Create Account") : "Continue"}
                      {registerType === "otp" ? <Zap className="w-5 h-5 ml-2 fill-current" /> : <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && registerType === "email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Set Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter a new password"
                        className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all font-semibold pr-12"
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors cursor-pointer">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {formData.password && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
                      <Card className="p-4 bg-gray-50/50 border-gray-100 rounded-2xl space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-tight">
                          <div className={`flex items-center gap-1.5 ${passwordRules.length ? "text-green-600" : "text-gray-400"}`}>
                            <CheckCircle size={12} strokeWidth={3} /> Length {">"} 6
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordRules.uppercase ? "text-green-600" : "text-gray-400"}`}>
                            <Zap size={12} strokeWidth={3} /> Uppercase
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordRules.number ? "text-green-600" : "text-gray-400"}`}>
                            <CheckCircle size={12} strokeWidth={3} /> Numbers
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordRules.symbol ? "text-green-600" : "text-gray-400"}`}>
                            <Zap size={12} strokeWidth={3} /> Symbols
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Confirm Password</label>
                    <div className="relative group">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        className="w-full h-16 px-6 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-[6px] focus:ring-red-500/5 focus:border-red-500 transition-all text-lg font-bold"
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors cursor-pointer">
                        {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs font-black mt-1 pl-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button 
                      variant="ghost" 
                      onClick={handleBack} 
                      className="flex-1 h-16 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest text-xs cursor-pointer"
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-[2] bg-red-600 hover:bg-black text-white h-16 rounded-2xl font-black shadow-2xl shadow-red-500/20 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] cursor-pointer"
                      onClick={handleRegister}
                      disabled={isLoading || !isPasswordValid}
                    >
                      {isLoading ? "Registering..." : "Create Account"}
                      {!isLoading && <ChevronRight className="w-5 h-5 ml-2" />}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4 w-full">
              <div className="text-center mb-6">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="text-red-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Verify OTP</h3>
                <p className="text-sm text-gray-500">We've sent a code to your {registerType === "email" ? "email" : "phone"}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={registerType === "email" ? 4 : 6}
                    value={formData.otp}
                    onChange={handleOtpChange}
                    ref={otpRef}
                    autoFocus
                  >
                    <InputOTPGroup className="gap-3">
                      {Array.from({ length: registerType === "email" ? 4 : 6 }).map((_, i) => (
                        <InputOTPSlot 
                          key={i} 
                          index={i} 
                          className="w-14 h-16 text-2xl font-black rounded-2xl border-2 border-gray-100 !bg-gray-50/50 data-[active=true]:border-red-600 data-[active=true]:ring-0 transition-all shadow-sm" 
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full h-18 bg-red-600 hover:bg-black text-white rounded-[24px] font-black text-xl shadow-2xl shadow-red-500/20 active:scale-95 transition-all uppercase tracking-[0.2em] cursor-pointer"
                    disabled={isVerifying || formData.otp.length !== (registerType === "email" ? 4 : 6)}
                  >
                    {isVerifying ? "Verifying..." : "Get OTP"}
                    {!isVerifying && <CheckCircle className="w-6 h-6 ml-3" />}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleResendOtp}
                    variant="ghost"
                    disabled={isResending || isResendDisabled}
                    className="w-full h-12 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    {isResending ? "Resending..." : isResendDisabled ? `Wait: ${timer}s` : "Resend OTP Code"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-4">
          <p className="text-sm">
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Log in
            </span>
          </p>
        </div>
      </div>

      <div className="relative z-10 hidden lg:flex flex-col items-start text-white p-12 lg:max-w-xl">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <h1 className="text-5xl font-black leading-[0.9] tracking-tighter">
              SELL <br />
              <span className="text-red-500">PRODUCTS.</span>
            </h1>
            <p className="text-xl text-gray-300 font-medium leading-relaxed max-w-md">
              The best place to sell your products and services online.
            </p>
          </div>

          <div className="space-y-8 border-l-2 border-white/10 pl-8">
            <div className="flex items-start gap-5 group">
              <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl group-hover:bg-red-600/20 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                <Globe className="text-red-500" size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-widest mb-1">Reach Everyone</h4>
                <p className="text-gray-400 font-medium">Sell your products to millions of customers.</p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl group-hover:bg-red-600/20 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                <ShieldCheck className="text-red-500" size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-widest mb-1">Secure & Safe</h4>
                <p className="text-gray-400 font-medium">Your business data is safe and protected.</p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl group-hover:bg-red-600/20 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                <Zap className="text-red-500" size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-widest mb-1">Quick Setup</h4>
                <p className="text-gray-400 font-medium">Easy registration. Start selling today.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

};

export default Register;
