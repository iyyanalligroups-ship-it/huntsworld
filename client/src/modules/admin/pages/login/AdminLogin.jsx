import { useState, useContext, useRef, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginWithEmailMutation, useLazyGetUserByIdQuery } from "@/redux/api/Authapi";
import showToast from "@/toast/showToast";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const { login, user, loginWithOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("email");

  const [form, setForm] = useState({
    email: "",
    password: "",
    mobile: "",
    otp: ["", "", "", ""],
  });
  const [errors, setErrors] = useState({});
  const [isOtpShow, setIsOtpShow] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const [loginWithEmail, { isLoading, error }] = useLoginWithEmailMutation();
  const [fetchUserById] = useLazyGetUserByIdQuery();
  const validateEmailLogin = () => {
    let newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidMobile = (number) => /^[6-9]\d{9}$/.test(number);

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loginType === "email") {
      if (validateEmailLogin()) {
        try {
        
          const response = await loginWithEmail({
            email: form.email,
            password: form.password,
            isAdminLogin: true,
          }).unwrap();


          if (!response.success) {
            throw new Error(response.message || "Login Failed");
          }

          const token = response.data;
          sessionStorage.setItem("token", token);

       
          const decodedToken = jwtDecode(token);
          const userId = decodedToken?.userId;

          if (userId) {
            
            const { data: userResponse } = await fetchUserById(userId);
            login(userResponse, token);
          } else {
            login(null, token);
          }

          showToast(response.message || "Login Successful", "success");
          navigate("/");
        } catch (err) {
          console.error("Login Error:", err);
          showToast(err?.data?.message || "Login Failed", "error");
        }
      }
    }
  };

  
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    let newOtp = [...form.otp];
    newOtp[index] = value;
    setForm({ ...form, otp: newOtp });

    if (value && index < 3) otpRefs[index + 1].current.focus();
  };


  const handleSendOtp = () => {
    setIsOtpShow(true); 
    setForm({ ...form, otp: ["", "", "", ""] }); 
  };


  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !form.otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };




  return (
    <section className="flex justify-center items-center h-screen bg-gray-100">

      <div className="grid grid-cols-2 w-full max-w-4xl shadow-lg bg-white rounded-lg overflow-hidden">
        <div className="flex flex-col justify-center items-center p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            Huntsworld Admin Login
          </h2>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => {
                setLoginType("email");
                setIsOtpShow(false);
              }}
              className={`py-2 px-4 ${loginType === "email" ? "bg-[#ea1a24] text-white" : "bg-gray-300 cursor-pointer"
                }`}
            >
              Login With Password
            </Button>
            <Button
              onClick={() => {
                setLoginType("otp");
                setIsOtpShow(false);
              }}
              className={`py-2 px-4 ${loginType === "otp" ? "bg-[#ea1a24] text-white" : "bg-gray-300 cursor-pointer"
                }`}
            >
              Login With OTP
            </Button>
          </div>
          {/* Email/Password Login */}
          {loginType === "email" && (
            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4 w-full max-w-sm"
            >
              <Input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}

              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#ea1a24] text-white py-2 rounded-md cursor-pointer"
              >
                Sign In
              </Button>
            </form>
          )}


          {loginType === "otp" && (
            <div className="mt-4 space-y-4 w-full max-w-sm">
 
              {!isOtpShow && (
                <>
                  <Input
                    type="text"
                    name="mobile"
                    placeholder="Enter Mobile Number"
                    value={form.mobile}
                    onChange={(e) =>
                      setForm({ ...form, mobile: e.target.value })
                    }
                    maxLength={10}
                  />
                  {isValidMobile(form.mobile) && (
                    <Button
                      onClick={handleSendOtp}
                      className="w-full bg-[#ea1a24] text-white py-2 rounded-md cursor-pointer"
                    >
                      Send OTP
                    </Button>
                  )}
                </>
              )}

           
              {isOtpShow && (
                <>
                  <div className="flex gap-2 justify-center">
                    {form.otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        maxLength={1}
                        className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                
                  <Button
                    onClick={handleSendOtp} 
                    className="w-full bg-gray-500 text-white py-2 rounded-md mt-3  cursor-pointer"
                  >
                    Resend OTP
                  </Button>

             
                  {form.otp.every((digit) => digit !== "") && (
                    <Button
                      type="submit"
                      onClick={handleSubmit}
                      className="w-full bg-[#ea1a24] text-white py-2 rounded-md cursor-pointer"
                    >
                      Verify OTP
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center items-center bg-[#0c1f4d] text-white p-8">
          <h2 className="text-2xl font-semibold">Welcome to ExpoB2B</h2>
          <p className="text-center mt-3">
            Join our platform to expand your business, connect with merchants,
            and grow your network. Sign in to access exclusive deals and
            partnerships.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;



