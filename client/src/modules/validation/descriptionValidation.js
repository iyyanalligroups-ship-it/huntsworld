export const validateDescription = (description) => {
  if (!description) {
    return { isValid: false, errorMessage: "Description is required" };
  }
  if (description.length < 10) {
    return { isValid: false, errorMessage: "Description must be at least 10 characters long" };
  }
  if (description.length > 3000) {
    return { isValid: false, errorMessage: "Description cannot exceed 500 characters" };
  }
  return { isValid: true, errorMessage: "" };
};