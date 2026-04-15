const PaymentAccount = require("../models/paymentAccountModel");
const StudentPaymentHistory = require("../models/studentPaymentHistoryModel");
const Admin = require("../models/adminModel");
const TrustSealRequest = require("../models/trustSealRequestModel");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/userModel");
/**
 * Create Payment Account
 */
exports.createPaymentAccount = async (req, res) => {
  try {
    const { userId, ...rest } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const payload = {
      ...rest,
      user_id: userId, // ✅ map correctly
    };

    const account = await PaymentAccount.create(payload);

    res.status(201).json({
      success: true,
      message: "Payment account created successfully",
      data: account,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * Get All Payment Accounts of a User
 */
exports.getUserPaymentAccounts = async (req, res) => {
  try {
    const { userId } = req.params;

    const accounts = await PaymentAccount.find({ user_id: userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Single Payment Account
 */
exports.getPaymentAccountById = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Payment account not found",
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update Payment Account
 */
exports.updatePaymentAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Payment account not found",
      });
    }

    res.json({
      success: true,
      message: "Payment account updated successfully",
      data: account,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete Payment Account
 */
exports.deletePaymentAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndDelete(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Payment account not found",
      });
    }

    res.json({
      success: true,
      message: "Payment account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin Verify Payment Account
 */
exports.adminVerifyPaymentAccount = async (req, res) => {
  try {
    const adminId = req.admin._id; // from admin auth middleware

    const account = await PaymentAccount.findByIdAndUpdate(
      req.params.id,
      {
        is_verified_by_admin: true,
        verified_by: adminId,
        verified_at: new Date(),
      },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Payment account not found",
      });
    }

    res.json({
      success: true,
      message: "Payment account verified successfully",
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Set Active Payment Account (Only One Active Per User)
 */
exports.setActivePaymentAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Payment account not found",
      });
    }

    // Deactivate others
    await PaymentAccount.updateMany(
      { user_id: account.user_id },
      { is_active: false }
    );

    account.is_active = true;
    await account.save();

    res.json({
      success: true,
      message: "Payment account set as active",
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.sendCouponEmail = async (req, res) => {
  try {
    const { userId, couponCode, description } = req.body;

    if (!userId || !couponCode || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findById(userId).select("email name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const subject = "🎁 You've Received a Coupon Code!";

    const htmlContent = `
      <div style="max-width:600px;margin:20px auto;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;border:1px solid #e1e4e8;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color:#0c1f4d;padding:30px 20px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:1px;">HuntsWorld</h1>
          <p style="color:#a5b4fc;margin:10px 0 0 0;font-size:16px;">Your Rewards Are Here!</p>
        </div>
        
        <div style="padding:40px 30px;background-color:#ffffff;">
          <h2 style="color:#1f2937;margin-top:0;font-size:22px;">🎉 Congratulations, ${user.name || "User"}!</h2>
          <p style="color:#4b5563;line-height:1.6;font-size:16px;">
            We are excited to inform you that your redemption request has been processed. Your exclusive coupon code is ready to use!
          </p>
          
          <div style="background-color:#f8fafc;border:2px dashed #0c1f4d;padding:25px;border-radius:12px;text-align:center;margin:30px 0;">
            <p style="margin:0 0 10px 0;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Your Coupon Code</p>
            <h2 style="margin:0;color:#0c1f4d;font-size:36px;letter-spacing:2px;font-family:monospace;">${couponCode}</h2>
          </div>
          
          <div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:15px;margin-bottom:30px;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#1e40af;font-size:15px;"><strong>Note:</strong> ${description}</p>
          </div>

          <p style="color:#4b5563;line-height:1.6;font-size:15px;">
            To use your coupon, simply enter the code during checkout on the merchant's platform. If you have any questions or need assistance, our support team is always here to help.
          </p>
          
          <div style="text-align:center;margin-top:40px;">
            <a href="https://huntsworld.com" style="background-color:#0c1f4d;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">Visit HuntsWorld</a>
          </div>
        </div>
        
        <div style="background-color:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e1e4e8;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            &copy; ${new Date().getFullYear()} HuntsWorld. All rights reserved.
          </p>
          <div style="margin-top:10px;">
            <a href="#" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 10px;">Privacy Policy</a>
            <a href="#" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 10px;">Contact Support</a>
          </div>
        </div>
      </div>
    `;

    const sent = await sendEmail(
      user.email,
      subject,
      `Your coupon code is ${couponCode}`,
      htmlContent
    );

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "Email sending failed",
      });
    }

    res.json({
      success: true,
      message: "Coupon email sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.checkStudentPaymentAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const count = await PaymentAccount.countDocuments({
      user_id: userId,
    });

    // ❌ No payment account exists
    if (count === 0) {
      return res.status(403).json({
        success: false,
        message:
          "Please add at least one payment method (Bank / UPI) before requesting coupon redemption",
      });
    }

    // ✅ At least one payment method exists
    res.json({
      success: true,
      message: "Payment account exists",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Record Student Payment (By Admin)
 */
exports.recordStudentPayment = async (req, res) => {
  try {
    const { student_id, request_id, amount, transaction_id, payment_method, notes } = req.body;
    const { userId, role } = req.user;

    if (!student_id || !request_id || !amount || !transaction_id || !payment_method) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if user is an admin or sub-admin
    if (role !== "ADMIN" && role !== "SUB_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can record payments",
      });
    }

    const payment = await StudentPaymentHistory.create({
      student_id,
      request_id,
      amount,
      transaction_id,
      payment_method,
      notes,
      paid_by: userId,
    });

    // Update the TrustSealRequest to mark as student paid
    await TrustSealRequest.findByIdAndUpdate(request_id, {
      is_student_paid: true,
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Student Payment History (Admin View - All Records)
 */
exports.getStudentPaymentHistory = async (req, res) => {
  try {
    const history = await StudentPaymentHistory.find()
      .populate("student_id", "name email phone profile_pic")
      .populate("request_id", "amount status")
      .sort({ createdAt: -1 });

    const validHistory = history.filter((item) => item.student_id);

    res.json({
      success: true,
      data: validHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Specific Student Payment History (User View - Own Records)
 */
exports.getStudentPaymentHistoryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const totalCount = await StudentPaymentHistory.countDocuments({ student_id: userId });

    const history = await StudentPaymentHistory.find({ student_id: userId })
      .populate("student_id", "name email phone profile_pic")
      .populate("request_id", "amount status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: history,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
