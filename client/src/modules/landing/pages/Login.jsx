import React, { useState, useContext, useRef, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  useLoginWithEmailMutation,
  useLazyGetUserByIdQuery,
  useVerifyEmailOtpMutation,
  useResendOtpMutation,
} from "@/redux/api/Authapi";
import showToast from "@/toast/showToast";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";



const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("email"); // "email" = password login, "otp" = OTP login
  const [form, setForm] = useState({
    email: "",     // ← Now used for both Email & Phone in password login
    password: "",
    mobile: "",
    otp: "",
    emailOtp: "",   // New field for email OTP
  });
  const [errors, setErrors] = useState({});
  const [isOtpShow, setIsOtpShow] = useState(false);
  const [isEmailOtpShow, setIsEmailOtpShow] = useState(false); // New state
  const [tempEmail, setTempEmail] = useState(""); // New state
  const otpRef = useRef(null);
  const emailOtpRef = useRef(null); // New ref
  const phoneOtpInputRef = useRef(null); // Ref for inline phone OTP
  const emailOtpInputRef = useRef(null); // Ref for inline email OTP
  const [loginWithEmail] = useLoginWithEmailMutation();
  const [fetchUserById] = useLazyGetUserByIdQuery();
  const [verifyEmailOtp, { isLoading: isVerifyingEmailOtp }] = useVerifyEmailOtpMutation();
  const [resendOtp, { isLoading: isResendingEmailOtp }] = useResendOtpMutation();
  const [showPassword, setShowPassword] = useState(false);
  // OTP Timer Logic (unchanged)
  const passwordValueRef = useRef("");
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const intervalRef = useRef(null);
  const OTP_COOLDOWN_KEY = (key) => `otpCooldown_${key}`;

  const startCooldown = (phone) => {
    const now = Date.now();
    const key = OTP_COOLDOWN_KEY(phone);
    sessionStorage.setItem(key, now.toString());

    setTimer(60);
    setIsResendDisabled(true);

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsResendDisabled(false);
          sessionStorage.removeItem(key);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (form.mobile && isOtpShow) {
      const key = OTP_COOLDOWN_KEY(form.mobile);
      const saved = sessionStorage.getItem(key);
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
                sessionStorage.removeItem(key);
                return 0;
              }
              return t - 1;
            });
          }, 1000);
        }
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [form.mobile, isOtpShow]);

  useEffect(() => {
    if (isOtpShow && otpRef.current) {
      otpRef.current.focus();
    }
  }, [isOtpShow]);

  useEffect(() => {
    if (isEmailOtpShow && emailOtpRef.current) {
      emailOtpRef.current.focus();
    }
  }, [isEmailOtpShow]);

  // Validation Helpers
  const isValidMobile = (number) => /^[6-9]\d{9}$/.test(number);
  const isValidEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Send OTP
  const handleSendOtp = async () => {
    if (!isValidMobile(form.mobile)) {
      setErrors({ mobile: "Invalid mobile number" });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/send-number-otp`,
        { phone: form.mobile }
      );

      if (response.data.success) {
        setIsOtpShow(true);
        setForm({ ...form, otp: "" });
        setErrors({});
        showToast("OTP sent successfully", "success");
        startCooldown(form.mobile);
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

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (form.otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/verify-number-otp`,
        { phone: form.mobile, otp: form.otp }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "OTP verification failed");
      }

      const token = response.data.data;
      sessionStorage.setItem("token", token);

      const decodedToken = jwtDecode(token);
      const userId = decodedToken?.userId;

      if (userId) {
        const { data: userResponse } = await fetchUserById(userId);
        // login(userResponse, token);
        login(
          {
            success: true,
            message: "User fetched successfully",
            user: userResponse.user || userResponse,
          },
          token
        );


      } else {
        login(null, token);
      }

      showToast("Login successful", "success");
      navigate(decodedToken.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      console.error("OTP Verification Error:", err);
      showToast(
        err.response?.data?.message || err.message || "OTP verification failed",
        "error"
      );
      setForm({ ...form, otp: "" });
      otpRef.current?.focus();
    }
  };

  // Main Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (loginType !== "email") return;

    const identifier = form.email.trim();
    const password = passwordValueRef.current;

    console.log(password, 'password field');

    // Email / Phone validation
    if (!identifier) {
      setErrors({ email: "Email or phone number is required" });
      return;
    }

    const isPhoneNumber = /^[6-9]\d{9}$/.test(identifier);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    if (!isPhoneNumber && !isEmail) {
      setErrors({ email: "Please enter a valid email or phone number" });
      return;
    }

    // Password validation
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }

    try {
      const payload = isPhoneNumber
        ? { phone: identifier, password }
        : { email: identifier, password };

      const response = await loginWithEmail(payload).unwrap();

      if (!response.success) {
        throw new Error(response.message || "Login failed");
      }

      const token = response.token;
      sessionStorage.setItem("token", token);

      // clear password after success
      passwordValueRef.current = "";

      const decodedToken = jwtDecode(token);
      const userId = decodedToken?.userId;

      if (userId) {
        const { data: userResponse } = await fetchUserById(userId);
        login(userResponse, token);
      } else {
        login(null, token);
      }

      showToast(response.message || "Login successful", "success");

      navigate(decodedToken.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      // API / auth error
      if (err.data?.notVerified) {
        setTempEmail(err.data.email);
        setIsEmailOtpShow(true);
        showToast(err.data.message || "Please verify your email", "warning");
        startCooldown(err.data.email);
        return;
      }

      setErrors({
        password:
          err?.data?.message ||
          err.message ||
          "Invalid email/phone or password",
      });

      showToast(
        err?.data?.message || "Invalid email/phone or password",
        "error"
      );
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    if (e) e.preventDefault();
    if (form.emailOtp.length !== 4) {
      showToast("Please enter a valid 4-digit OTP", "error");
      return;
    }

    try {
      const response = await verifyEmailOtp({
        email: tempEmail,
        email_otp: form.emailOtp,
      }).unwrap();

      if (response.success) {
        showToast(response.message || "Email verified and login successful!", "success");
        const token = response.data;
        if (token) {
          sessionStorage.setItem("token", token);
          const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const userData = await res.json();
          if (userData.success) {
            login(userData, token);
            navigate("/");
          }
        }
      }
    } catch (err) {
      showToast(err?.data?.message || "OTP verification failed", "error");
    }
  };

  const handleResendEmailOtp = async () => {
    if (timer > 0) return;
    try {
      // resendOtp takes { email } or { phone }
      const response = await resendOtp({ email: tempEmail }).unwrap();
      showToast(response.message || "OTP resent successfully", "success");
      startCooldown(tempEmail);
    } catch (err) {
      showToast(err?.data?.message || "Failed to resend OTP", "error");
    }
  };

  const handleOtpChange = (value) => {
    setForm({ ...form, otp: value });
    setErrors({});
  };

  const handleResendOtp = async () => {
    if (timer > 0) {
      showToast("Please wait until the timer finishes", "warning");
      return;
    }
    setIsOtpShow(false);
    await handleSendOtp();
  };

  return (
    <section className="relative flex justify-center items-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-6">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="hidden md:flex absolute cursor-pointer top-5 left-5 z-40 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-4xl shadow-lg bg-white rounded-lg overflow-hidden">
        {/* Left - Login Form */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-[#0c1f4d] text-center mb-4">
            Huntsworld Login
          </h2>

          {/* Toggle: Only 2 Options */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 w-full max-w-sm">
            <Button
              onClick={() => {
                setLoginType("email");
                setIsOtpShow(false);
                setErrors({});
                setForm({ ...form, email: "", password: "" });
              }}
              className={`flex-1 py-3 ${loginType === "email"
                ? "bg-[#ea1a24] text-white"
                : "bg-gray-300"
                }`}
            >
              Login with Password
            </Button>
            <Button
              onClick={() => {
                setLoginType("otp");
                setIsOtpShow(false);
                setErrors({});
                setForm({ ...form, mobile: "", otp: "" });
              }}
              className={`flex-1 py-3 ${loginType === "otp"
                ? "bg-[#ea1a24] text-white"
                : "bg-gray-300"
                }`}
            >
              Login with OTP
            </Button>
          </div>

          {/* === Password Login (Email OR Phone) === */}

          {loginType === "email" && !isEmailOtpShow && (
            <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
              {/* Email / Phone Field */}
              <div>
                <Input
                  type="text"
                  placeholder="Email or Phone Number"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value.trim() });
                    setErrors({});
                  }}
                  className="w-full h-12"
                  autoComplete="username email tel"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1.5">{errors.email}</p>
                )}
                {form.email && isValidMobile(form.email) && (
                  <p className="text-xs text-green-600 mt-1.5">
                    Logging in with Phone Number
                  </p>
                )}
                {form.email && isValidEmailFormat(form.email) && !isValidMobile(form.email) && (
                  <p className="text-xs text-blue-600 mt-1.5">
                    Logging in with Email
                  </p>
                )}
              </div>

              {/* ── Password Field with Eye Toggle ── Best Practice Version ── */}
              <div>
                {/* Input + Eye Wrapper */}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full h-12 pr-11"
                    autoComplete="current-password"
                    onChange={(e) => {
                      passwordValueRef.current = e.target.value;
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                  />

                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#ea1a24] hover:underline focus:outline-none focus:ring-2 focus:ring-[#ea1a24]/50"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#ea1a24] hover:bg-[#c7161f] text-white py-6 rounded-md font-medium transition-colors"
                disabled={!!errors.email || !!errors.password} // optional: disable when invalid
              >
                Sign In
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-[#ea1a24] cursor-pointer font-medium hover:underline"
                >
                  Register
                </Link>
              </p>
            </form>
          )}

          {/* === Email OTP Verification === */}
          {isEmailOtpShow && (
            <div className="space-y-5 w-full max-w-sm">
              <h3 className="text-lg font-medium text-center text-gray-700">
                Verify Your Email
              </h3>
              <p className="text-sm text-center text-gray-500">
                A 4-digit code has been sent to <strong>{tempEmail}</strong>
              </p>

              <form onSubmit={handleVerifyEmailOtp}>
                <div className="flex justify-center my-6">
                  <InputOTP
                    maxLength={4}
                    value={form.emailOtp}
                    onChange={(val) => setForm({ ...form, emailOtp: val })}
                    ref={emailOtpRef}
                    autoFocus
                    className="flex justify-center"
                  >
                    <InputOTPGroup className="flex gap-2">
                      {[0, 1, 2, 3].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-12 h-12 text-center text-lg border-2 border-gray-400 rounded-md focus:border-[#ea1a24] data-[active=true]:border-[#ea1a24]"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="submit"
                  disabled={isVerifyingEmailOtp || form.emailOtp.length !== 4}
                  className="w-full bg-[#ea1a24] text-white py-6 rounded-md font-medium flex items-center justify-center gap-2"
                >
                  {isVerifyingEmailOtp ? "Verifying..." : "Verify & Sign In"}
                </Button>

                <Button
                  type="button"
                  onClick={handleResendEmailOtp}
                  disabled={isResendingEmailOtp || timer > 0}
                  className={`w-full mt-3 py-3 rounded-md font-medium ${isResendingEmailOtp || timer > 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-700 hover:bg-gray-800 text-white"
                    }`}
                >
                  {isResendingEmailOtp ? "Resending..." : timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEmailOtpShow(false)}
                  className="w-full mt-2 text-gray-600 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Button>
              </form>
            </div>
          )}

          {/* === OTP Login === */}
          {loginType === "otp" && (
            <div className="space-y-5 w-full max-w-sm">
              {!isOtpShow ? (
                <>
                  <Input
                    type="text"
                    placeholder="Enter Mobile Number"
                    value={form.mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setForm({ ...form, mobile: value });
                      setErrors({});
                    }}
                    maxLength={10}
                    className="w-full"
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-sm">{errors.mobile}</p>
                  )}

                  <Button
                    onClick={handleSendOtp}
                    disabled={!isValidMobile(form.mobile) || timer > 0}
                    className={`w-full py-6 rounded-md font-medium ${!isValidMobile(form.mobile) || timer > 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#ea1a24] text-white"
                      }`}
                  >
                    {timer > 0 ? `Wait ${timer}s` : "Send OTP"}
                  </Button>
                </>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
                  <div className="flex justify-center my-6">
                    <InputOTP
                      maxLength={6}
                      value={form.otp}
                      onChange={handleOtpChange}
                      ref={otpRef}
                      autoFocus
                      className="flex justify-center"
                    >
                      <InputOTPGroup className="flex gap-1 sm:gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="
            w-10 h-10 sm:w-12 sm:h-12
            text-center text-sm sm:text-base
            border-2 border-gray-400
            rounded-md
            focus:border-[#ea1a24]
            focus:ring-2 focus:ring-[#ea1a24]/30
            data-[active=true]:border-[#ea1a24]
            data-[active=true]:ring-2 data-[active=true]:ring-[#ea1a24]/30
            data-[filled=true]:border-[#ea1a24]
            data-[filled=true]:bg-[#ea1a24]/5
          "
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>


                  <Button
                    type="submit"
                    className="w-full bg-[#ea1a24] text-white py-6 rounded-md font-medium"
                  >
                    Verify OTP
                  </Button>

                  <Button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResendDisabled}
                    className={`w-full mt-3 py-3 rounded-md font-medium ${isResendDisabled
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-700 hover:bg-gray-800 text-white"
                      }`}
                  >
                    {isResendDisabled ? `Resend in ${timer}s` : "Resend OTP"}
                  </Button>
                </form>
              )}

              <p className="text-center text-sm text-gray-600 -mt-2">
                Don't have an account?{" "}
                <Link to="/register" className="text-[#ea1a24] cursor-pointer font-medium hover:underline">
                  Register
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Right - Description */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-[#0c1f4d] text-white p-8">
          <h2 className="text-3xl font-bold">Welcome to Huntsworld</h2>
          <p className="text-center mt-4 max-w-md text-lg">
            Join our platform to expand your business, connect with merchants,
            and grow your network. Sign in to access exclusive deals and partnerships.
          </p>
        </div >
      </div>
    </section>
  );
};

export default Login;
