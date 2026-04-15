export function validatePAN(pan) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!pan) {
    return { isValid: true, errorMessage: "" }; // Optional field
  }
  if (!panRegex.test(pan)) {
    return {
      isValid: false,
      errorMessage: "Invalid PAN number format. Must be 10 characters (e.g., AAAAA9999A)",
    };
  }
  return { isValid: true, errorMessage: "" };
}