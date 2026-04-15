import { useState, useEffect, useRef } from "react";
import {
  useAddUserMutation,
  useUpdateUserMutation,
  useResendOtpMutation,
  useVerifyEmailOtpMutation,
} from "@/redux/api/Authapi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import showToast from "@/toast/showToast";

const UserForm = ({ user, closeModal }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    confirmPassword: "",
    otp: ["", "", "", ""],
  });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState({});
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [verifyEmailOtp] =
    useVerifyEmailOtpMutation();

  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const [isOtpShow, setIsOtpShow] = useState(false);
  // Handle Field Blur (Mark field as touched)


  const [addUser] = useAddUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (formData.name.length < 3)
      newErrors.name = "Name must be at least 3 characters";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone number must be 10 digits";

    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  // Validate on Input Change
  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });
    validateForm();

    if (!isValid) return;

    if (user) {
      const response = await updateUser({
        id: user._id,
        updatedUser: formData,
      });

      if (response.success == true) {
        showToast(response.message || "User Updated Successfully",'success');
      } else {
        showToast(response.message || "Failed to Update",'error');
      }
    } else {
      const response = await addUser(formData);
      console.log(response, "user");
      if (response?.data?.success == true) {
        setIsOtpShow(true);
        showToast(response?.data?.message || "User Added Successfully",'success');
      } else {
        showToast(response?.data?.message || "Falied to Add");
      }
    }

    // closeModal();
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await verifyEmailOtp({
        email: formData.email,
        email_otp: formData.otp.join(""),
      }).unwrap();
      if (response) {
        setIsOtpShow(true);
      }
      closeModal();
    } catch (error) {
      console.log(error.message || "Otp Verification Failed", "error");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await resendOtp({ email: formData.email }).unwrap();
      if (response.success) {
        setFormData({ ...formData, otp: ["", "", "", ""] }); // Clear OTP fields
      }
    } catch (error) {
      console.log(error.message || "Failed to send Otp", "error");
    }
  };

  // Handle OTP Input Change
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Only allow numbers
    let newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData({ ...formData, otp: newOtp });

    // Move focus forward
    if (value && index < 3) otpRefs[index + 1].current.focus();
  };
  // Handle OTP Backspace (Move focus back)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };
  return (
    <>
  

      {!isOtpShow ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            placeholder="Enter Name"
            value={formData.name}
            onChange={handleChange}
          />
          {touched.name && errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
          <Input
            name="email"
            type="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
          />
          {touched.email && errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
          <Input
            name="phone"
            type="tel"
            placeholder="Enter Phone Number"
            value={formData.phone}
            onChange={handleChange}
          />
          {touched.phone && errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone}</p>
          )}
          <Input
            name="password"
            type="password"
            placeholder="Enter Password"
            value={formData.password}
            autocomplete="password"
            onChange={handleChange}
          />
          {touched.password && errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            autocomplete="confirmPassword"
            onChange={handleChange}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              // disabled={!isValid}
              className={
                !isValid ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }
            >
              {user ? "Update" : "Add"} User
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-4 w-full max-w-sm">
          <div className="flex gap-2 justify-center">
            {formData.otp.map((digit, index) => (
              <input
                key={index}
                ref={otpRefs[index]}
                type="text"
                maxLength={1}
                className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
              />
            ))}
          </div>
          <Button
            onClick={handleResendOtp}
            className="w-full bg-gray-500 text-white py-2 rounded-md mt-3 cursor-pointer"
            disabled={isResending}
          >
            {isResending ? "Resending..." : "Resend OTP"}
          </Button>

          <Button
            className="w-full bg-[#e03733] text-white py-2"
            onClick={handleVerifyOtp}
          >
            Verify OTP
          </Button>
        </div>
      )}
    </>
  );
};

export default UserForm;
