export const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!password) {
    return { isValid: false, errorMessage: "Password is required" };
  }
  if (!passwordRegex.test(password)) {
    return {
      isValid: false,
      errorMessage:
        "Password must be at least 6 characters long, include an uppercase letter, a lowercase letter, a number, and a special character",
    };
  }
  return { isValid: true, errorMessage: "" };
};