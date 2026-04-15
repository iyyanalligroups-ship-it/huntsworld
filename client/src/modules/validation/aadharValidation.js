export function validateAadhar(aadhar) {
  const aadharRegex = /^\d{12}$/;
  if (!aadhar) {
    return { isValid: true, errorMessage: "" }; // Optional field
  }
  if (!aadharRegex.test(aadhar)) {
    return {
      isValid: false,
      errorMessage: "Invalid Aadhar number format. Must be exactly 12 digits",
    };
  }
  return { isValid: true, errorMessage: "" };
}