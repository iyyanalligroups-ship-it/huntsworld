const validatePincode = (pincode) => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

export default validatePincode;