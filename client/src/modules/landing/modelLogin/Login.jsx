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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useLoginWithEmailMutation,
  useLazyGetUserByIdQuery,
} from "@/redux/api/Authapi";
import showToast from "@/toast/showToast";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const Login = ({ isOpen, setIsOpen, redirectOnLogin = true }) => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("email");
  const [form, setForm] = useState({
    email: "",
    mobile: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [isOtpShow, setIsOtpShow] = useState(false);
  const otpRef = useRef(null);
  const passwordValueRef = useRef("");
  const [loginWithEmail, { isLoading: isEmailLoading }] =
    useLoginWithEmailMutation();
  const [fetchUserById] = useLazyGetUserByIdQuery();
  const [showPassword, setShowPassword] = useState(false);
  // === NEW: OTP Timer State ===
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const intervalRef = useRef(null);
  const OTP_COOLDOWN_KEY = (phone) => `otpCooldown_${phone}`;

  // === NEW: Start 60-second cooldown ===
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

  // === NEW: Restore timer on refresh or modal reopen ===
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

  // Auto-focus OTP input
  useEffect(() => {
    if (isOtpShow && otpRef.current) {
      otpRef.current.focus();
    }
  }, [isOtpShow]);

  // Validate Mobile Number
  const isValidMobile = (number) => /^[6-9]\d{9}$/.test(number);

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

        // START COOLDOWN
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
        login(userResponse, token);
      } else {
        login(null, token);
      }

      showToast("Login successful", "success");
      setIsOpen(false);
      if (redirectOnLogin || decodedToken.role === "ADMIN") {
        navigate(decodedToken.role === "ADMIN" ? "/admin" : "/");
      }
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

  // ENHANCED: Handle form submit - Now supports Email OR Phone + Password
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

      showToast(response.message || "Login successful", "success");
      setIsOpen(false);
      if (redirectOnLogin || decodedToken.role === "ADMIN") {
        navigate(decodedToken.role === "ADMIN" ? "/admin" : "/");
      }
    } catch (err) {
      // API / auth error
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
  // Validate Mobile Number
  // const isValidMobile = (number) => /^[6-9]\d{9}$/.test(number);

  // Validate Email Format
  const isValidEmailFormat = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // OTP input change
  const handleOtpChange = (value) => {
    setForm({ ...form, otp: value });
    setErrors({});
  };

  // Resend OTP with timer guard
  const handleResendOtp = async () => {
    if (timer > 0) {
      showToast("Please wait until the timer finishes", "warning");
      return;
    }
    setIsOtpShow(false);
    await handleSendOtp();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center capitalize">
            Huntsworld Login
          </DialogTitle>
        </DialogHeader>

        {isEmailLoading && (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin text-red-500 h-12 w-12"></div>
          </div>
        )}
        {errors.general && (
          <div className="text-red-500 text-center mb-4">{errors.general}</div>
        )}

        <div className="flex flex-col gap-4 mb-4">
          <Button
            onClick={() => {
              setLoginType("email");
              setIsOtpShow(false);
              setErrors({});
            }}
            className={`w-full py-2 px-4 ${loginType === "email"
              ? "bg-[#ea1a24] text-white cursor-pointer"
              : "bg-gray-300 cursor-pointer"
              }`}
          >
            Login With Password
          </Button>
          <Button
            onClick={() => {
              setLoginType("otp");
              setIsOtpShow(false);
              setErrors({});
            }}
            className={`w-full py-2 px-4 ${loginType === "otp"
              ? "bg-[#ea1a24] text-white"
              : "bg-gray-300 cursor-pointer"
              }`}
          >
            Login With OTP
          </Button>
        </div>

        {/* Email Login - NOW SUPPORTS EMAIL OR PHONE */}
        {loginType === "email" && (
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
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
              {/* Input + Eye Icon */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-900 transition-colors"
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
              className="w-full cursor-pointer bg-[#ea1a24] hover:bg-[#c7161f] text-white py-6 rounded-md font-medium transition-colors"
              disabled={!!errors.email || !!errors.password} // optional: disable when invalid
            >
              Sign In
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/register");
                }}
                className="text-[#ea1a24] cursor-pointer font-medium hover:underline"
              >
                Register
              </button>
            </p>

          </form>
        )}

        {/* OTP Login - 100% UNCHANGED */}
        {loginType === "otp" && (
          <div className="space-y-4 w-full">
            {!isOtpShow && (
              <>
                <Input
                  type="text"
                  name="mobile"
                  placeholder="Enter Mobile Number"
                  value={form.mobile}
                  onChange={(e) => {
                    setForm({ ...form, mobile: e.target.value });
                    setErrors({});
                  }}
                  maxLength={10}
                  className="w-full h-12"
                />
                {errors.mobile && (
                  <p className="text-red-500 text-sm">{errors.mobile}</p>
                )}

                <Button
                  onClick={handleSendOtp}
                  disabled={!isValidMobile(form.mobile) || timer > 0}
                  className={`w-full py-6 rounded-md ${!isValidMobile(form.mobile) || timer > 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#ea1a24] text-white cursor-pointer"
                    }`}
                >
                  {timer > 0 ? `Wait ${timer}s` : "Send OTP"}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#ea1a24] hover:underline"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </p>
              </>
            )}

            {isOtpShow && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyOtp();
                }}
                className="space-y-4"
              >
                <div className="flex justify-center my-6">
                  <InputOTP
                    maxLength={6}
                    value={form.otp}
                    onChange={handleOtpChange}
                    ref={otpRef}
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

                {form.otp.length === 6 ? (
                  <Button
                    type="submit"
                    className="w-full bg-[#ea1a24] text-white py-2 rounded-md cursor-pointer"
                  >
                    Verify OTP
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    Enter complete OTP to verify
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendDisabled}
                  className={`w-full py-2 rounded-md ${isResendDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
                    }`}
                >
                  {isResendDisabled ? `Resend OTP in ${timer}s` : "Resend OTP"}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#ea1a24] hover:underline"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </p>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Login;
