const BannerPayment = require("../models/bannerPaymentModel");
const Banner = require("../models/bannerModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const CommonSubscriptionPlan = require('../models/commonSubcriptionPlanModel');
const Address = require("../models/addressModel");
const subscriptionPlanSendEmail = require('../utils/subscriptionPlanSendEmail');
const SubscriptionPlanElement = require("../models/subscriptionPlanElementModel");
const UserActiveFeature = require("../models/UserActiveFeature");
const AdminBanner = require("../models/adminBanner");
const PaymentHistory = require('../models/paymentHistoryModel');
const Merchant = require("../models/MerchantModel");
const Role = require("../models/roleModel");
const GrocerySeller = require("../models/grocerySellerModel");
const BaseMemberType = require("../models/baseMemberTypeModel");
const { STATUS, PAYMENT_TYPES, FEATURES } = require("../constants/subscriptionConstants");



exports.createBannerOrder = async (req, res) => {
  try {
    const { user_id, days, amount, subscription_id } = req.body;

    /* ------------------------------------------------
       1️⃣ Basic Validation
    ------------------------------------------------ */
    if (!user_id || !days || !subscription_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (typeof days !== "number" || days <= 0 || !Number.isInteger(days)) {
      return res.status(400).json({
        success: false,
        message: "Days must be a positive integer",
      });
    }

    /* ------------------------------------------------
       2️⃣ Fetch Dynamic Banner Price From DB
    ------------------------------------------------ */
    const bannerPlan = await CommonSubscriptionPlan.findOne({
      name: { $regex: /^Banner Ads$/i },
      category: { $regex: /^ads$/i },
      durationType: { $regex: /^per_day$/i },
    }).select("price");

    if (!bannerPlan) {
      return res.status(500).json({
        success: false,
        message: "Banner Ads pricing configuration not found",
      });
    }

    const perDayPrice = Number(bannerPlan.price);

    if (isNaN(perDayPrice) || perDayPrice <= 0) {
      return res.status(500).json({
        success: false,
        message: "Invalid banner pricing configuration",
      });
    }

    const expectedAmount = days * perDayPrice;

    /* ------------------------------------------------
       3️⃣ Validate Frontend Amount (Security Check)
    ------------------------------------------------ */
    if (Number(amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount calculation",
        expected: expectedAmount,
        received: amount,
      });
    }

    /* ------------------------------------------------
       4️⃣ Check Active Subscription
    ------------------------------------------------ */
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
    }).populate("subscription_plan_id");

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "No active paid subscription found",
      });
    }

    if (subscription.subscription_plan_id?.plan_code === "FREE") {
      return res.status(403).json({
        success: false,
        message: "Banner Ad purchases are not allowed for Free plan users. Please upgrade to a paid plan first.",
      });
    }

    /* ------------------------------------------------
       5️⃣ Fetch GST
    ------------------------------------------------ */
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: "GST",
      category: "gst",
      durationType: "percentage",
    });

    if (!gstPlan && req.body.gst_percentage === undefined) {
      return res.status(500).json({
        success: false,
        message: "GST configuration not found",
      });
    }

    const gstPercentage = req.body.gst_percentage !== undefined ? Number(req.body.gst_percentage) : (gstPlan?.price ?? 0);

    const baseAmount = expectedAmount;
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    /* ------------------------------------------------
       6️⃣ Calculate Banner Expiry
    ------------------------------------------------ */
    const createdAt = new Date();
    const end_date = new Date(createdAt);
    end_date.setDate(createdAt.getDate() + days);

    /* ------------------------------------------------
       7️⃣ Create Razorpay Order
    ------------------------------------------------ */
    const receipt = `BNR_${user_id.slice(-6)}_${Date.now().toString().slice(-6)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes: {
        purpose: "Banner Advertisement",
        user_id: user_id.toString(),
        days: days.toString(),
      },
    });

    /* ------------------------------------------------
       8️⃣ Create PaymentHistory
    ------------------------------------------------ */
    const paymentHistory = new PaymentHistory({
      user_id,
      payment_type: PAYMENT_TYPES.BANNER,
      banner_id: null,
      user_subscription_id: subscription_id,
      razorpay_order_id: razorpayOrder.id,
      receipt,
      amount: Math.round(baseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: "INR",
      status: STATUS.CREATED,
      notes: `Banner advertisement for ${days} days`,
    });

    await paymentHistory.save();

    /* ------------------------------------------------
       9️⃣ Success Response
    ------------------------------------------------ */
    return res.status(201).json({
      success: true,
      message: "Banner advertisement order initialized. Please proceed to payment.",
      order: razorpayOrder,
      paymentHistoryId: paymentHistory._id,
      gst: {
        percentage: gstPercentage,
        amount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      },
    });

  } catch (error) {
    console.error("Create Banner Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create banner order",
      error: error.message,
    });
  }
};

exports.verifyBannerPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    /* ------------------------------------------------
       1️⃣ Validate Input
    ------------------------------------------------ */
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    /* ------------------------------------------------
       2️⃣ Verify Razorpay Signature
    ------------------------------------------------ */
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    /* ------------------------------------------------
       3️⃣ Find Payment History
    ------------------------------------------------ */
    const paymentHistory = await PaymentHistory.findOne({
      razorpay_order_id,
      payment_type: PAYMENT_TYPES.BANNER,
    });
    
    if (!paymentHistory) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this order",
      });
    }

    if (paymentHistory.status === STATUS.PAID) {
      return res.status(400).json({
        success: false,
        message: "This payment has already been verified and processed",
      });
    }

    /* ------------------------------------------------
       4️⃣ Create Banner Payment Record (Only after verified payment)
    ------------------------------------------------ */
    // Extract days from paymentHistory.notes (e.g., "Banner advertisement for 30 days")
    const notesStr = paymentHistory.notes || "";
    const daysMatch = notesStr.match(/for (\d+) days/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 30; // fallback if regex fails

    const createdAt = new Date();
    const end_date = new Date(createdAt);
    end_date.setDate(createdAt.getDate() + days);

    const bannerPayment = new BannerPayment({
      user_id: paymentHistory.user_id,
      subscription_id: paymentHistory.user_subscription_id,
      days,
      amount: paymentHistory.amount / 100,
      total_amount_paid: paymentHistory.amount / 100,
      gst_percentage: paymentHistory.gst_percentage,
      gst_amount: paymentHistory.gst_amount / 100,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
      end_date,
      payment_history_id: paymentHistory._id,
    });
    
    await bannerPayment.save();

    /* ------------------------------------------------
       5️⃣ Update Payment History Status
    ------------------------------------------------ */
    paymentHistory.razorpay_payment_id = razorpay_payment_id;
    paymentHistory.razorpay_signature = razorpay_signature;
    paymentHistory.status = STATUS.PAID;
    paymentHistory.captured = true;
    paymentHistory.paid_at = new Date();
    paymentHistory.payment_method = "razorpay";
    paymentHistory.banner_id = bannerPayment._id;
    await paymentHistory.save();

    /* ------------------------------------------------
       6️⃣ Prepare Invoice Data (NO DISCOUNT LOGIC)
    ------------------------------------------------ */
    const baseAmount = bannerPayment.amount;
    const gstAmount = (baseAmount * bannerPayment.gst_percentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    const user = await User.findById(bannerPayment.user_id).select("name email");

    const subscription = await UserSubscription.findById(
      bannerPayment.subscription_id
    );

    const plan = subscription
      ? await SubscriptionPlan.findById(subscription.subscription_plan_id)
        .select("plan_name")
      : null;

    const formatDate = (date) => {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const paidAt = formatDate(new Date());
    const endDate = formatDate(bannerPayment.end_date);

    /* ------------------------------------------------
       7️⃣ YOUR ORIGINAL FULL HTML TEMPLATE
    ------------------------------------------------ */
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Banner Advertisement Invoice</title>
      </head>
      <body style="margin:0; padding:0; font-family:'Helvetica Neue',Arial,sans-serif; background:#f9fafb;">
        <div style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

          <div style="background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding:40px 30px; text-align:center; color:white;">
            <h1 style="margin:0; font-size:28px;">Banner Advertisement Invoice</h1>
            <p style="margin:8px 0 0; font-size:15px; opacity:0.9;">Payment Successful • Thank You!</p>
          </div>

          <div style="padding:30px;">
            <h3 style="color:#1f2937;">Payment Summary</h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:12px;">Merchant</td>
                <td style="padding:12px;"><strong>${user?.name || "N/A"}</strong></td>
              </tr>
              <tr>
                <td style="padding:12px;">Plan</td>
                <td style="padding:12px;">${plan?.plan_name || "Banner Advertisement"}</td>
              </tr>
              <tr>
                <td style="padding:12px;">Duration</td>
                <td style="padding:12px;">${bannerPayment.days} days</td>
              </tr>
              <tr>
                <td style="padding:12px;">Base Amount</td>
                <td style="padding:12px;">₹${baseAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:12px;">GST (${bannerPayment.gst_percentage}%)</td>
                <td style="padding:12px;">₹${gstAmount.toFixed(2)}</td>
              </tr>
              <tr style="font-weight:bold;">
                <td style="padding:12px;">Total Paid</td>
                <td style="padding:12px;">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </table>

            <h3 style="margin-top:30px; color:#1f2937;">Transaction Details</h3>
            <p>
              <strong>Payment ID:</strong> ${razorpay_payment_id}<br>
              <strong>Order ID:</strong> ${razorpay_order_id}<br>
              <strong>Paid on:</strong> ${paidAt}<br>
              <strong>Valid until:</strong> ${endDate}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    /* ------------------------------------------------
       8️⃣ Send Email
    ------------------------------------------------ */
    if (user?.email) {
      try {
        await subscriptionPlanSendEmail(
          user.email,
          "Your Banner Advertisement Invoice",
          invoiceHtml
        );
      } catch (emailErr) {
        console.error("Invoice email failed:", emailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Banner payment verified successfully",
      bannerPayment,
    });

  } catch (error) {
    console.error("Banner Payment Verification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const {
      user_id,
      subscription_id,
      banner_payment_id,
      title,
      company_name,
      banner_image,
      rectangle_logo
    } = req.body;

    const now = new Date();

    /* ------------------------------------------------
       1️⃣ Basic Validations
    ------------------------------------------------ */
    if (!user_id || !subscription_id || !title || !company_name) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user_id format" });
    }

    /* ------------------------------------------------
       2️⃣ Check Active Subscription
    ------------------------------------------------ */
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
      captured: true,
      $or: [
        { end_date: { $gt: now } },
        { end_date: null }
      ],
    }).populate("subscription_plan_id");

    if (!subscription) {
      return res.status(400).json({
        message: "No active subscription found",
      });
    }

    if (banner_image && subscription.subscription_plan_id?.plan_code === "FREE") {
      return res.status(403).json({
        message: "Paid banner ads are not available for users on the FREE plan.",
      });
    }

    /* =====================================================
       🔴 PAID BANNER VALIDATION (ONLY FOR banner_image)
    ===================================================== */
    if (banner_image && banner_image.trim() !== "") {

      // 1️⃣ Check if banner feature exists
      const bannerFeature = await UserActiveFeature.findOne({
        user_id: user_id,
        user_subscription_id: subscription._id,
        feature_code: FEATURES.BANNER || "BANNER", // Fallback to string if not in constants yet
        status: STATUS.ACTIVE,
      }).lean();

      let hasFeatureAccess = false;

      if (
        bannerFeature &&
        (bannerFeature.expires_at === null || new Date(bannerFeature.expires_at) > now)
      ) {
        hasFeatureAccess = true;
      }

      // 2️⃣ If no feature → check BannerPayment
      if (!hasFeatureAccess) {

        const bannerPayment = await BannerPayment.findOne({
          user_id: user_id,
          subscription_id: subscription._id,
          payment_status: STATUS.PAID,
          status: STATUS.ACTIVE_CAP,
          $or: [
            { end_date: { $gt: now } },
            { end_date: null }
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        if (!bannerPayment) {
          return res.status(400).json({
            message:
              "Paid banner requires active banner feature or valid banner payment",
          });
        }
      }
    }

    /* ------------------------------------------------
       3️⃣ Validate banner_payment_id (if passed)
    ------------------------------------------------ */
    if (banner_payment_id) {
      if (!mongoose.Types.ObjectId.isValid(banner_payment_id)) {
        return res.status(400).json({ message: "Invalid banner_payment_id format" });
      }

      const bannerPayment = await BannerPayment.findById(banner_payment_id);

      if (
        !bannerPayment ||
        bannerPayment.payment_status !== STATUS.PAID ||
        bannerPayment.status !== STATUS.ACTIVE_CAP ||
        (bannerPayment.end_date !== null && bannerPayment.end_date <= now)
      ) {
        return res.status(400).json({
          message: "Invalid or expired banner payment",
        });
      }
    }

    /* ------------------------------------------------
       4️⃣ Check Existing Banner
    ------------------------------------------------ */
    const existingBanner = await Banner.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
    });

    if (existingBanner) {
      const updatePayload = {
        subscription_id,
        banner_payment_id,
        title,
        company_name,
        updatedAt: new Date(),
        markAsRead: false, // 🔥 MERCHANT UPDATE: Reset unread status for Admin
      };

      // 🔥 RESET APPROVAL IF NEW IMAGE UPLOADED (Merchant side update)
      if (banner_image && banner_image !== existingBanner.banner_image) {
        updatePayload.banner_image = banner_image;
        updatePayload.banner_image_approved = false;
      }
      if (rectangle_logo && rectangle_logo !== existingBanner.rectangle_logo) {
        updatePayload.rectangle_logo = rectangle_logo;
        updatePayload.rectangle_logo_approved = false;
      }

      const updatedBanner = await Banner.findOneAndUpdate(
        { user_id: new mongoose.Types.ObjectId(user_id) },
        updatePayload,
        { new: true }
      ).populate("user_id subscription_id banner_payment_id");

      // 🔥 Real-time notification update
      const adminHelpers = req.app.get("adminSocketHelpers");
      if (adminHelpers && adminHelpers.updateUnreadCount) {
        await adminHelpers.updateUnreadCount();
      }

      return res.status(200).json({
        message: "Banner updated successfully",
        banner: updatedBanner,
      });
    }

    /* ------------------------------------------------
       5️⃣ Create New Banner
    ------------------------------------------------ */
    const banner = new Banner({
      user_id: new mongoose.Types.ObjectId(user_id),
      subscription_id,
      banner_payment_id,
      title,
      company_name,
      banner_image: banner_image || "",
      rectangle_logo: rectangle_logo || "",
    });

    await banner.save();

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    return res.status(201).json({
      message: "Banner created successfully",
      banner,
    });

  } catch (error) {
    console.error("Create Banner Error:", error);
    return res.status(500).json({
      message: "Failed to create or update banner",
      error: error.message,
    });
  }
};



exports.getActiveBanner = async (req, res) => {
  try {
    const { user_id } = req.params;

    // 1️⃣ Get active banner
    let bannerPayment = await BannerPayment.findOne({
      user_id,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
    });

    // 2️⃣ Get banner details
    let banner = await Banner.findOne({
      user_id: user_id,
    });

    if (!banner && !bannerPayment) {
      return res.status(404).json({
        success: false,
        message: "No active banner or banner payment found",
      });
    }


    // 3️⃣ Get total amount spent on banners (all paid records)
    const totalSpentAgg = await BannerPayment.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(user_id), // Cast to ObjectId for aggregation
          payment_status: STATUS.PAID,
        },
      },


      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
          totalGST: { $sum: "$gst_amount" },
        },
      },
    ]);

    const totalSpent = totalSpentAgg[0]?.totalSpent || 0;
    const totalGST = totalSpentAgg[0]?.totalGST || 0;

    // 4️⃣ Get purchase history
    const purchaseHistory = await BannerPayment.find({
      user_id,
      payment_status: STATUS.PAID,
    })
      .sort({ createdAt: -1 })
      .select("days amount gst_amount total_amount_paid end_date createdAt");

    res.status(200).json({
      success: true,
      banner,
      bannerPayment,
      tracking: {
        totalSpent,
        totalGST,
        totalWithGST: totalSpent + totalGST,
      },
      purchaseHistory,
    });

  } catch (error) {
    console.error("Get Active Banner Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active banner",
      error: error.message,
    });
  }
};


exports.cancelBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete associated Banner record(s) if any
    await Banner.deleteMany({ banner_payment_id: id });

    // 2. Delete the BannerPayment record
    const deletedPayment = await BannerPayment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({
        success: false,
        message: "Banner payment not found or already deleted"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner plan and associated ad record permanently deleted"
    });

  } catch (error) {
    console.error("Cancel Banner Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete banner plan",
      error: error.message,
    });
  }
};

exports.upgradeBanner = async (req, res) => {
  try {
    const { user_id, old_banner_payment_id, days, amount, subscription_id } = req.body;

    /* ------------------------------------------------
       1️⃣ Basic Validation
    ------------------------------------------------ */
    if (!user_id || !old_banner_payment_id || !days || !subscription_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (typeof days !== "number" || days <= 0 || !Number.isInteger(days)) {
      return res.status(400).json({
        success: false,
        message: "Days must be a positive integer",
      });
    }

    /* ------------------------------------------------
       2️⃣ Fetch Per-Day Rate (Dynamic)
    ------------------------------------------------ */
    const plan = await CommonSubscriptionPlan.findOne({
      name: "Banner Ads",
      category: "ads",
      durationType: "per_day",
    });

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Banner Ads pricing not configured",
      });
    }

    const perDayRate = Number(plan.price);

    if (isNaN(perDayRate) || perDayRate <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid per-day banner pricing",
      });
    }

    const expectedAmount = days * perDayRate;

    if (Number(amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount calculation",
        expected: expectedAmount,
        received: amount,
      });
    }

    /* ------------------------------------------------
       3️⃣ Fetch Old Banner Payment
    ------------------------------------------------ */
    const oldBannerPayment = await BannerPayment.findById(old_banner_payment_id);

    if (
      !oldBannerPayment ||
      oldBannerPayment.status !== STATUS.ACTIVE_CAP ||
      oldBannerPayment.payment_status !== STATUS.PAID
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive banner payment",
      });
    }

    /* ------------------------------------------------
       4️⃣ Calculate Remaining Days
    ------------------------------------------------ */
    const now = new Date();
    let remainingDays = 0;

    if (oldBannerPayment.end_date) {
      const oldEndDate = new Date(oldBannerPayment.end_date);
      remainingDays = Math.max(
        0,
        Math.ceil((oldEndDate - now) / (1000 * 60 * 60 * 24))
      );
    }

    const totalDays = remainingDays + days;

    /* ------------------------------------------------
       5️⃣ Validate Subscription
    ------------------------------------------------ */
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
    });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "No active subscription found",
      });
    }

    /* ------------------------------------------------
       6️⃣ GST Calculation
    ------------------------------------------------ */
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: "GST",
      category: "gst",
      durationType: "percentage",
    });

    const gstPercentage = gstPlan?.price ?? 0;

    const gstAmount = (expectedAmount * gstPercentage) / 100;
    const totalPayable = expectedAmount + gstAmount;

    /* ------------------------------------------------
       7️⃣ Create Razorpay Order
    ------------------------------------------------ */
    const receipt = `BNR_UP_${user_id.slice(-6)}_${Date.now()
      .toString()
      .slice(-6)}`;

    const order = await razorpay.orders.create({
      amount: Math.round(totalPayable * 100),
      currency: "INR",
      receipt,
      payment_capture: 1,
    });

    /* ------------------------------------------------
       8️⃣ Calculate New End Date
    ------------------------------------------------ */
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + totalDays);

    /* ------------------------------------------------
       9️⃣ Calculate Cumulative Amount
    ------------------------------------------------ */
    const previousTotalPaid =
      oldBannerPayment.total_amount_paid || oldBannerPayment.amount;

    const cumulativeTotalPaid = previousTotalPaid + expectedAmount;

    /* ------------------------------------------------
       🔟 Create New Banner Payment Record
    ------------------------------------------------ */
    const newBannerPayment = new BannerPayment({
      user_id,
      subscription_id,
      days: totalDays,
      amount: expectedAmount, // only new charge
      total_amount_paid: cumulativeTotalPaid,
      purchase_type: "upgrade",
      previous_banner_payment_id: oldBannerPayment._id,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      razorpay_order_id: order.id,
      payment_status: STATUS.CREATED,
      status: STATUS.ACTIVE_CAP,
      end_date: newEndDate,
    });

    await newBannerPayment.save();

    /* ------------------------------------------------
       1️⃣1️⃣ Expire Old Banner
    ------------------------------------------------ */
    oldBannerPayment.status = STATUS.EXPIRED_CAP;
    oldBannerPayment.updated_at = new Date();
    await oldBannerPayment.save();

    /* ------------------------------------------------
       1️⃣2️⃣ Response
    ------------------------------------------------ */
    return res.status(201).json({
      success: true,
      message: "Banner upgrade initiated successfully",
      order,
      newBannerPayment,
      summary: {
        remainingDays,
        newDaysAdded: days,
        totalDays,
        perDayRate,
        chargedAmount: expectedAmount,
        cumulativeTotalPaid,
      },
    });

  } catch (error) {
    console.error("Upgrade Banner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upgrade banner",
      error: error.message,
    });
  }
};


exports.checkUserSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;

    const subscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE_CAP] },
      end_date: { $gte: new Date() },
    });

    res.status(200).json({ hasSubscription: !!subscription });
  } catch (error) {
    console.error("Check Subscription Error:", error);
    res
      .status(500)
      .json({ message: "Failed to check subscription", error: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { title, company_name, banner_image, circle_logo, rectangle_logo, banner_payment_id, subscription_id } =
      req.body;
    const banner_id = req.params.id;

    const updateData = {
      title,
      company_name,
      banner_image,
      circle_logo,
      rectangle_logo,
      updated_at: new Date(),
    };

    if (banner_payment_id) {
      updateData.banner_payment_id = banner_payment_id;
    }
    if (subscription_id) {
      updateData.subscription_id = subscription_id;
    }

    const banner = await Banner.findByIdAndUpdate(
      banner_id,
      {
        ...updateData,
        markAsRead: false, // 🔥 RESET: Admin needs to know something changed
      },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ message: "Banner updated successfully", banner });
  } catch (error) {
    console.error("Update Banner Error:", error);
    res
      .status(500)
      .json({ message: "Failed to update banner", error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { banner_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(banner_id)) {
      return res.status(400).json({ message: "Invalid Banner ID format" });
    }

    const banner = await Banner.findByIdAndDelete(banner_id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({
      message: "Banner deleted successfully",
      deletedBannerId: banner._id,
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete banner", error: error.message });
  }
};

exports.getAllActiveBannerPayments = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    // Count total active banner payments with payment_status = STATUS.PAID and status = STATUS.ACTIVE_CAP
    const total = await BannerPayment.countDocuments({
      status: STATUS.ACTIVE_CAP,
      payment_status: STATUS.PAID
    });

    // Fetch active banner payments with pagination and populate user and subscription details
    const payments = await BannerPayment.find({
      status: STATUS.ACTIVE_CAP,
      payment_status: STATUS.PAID
    })
      .populate({
        path: 'user_id',
        select: 'name email phone',
        model: User,
      })
      .populate({
        path: 'subscription_id',
        select: 'subscription_plan_id',
        populate: {
          path: 'subscription_plan_id',
          select: 'plan_name price',
          model: SubscriptionPlan,
        },
      })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active banner purchases found',
        data: [],
        page,
        pages: 0,
      });
    }

    // Format response to match frontend expectations
    const formattedBannerPayments = payments.map((payment) => ({
      _id: payment._id,
      user: {
        _id: payment.user_id?._id || null,
        name: payment.user_id?.name || 'N/A',
        email: payment.user_id?.email || 'N/A',
        phone: payment.user_id?.phone || 'N/A',
      },
      subscription: {
        _id: payment.subscription_id?._id || null,
        plan_name: payment.subscription_id?.subscription_plan_id?.plan_name || 'N/A',
        price: payment.subscription_id?.subscription_plan_id?.price || 0,
      },
      days: payment.days,
      amount: payment.amount,
      total_amount_paid: payment.total_amount_paid,
      gst_percentage: payment.gst_percentage,
      gst_amount: payment.gst_amount,
      payment_status: payment.payment_status,
      status: payment.status,
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      created_at: payment.created_at,
      paid_at: payment.updated_at,
    }));

    res.status(200).json({
      success: true,
      message: 'Active banner payments retrieved successfully',
      data: formattedBannerPayments,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active banner payments',
      error: error.message,
    });
  }
};

exports.checkUserSubscriptionAndPlan = async (req, res) => {
  try {
    const { user_id } = req.params;


    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    // Get latest active subscription
    const subscription = await UserSubscription.findOne({
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      captured: true,
    })
      .sort({ paid_at: -1 })
      .populate("subscription_plan_id");
    const hasSubscription = !!subscription;
    const subscriptionId = subscription?._id || null;
    const isRoyal = subscription?.subscription_plan_id?.plan_code === "ROYAL";

    // 🔥 Special Condition for Grocery Sellers (Base Members)
    let canShowContact = hasSubscription && subscription?.subscription_plan_id?.plan_code !== "FREE";

    if (!canShowContact) {
      const userDoc = await User.findById(user_id).populate("role");
      if (userDoc?.role?.role === "GROCERY_SELLER") {
        const grocerySeller = await GrocerySeller.findOne({ user_id });
        if (grocerySeller?.member_type) {
          const memberType = await BaseMemberType.findById(grocerySeller.member_type);
          if (memberType?.has_full_access === true) {
            canShowContact = true;
          }
        }
      }
    }

    const now = new Date();
    let features = {};

    // Get all possible features (master list)
    const allFeatures = await SubscriptionPlanElement.find({ is_active: true });

    if (hasSubscription) {
      // Get currently active features for this user
      const activeFeatures = await UserActiveFeature.find({
        user_id,
        status: STATUS.ACTIVE,
        $or: [
          { expires_at: { $gt: now } },
          { expires_at: null },
        ],
      }).select("feature_code");

      const activeCodesSet = new Set(activeFeatures.map(f => f.feature_code));

      // Build features object dynamically
      allFeatures.forEach((feature) => {
        // Use existing feature_code if present, otherwise generate from feature_name
        let code = feature.feature_code;

        if (!code && feature.feature_name) {
          code = feature.feature_name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, "")   // remove special characters
            .replace(/\s+/g, "_");         // spaces → underscore
        }

        if (code) {
          features[code.toLowerCase()] = activeCodesSet.has(code);
        }
      });
    } else {
      // No active subscription → all features false
      allFeatures.forEach((feature) => {
        let code = feature.feature_code;

        if (!code && feature.feature_name) {
          code = feature.feature_name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, "")
            .replace(/\s+/g, "_");
        }

        if (code) {
          features[code.toLowerCase()] = false;
        }
      });
    }

    return res.status(200).json({
      success: true,
      hasSubscription: canShowContact,
      actualSubscription: hasSubscription,
      subscriptionId,
      isRoyal,
      planCode: subscription?.subscription_plan_id?.plan_code || "FREE",
      features,
    });

  } catch (error) {
    console.error("Check Subscription Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserBannerDetails = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();
    // ──────────────────────────────────────────────
    // 1️⃣ MERCHANT BANNERS (approved + image)
    // ──────────────────────────────────────────────
    const merchantBanners = await Banner.find({
      approved_by_admin: true,
      banner_image: { $nin: [null, "", undefined] },
    })
      .select("title company_name banner_image rectangle_logo createdAt _id")
      .lean();

    // ──────────────────────────────────────────────
    // 2️⃣ ADMIN NORMAL ACTIVE BANNERS
    // ──────────────────────────────────────────────
    const adminBanners = await AdminBanner.find({
      type: "NORMAL",
      is_active: true,
      image_urls: { $exists: true, $ne: [] },
    })
      .select("title image_urls createdAt _id")
      .lean();

    // ──────────────────────────────────────────────
    // 3️⃣ NORMALIZE DATA SHAPE
    // ──────────────────────────────────────────────
    const normalizedMerchant = merchantBanners.map((banner) => ({
      _id: banner._id.toString(),
      title: banner.title || "Banner",
      company_name: banner.company_name || "Company",
      banner_image: banner.banner_image,
      rectangle_logo: banner.rectangle_logo || null,
      createdAt: banner.createdAt,
      source: "MERCHANT",
    }));

    const normalizedAdmin = adminBanners.map((banner) => ({
      _id: banner._id.toString(),
      title: banner.title || "Banner",
      company_name: "Admin",
      banner_image: banner.image_urls, // 👈 use first image
      rectangle_logo: null,
      createdAt: banner.createdAt,
      source: "ADMIN",
    }));

    // ──────────────────────────────────────────────
    // 4️⃣ MERGE + SORT
    // ──────────────────────────────────────────────
    const mergedBanners = [...normalizedMerchant, ...normalizedAdmin].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // ──────────────────────────────────────────────
    // 5️⃣ PAGINATION
    // ──────────────────────────────────────────────
    const total = mergedBanners.length;
    const paginatedBanners = mergedBanners.slice(
      skip,
      skip + limitNum
    );

    // ──────────────────────────────────────────────
    // 6️⃣ RESPONSE
    // ──────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      hasMore: skip + limitNum < total,
      banners: paginatedBanners,
    });
  } catch (error) {
    console.error("Error in getUserBannerDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getBannerExpireDate = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const now = new Date();

    /* ------------------------------------------------
       1️⃣ Get latest ACTIVE PAID subscription
    ------------------------------------------------ */
    const subscription = await UserSubscription.findOne({
      user_id: userObjectId,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      captured: true,
      end_date: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!subscription) {
      // 🔴 No active subscription → clean up banner image
      await Banner.updateOne(
        { user_id: userObjectId },
        { $set: { banner_image: null } }
      );

      return res.json({
        success: true,
        expires_at: null,
        message: "No active paid subscription found",
      });
    }

    /* ------------------------------------------------
       2️⃣ Check UserActiveFeature (BANNER)
    ------------------------------------------------ */
    const bannerFeature = await UserActiveFeature.findOne({
      user_id: userObjectId,
      user_subscription_id: subscription._id,
      feature_code: FEATURES.BANNER || "BANNER",
      status: STATUS.ACTIVE,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (bannerFeature) {
      // CASE 1 → expires_at exists
      if (bannerFeature.expires_at) {
        const featureEndDate = new Date(bannerFeature.expires_at);

        if (featureEndDate <= now) {
          // 🔴 Expired → Update status in DB and clear image
          await UserActiveFeature.updateOne(
            { _id: bannerFeature._id },
            { status: STATUS.EXPIRED }
          );
          await Banner.updateOne(
            { user_id: userObjectId },
            { $set: { banner_image: null } }
          );

          return res.json({
            success: true,
            expires_at: null,
            source: "BANNER_FEATURE_EXPIRED",
          });
        }

        return res.json({
          success: true,
          expires_at: featureEndDate.toISOString(),
          source: "BANNER_FEATURE",
        });
      } else {
        // CASE 2 → expires_at is null (follows subscription)
        return res.json({
          success: true,
          expires_at: subscription.end_date ? new Date(subscription.end_date).toISOString() : null,
          source: "BANNER_FEATURE_FOLLOWS_SUBSCRIPTION",
        });
      }
    }


    /* ------------------------------------------------
       3️⃣ If expires_at null OR no feature record
           → Check BannerPayment
    ------------------------------------------------ */
    const bannerPayment = await BannerPayment.findOne({
      user_id: userObjectId,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (bannerPayment) {
      const paymentEndDate = bannerPayment.end_date
        ? new Date(bannerPayment.end_date)
        : null;

      if (paymentEndDate && paymentEndDate <= now) {

        // 🔴 Expired → Update status in DB
        await BannerPayment.updateOne(
          { _id: bannerPayment._id },
          { status: STATUS.EXPIRED_CAP }
        );

        // 🔴 Null out the banner_image on the Banner document for this user
        await Banner.updateOne(
          { user_id: userObjectId },
          { $set: { banner_image: null } }
        );

        return res.json({
          success: true,
          expires_at: null,
          source: "BANNER_PAYMENT_EXPIRED",
        });
      }

      if (paymentEndDate && paymentEndDate > now) {
        return res.json({
          success: true,
          expires_at: paymentEndDate.toISOString(),
          source: "BANNER_PAYMENT",
        });
      }
    }


    /* ------------------------------------------------
       4️⃣ Nothing found
    ------------------------------------------------ */
    // 🔴 No active banner found at all → clean up banner image just in case
    await Banner.updateOne(
      { user_id: userObjectId },
      { $set: { banner_image: null } }
    );

    return res.json({
      success: true,
      expires_at: null,
      message: "No active banner feature or payment found",
    });

  } catch (error) {
    console.error("getBannerExpireDate error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getActiveDefaultBanner = async (req, res) => {
  try {
    const banner = await AdminBanner.findOne({
      type: "DEFAULT",
      is_active: true,
      image_urls: { $exists: true, $ne: [] },
    })
      .select("title image_urls createdAt _id")
      .sort({ createdAt: -1 }) // safety: latest active default
      .lean();

    if (!banner) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No active default banner found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: banner._id.toString(),
        title: banner.title || "Default Banner",
        image_urls: banner.image_urls,
        createdAt: banner.createdAt,
      },
    });
  } catch (error) {
    console.error("getActiveDefaultBanner error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.getBannerImageByLocation = async (req, res) => {
  try {
    // ────────────────────────────────────────────────
    // A. Fetch VALID MERCHANT banners (existing logic)
    // ────────────────────────────────────────────────
    const merchantBannersRaw = await Banner.find({
      banner_image: { $nin: [null, "", undefined] },
      banner_image_approved: true,
    }).lean();

    const validMerchantBanners = [];

    for (const banner of merchantBannersRaw) {
      const bannerUserId = banner.user_id;
      if (!bannerUserId) continue;

      const userExists = await User.findById(bannerUserId)
        .select("_id")
        .lean();
      if (!userExists) continue;

      const merchantExists = await Merchant.findOne({
        user_id: bannerUserId,
        verified_status: true,
      })
        .select("_id verified_status")
        .lean();
      if (!merchantExists) continue;

      let isValidSubscription = false;

      // OPTION A: UserSubscription
      if (banner.subscription_id) {
        const subscription = await UserSubscription.findOne({
          _id: banner.subscription_id,
          user_id: bannerUserId,
          status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
          captured: true,
        })
          .sort({ createdAt: -1 })
          .lean();
        if (subscription) isValidSubscription = true;
      }

      // OPTION B: BannerPayment
      if (!isValidSubscription && banner.banner_payment_id) {
        const bannerPayment = await BannerPayment.findOne({
          _id: banner.banner_payment_id,
          user_id: bannerUserId,
          payment_status: STATUS.PAID,
          status: STATUS.ACTIVE_CAP,
        })
          .sort({ createdAt: -1 })
          .lean();
        if (bannerPayment) isValidSubscription = true;
      }

      // OPTION C: UserActiveFeature
      if (!isValidSubscription && banner.subscription_id) {
        const activeFeature = await UserActiveFeature.findOne({
          user_id: bannerUserId,
          user_subscription_id: banner.subscription_id,
          feature_code: FEATURES.BANNER,
          status: STATUS.ACTIVE,
        })
          .sort({ createdAt: -1 })
          .lean();
        if (activeFeature) isValidSubscription = true;
      }

      if (!isValidSubscription) continue;

      validMerchantBanners.push({
        _id: banner._id,
        title: banner.title,
        company_name: banner.company_name || "",
        banner_image: banner.banner_image,   // single string
        link: banner.link || "",             // if you added link to Banner model too
        createdAt: banner.createdAt,
        source: "merchant",
      });
    }

    // ────────────────────────────────────────────────
    // B. Fetch ACTIVE ADMIN banners
    // ────────────────────────────────────────────────
    const adminBannersRaw = await AdminBanner.find({
      is_active: true,
      image_urls: { $nin: [null, [], undefined], $not: { $size: 0 } },
    })
      .sort({ createdAt: -1 })
      .lean();

    const validAdminBanners = adminBannersRaw.map((banner) => ({
      _id: banner._id,
      title: banner.title,
      company_name: "Admin Banner",          // or leave empty ""
      banner_image: banner.image_urls[0] || "",   // take first image
      link: banner.link || "",
      createdAt: banner.createdAt,
      source: "admin",
      // Optional: image_urls: banner.image_urls  ← if frontend should handle carousel
    }));

    // ────────────────────────────────────────────────
    // C. Combine & sort (newest first)
    // ────────────────────────────────────────────────
    const allBanners = [...validMerchantBanners, ...validAdminBanners].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      total: allBanners.length,
      data: allBanners,
    });
  } catch (error) {
    console.error("getBannerImage Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.getRectangleBannersByLocation = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const loginUserId = new mongoose.Types.ObjectId(user_id);

    // ==========================================================
    // 1️⃣ Validate Login User
    // ==========================================================
    const loginUser = await User.findById(loginUserId)
      .select("_id")
      .lean();

    if (!loginUser) {
      return res.status(404).json({
        success: false,
        message: "Login user not found",
      });
    }

    // ==========================================================
    // 2️⃣ Get Login User City
    // ==========================================================
    const loginAddress = await Address.findOne({
      user_id: loginUserId,
      address_type: { $in: ["personal", "company"] },
    }).lean();

    if (!loginAddress?.city) {
      return res.status(404).json({
        success: false,
        message: "Login user city not found",
      });
    }

    const loginCity = loginAddress.city;

    // ==========================================================
    // 3️⃣ Get All Approved Rectangle Banners
    // ==========================================================
    const banners = await Banner.find({
      rectangle_logo: { $nin: [null, "", undefined] },
      rectangle_logo_approved: true,
    }).lean();

    if (!banners.length) {
      return res.status(200).json({
        success: true,
        total: 0,
        data: [],
      });
    }

    const validBanners = [];

    for (const banner of banners) {
      const bannerUserId = banner.user_id;

      // ----------------------------------------------------------
      // 4️⃣ Check User Exists
      // ----------------------------------------------------------
      const userExists = await User.findById(bannerUserId)
        .select("_id")
        .lean();
      if (!userExists) continue;

      // ----------------------------------------------------------
      // 5️⃣ Check Merchant Exists AND Verified
      // ----------------------------------------------------------
      const merchantExists = await Merchant.findOne({
        user_id: bannerUserId,
        verified_status: true,   // ✅ NEW CONDITION
      })
        .select("_id verified_status company_name") // ✅ Fetch company_name from Merchant too
        .lean();

      if (!merchantExists) continue;

      // ----------------------------------------------------------
      // 6️⃣ Check Banner Owner City
      // ----------------------------------------------------------
      const bannerUserAddress = await Address.findOne({
        user_id: bannerUserId,
        address_type: { $in: ["personal", "company"] },
      }).lean();

      if (!bannerUserAddress?.city) continue;

      if (bannerUserAddress.city !== loginCity) continue;

      // ----------------------------------------------------------
      // 7️⃣ Push Valid Banner
      // ----------------------------------------------------------
      validBanners.push({
        _id: banner._id,
        title: banner.title,
        company_name: merchantExists.company_name || banner.company_name, // ✅ Prioritize Merchant's real company name
        rectangle_logo: banner.rectangle_logo,
        city: bannerUserAddress.city,
        createdAt: banner.createdAt,
      });
    }

    return res.status(200).json({
      success: true,
      total: validBanners.length,
      city: loginCity,
      data: validBanners,
    });

  } catch (error) {
    console.error("getRectangleBannersByLocation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// --------------------------------------------------
// Date Filter
// --------------------------------------------------
function getDateFilter(filter) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  switch (filter?.toLowerCase()) {
    case "today":
      return { created_at: { $gte: startOfToday } };

    case "yesterday":
      return {
        created_at: {
          $gte: new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000),
          $lt: startOfToday,
        },
      };

    case "week":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return { created_at: { $gte: startOfWeek } };

    case "month":
      return {
        created_at: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      };

    default:
      return {};
  }
}

// --------------------------------------------------
// Common Lookup
// --------------------------------------------------
function getCommonLookupStages() {
  return [
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "merchants",
        localField: "user_id",
        foreignField: "user_id",
        as: "merchantInfo",
      },
    },
    { $unwind: { path: "$merchantInfo", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "addresses",
        let: { userId: "$user_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user_id", "$$userId"] },
                  { $eq: ["$address_type", "company"] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "companyAddress",
      },
    },
    { $unwind: { path: "$companyAddress", preserveNullAndEmptyArrays: true } },
  ];
}

// --------------------------------------------------
// Toggle Approval
// --------------------------------------------------
exports.toggleBannerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!type || !["free", "paid"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'free' or 'paid'",
      });
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    let field, imageField;

    if (type === "paid") {
      field = "banner_image_approved";
      imageField = "banner_image";
    } else {
      field = "rectangle_logo_approved";
      imageField = "rectangle_logo";
    }

    if (!banner[imageField]) {
      return res.status(400).json({
        success: false,
        message: "Image not found for approval toggle",
      });
    }

    banner[field] = !banner[field];
    banner.updated_at = new Date();
    await banner.save();

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    return res.status(200).json({
      success: true,
      message: banner[field]
        ? "Approved successfully"
        : "Unverified successfully",
      data: {
        _id: banner._id,
        banner_image_approved: banner.banner_image_approved,
        rectangle_logo_approved: banner.rectangle_logo_approved,
      },
    });
  } catch (error) {
    console.error("Toggle error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// --------------------------------------------------
// 🔥 IMAGE LEVEL PIPELINE BUILDER
// --------------------------------------------------
function buildImageLevelPipeline(dateFilter, approvedStatus) {
  return [
    { $match: dateFilter },
    ...getCommonLookupStages(),

    // Split into 2 image records
    {
      $project: {
        base: {
          _id: "$_id",
          company_name: "$company_name",
          markAsRead: "$markAsRead",
          merchant: {
            company_logo: "$merchantInfo.company_logo",
            company_name: "$merchantInfo.company_name",
          },
          user: {
            name: "$userInfo.name",
            email: "$userInfo.email",
            phone: "$userInfo.phone",
          },
          address: {
            city: "$companyAddress.city",
            state: "$companyAddress.state",
            pincode: "$companyAddress.pincode",
          },
        },
        images: [
          {
            imageType: "premium",
            imageUrl: "$banner_image",
            approved: "$banner_image_approved",
          },
          {
            imageType: "rectangle",
            imageUrl: "$rectangle_logo",
            approved: "$rectangle_logo_approved",
          },
        ],
      },
    },
    { $unwind: "$images" },

    // Image-level filtering
    {
      $match: {
        "images.imageUrl": { $nin: [null, ""] },
        ...(approvedStatus === true
          ? { "images.approved": true }
          : { "images.approved": { $ne: true } }),
      },
    },

    {
      $project: {
        _id: "$base._id",
        originalBannerId: "$base._id",
        markAsRead: "$base.markAsRead",
        company_name: "$base.company_name",
        merchant: "$base.merchant",
        user: "$base.user",
        address: "$base.address",
        imageType: "$images.imageType",
        imageUrl: "$images.imageUrl",
        approved: "$images.approved",
      },
    },
  ];
}

// --------------------------------------------------
// Pending Banners
// --------------------------------------------------
exports.getPendingBannersForAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 10, filter = "all" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const dateFilter = getDateFilter(filter);

    const pipeline = [
      ...buildImageLevelPipeline(dateFilter, false),
      { $sort: { _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const countPipeline = buildImageLevelPipeline(dateFilter, false);

    const [banners, totalResults] = await Promise.all([
      Banner.aggregate(pipeline),
      Banner.aggregate([...countPipeline, { $count: "total" }]),
    ]);

    const total = totalResults[0]?.total || 0;

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      data: banners,
    });
  } catch (error) {
    console.error("Pending banners error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending banners",
    });
  }
};

// --------------------------------------------------
// Approved Banners
// --------------------------------------------------
exports.getApprovedBannersForAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 10, filter = "all" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const dateFilter = getDateFilter(filter);

    const pipeline = [
      ...buildImageLevelPipeline(dateFilter, true),
      { $sort: { _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const countPipeline = buildImageLevelPipeline(dateFilter, true);

    const [banners, totalResults] = await Promise.all([
      Banner.aggregate(pipeline),
      Banner.aggregate([...countPipeline, { $count: "total" }]),
    ]);

    const total = totalResults[0]?.total || 0;

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      data: banners,
    });
  } catch (error) {
    console.error("Approved banners error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approved banners",
    });
  }
};

// --------------------------------------------------
// Mark Banner as Read
// --------------------------------------------------
exports.markBannerAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(
      id,
      { markAsRead: true },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // 🔥 Real-time notification update
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers && adminHelpers.updateUnreadCount) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "Banner marked as read", data: banner });
  } catch (error) {
    console.error("markBannerAsRead error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
