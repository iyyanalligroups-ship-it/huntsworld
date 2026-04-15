const User = require("../models/userModel");
const Role = require("../models/roleModel");
const Address = require("../models/addressModel");
const { sendOtpEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const ViewPoint = require("../models/viewPointsModel");
const mongoose = require("mongoose");
const Message = require("../models/messageModel");
const Point = require("../models/pointsModel");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const SubscriptionPlanElement = require("../models/subscriptionPlanElementModel");
const SubscriptionPlanElementMapping = require("../models/subscriptionPlanElementMappingModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const { passwordResetGenerateOtp, sendPasswordResetOtpEmail } = require('../utils/passwordResetOtp');
const GrocerySeller = require("../models/grocerySellerModel");
const { generateAuthToken } = require("../utils/jwt");
const UserActiveFeature = require("../models/UserActiveFeature");
const { STATUS } = require("../constants/subscriptionConstants");
const Student = require("../models/studentModel");
const PendingUser = require("../models/pendingUserModel");
const { checkDuplicates } = require("../utils/duplicateCheck");
const { propagateVerificationChange } = require("../utils/verificationSync");

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      password,
      confirmPassword,
      referral_code: providedReferralCode,
    } = req.body;
    const normalizedPhone = phone?.trim();
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

    // ===============================
    // GLOBAL DUPLICATE CHECK (PHONE & EMAIL)
    // ===============================
    const duplicateStatus = await checkDuplicates({
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    if (duplicateStatus.exists) {
      // Special logic for createUser: 
      // We ALLOW progress if the "duplicate" is just an unverified User OR a PendingUser session.
      // This allows users to restart registration after refresh or timeout.
      
      const emailOrPhone = [];
      if (normalizedEmail) emailOrPhone.push({ email: normalizedEmail });
      if (normalizedPhone) emailOrPhone.push({ phone: normalizedPhone });

      const merchantOr = [];
      if (normalizedEmail) merchantOr.push({ company_email: normalizedEmail });
      if (normalizedPhone) merchantOr.push({ company_phone_number: normalizedPhone });

      const groceryOr = [];
      if (normalizedEmail) groceryOr.push({ shop_email: normalizedEmail });
      if (normalizedPhone) groceryOr.push({ shop_phone_number: normalizedPhone });

      const [existingUserRef, existingMerchant, existingGrocery, existingStudent, existingPending] = await Promise.all([
        emailOrPhone.length ? User.findOne({ $or: emailOrPhone }) : null,
        merchantOr.length ? Merchant.findOne({ $or: merchantOr }) : null,
        groceryOr.length ? GrocerySeller.findOne({ $or: groceryOr }) : null,
        normalizedEmail ? Student.findOne({ college_email: normalizedEmail }) : null,
        emailOrPhone.length ? PendingUser.findOne({ $or: emailOrPhone }) : null
      ]);

      // Block if it's already registered in a primary profile
      if (existingMerchant || existingGrocery || existingStudent) {
        return res.status(400).json({ success: false, error: true, message: duplicateStatus.message });
      }

      // If it's a real User, block if verified
      if (existingUserRef && (existingUserRef.number_verified || existingUserRef.email_verified)) {
        return res.status(400).json({ success: false, error: true, message: "This email/phone is already registered by a verified user." });
      }

      // If it's only an unverified User or a PendingUser session, we let it proceed to findOneAndUpdate/upsert logic.
      const isOkToContinue = (existingUserRef && !existingUserRef.number_verified && !existingUserRef.email_verified) || 
                             (existingPending);

      if (!isOkToContinue) {
        return res.status(400).json({
          success: false,
          error: true,
          message: duplicateStatus.message,
        });
      }
    }

    // ===============================
    // VALIDATIONS
    // ===============================

    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Enter a valid 10-digit phone number",
      });
    }

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Enter a valid email address",
      });
    }

    if (password && password.trim() !== confirmPassword?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Passwords do not match",
      });
    }

    // ===============================
    // ROLE SETUP
    // ===============================
    let userRole = await Role.findOne({ role: "USER" });

    if (!userRole) {
      return res.status(500).json({
        success: false,
        error: true,
        message: "Default role USER not found",
      });
    }

    if (role) {
      const requestedRole = await Role.findOne({ role });
      if (!requestedRole) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Invalid role",
        });
      }
      userRole = requestedRole;
    }

    // ===============================
    // CHECK EXISTING USER (EMAIL OR PHONE)
    // ===============================
    const queryConditions = [];
    if (normalizedEmail) queryConditions.push({ email: normalizedEmail });
    if (normalizedPhone) queryConditions.push({ phone: normalizedPhone });

    const existingUser =
      queryConditions.length > 0
        ? await User.findOne({ $or: queryConditions })
        : null;

    // ============================================================
    // EXISTING USER UPDATE FLOW (IF NOT VERIFIED)
    // ============================================================
    if (existingUser) {
      if (!existingUser.email_verified || !existingUser.number_verified) {
        if (name) existingUser.name = name;
        if (normalizedEmail) existingUser.email = normalizedEmail;
        if (normalizedPhone) existingUser.phone = normalizedPhone;
        if (userRole?._id) existingUser.role = userRole._id;

        if (password) {
          existingUser.password = await bcrypt.hash(password, 10);
        }

        existingUser.referral_code = normalizedPhone
          ? (name || existingUser.name || "HW").substring(0, 2).toUpperCase() + normalizedPhone
          : existingUser.referral_code;

        // ---------------- EMAIL OTP ----------------
        if (normalizedEmail) {
          const otp = Math.floor(
            1000 + Math.random() * 9000
          ).toString();

          existingUser.email_otp = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

          existingUser.otpExpires = new Date(
            Date.now() + 60 * 60 * 1000
          );

          existingUser.email_verified = false;

          await existingUser.save();
          await sendOtpEmail(normalizedEmail, otp);

          return res.status(201).json({
            success: true,
            error: false,
            message:
              "User updated. OTP sent to email for verification.",
            data: {
              userId: existingUser._id,
              name: existingUser.name,
              email: existingUser.email,
              phone: existingUser.phone,
            },
          });
        }

        // ---------------- PHONE OTP ----------------
        if (normalizedPhone) {
          const otp = generateOtp();

          existingUser.number_otp = otp;
          existingUser.otpExpires = new Date(
            Date.now() + 60 * 60 * 1000
          );

          existingUser.number_verified = false;

          await existingUser.save();

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${normalizedPhone}&text=Your OTP for login/verification is ${otp}. Please do not share this with anyone. – HUNTSWORLD`;

          await axios.get(smsApiUrl);

          return res.status(201).json({
            success: true,
            error: false,
            message:
              "User updated. OTP sent to phone for verification.",
            data: {
              userId: existingUser._id,
              name: existingUser.name,
              email: existingUser.email,
              phone: existingUser.phone,
            },
          });
        }
      }

      // Already verified
      if (existingUser.email === normalizedEmail && normalizedEmail) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Email already exists",
        });
      }

      if (existingUser.phone === normalizedPhone && normalizedPhone) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Phone number already exists",
        });
      }
    }

    // ============================================================
    // NEW USER CREATION
    // ============================================================



    // ============================================================
    // PENDING USER CREATION (REPLACES DIRECT USER CREATION)
    // ============================================================
    // Phone number is the primary requirement. Email is optional.
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Phone number is required for registration",
      });
    }

    // Capture and validate email ONLY if provided
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            error: true,
            message: "Enter a valid email address",
        });
    }

    // Check if user already exists in PendingUser (optional: upsert/update)
    const emailOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const encryptedEmailOtp = crypto.createHash("sha256").update(emailOtp).digest("hex");
    const phoneOtp = generateOtp();
    const hashPassword = password ? await bcrypt.hash(password, 10) : null;

    // Validate referrer
    let referred_by = null;
    if (providedReferralCode) {
      const referringUser = await User.findOne({
        referral_code: providedReferralCode,
      });

      if (!referringUser) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Invalid referral code",
        });
      }

      referred_by = referringUser._id;
    }

    // Using findOneAndUpdate to preserve existing verification flags if user is re-verifying
    const updateData = {
      phone: normalizedPhone,
      role: userRole._id,
      referral_code: providedReferralCode, 
      referred_by: referred_by,
      email_otp: encryptedEmailOtp,
      number_otp: phoneOtp,
      otpExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    };

    // Only set these if they are provided, preventing overwrite of existing verified data
    if (name) updateData.name = name;
    if (normalizedEmail) updateData.email = normalizedEmail;
    if (hashPassword) updateData.password = hashPassword;

    // If a new email is provided in this step, reset its verification status if it's DIFFERENT from the one on record
    // However, the findOneAndUpdate will preserve other fields automatically.

    const pendingUser = await PendingUser.findOneAndUpdate(
      { phone: normalizedPhone },
      { $set: updateData },
      { upsert: true, new: true }
    );

    // -------------------------------------------------------------
    // SEND OTPs (Trigger primary based on registerType if provided)
    // -------------------------------------------------------------
    // If it's email flow, send email OTP
    if (normalizedEmail) {
      await sendOtpEmail(normalizedEmail, emailOtp);
    }
    
    // If phone is provided, send SMS OTP too as requested "verify email and phone"
    if (normalizedPhone) {
      const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${normalizedPhone}&text=Your OTP for login/verification is ${phoneOtp}. Please do not share this with anyone. – HUNTSWORLD`;
      await axios.get(smsApiUrl).catch(e => console.error("SMS skip error:", e.message));
    }

    return res.status(201).json({
      success: true,
      error: false,
      message: "Registration initiated. OTP sent for verification.",
      data: {
        emailSent: !!normalizedEmail,
        smsSent: !!normalizedPhone,
        email: normalizedEmail,
        phone: normalizedPhone,
      },
    });

  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "An account with this email/phone is already in the system.",
      });
    }
    return res.status(500).json({
      success: false,
      error: true,
      message: "Error creating user",
      errorMessage: error.message,
    });
  }
};


exports.resendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    const normalizedPhone = phone ? phone.trim() : null;

    let target = null;
    let isPending = false;

    // 1. Identify the TARGET record (the current session)
    // We prioritize phone because during registration/verification, phone is the most stable identifier.
    if (normalizedPhone) {
      target = await User.findOne({ phone: normalizedPhone }) || await PendingUser.findOne({ phone: normalizedPhone });
      isPending = target ? !(await User.exists({ _id: target._id })) : false;
    }

    // 2. If no target found by phone, try finding by email
    if (!target && normalizedEmail) {
      target = await User.findOne({ email: normalizedEmail }) || await PendingUser.findOne({ email: normalizedEmail });
      isPending = target ? !(await User.exists({ _id: target._id })) : false;
    }

    if (!target) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // 3. GLOBAL DUPLICATE CHECK for the provided identity
    // If we're trying to assign an email to an existing target (found by phone), 
    // we must ensure that email doesn't belong to ANOTHER user (including other pending sessions).
    const duplicateStatus = await checkDuplicates({
      email: normalizedEmail,
      phone: normalizedPhone,
      userId: !isPending ? target._id : undefined, // If it's a real User, exclude them from duplicate check
      pendingId: isPending ? target._id : undefined, // If it's a pending session, exclude it
    });

    if (duplicateStatus.exists) {
      // Find who owns this existing identity in the User table
      const emailOrPhone = [];
      if (normalizedEmail) emailOrPhone.push({ email: normalizedEmail });
      
      const existingUserRef = emailOrPhone.length ? await User.findOne({ $or: emailOrPhone }) : null;

      // If the duplicate is NOT the same as our target, it's a real conflict.
      const isSelf = existingUserRef && target._id.toString() === existingUserRef._id.toString();

      if (!isSelf) {
          // Check if the "other" account is verified or attached to a profile
          const merchantOr = [];
          if (normalizedEmail) merchantOr.push({ company_email: normalizedEmail });
          const groceryOr = [];
          if (normalizedEmail) groceryOr.push({ shop_email: normalizedEmail });

          const [existingMerchant, existingGrocery, existingStudent] = await Promise.all([
              merchantOr.length ? Merchant.findOne({ $or: merchantOr }) : null,
              groceryOr.length ? GrocerySeller.findOne({ $or: groceryOr }) : null,
              normalizedEmail ? Student.findOne({ college_email: normalizedEmail }) : null
          ]);

          // We block if it's in any major profile, OR if it's a verified User, 
          // OR if checkDuplicates identified a conflict (like a verified Pending session).
          const isVerifiedOther = (existingUserRef && (existingUserRef.number_verified || existingUserRef.email_verified)) ||
                                   existingMerchant || existingGrocery || existingStudent || duplicateStatus.exists;

          if (isVerifiedOther) {
              return res.status(400).json({
                  success: false,
                  error: true,
                  message: duplicateStatus.message || "This email is already registered by another user.",
              });
          }
      }
    }

    const otp = email ? Math.floor(1000 + Math.random() * 9000).toString() : generateOtp();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    if (email) {
      const updateData = {
        email: normalizedEmail,
        email_otp: crypto.createHash("sha256").update(otp).digest("hex"),
        otpExpires: expiry
      };

      if (isPending) {
        await PendingUser.findByIdAndUpdate(target._id, { $set: updateData });
      } else {
        await User.findByIdAndUpdate(target._id, { $set: updateData });
      }
      
      await sendOtpEmail(normalizedEmail, otp);
    } else {
      const normalizedPhone = phone.trim();
      const updateData = {
        number_otp: otp,
        otpExpires: expiry
      };

      if (isPending) {
        await PendingUser.findByIdAndUpdate(target._id, { $set: updateData });
      } else {
        await User.findByIdAndUpdate(target._id, { $set: updateData });
      }

      const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${normalizedPhone}&text=Your OTP is ${otp}. HUNTSWORLD`;
      await axios.get(smsApiUrl).catch(e => console.error("Resend SMS error:", e.message));
    }

    res.status(200).json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error resending OTP", error: error.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, phone, password, isAdminLogin = false } = req.body;

    // Step 1: Validate that at least one identifier + password is provided
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number and password are required",
      });
    }

    // Step 2: Normalize input (trim & lowercase for email)
    const identifier = (email || phone || "").toString().trim();
    const isPhoneLogin = !!phone || /^\d{10}$/.test(identifier); // 10-digit Indian number
    const isEmailLogin = !!email && identifier.includes("@");

    let user;

    // Step 3: Find user by email OR phone
    if (isPhoneLogin) {
      const phoneNumber = phone || identifier;
      user = await User.findOne({ phone: phoneNumber }).populate("role", "_id role");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this phone number. Please register first.",
        });
      }
    } else if (isEmailLogin) {
      const emailAddress = email || identifier;
      user = await User.findOne({ email: emailAddress.toLowerCase() }).populate("role", "_id role");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found for this email address. Please register first.",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email or 10-digit phone number",
      });
    }
    // NEW: Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin to activate your account.",
      });
    }

    // Step 4: Role-based access control
    const userRole = user.role?.role || "USER";

    if (isAdminLogin) {
      if (!["ADMIN", "SUB_ADMIN"].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to admin panel",
        });
      }
    } else {
      if (["ADMIN", "SUB_ADMIN"].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Admins must use the admin login page",
        });
      }
    }

    // Step 5: Check email verification (only for email-based login)
    if (isEmailLogin && !user.email_verified) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const encryptedOtp = crypto.createHash("sha256").update(otp).digest("hex");
      user.email_otp = encryptedOtp;
      user.otpExpires = new Date(Date.now() + 60 * 60 * 1000); // Add expires
      await user.save();

      await sendOtpEmail(user.email, otp);

      return res.status(403).json({
        success: false,
        notVerified: true, // Add flag for frontend
        email: user.email, // Return email for UI
        message: "Email not verified. A new OTP has been sent to your email.",
      });
    }

    // Step 6: Validate password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Your account does not have a password set. Please login using OTP or reset your password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    // This extracts just the name "STUDENT"


    // const token = jwt.sign(
    //   { userId: user._id, role: userRole }, // Now it is just the string
    //   process.env.JWT_SECRET,
    //   { expiresIn: "7d" }
    // );
    const token = generateAuthToken(user);

    // Step 8: Success Response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login",
      details: error.message,
    });
  }
};


// controllers/authController.js
exports.refreshToken = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate("role", "role");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }


    const newToken = generateAuthToken(user);

    return res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Step 1: Validate input
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Step 2: Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found for this phone number please register before login",
      });
    }

    // Step 3: Generate OTP and save to user
    const otp = generateOtp(); // e.g. a 4 or 6-digit random OTP
    user.number_otp = otp;
    user.otpExpires = new Date(Date.now() + 60 * 60 * 1000); // ✅ ADD
    await user.save();


    // Step 4: Send OTP via SMS API
    const smsText = `Your OTP for login/verification is ${otp}. Please do not share this with anyone. – HUNTSWORLD`;

    const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${phone}&text=${encodeURIComponent(
      smsText
    )}`;

    const response = await axios.get(smsApiUrl);

    if (response && response.status === 200) {
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } else {
      throw new Error("Failed to send OTP via SMS API");
    }
  } catch (error) {
    console.error("Send OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, email_otp, phone } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    // 1. Check if user is already in main User collection (verifying an update)
    let user = await User.findOne({ email: normalizedEmail }).populate("role", "role");
    let isNewRegistration = false;
    let pendingUser = null;

    if (!user) {
      // 2. Check in PendingUser collection (new registration)
      // Try finding by email or phone (as email might not be set yet if phone-only register)
      const lookupConditions = [];
      if (normalizedEmail) lookupConditions.push({ email: normalizedEmail });
      if (normalizedPhone) lookupConditions.push({ phone: normalizedPhone });

      pendingUser = await PendingUser.findOne({ $or: lookupConditions });
      
      if (!pendingUser) {
        return res.status(404).json({ success: false, message: "No registration found for this user." });
      }
      isNewRegistration = true;
    }

    const target = user || pendingUser;

    // 3. Expiry check
    if (!target.otpExpires || target.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // 4. OTP match
    const hashedOtp = crypto.createHash("sha256").update(email_otp).digest("hex");
    if (hashedOtp !== target.email_otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (isNewRegistration) {
      // Mark as verified and ENSURE the email field is saved
      await PendingUser.findByIdAndUpdate(target._id, {
        $set: {
          email: normalizedEmail,
          email_verified: true,
          isEmailVerified: true,
          email_otp: null,
          otpExpires: null
        }
      });

      return res.status(200).json({
        success: true,
        message: "Email verified successfully.",
        isEmailVerified: true,
        pendingUserId: target._id
      });
    } else {
      // Existing user verified update
      await User.findByIdAndUpdate(user._id, {
        $set: {
          email_verified: true,
          email_otp: null,
          otpExpires: null
        }
      });

      // Cross-model verification sync
      await propagateVerificationChange(user._id, normalizedEmail, 'email');
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role?.role || "USER" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: token,
    });
  } catch (error) {
    console.error("Verify Email OTP Error:", error);
    res.status(500).json({ success: false, message: "Error verifying OTP", error: error.message });
  }
};

// exports.verifyNumberOtp = async (req, res) => {
//   try {
//     const { phone, otp, isAdminLogin = false } = req.body;
//     

//     // Step 1: Validate input
//     if (!phone || !otp) {
//       return res.status(400).json({
//         success: false,
//         error: true,
//         message: "Phone number and OTP are required",
//       });
//     }

//     // Step 2: Get user with populated role
//     const user = await User.findOne({ phone }).populate("role", "_id role");
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: true,
//         message: "User not found",
//       });
//     }

//     // Step 3: Role Check
//     const userRole = user.role?.role;
//     
//     if (isAdminLogin) {
//       if (userRole !== "ADMIN" && userRole !== "SUB_ADMIN") {
//         return res.status(403).json({
//           success: false,
//           error: true,
//           message: "Unauthorized access to admin panel",
//         });
//       }
//     } else {
//       if (userRole === "ADMIN" || userRole === "SUB_ADMIN") {
//         return res.status(403).json({
//           success: false,
//           error: true,
//           message: "Admins and Sub-Admins must use the admin login page",
//         });
//       }
//     }

//     if (!user.otpExpires || user.otpExpires < new Date()) {
//       return res.status(400).json({
//         success: false,
//         error: true,
//         message: "OTP has expired. Please request a new one.",
//       });
//     }

//     // Step 5: OTP Verification (plain text comparison)
//     
//     
//     if (user.number_otp !== otp) {
//       return res.status(401).json({
//         success: false,
//         error: true,
//         message: "Invalid OTP",
//       });
//     }

//     // Step 6: Clear OTP and set number_verified to true
//     user.number_otp = null;
//     user.otpExpires = null; // ✅ ADD
//     user.number_verified = true;
//     await user.save();


//     // Step 7: JWT Token Generation
//     const token = jwt.sign(
//       {
//         userId: user._id,
//         role: user.role?.role || "USER", // ✅ STRING
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // Step 8: Return response
//     return res.status(200).json({
//       success: true,
//       error: false,
//       message: "OTP verified and login successful",
//       data: token,
//     });
//   } catch (error) {
//     console.error("Verify OTP Error:", error);
//     return res.status(500).json({
//       success: false,
//       error: true,
//       message: "Error verifying OTP",
//       details: error.message,
//     });
//   }
// };

exports.verifyNumberOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const normalizedPhone = phone?.trim();

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone and OTP are required" });
    }

    // 1. Check main collection
    let user = await User.findOne({ phone: normalizedPhone }).populate("role", "role");
    let isNewRegistration = false;
    let pendingUser = null;

    if (!user) {
      // 2. Check PendingUser
      pendingUser = await PendingUser.findOne({ phone: normalizedPhone });
      if (!pendingUser) {
        return res.status(404).json({ success: false, message: "No registration found for this phone number." });
      }
      isNewRegistration = true;
    }

    const target = user || pendingUser;

    // 3. Expiry check
    if (!target.otpExpires || target.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    // 4. OTP match
    if (String(target.number_otp) !== String(otp)) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    // 5. Success Flow
    if (isNewRegistration) {
      // Mark as verified session
      await PendingUser.findByIdAndUpdate(target._id, {
        $set: {
          number_verified: true,
          isPhoneVerified: true,
          number_otp: null,
          otpExpires: null
        }
      });

      return res.status(200).json({
        success: true,
        message: "Phone verified successfully.",
        isPhoneVerified: true,
        pendingUserId: target._id
      });
    } else {
      // Existing user verified update
      await User.findByIdAndUpdate(user._id, {
        $set: {
          number_verified: true,
          number_otp: null,
          otpExpires: null
        }
      });

      // Cross-model verification sync
      await propagateVerificationChange(user._id, normalizedPhone, 'phone');
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role?.role || "USER" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Phone verified successfully.",
      data: token,
    });

  } catch (error) {
    console.error("Verify Phone OTP Error:", error);
    return res.status(500).json({ success: false, message: "Error verifying OTP", error: error.message });
  }
};

exports.completeRegistration = async (req, res) => {
  try {
    const { phone, email, name, password, referral_code } = req.body;

    const normalizedPhone = phone?.trim();
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
    // Robust lookup: search by either normalized email or phone
    const lookupQuery = {
      $or: [
        { phone: normalizedPhone }
      ]
    };
    if (normalizedEmail) {
      lookupQuery.$or.push({ email: normalizedEmail });
    }
    const pendingUser = await PendingUser.findOne(lookupQuery);
    if (!pendingUser) {
      // Fallback: Check if user was ALREADY created (handles double-clicks/refreshes)
      const existingUser = await User.findOne(lookupQuery).populate("role");
      if (existingUser) {
        const token = jwt.sign(
          { userId: existingUser._id, role: existingUser.role.role },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        return res.status(200).json({ 
          success: true, 
          message: "Registration already completed. Welcome back!",
          data: token 
        });
      }
      return res.status(404).json({ success: false, message: "Registration session not found or expired." });
    }

    if (!pendingUser.isPhoneVerified) {
      return res.status(400).json({ success: false, message: "Phone number must be verified first." });
    }

    if ((normalizedEmail || pendingUser.email) && !pendingUser.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email was provided but not verified." });
    }

    const finalName = name || pendingUser.name;
    if (!finalName) {
      return res.status(400).json({ success: false, message: "Username is required to complete registration." });
    }

    // ============================================================
    // RESOLVE referred_by — key fix: fallback if pendingUser.referred_by is missing
    // ============================================================
    let resolvedReferredBy = pendingUser.referred_by || null;

    if (!resolvedReferredBy && referral_code) {
      // PendingUser may have been created in a previous session without the referral code.
      // Re-resolve it now so it doesn't get lost.
      const referrer = await User.findOne({ referral_code: referral_code.trim() });
      if (referrer) {
        resolvedReferredBy = referrer._id;
      } else {
        console.warn("Warning: referral_code provided but no matching user found:", referral_code);
      }
    }

    // Hash password if provided
    let hashPassword = pendingUser.password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashPassword = await bcrypt.hash(password, salt);
    }

    // AUDIT LOG: Check pendingUser state before promotion
    // Create User
    const newUser = new User({
      name: finalName,
      email: normalizedEmail || pendingUser.email, // Explicitly prioritize the request's email if possible
      phone: pendingUser.phone,
      password: hashPassword,
      role: pendingUser.role,
      referred_by: resolvedReferredBy, // Use resolved value (with fallback)
      number_verified: true,
      email_verified: !!pendingUser.isEmailVerified, // Explicitly promote verified flag
      isActive: true,
      created_at: new Date(),
    });

    await newUser.save();

    // Trigger Admin Notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("user", {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        created_at: newUser.created_at
      });
    }

    // Clean up
    await PendingUser.deleteOne({ _id: pendingUser._id });

    const token = jwt.sign(
      { userId: newUser._id, role: "USER" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Registration completed successfully",
      data: token,
    });

  } catch (error) {
    console.error("Complete Registration Error:", error);
    res.status(500).json({ success: false, message: "Failed to finalize registration", error: error.message });
  }
};



exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { name } = req.query;

    // 1. Fetch role IDs for ADMIN and SUB_ADMIN
    const roles = await Role.find({ role: { $in: ["ADMIN", "SUB_ADMIN"] } }).lean();
    const roleMap = {
      ADMIN: roles.find((r) => r.role === "ADMIN")?._id,
      SUB_ADMIN: roles.find((r) => r.role === "SUB_ADMIN")?._id,
    };

    if (!roleMap.ADMIN || !roleMap.SUB_ADMIN) {
      return res
        .status(500)
        .json({ message: "Required roles (ADMIN or SUB_ADMIN) not found" });
    }

    // 2. Build query
    const roleFilter = { role: { $in: [roleMap.ADMIN, roleMap.SUB_ADMIN] } };
    const nameFilter = name ? { name: { $regex: name, $options: "i" } } : {};
    const query = { ...roleFilter, ...nameFilter };

    // 3. Fetch users
    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .select("-password")
      .populate("role") // role will be { _id, role }
      .lean();

    const userIds = users.map((user) => user._id);

    // 4. Fetch addresses
    const addresses = await Address.find({ user_id: { $in: userIds } }).lean();

    // 5. Separate Admins and SubAdmins (compare ObjectIds properly)
    const adminUsers = users
      .filter((user) => user.role && user.role._id.equals(roleMap.ADMIN))
      .map((user) => {
        const userAddress = addresses.find(
          (addr) => addr.user_id.toString() === user._id.toString()
        );
        return { ...user, address: userAddress || {} };
      });

    const subAdminUsers = users
      .filter((user) => user.role && user.role._id.equals(roleMap.SUB_ADMIN))
      .map((user) => {
        const userAddress = addresses.find(
          (addr) => addr.user_id.toString() === user._id.toString()
        );
        return { ...user, address: userAddress || {} };
      });

    // 6. Count for pagination
    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      adminUsers,
      subAdminUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      perPage: limit,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};


exports.getUserRoleData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { name, role } = req.query;

    // Fetch role IDs
    const roles = await Role.find({ role: role ? role : { $ne: null } }).lean();
    const roleMap = {};
    roles.forEach(r => roleMap[r.role] = r._id);

    if (role && !roleMap[role]) {
      return res.status(404).json({ message: `${role} role not found` });
    }

    // Build query
    const roleFilter = role ? { role: roleMap[role] } : {};
    const nameFilter = name ? { name: { $regex: name.trim(), $options: "i" } } : {};
    const query = { ...roleFilter, ...nameFilter };

    // Fetch users
    const users = await User.find(query)
      .sort({ markAsRead: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password")
      .populate("role")
      .lean();

    const userIds = users.map(u => u._id);

    // Fetch addresses
    const addresses = await Address.find({ user_id: { $in: userIds } }).lean();

    // Map addresses
    const usersWithAddress = users.map(user => {
      const userAddress = addresses.find(a => a.user_id.toString() === user._id.toString());
      return { ...user, address: userAddress || {} };
    });

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      users: usersWithAddress,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      perPage: limit,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

exports.getChatUsers = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.user_id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const messagedUserIdsAgg = await Message.aggregate([
      {
        $match: {
          deleted: false,
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $project: {
          userId: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          createdAt: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$userId",
          lastMessageTime: { $first: "$createdAt" },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const userIds = messagedUserIdsAgg.map((doc) => doc._id);

    // 💡 DSA Optimization: Batch Fetching & Hash Maps (O(1) Lookups)
    const [users, addresses, allMessages, merchants, students, grocerySellers] = await Promise.all([
      User.find({ _id: { $in: userIds } })
        .select("-password")
        .populate("role", "role")
        .lean(),
      Address.find({ user_id: { $in: userIds } }).lean(),
      Message.find({
        $or: [
          { sender: userId, receiver: { $in: userIds } },
          { sender: { $in: userIds }, receiver: userId },
        ],
      })
        .sort({ createdAt: -1 })
        .lean(),
      Merchant.find({ user_id: { $in: userIds } }).select("user_id company_name").lean(),
      Student.find({ user_id: { $in: userIds } }).select("user_id college_name").lean(),
      GrocerySeller.find({ user_id: { $in: userIds } }).select("user_id shop_name").lean(),
    ]);

    // Build Hash Maps (O(N) CPU)
    const addressMap = {};
    addresses.forEach(addr => addressMap[addr.user_id.toString()] = addr);

    const merchantMap = {};
    merchants.forEach(m => merchantMap[m.user_id.toString()] = m.company_name);

    const studentMap = {};
    students.forEach(s => studentMap[s.user_id.toString()] = s.college_name);

    const groceryMap = {};
    grocerySellers.forEach(g => groceryMap[g.user_id.toString()] = g.shop_name);

    const lastMessageMap = {};
    const unreadCountMap = {};

    // O(M) messages pass
    allMessages.forEach(msg => {
      const senderStr = msg.sender.toString();
      const receiverStr = msg.receiver.toString();

      const otherUserId = senderStr === userId.toString() ? receiverStr : senderStr;

      if (!lastMessageMap[otherUserId]) {
        lastMessageMap[otherUserId] = msg;
      }

      // Calculate unread count
      if (senderStr === otherUserId && receiverStr === userId.toString() && !msg.read && !msg.deleted) {
        unreadCountMap[otherUserId] = (unreadCountMap[otherUserId] || 0) + 1;
      }
    });

    // Structure output (O(N) CPU)
    const usersWithDetails = users.map(user => {
      const uId = user._id.toString();
      const lastMsg = lastMessageMap[uId];
      const roleName = user.role?.role;

      return {
        ...user,
        company_name: roleName === 'MERCHANT' ? merchantMap[uId] : null,
        college_name: roleName === 'STUDENT' ? studentMap[uId] : null,
        shop_name: roleName === 'GROCERY_SELLER' ? groceryMap[uId] : null,
        address: addressMap[uId] || {},
        lastMessage: lastMsg?.content || "",
        lastMessageTime: lastMsg?.createdAt || null,
        unreadCount: unreadCountMap[uId] || 0,
      };
    });




    const totalUsersAgg = await Message.aggregate([
      {
        $match: {
          deleted: false,
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $project: {
          userId: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
        },
      },
      {
        $group: {
          _id: "$userId",
        },
      },
      {
        $count: "total",
      },
    ]);

    const totalUsers = totalUsersAgg[0]?.total || 0;

    const sortedUsers = userIds.map((id) =>
      usersWithDetails.find((user) => user._id.toString() === id.toString())
    );

    res.status(200).json({
      users: sortedUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      perPage: limit,
    });
  } catch (error) {
    console.error("Chat user fetch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

exports.getUserByIdSubDealer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch view points for this user
    const viewPointData = await ViewPoint.findOne({ user_id: user._id });

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: {
        ...userWithoutPassword,
        wallet_points: viewPointData?.view_points || 0, // return 0 if not found
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// 2. Updated updateUser Function
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, password, gender, profile_pic } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId).populate("role");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let emailChanged = false;
    let phoneChanged = false;
    let shouldSendPhoneOtp = false;

    // ──────────────────────────────────────────────────────────────
    // Phone handling (your existing logic – kept mostly unchanged)
    // ──────────────────────────────────────────────────────────────
    let normalizedPhone = phone ? phone.trim() : user.phone;

    if (phone && normalizedPhone !== user.phone) {
      if (!/^\d{10}$/.test(normalizedPhone)) {
        return res.status(400).json({ success: false, message: "Enter a valid 10-digit phone number" });
      }

      const duplicateStatus = await checkDuplicates({
        phone: normalizedPhone,
        userId: userId
      });

      if (duplicateStatus.exists) {
        return res.status(400).json({ success: false, message: duplicateStatus.message });
      }

      phoneChanged = true;
      shouldSendPhoneOtp = true;
    }

    // ──────────────────────────────────────────────────────────────
    // IMPROVED EMAIL HANDLING – allows clearing with ""
    // ──────────────────────────────────────────────────────────────
    let normalizedEmail = user.email; // default = keep current value
    emailChanged = false;

    // Check if email field was explicitly sent in the request
    if ("email" in req.body) {
      // Respect whatever the client sent (including empty string)
      const inputEmail = req.body.email ?? ""; // null/undefined → ""
      normalizedEmail = typeof inputEmail === 'string' ? inputEmail.trim().toLowerCase() : "";

      // Only mark as changed if it's actually different
      if (normalizedEmail !== user.email) {
        emailChanged = true;

        // If trying to set a new non-empty email → validate
        if (normalizedEmail !== "") {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
          }

          const duplicateStatus = await checkDuplicates({
            email: normalizedEmail,
            userId: userId
          });

          if (duplicateStatus.exists) {
            return res.status(400).json({ success: false, message: duplicateStatus.message });
          }
        }
        // If normalizedEmail === "" → we allow it (clearing email)
      }
    }

    // Resend OTP for same unverified phone (your original logic)
    if (phone && normalizedPhone === user.phone && !user.number_verified) {
      shouldSendPhoneOtp = true;
      phoneChanged = true;
    }

    // ──────────────────────────────────────────────────────────────
    // Prepare update fields
    // ──────────────────────────────────────────────────────────────
    const updateFields = {
      name: name || user.name,
      email: normalizedEmail,           // ← now correctly handles ""
      phone: normalizedPhone,
      gender: gender || user.gender,
      updated_at: new Date(),
    };

    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) return res.status(400).json({ success: false, message: "Invalid role ID" });
      updateFields.role = role;
    }
    if (profile_pic) updateFields.profile_pic = profile_pic;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    // ──────────────────────────────────────────────────────────────
    // Email OTP (only if changed to non-empty)
    // ──────────────────────────────────────────────────────────────
    // --- Handle Email OTP (only if changed TO a non-empty value) ---
    if (emailChanged && normalizedEmail !== "") {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const encryptedOtp = crypto.createHash("sha256").update(otp).digest("hex");

      const expiresInMinutes = 5;

      updateFields.email_otp = encryptedOtp;   // encrypted version
      updateFields.otpExpires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      updateFields.email_verified = false;

      try {
        await sendOtpEmail(normalizedEmail, otp);
      } catch (err) {
        console.error("Email sending failed:", err);
        // still continue – don't fail the whole update
      }
    } else if (emailChanged && normalizedEmail === "") {
      // When removing email → clear verification fields if you want
      updateFields.email_otp = null;           // or undefined
      updateFields.email_verified = false;     // or true – your business rule
      // No OTP sent – that's the goal
    }

    // ──────────────────────────────────────────────────────────────
    // Phone OTP (your existing logic)
    // ──────────────────────────────────────────────────────────────
    if (shouldSendPhoneOtp) {
      const otp = generateOtp();  // assume this returns a string like "123456"

      const expiresInMinutes = 5; // or 10 — your choice

      updateFields.number_otp = otp;
      updateFields.otpExpires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      updateFields.number_verified = false;

      const smsText = `Your OTP for login/verification is ${otp}. Please do not share this with anyone. – HUNTSWORLD`;

      const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${normalizedPhone}&text=${encodeURIComponent(smsText)}`;

      try {
        const response = await axios.get(smsApiUrl);
        if (response.status !== 200) {
          throw new Error("SMS API returned non-200 status");
        }
      } catch (smsError) {
        console.error("SMS sending failed:", smsError.message);
        return res.status(500).json({
          success: false,
          message: "Profile updated partially, but failed to send OTP to phone. Please try again.",
        });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // Apply update & save
    // ──────────────────────────────────────────────────────────────
    Object.assign(user, updateFields);
    await user.save();

    // ──────────────────────────────────────────────────────────────
    // Response preparation
    // ──────────────────────────────────────────────────────────────
    const updatedUser = await User.findById(userId).populate("role");

    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      referral_code: updatedUser.referral_code,
      email: updatedUser.email,
      phone: updatedUser.phone,
      gender: updatedUser.gender,
      profile_pic: updatedUser.profile_pic || null,
      email_verified: updatedUser.email_verified,
      number_verified: updatedUser.number_verified,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      role: updatedUser.role,
    };

    // Determine actual verification needs
    const verifyEmailFlag = emailChanged && normalizedEmail !== "";
    const verifyPhoneFlag = phoneChanged; // or your existing phone logic

    const requiresVerification = verifyEmailFlag || verifyPhoneFlag;

    let message = "Profile updated successfully";

    if (requiresVerification) {
      if (verifyEmailFlag && verifyPhoneFlag) {
        message = "Email and phone updated. Please verify both using OTPs sent.";
      } else if (verifyEmailFlag) {
        message = "Email updated. OTP sent to new email for verification.";
      } else if (verifyPhoneFlag) {
        message = "OTP sent to phone for verification.";
      }
    } else if (emailChanged && normalizedEmail === "") {
      message = "Email removed successfully.";
    } else if (phoneChanged) {
      message = "Phone updated successfully.";
    }

    return res.status(200).json({
      success: true,
      message,
      user: userResponse,
      requiresVerification: requiresVerification,
      verifyEmail: verifyEmailFlag,
      verifyPhone: verifyPhoneFlag,
    });

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};
exports.verifyPhoneUpdateOtp = async (req, res) => {
  try {
    const { phone_otp, user_id } = req.body;

    if (!phone_otp || !user_id) {
      return res.status(400).json({
        success: false,
        message: "OTP and user ID are required",
      });
    }

    const user = await User.findById(user_id).populate("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (String(user.number_otp) !== String(phone_otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.number_otp = null;
    user.otpExpires = null;
    user.number_verified = true;

    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role?.role || "USER",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      referral_code: user.referral_code,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      profile_pic: user.profile_pic || null,
      email_verified: user.email_verified,
      number_verified: user.number_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
      user: userResponse,
      token,
    });

  } catch (error) {
    console.error("Phone OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying phone OTP",
    });
  }
};


// exports.verifyPhoneUpdateOtp = async (req, res) => {
//   try {
//     const { phone_otp, user_id } = req.body;

//     if (!phone_otp || !user_id) {
//       return res.status(400).json({
//         success: false,
//         message: "OTP and user ID are required",
//       });
//     }

//     // Find user and populate role
//     const user = await User.findById(user_id).populate("role");
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }
//     if (!user.otpExpires || user.otpExpires < new Date()) {
//       return res.status(400).json({
//         success: false,
//         error: true,
//         message: "OTP has expired. Please request a new one.",
//       });
//     }

//     // Verify OTP
//     if (String(user.number_otp) !== String(phone_otp)) {
//       return res.status(400).json({ success: false, message: "Invalid OTP" });
//     }

//     // Update User Status
//     user.number_otp = null;
//     user.otpExpires = null; // ✅ ADD
//     user.number_verified = true;
//     await user.save();

//     // ---------------------------------------------------------
//     // FIX: Extract the role name string (e.g., "USER", "MERCHANT")
//     // The previous code passed the whole object, causing auth middleware to fail
//     // ---------------------------------------------------------
//     const userRole = user.role?.role || "USER";

//     const token = jwt.sign(
//       {
//         userId: user._id,
//         role: user.role?.role || "USER", // ✅ STRING
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // Prepare User Response
//     const userResponse = {
//       _id: user._id,
//       name: user.name,
//       referral_code: user.referral_code,
//       email: user.email,
//       phone: user.phone,
//       gender: user.gender,
//       profile_pic: user.profile_pic || null,
//       email_verified: user.email_verified,
//       number_verified: user.number_verified,
//       created_at: user.created_at,
//       updated_at: user.updated_at,
//       role: user.role, // It's okay to send object to frontend, just not in token
//     };

//     return res.status(200).json({
//       success: true,
//       message: "Phone number verified successfully",
//       user: userResponse,
//       token: token,
//     });

//   } catch (error) {
//     console.error("Phone OTP verification error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error verifying phone OTP",
//       error: error.message,
//     });
//   }
// };
// Updated updateUserRoleById
exports.updateUserRoleById = async (req, res) => {
  try {
    const { user_id, role_id } = req.body;
    const user = await User.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const role = await Role.findById(role_id);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    user.role = role_id;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: { user_id, role_id },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error updating user role",
        error: error.message,
      });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

exports.lookupUser = async (req, res) => {
  try {
    const { user_id, name } = req.query;

    const query = { $or: [] };

    if (user_id) query.$or.push({ _id: user_id });

    if (name) {
      query.$or.push({ name: { $regex: name, $options: "i" } });
      query.$or.push({ email: { $regex: name, $options: "i" } });
      query.$or.push({ phone: { $regex: name, $options: "i" } });
    }

    if (query.$or.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          error: "At least one search parameter is required",
        });
    }

    // Find users matching the query and populate their role
    const users = await User.find(query).select("-password").populate("role");

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, users: [], message: "No users found" });
    }

    // Find the "USER" role ID from the role collection
    const userRole = await Role.findOne({ role: "USER" }).lean();
    if (!userRole) {
      return res.status(500).json({ success: false, error: "USER role not found in role collection" });
    }
    const userRoleId = userRole._id.toString();

    // Filter users to only include those with role "USER"
    const filteredUsers = users.filter(user => user.role && user.role._id.toString() === userRoleId);

    if (filteredUsers.length === 0) {
      return res.status(404).json({
        success: false,
        users: [],
        message: "Selected user(s) not found or not a USER role",
      });
    }

    // Map the filtered users to the desired response format
    const userData = filteredUsers.map((user) => ({
      user_id: user._id.toString(),
      name: user.name,
      email: user.email || "",
      phone_number: user.phone,
      role: user.role,
    }));

    res.json({ success: true, users: userData });
  } catch (error) {
    console.error("Lookup error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.getAllUsersWithUserRole = async (req, res) => {
  try {
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res
        .status(404)
        .json({ success: false, message: "USER role not found" });
    }

    const users = await User.find({ role: userRole._id }).select(
      "-password -email_otp -number_otp"
    );

    return res.status(200).json({
      success: true,
      message: "Users with USER role fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users with USER role",
      error: error.message,
    });
  }
};

// 📌 Function to get all users with role MERCHANT
exports.getAllUsersWithMerchantRole = async (req, res) => {
  try {
    const merchantRole = await Role.findOne({ role: "MERCHANT" });
    if (!merchantRole) {
      return res
        .status(404)
        .json({ success: false, message: "MERCHANT role not found" });
    }

    const merchants = await User.find({ role: merchantRole._id }).select(
      "-password -email_otp -number_otp"
    );

    return res.status(200).json({
      success: true,
      message: "Users with MERCHANT role fetched successfully",
      data: merchants,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users with MERCHANT role",
      error: error.message,
    });
  }
};

exports.getStudentRole = async (req, res) => {
  try {
    const studentRole = await Role.findOne({ role: "STUDENT" });

    if (!studentRole) {
      return res
        .status(404)
        .json({ success: false, message: "STUDENT role not found" });
    }

    res.status(200).json({ success: true, role: studentRole });
  } catch (error) {
    console.error("Error fetching STUDENT role:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.checkUserEmail = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛡️ ID validation
    if (!id) {
      return res.status(200).json({
        success: true,
        hasEmail: false,
      });
    }

    // 1️⃣ Get user with populated role
    const user = await User.findById(id).populate("role");

    if (!user) {
      return res.status(200).json({
        success: true,
        hasEmail: false,
      });
    }

    // 2️⃣ If user already has email
    if (user?.email && user.email.trim() !== "") {
      return res.status(200).json({
        success: true,
        hasEmail: true,
      });
    }

    let extractedEmail = null;

    // ✅ Correct role field from your Role schema
    const roleName = user?.role?.role || null;

    // 3️⃣ Check MERCHANT
    if (roleName === "MERCHANT") {
      const merchant = await Merchant.findOne({ user: user._id });

      if (merchant?.company_email?.trim()) {
        extractedEmail = merchant.company_email.trim();
      }
    }

    // 4️⃣ Check GROCERY_SELLER
    if (roleName === "GROCERY_SELLER") {
      const grocerySeller = await GrocerySeller.findOne({
        user: user._id,
      });

      if (grocerySeller?.shop_email?.trim()) {
        extractedEmail = grocerySeller.shop_email.trim();
      }
    }

    // 5️⃣ If email found → update User safely
    if (extractedEmail) {
      await User.findByIdAndUpdate(
        user._id,
        { email: extractedEmail },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        hasEmail: true,
      });
    }

    // 6️⃣ Final fallback
    return res.status(200).json({
      success: true,
      hasEmail: false,
    });
  } catch (error) {
    console.error("Check User Email Error:", error?.message);

    return res.status(200).json({
      success: true,
      hasEmail: false,
    });
  }
};

exports.getUserByIdForChat = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Step 1: Always start with User model
    const user = await User.findById(id)
      .select("-password -email_otp -__v")
      .populate({
        path: "role",
        select: "role", // we get role.role as string e.g. "MERCHANT"
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const roleName = user.role?.role || "USER"; // fallback to "USER"
    let profile = null;
    let entityType = "User";
    let addressToReturn = null;

    // Step 2: Fetch role-specific profile
    switch (roleName.toUpperCase()) {
      case "MERCHANT":
        profile = await Merchant.findOne({ user_id: user._id })
          .populate({
            path: "address_id",
            select: "address_line_1 address_line_2 city state country pincode address_type",
          })
          .lean();
        if (profile) {
          entityType = "Merchant";
          addressToReturn = profile.address_id;
        }
        break;

      case "SERVICE_PROVIDER":
        profile = await ServiceProvider.findOne({ user_id: user._id })
          .populate({
            path: "address_id",
            select: "address_line_1 address_line_2 city state country pincode address_type",
          })
          .lean();
        if (profile) {
          entityType = "ServiceProvider";
          addressToReturn = profile.address_id;
        }
        break;

      case "STUDENT":
        profile = await Student.findOne({ user_id: user._id }).lean();
        if (profile) {
          entityType = "Student";
          // If Student model has address, you can populate here too
        }
        break;

      case "GROCERY_SELLER":
        profile = await GrocerySeller.findOne({ user_id: user._id }).lean();
        if (profile) {
          entityType = "GrocerySeller";
          // Same — populate address if exists
        }
        break;

      case "ADMIN":
      case "SUB_ADMIN":
      case "USER":
        // No extra profile needed — just user data
        entityType = roleName;
        break;

      default:
        console.warn(`Unknown role for user ${id}: ${roleName}`);
        entityType = "User";
    }

    // Step 3: Fetch addresses if not already from profile
    if (!addressToReturn) {
      const addresses = await Address.find({ user_id: user._id }).lean();

      if (addresses.length > 0) {
        // Prefer company address if exists
        addressToReturn =
          addresses.find((addr) => addr.address_type?.toLowerCase() === "company") ||
          addresses[0]; // fallback to first one
      }
    }

    // Step 4: Clean & format response
    const formattedUser = {
      ...user,
      role: roleName, // just the string "MERCHANT", "STUDENT", etc.
      password: undefined, // ensure removed
      email_otp: undefined,
      __v: undefined,
    };

    // Final response structure
    return res.status(200).json({
      success: true,
      user: formattedUser,
      profile,              // Merchant / ServiceProvider / Student / etc. or null
      address: addressToReturn,
      entityType,
    });
  } catch (error) {
    console.error("Error in getUserByIdForChat:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      error: error.message,
    });
  }
};


exports.searchUserForServiceProvider = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: true, message: "Search query is required" });
    }

    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(500).json({ success: false, error: true, message: "USER role not found" });
    }

    const users = await User.find({
      role: userRole._id,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    }).select("-password -email_otp -number_otp -number_verified -email_verified").lean();

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: true, message: "No user found for the search" });
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "User(s) found",
      data: users,
    });
  } catch (error) {
    console.error("Search user error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Error searching user",
      details: error.message,
    });
  }
};

// ----------------------------------------------------
// USER UTILITIES
// ----------------------------------------------------


exports.getUserNameById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(id).select("name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User name fetched successfully",
      name: user.name,
    });
  } catch (error) {
    console.error("Error fetching user name:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user name",
      error: error.message,
    });
  }
};




//reset password function section

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }

    // ensure OTP is a string
    const otp = passwordResetGenerateOtp().toString(); // e.g., "1234"

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.email_otp = hashedOtp;
    // store as Date object
    user.otpExpires = new Date(Date.now() + 60 * 60 * 1000); // 10 minutes from now
    await user.save();

    await sendPasswordResetOtpEmail(email, otp);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. Verify OTP
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // If the field is missing or expired
    if (!user.otpExpires || Date.now() > user.otpExpires.getTime()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    if (hashedOtp !== user.email_otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP valid → clear it
    user.email_otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ success: true, message: "OTP verified", email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// 3. Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Phone Number Password Reset
exports.resetPasswordPhone = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    // Validate phone number (you can enhance this validation)
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Find user by phone number
    const user = await User.findOne({ phone });

    // If no user found by phone, check if phone exists in any format
    // (you might want to normalize phone numbers in your DB)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this phone number"
      });
    }

    // Check if password meets requirements
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 1 uppercase letter, 1 number, and 1 special character (@$!%*?)"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Update user's last password reset timestamp (optional)
    user.lastPasswordReset = new Date();

    await user.save();

    // Log the password reset event (optional - for security audit)
    res.json({
      success: true,
      message: "Password reset successfully via phone number"
    });

  } catch (error) {
    console.error("Password reset phone error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset"
    });
  }
};


exports.blockUser = async (req, res) => {
  try {
    const { userIdToBlock } = req.body;
    const userId = req.user.id; // logged in user

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: userIdToBlock }
    });

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userIdToUnblock } = req.body;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: userIdToUnblock }
    });

    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Toggle user active status (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;


    // if (!req.user.role === 'ADMIN') return res.status(403).json({ message: 'Access denied' });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getAllAdmins = async (req, res) => {
  try {
    // Step 1: Find the Role document where role === "ADMIN"
    const adminRole = await Role.findOne({ role: "ADMIN" });

    if (!adminRole) {
      return res.status(200).json({
        success: true,
        admins: [], // No ADMIN role defined in the system
      });
    }

    // Step 2: Find all users whose role field matches the _id of the ADMIN role
    const admins = await User.find(
      { role: adminRole._id }, // Match by ObjectId reference
      { name: 1, email: 1, _id: 1 } // Project only needed fields
    ).sort({ name: 1 }); // Optional: sort alphabetically by name

    res.status(200).json({
      success: true,
      admins: admins || [],
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error: error.message,
    });
  }
};

exports.getAllRoleUsers = async (req, res) => {
  try {
    const { name, email, phone, role, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (email) query.email = { $regex: email, $options: "i" };
    if (phone) query.phone = { $regex: phone, $options: "i" };
    if (role) query.role = role; // Expecting Role ObjectId here

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .populate("role")
      .sort({ markAsRead: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update user details including password
exports.updateAllRoleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, roleId } = req.body;

    // Building update data dynamically
    const updateData = {};
    const unsetData = {};

    if (name) updateData.name = name;

    // Best Practice: For unique fields with sparse index, don't set to null.
    // Instead, $unset them if they are empty to avoid duplicate key errors.
    if (phone !== undefined) {
      if (phone === "" || phone === null) {
        unsetData.phone = 1;
      } else {
        const normalizedPhone = phone.trim();
        const duplicateStatus = await checkDuplicates({ phone: normalizedPhone, userId: id });
        if (duplicateStatus.exists) {
          return res.status(400).json({ message: duplicateStatus.message });
        }
        updateData.phone = normalizedPhone;
      }
    }

    if (email !== undefined) {
      if (email === "" || email === null) {
        unsetData.email = 1;
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const duplicateStatus = await checkDuplicates({ email: normalizedEmail, userId: id });
        if (duplicateStatus.exists) {
          return res.status(400).json({ message: duplicateStatus.message });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (roleId) updateData.role = roleId;

    // If password is provided, hash it
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Dynamic query construction
    const updateQuery = { $set: updateData };
    if (Object.keys(unsetData).length > 0) {
      updateQuery.$unset = unsetData;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true, runValidators: true }
    ).populate("role", "role");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    console.error("Update User Error:", error);
    // Return specific error message for unique constraints
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `Update failed: The ${field} is already in use by another account.`,
        error: error.message
      });
    }
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

exports.getMyReferrals = async (req, res) => {
  try {
    const userId = req.user.userId;   // ← from auth middleware (jwt)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed: userId missing in token',
      });
    }
    const referrals = await User.find({ referred_by: userId })
      .select('name phone email createdAt number_verified role')   // ← include role
      .populate('role', 'role')                                    // ← populate role name
      .sort({ createdAt: -1 })
      .lean();

    // Optional: transform data for cleaner frontend consumption
    const formattedReferrals = referrals.map(ref => ({
      _id: ref._id,
      name: ref.name,
      phone: ref.phone,
      email: ref.email,
      createdAt: ref.createdAt,
      number_verified: ref.number_verified,
      role: ref.role?.role || '—',           // fallback if role is missing
    }));

    return res.status(200).json({
      success: true,
      count: formattedReferrals.length,
      data: formattedReferrals,
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching referral list',
      error: error.message,
    });
  }
};



exports.getAuthMe = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT middleware

    const user = await User.findById(userId)
      .populate({
        path: "role",
        select: "_id id role",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("getAuthMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.getUserBasicDetails = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(user_id)
      .select("name email phone")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      },
    });
  } catch (error) {
    console.error("Get user basic details error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



exports.changeToUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(404).json({ message: "USER role not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role: userRole._id } },  // 🔥 use $set
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Role Update Error:", error);
    return res.status(500).json({ message: error.message });
  }
};




exports.getUserDisplayName = async (req, res) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({
        success: false,
        message: "user_id and role are required",
      });
    }

    let name = null;

    // 🔹 MERCHANT
    if (role === "MERCHANT") {
      const merchant = await Merchant.findOne({ user_id }).select("company_name");

      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: "Merchant not found",
        });
      }

      name = merchant.company_name;
    }

    // 🔹 GROCERY SELLER
    else if (role === "GROCERY_SELLER") {
      const grocery = await GrocerySeller.findOne({ user_id }).select("shop_name");

      if (!grocery) {
        return res.status(404).json({
          success: false,
          message: "Grocery seller not found",
        });
      }

      name = grocery.shop_name;
    }

    // 🔹 DEFAULT USER
    else {
      const user = await User.findById(user_id).select("name");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      name = user.name;
    }

    return res.status(200).json({
      success: true,
      name,
    });

  } catch (error) {
    console.error("Get User Display Name Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


exports.deactivateUserAccount = async (req, res) => {
  const { user_id } = req.params;

  try {
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // 1️⃣ Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Deactivate user (NOT DELETE)
    user.isActive = false;
    user.deactivated_at = new Date();
    await user.save();

    // 3️⃣ Remove role-based records (optional but recommended)

    await Student.deleteMany({ user_id });
    await Merchant.deleteMany({ user_id });
    await GrocerySeller.deleteMany({ user_id });

    // 4️⃣ Optionally deactivate subscriptions
    await UserSubscription.updateMany(
      { user_id },
      { status: STATUS.CANCELLED, cancelled_at: new Date() }
    );

    // 5️⃣ Deactivate active features
    await UserActiveFeature.updateMany(
      { user_id },
      { status: STATUS.INACTIVE }
    );

    return res.status(200).json({
      success: true,
      message: "User account deactivated successfully.",
      user_id,
    });

  } catch (error) {
    console.error("Error deactivating user:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.markUserAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { markAsRead: true }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "User marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error marking user as read", error: error.message });
  }
};

exports.sendEntityOtp = async (req, res) => {
  try {
    const { entityId, entityType, contactType, value } = req.body;
    if (!entityId || !entityType || !contactType || !value) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let Model;
    if (entityType === "Merchant") Model = Merchant;
    else if (entityType === "GrocerySeller") Model = GrocerySeller;
    else if (entityType === "Student") Model = Student;
    else return res.status(400).json({ success: false, message: "Invalid entity type" });

    const entity = await Model.findById(entityId);
    if (!entity) return res.status(404).json({ success: false, message: "Entity not found" });

    const otp = contactType === "email" ? Math.floor(1000 + Math.random() * 9000).toString() : generateOtp();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (contactType === "email") {
      entity.email_otp = crypto.createHash("sha256").update(otp).digest("hex");
      entity.otpExpires = expiry;
      await entity.save();
      await sendOtpEmail(value, otp);
    } else {
      entity.number_otp = otp;
      entity.otpExpires = expiry;
      await entity.save();
      const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${value}&text=Your OTP is ${otp}. HUNTSWORLD`;
      await axios.get(smsApiUrl).catch(e => console.error("Entity SMS error:", e.message));
    }

    res.status(200).json({ success: true, message: `OTP sent successfully to ${contactType}` });
  } catch (error) {
    console.error("sendEntityOtp Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP", error: error.message });
  }
};

exports.verifyEntityOtp = async (req, res) => {
  try {
    const { entityId, entityType, contactType, otp } = req.body;
    if (!entityId || !entityType || !contactType || !otp) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let Model;
    if (entityType === "Merchant") Model = Merchant;
    else if (entityType === "GrocerySeller") Model = GrocerySeller;
    else if (entityType === "Student") Model = Student;
    else return res.status(400).json({ success: false, message: "Invalid entity type" });

    const entity = await Model.findById(entityId);
    if (!entity) return res.status(404).json({ success: false, message: "Entity not found" });

    if (!entity.otpExpires || entity.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (contactType === "email") {
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
      if (hashedOtp !== entity.email_otp) return res.status(400).json({ success: false, message: "Invalid OTP" });
      entity.email_verified = true;
      entity.email_otp = undefined;
    } else {
      if (otp !== entity.number_otp) return res.status(400).json({ success: false, message: "Invalid OTP" });
      entity.number_verified = true;
      entity.number_otp = undefined;
    }

    entity.otpExpires = undefined;
    await entity.save();

    // ──────────────────────────────────────────────────────────────────────────
    // SYNC VERIFICATION ACROSS MODELS
    // ──────────────────────────────────────────────────────────────────────────
    try {
      let identifier;
      if (contactType === "email") {
        identifier = entity.company_email || entity.shop_email || entity.college_email;
      } else {
        identifier = entity.company_phone_number || entity.shop_phone_number;
      }

      if (identifier && entity.user_id) {
        await propagateVerificationChange(entity.user_id, identifier, contactType);
      }
    } catch (syncError) {
      console.error("Verification sync failed:", syncError.message);
      // We don't fail the request if sync fails, as the primary entity is already verified
    }

    res.status(200).json({ success: true, message: `${contactType} verified successfully.` });
  } catch (error) {
    console.error("verifyEntityOtp Error:", error);
    res.status(500).json({ success: false, message: "Error verifying OTP", error: error.message });
  }
};