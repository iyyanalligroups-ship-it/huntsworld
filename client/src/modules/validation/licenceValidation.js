export const validateLicence = (licenceNumber) => {
  const licenceRegex = /^[A-Z0-9]{5,15}$/;
  if (!licenceNumber) {
    return { isValid: false, errorMessage: "Licence number is required" };
  }
  if (!licenceRegex.test(licenceNumber)) {
    return {
      isValid: false,
      errorMessage: "Invalid licence number format. Must be 5-15 alphanumeric characters",
    };
  }
  return { isValid: true, errorMessage: "" };
};