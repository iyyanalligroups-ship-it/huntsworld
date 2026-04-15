export const validateMSME = (msmeNumber) => {
  const msmeRegex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
  if (!msmeNumber) {
    return { isValid: false, errorMessage: "MSME registration number is required" };
  }
  if (!msmeRegex.test(msmeNumber)) {
    return {
      isValid: false,
      errorMessage: "Invalid MSME number format. Must be like UDYAM-XX-00-0000000",
    };
  }
  return { isValid: true, errorMessage: "" };
};