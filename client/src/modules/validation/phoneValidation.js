export function validatePhoneNumber(phoneNumber) {
  // Remove any whitespace or non-digit characters except the leading '+'
  const cleanedNumber = phoneNumber.replace(/[\s-]/g, '');
  
  if (!cleanedNumber) {
    return {
      isValid: false,
      errorMessage: "Phone number is required",
    };
  }

  const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

  if (!phoneRegex.test(cleanedNumber)) {
    return {
      isValid: false,
      errorMessage: "Invalid phone number format. Must be a 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g., +919876543210 or 9876543210)",
    };
  }

  return {
    isValid: true,
    errorMessage: "",
  };
}