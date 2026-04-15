const User = require("../models/userModel");
const Merchant = require("../models/MerchantModel");
const GrocerySeller = require("../models/grocerySellerModel");
const Student = require("../models/studentModel");
const PendingUser = require("../models/pendingUserModel");

/**
 * Global utility to check for duplicate phone or email across all primary models.
 * 
 * @param {Object} params
 * @param {string} params.email - The email address to check.
 * @param {string} params.phone - The phone number to check.
 * @param {string} params.userId - The ID of the current user (if any). If specified, checks against OTHER users.
 * @param {string} params.excludeModel - The name of the model currently being updated (e.g., 'Merchant', 'Student').
 * @param {string} params.excludeId - The ID of the specific record within excludeModel to skip (e.g., the current Merchant's _id).
 * @param {string} params.pendingId - The ID of the current PendingUser record (if any) to exclude from checks.
 * 
 * @returns {Promise<{exists: boolean, message: string|null}>}
 */
const checkDuplicates = async ({ email, phone, userId, excludeModel, excludeId, pendingId }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = email ? email.trim().toLowerCase() : null;
  const normalizedPhone = phone ? phone.trim() : null;

  // 1. Check phone number globally
  if (normalizedPhone) {
    // Check User model
    const userWithPhone = await User.findOne({ phone: normalizedPhone });
    if (userWithPhone && userWithPhone._id.toString() !== userId?.toString()) {
      return { exists: true, message: "This phone number is already registered by another user." };
    }

    // Check PendingUser Model
    const pendingWithPhone = await PendingUser.findOne({ phone: normalizedPhone });
    if (pendingWithPhone && pendingWithPhone._id.toString() !== pendingId?.toString()) {
      // If a phone is in another pending session, we block it to prevent race conditions or hijacked registrations
      return { exists: true, message: "This phone number is currently being registered by another session." };
    }

    // Check Merchant model
    const merchantWithPhone = await Merchant.findOne({ company_phone_number: normalizedPhone });
    if (merchantWithPhone) {
      if (merchantWithPhone.user_id?.toString() !== userId?.toString() || 
          (excludeModel === "Merchant" && merchantWithPhone._id.toString() !== excludeId?.toString())) {
        return { exists: true, message: "This phone number is already registered with a Merchant profile by another user." };
      }
    }

    // Check GrocerySeller model
    const groceryWithPhone = await GrocerySeller.findOne({ shop_phone_number: normalizedPhone });
    if (groceryWithPhone) {
      if (groceryWithPhone.user_id?.toString() !== userId?.toString() || 
          (excludeModel === "GrocerySeller" && groceryWithPhone._id.toString() !== excludeId?.toString())) {
        return { exists: true, message: "This phone number is already registered with a Grocery Seller / Base Member profile by another user." };
      }
    }
  }

  // 2. Check email globally
  if (normalizedEmail && emailRegex.test(normalizedEmail)) {
    // Check User model
    const userWithEmail = await User.findOne({ email: normalizedEmail });
    if (userWithEmail && userWithEmail._id.toString() !== userId?.toString()) {
      return { exists: true, message: "This email address is already registered by another user." };
    }

    // Check PendingUser Model
    const pendingWithEmail = await PendingUser.findOne({ email: normalizedEmail });
    if (pendingWithEmail && pendingWithEmail._id.toString() !== pendingId?.toString()) {
      // If the email is already verified in another session, block it
      if (pendingWithEmail.email_verified) {
        return { exists: true, message: "This email address is already verified and held by another registration session." };
      }
    }

    // Check Merchant model
    const merchantWithEmail = await Merchant.findOne({ company_email: normalizedEmail });
    if (merchantWithEmail) {
      if (merchantWithEmail.user_id?.toString() !== userId?.toString() || 
          (excludeModel === "Merchant" && merchantWithEmail._id.toString() !== excludeId?.toString())) {
        return { exists: true, message: "This company email is already registered with a Merchant profile by another user." };
      }
    }

    // Check GrocerySeller model
    const groceryWithEmail = await GrocerySeller.findOne({ shop_email: normalizedEmail });
    if (groceryWithEmail) {
      if (groceryWithEmail.user_id?.toString() !== userId?.toString() || 
          (excludeModel === "GrocerySeller" && groceryWithEmail._id.toString() !== excludeId?.toString())) {
        return { exists: true, message: "This shop email is already registered with a Grocery Seller / Base Member profile by another user." };
      }
    }

    // Check Student model
    const studentWithEmail = await Student.findOne({ college_email: normalizedEmail });
    if (studentWithEmail) {
      if (studentWithEmail.user_id?.toString() !== userId?.toString() || 
          (excludeModel === "Student" && studentWithEmail._id.toString() !== excludeId?.toString())) {
        return { exists: true, message: "This college email is already registered with a Student profile by another user." };
      }
    }
  }

  return { exists: false, message: null };
};

module.exports = { checkDuplicates };
