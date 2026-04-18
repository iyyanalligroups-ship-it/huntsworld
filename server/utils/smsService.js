const axios = require('axios');

/**
 * Cleans a phone number to ensure it's a 10-digit string for Indian SMS gateways.
 * Strips prefixes like +91, 91, or 0.
 */
const cleanPhoneNumber = (number) => {
  if (!number) return "";
  // Remove all non-digit characters
  let cleaned = number.toString().replace(/\D/g, "");

  // If starts with 91 and is 12 digits, take last 10
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  }

  // If starts with 0 and is 11 digits, take last 10
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Return the last 10 digits if possible, or the whole thing if it's already shorter
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
};

/**
 * Centralized SMS service using ChennaiSMS gateway.
 */
const sendSMS = async (number, message) => {
  const user = process.env.CHENNAI_SMS_USER;
  const password = process.env.CHENNAI_SMS_PASS;
  const senderId = process.env.CHENNAI_SMS_SENDER;

  if (!user || !password) {
    console.warn("SMS Config missing in .env. SMS will not be sent.");
    return null;
  }

  const cleanedNumber = cleanPhoneNumber(number);
  if (cleanedNumber.length !== 10) {
    console.warn(`Invalid phone number format for SMS: ${number}`);
  }

  try {
    // Constructing the URL using URLSearchParams ensures all parameters are correctly encoded.
    const params = new URLSearchParams({
      user: user,
      password: password,
      senderid: senderId,
      channel: "Trans",
      DCS: "0",
      flashsms: "0",
      number: cleanedNumber,
      text: message
    });

    const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?${params.toString()}`;

    const response = await axios.get(smsApiUrl);

    // Log the response for debugging purposes
    console.log(`SMS Sent to ${cleanedNumber}. Response:`, response.data);

    return response.data;
  } catch (error) {
    console.error("ChennaiSMS delivery failure:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendSMS, cleanPhoneNumber };
