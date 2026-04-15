import React, { useState, useContext, useRef, useEffect } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import showToast from "@/toast/showToast";
import axios from "axios";

const MandatoryPhoneModal = ({ isOpen }) => {
  const { user, refreshUser } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const phoneRef = useRef(null);
  const otpRef = useRef(null);
  const intervalRef = useRef(null);

  // Auto-focus logic
  useEffect(() => {
    if (isOpen && step === 1 && phoneRef.current) {
      setTimeout(() => phoneRef.current.focus(), 100);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (step === 2 && otpRef.current) {
      setTimeout(() => otpRef.current.focus(), 100);
    }
  }, [step]);

  const startCooldown = () => {
    setTimer(60);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      showToast("Please enter a valid 10-digit phone number.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const userId = user?.user?._id;
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/update-users-by-id/${userId}`,
        { phone },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setStep(2);
        showToast("OTP sent successfully to your phone.", "success");
        startCooldown();
      } else {
        throw new Error(response.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      showToast(err.response?.data?.message || "Failed to send OTP.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      showToast("Please enter the 6-digit OTP.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const userId = user?.user?._id;
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/verify-phone-update-otp`,
        { phone_otp: otp, user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showToast("Phone number verified successfully!", "success");
        // Update global state with new user data from response
        refreshUser({
          ...user,
          user: response.data.user
        });
      } else {
        throw new Error(response.data.message || "Verification failed.");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      showToast(err.response?.data?.message || "Verification failed.", "error");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}> 
      {/* onOpenChange left empty to make it non-dismissible */}
      <DialogContent 
        className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-[#ea1a24]">
            Action Required: Update Phone
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            To ensure the security of your account, a verified phone number is now mandatory for all users.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Input
                  ref={phoneRef}
                  type="text"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  className="w-full h-12 text-lg text-center tracking-widest border-gray-300 focus:border-[#ea1a24] focus:ring-[#ea1a24]"
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={isLoading || phone.length !== 10}
                className="w-full h-12 bg-[#ea1a24] hover:bg-[#c7161f] text-white font-semibold text-lg transition-all rounded-md shadow-md disabled:bg-gray-400 cursor-pointer"
              >
                {isLoading ? "Sending..." : "Send Verification OTP"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-500">
                  OTP sent to <span className="font-bold text-gray-800">+91 {phone}</span>
                </p>
                <InputOTP
                  ref={otpRef}
                  maxLength={6}
                  value={otp}
                  onChange={(val) => setOtp(val)}
                  className="w-full"
                >
                  <InputOTPGroup className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <InputOTPSlot 
                        key={idx} 
                        index={idx}
                        className="w-12 h-14 text-xl border-2 border-gray-300 rounded-md focus:border-[#ea1a24] data-[active=true]:border-[#ea1a24]"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full h-12 bg-[#ea1a24] hover:bg-[#c7161f] text-white font-semibold text-lg transition-all rounded-md shadow-md disabled:bg-gray-400 cursor-pointer"
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
                
                <div className="flex justify-between items-center px-1">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Change phone number?
                  </button>
                  <button
                    onClick={handleSendOtp}
                    disabled={timer > 0 || isLoading}
                    className={`text-sm font-medium ${timer > 0 ? 'text-gray-400' : 'text-[#ea1a24] hover:underline'}`}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 italic text-[10px] text-gray-400 text-center">
          Secure verification by HUNTSWORLD Identity Services.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MandatoryPhoneModal;
