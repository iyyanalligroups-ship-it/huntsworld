const User = require("../models/userModel");
const Merchant = require("../models/MerchantModel");
const GrocerySeller = require("../models/grocerySellerModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Student = require("../models/studentModel");

/**
 * Checks if the provided email/phone matches the verified identifiers in the User model.
 * @param {string} userId - The user ID.
 * @param {string} email - The email to check.
 * @param {string} phone - The phone number to check.
 * @returns {object} - Verification flags { email_verified, number_verified }.
 */
async function getSyncVerificationFlags(userId, email, phone) {
  const flags = { email_verified: false, number_verified: false };
  if (!userId) return flags;

  try {
    const user = await User.findById(userId);
    if (!user) return flags;

    // Check email
    if (email && user.email && email.toLowerCase().trim() === user.email.toLowerCase().trim()) {
      if (user.email_verified) flags.email_verified = true;
    }

    // Check phone
    if (phone && user.phone && phone.trim() === user.phone.trim()) {
      if (user.number_verified) flags.number_verified = true;
    }

    return flags;
  } catch (err) {
    console.error("Error in getSyncVerificationFlags:", err);
    return flags;
  }
}

/**
 * Propagates a verification status change from one profile to all other profiles for the same user.
 * Called when an OTP is successfully verified.
 * @param {string} userId - The user ID.
 * @param {string} identifier - The email or phone number that was verified.
 * @param {string} type - 'email' or 'phone'.
 */
async function propagateVerificationChange(userId, identifier, type) {
  if (!userId || !identifier) return;

  const normalizedId = identifier.trim().toLowerCase();
  const updateFlag = type === 'email' ? { email_verified: true } : { number_verified: true };
  const queryField = type === 'email' ? 'email' : 'phone';

  try {
    // 1. Update User if it matches
    const user = await User.findById(userId);
    if (user) {
      const userValue = type === 'email' ? user.email : user.phone;
      if (userValue && userValue.trim().toLowerCase() === normalizedId) {
          if (type === 'email') user.email_verified = true;
          else user.number_verified = true;
          await user.save();
      }
    }

    // 2. Update Merchant
    await Merchant.updateMany(
      { 
        user_id: userId, 
        [type === 'email' ? 'company_email' : 'company_phone_number']: { $regex: new RegExp(`^${normalizedId}$`, "i") } 
      },
      { $set: updateFlag }
    );

    // 3. Update GrocerySeller
    await GrocerySeller.updateMany(
      { 
        user_id: userId, 
        [type === 'email' ? 'shop_email' : 'shop_phone_number']: { $regex: new RegExp(`^${normalizedId}$`, "i") } 
      },
      { $set: updateFlag }
    );

    // 4. Update ServiceProvider
    await ServiceProvider.updateMany(
      { 
        user_id: userId, 
        [type === 'email' ? 'company_email' : 'company_phone_number']: { $regex: new RegExp(`^${normalizedId}$`, "i") } 
      },
      { $set: updateFlag }
    );

    // 5. Update Student (Email only)
    if (type === 'email') {
      await Student.updateMany(
        { 
          user_id: userId, 
          college_email: { $regex: new RegExp(`^${normalizedId}$`, "i") } 
        },
        { $set: { email_verified: true } }
      );
    }

  } catch (err) {
    console.error("Error in propagateVerificationChange:", err);
  }
}

/**
 * Resets verification status across all profiles for a given user.
 * Called when an email or phone number is modified.
 * @param {string} userId - The user ID.
 * @param {string} type - 'email' or 'phone'.
 */
async function propagateVerificationReset(userId, type) {
  if (!userId) return;

  const resetFlag = type === 'email' ? { email_verified: false } : { number_verified: false };

  try {
    // 1. Reset Merchant
    await Merchant.updateMany({ user_id: userId }, { $set: resetFlag });

    // 2. Reset GrocerySeller
    await GrocerySeller.updateMany({ user_id: userId }, { $set: resetFlag });

    // 3. Reset ServiceProvider
    await ServiceProvider.updateMany({ user_id: userId }, { $set: resetFlag });

    // 4. Reset Student (Email only)
    if (type === 'email') {
      await Student.updateMany({ user_id: userId }, { $set: { email_verified: false } });
    }

    // 5. Reset User
    await User.findByIdAndUpdate(userId, { $set: resetFlag });

  } catch (err) {
    console.error("Error in propagateVerificationReset:", err);
  }
}

module.exports = {
  getSyncVerificationFlags,
  propagateVerificationChange,
  propagateVerificationReset
};
