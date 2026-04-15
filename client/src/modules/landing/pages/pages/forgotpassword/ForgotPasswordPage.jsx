// ForgotPasswordPage.tsx
import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Phone, Lock, ArrowLeft } from "lucide-react";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [method, setMethod] = useState(null); // Choose method first
  const [step, setStep] = useState("choose");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [rules, setRules] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleGoBack = () => {
    if (step === "choose") {
      navigate(-1);
    } else if (step === "input") {
      setStep("choose");
      setMethod(null);
    } else if (step === "otp") {
      setStep("input");
    } else if (step === "reset") {
      setStep("otp");
    }
  };

  const validatePasswordRules = (password) => {
    return {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[@$!%*?&]/.test(password),
    };
  };

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send OTP based on selected method
  const handleSendOtp = async () => {
    setLoading(true);

    try {
      if (method === "email") {
        if (!email.includes("@")) {
          showToast("Enter a valid email", "error");
          return;
        }

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/users/forgot-password`,
          { email }
        );
        showToast(res.data.message || "OTP sent to email", "success");
      } else if (method === "phone") {
        // Simple phone validation (you can improve with lib like libphonenumber)
        if (!/^\d{10,15}$/.test(phone.replace(/[\s+()-]/g, ""))) {
          showToast("Enter a valid phone number", "error");
          return;
        }

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/users/send-number-otp`,
          { phone: phone.trim() }
        );

        if (!res.data.success) throw new Error(res.data.message);
        showToast("OTP sent to phone", "success");
      }

      setStep("otp");
      setOtp("");
      startCooldown();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to send OTP",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP (4-digit for email, 6-digit for phone)
  const handleVerifyOtp = async () => {
    const expectedLength = method === "email" ? 4 : 6;
    if (otp.length !== expectedLength) {
      showToast(`Please enter a valid ${expectedLength}-digit OTP`, "error");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (method === "email") {
        res = await axios.post(
          `${import.meta.env.VITE_API_URL}/users/verify-reset-otp`,
          { email, otp }
        );
      } else {
        res = await axios.post(
          `${import.meta.env.VITE_API_URL}/users/verify-number-otp`,
          { phone: phone.trim(), otp }
        );
      }

      if (!res.data.success && method === "phone") {
        throw new Error(res.data.message || "Invalid OTP");
      }

      showToast("OTP verified successfully", "success");
      setStep("reset");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Invalid OTP",
        "error"
      );
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password (same for both methods)
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      return showToast("Passwords don't match", "error");
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return showToast(
        "Password must be 6+ chars with 1 uppercase, 1 number, 1 symbol",
        "error"
      );
    }

    setLoading(true);
    try {
      const payload = method === "email"
        ? { email, newPassword }
        : { phone: phone.trim(), newPassword };

      const endpoint = method === "email"
        ? "/users/reset-password"
        : "/users/reset-password-phone"; // Adjust endpoint if different

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        payload
      );

      showToast(res.data.message || "Password reset successfully", "success");
      setTimeout(() => (window.location.href = "/login"), 2000);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error resetting password",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex relative justify-center items-center min-h-screen bg-gray-100 px-4 py-12">
      <Button
        onClick={handleGoBack}
        className="hidden md:flex absolute top-8 left-8 items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800"
      >
        <ArrowLeft size={20} />
        Back
      </Button>

      {/* STEP 1: Choose Method */}
      {step === "choose" && (
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-[#1a2f6b] mb-8">
            Forgot Password?
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Select how you'd like to reset your password
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => {
                setMethod("email");
                setStep("input");
              }}
              className="w-full cursor-pointer h-20 text-lg flex items-center justify-center gap-4 bg-gray-500 border-2 border-gray-300 hover:border-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all"
            >
              <Mail size={28} />
              <div className="text-left">
                <div className="font-semibold">Via Email</div>
                <div className="text-sm opacity-80">4-digit OTP to your email</div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setMethod("phone");
                setStep("input");
              }}
              className="w-full cursor-pointer h-20 text-lg flex items-center justify-center gap-4 bg-gray-500 border-2 border-gray-300 hover:border-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all"
            >
              <Phone size={28} />
              <div className="text-left">
                <div className="font-semibold">Via SMS</div>
                <div className="text-sm opacity-80">6-digit OTP to your phone</div>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Input Email/Phone */}
      {step === "input" && (
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">
            Enter Your {method === "email" ? "Email" : "Phone Number"}
          </h2>

          <div className="space-y-6">
            {method === "email" ? (
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            ) : (
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="+1234567890 or 0123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            )}

            <Button
              onClick={handleSendOtp}
              disabled={loading || (method === "email" ? !email : !phone)}
              className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dec]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: OTP Verification */}
      {step === "otp" && (
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4">Enter OTP</h2>
          <p className="text-center text-gray-600 mb-8">
            We sent a <strong>{method === "email" ? "4" : "6"}-digit</strong> code to{" "}
            <span className="font-medium">
              {method === "email" ? email : phone}
            </span>
          </p>

          <Input
            type="text"
            inputMode="numeric"
            maxLength={method === "email" ? 4 : 6}
            placeholder={method === "email" ? "0000" : "000000"}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="text-center text-3xl tracking-widest letter-spacing-4"
            autoFocus
          />

          <Button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== (method === "email" ? 4 : 6)}
            className="w-full mt-6 bg-[#0c1f4d] hover:bg-[#0c1f4dec]"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify OTP"}
          </Button>

          <div className="text-center mt-4">
            <Button
              variant="link"
              disabled={cooldown > 0}
              onClick={handleSendOtp}
            >
              Resend OTP {cooldown > 0 && `(${cooldown}s)`}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Reset Password */}
      {step === "reset" && (
        <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Form */}
            <div className="flex flex-col p-6">
              <h2 className="text-2xl font-bold text-center text-[#0c1f4d] mb-8">
                Set New Password
              </h2>

              <div className="space-y-5">
                <Input
                  value={method === "email" ? email : phone}
                  disabled
                  className="bg-gray-100 text-center"
                />

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPassword(val);
                      setRules(validatePasswordRules(val));
                      setErrors((prev) => ({
                        ...prev,
                        password: "",
                        confirmPassword: prev.confirmPassword,
                      }));
                    }}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfirmPassword(val);
                      if (newPassword && newPassword !== val) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: "Passwords do not match",
                        }));
                      } else {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: "",
                        }));
                      }
                    }}
                    className="pl-10"
                  />
                </div>

                <Button
                  onClick={handleResetPassword}
                  disabled={loading || newPassword !== confirmPassword || !newPassword}
                  className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dec]"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </div>

            {/* Right: Rules */}
            <div className="bg-[#0c1f4d] text-white p-8 flex flex-col justify-center rounded-r-lg">
              <h3 className="text-xl font-semibold mb-6 text-center">
                Password Requirements
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  {rules.length ? "✓" : "✗"} Minimum 6 characters
                </li>
                <li className="flex items-center gap-3">
                  {rules.uppercase ? "✓" : "✗"} At least 1 uppercase letter
                </li>
                <li className="flex items-center gap-3">
                  {rules.number ? "✓" : "✗"} At least 1 number
                </li>
                <li className="flex items-center gap-3">
                  {rules.symbol ? "✓" : "✗"} At least 1 symbol (@$!%*?&)
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
