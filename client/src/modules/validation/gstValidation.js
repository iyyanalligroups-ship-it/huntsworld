export const validateGST = (gstNumber) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstNumber) {
    return { isValid: false, errorMessage: "GST number is required" };
  }
  if (!gstRegex.test(gstNumber)) {
    return {
      isValid: false,
      errorMessage: "Invalid GST number format. Must be 15 characters (e.g., 22AAAAA0000A1Z5)",
    };
  }
  return { isValid: true, errorMessage: "" };
};