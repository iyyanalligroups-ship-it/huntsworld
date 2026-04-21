const TopListingPayment = require('../models/topListingPaymentModel');
const UserSubscription = require('../models/userSubscriptionPlanModel');
const User = require('../models/userModel');
const SubscriptionPlan = require('../models/subscriptionPlanModel');
const CommonSubscriptionPlan = require('../models/commonSubcriptionPlanModel');
const PaymentHistory = require('../models/paymentHistoryModel');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const subscriptionPlanSendEmail = require('../utils/subscriptionPlanSendEmail');
const { STATUS, PAYMENT_TYPES } = require('../constants/subscriptionConstants');
const {
  getTopListingMonthlyRate,
  getGSTPercentage,
} = require("../utils/topListingPricing");
const Merchant = require("../models/MerchantModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const ProductAttribute = require("../models/productAttributeModel");
const TrustSealRequest = require("../models/trustSealRequestModel");
const TopListingProduct=require("../models/topListingProductModel");


exports.createTopListingOrder = async (req, res) => {
  try {
    const { user_id, days, subscription_id } = req.body;

    // 1️⃣ Validation
    if (!user_id || !days || !subscription_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!Number.isInteger(days) || days < 1) {
      return res.status(400).json({
        success: false,
        message: "days must be a positive integer",
      });
    }

    // 2️⃣ Get dynamic pricing
    const { pricePerMonth } = await getTopListingMonthlyRate();
    const dbGstPercentage = await getGSTPercentage();
    const gstPercentage = req.body.gst_percentage !== undefined ? Number(req.body.gst_percentage) : dbGstPercentage;

    const baseAmount = days * pricePerMonth;
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    // 3️⃣ Validate active subscription
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
    }).populate("subscription_plan_id");

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive subscription",
      });
    }

    if (subscription.subscription_plan_id?.plan_code === "FREE") {
      return res.status(403).json({
        success: false,
        message: "Top Listing purchases are not allowed for Free plan users. Please upgrade to a paid plan first.",
      });
    }

    // 4️⃣ Create Razorpay Order
    const receipt = `tl_${user_id}_${Date.now().toString().slice(-6)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes: {
        purpose: "Top Listing",
        days: days.toString(),
      },
    });

    // 5️⃣ Payment History
    const paymentHistory = await PaymentHistory.create({
      user_id,
      payment_type: PAYMENT_TYPES.TOP_LISTING,
      user_subscription_id: subscription_id,
      razorpay_order_id: razorpayOrder.id,
      receipt,
      amount: Math.round(baseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: "INR",
      status: STATUS.CREATED,
      notes: `Top Listing - ${days} month(s)`,
    });

    // 6️⃣ Success Response
    res.status(201).json({
      success: true,
      message: "Top listing order initialized. Please proceed to payment.",
      pricing: {
        days,
        pricePerMonth,
        baseAmount,
        gstPercentage,
        gstAmount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      },
      order: razorpayOrder,
      paymentHistoryId: paymentHistory._id,
    });
  } catch (error) {
    console.error("Top Listing Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create top listing order",
      error: error.message,
    });
  }
};

exports.verifyTopListingPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature - possible tampering',
      });
    }

    // 3. Find and verify Payment History
    const paymentHistory = await PaymentHistory.findOne({
      razorpay_order_id,
      payment_type: PAYMENT_TYPES.TOP_LISTING,
    });

    if (!paymentHistory) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found or already processed',
      });
    }

    if (paymentHistory.status === STATUS.PAID) {
        return res.status(400).json({
          success: false,
          message: 'This payment has already been verified and processed',
        });
    }

    // 4. Extract days from notes
    // Format: `Top Listing - ${days} month(s)`
    let days = 0;
    if (paymentHistory.notes) {
        const daysMatch = paymentHistory.notes.match(/Top Listing - (\d+)/);
        days = daysMatch ? parseInt(daysMatch[1]) : 0;
    }

    // 5. Create Top Listing Payment record (Only NOW after payment)
    const topListing = new TopListingPayment({
      user_id: paymentHistory.user_id,
      subscription_id: paymentHistory.user_subscription_id,
      days,
      amount: paymentHistory.amount / 100,
      gst_percentage: paymentHistory.gst_percentage,
      gst_amount: paymentHistory.gst_amount / 100,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP, // Activate the record
      starts_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000 * days),
      payment_history_id: paymentHistory._id,
    });

    await topListing.save();

    // 6. Update PaymentHistory
    paymentHistory.razorpay_payment_id = razorpay_payment_id;
    paymentHistory.razorpay_signature = razorpay_signature;
    paymentHistory.status = STATUS.PAID;
    paymentHistory.captured = true;
    paymentHistory.paid_at = new Date();
    paymentHistory.payment_method = 'razorpay';
    paymentHistory.top_listing_payment_id = topListing._id;
    await paymentHistory.save();

    // Invoice email (adapted from your trending points version)
    const user = await User.findById(topListing.user_id).select('name email');
    if (user?.email) {
      const paidAt = topListing.updated_at.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const totalAmount = topListing.amount + (topListing.gst_amount || 0);

      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Top Listing Invoice</title></head>
        <body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f9fafb;">
          <div style="max-width:640px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 30px;text-align:center;color:white;">
              <h1 style="margin:0;font-size:28px;">Top Listing Invoice</h1>
              <p style="margin:8px 0 0;font-size:15px;opacity:0.9;">Payment Successful • Thank You!</p>
            </div>
            <div style="padding:30px;">
              <div style="margin-bottom:30px;">
                <h3 style="margin:0 0 12px;color:#1f2937;font-size:20px;">Payment Summary</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr style="background:#f8fafc;">
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#4b5563;">Customer</td>
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#1f2937;"><strong>${user.name || 'N/A'}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#4b5563;">Duration</td>
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#1f2937;">${topListing.days} Days</td>
                  </tr>
                  <tr style="background:#f8fafc;">
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#4b5563;">Base Amount</td>
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#1f2937;">₹${topListing.amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#4b5563;">GST (${topListing.gst_percentage}%)</td>
                    <td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;color:#1f2937;">₹${(topListing.gst_amount || 0).toFixed(2)}</td>
                  </tr>
                  <tr style="background:#f8fafc;font-weight:bold;">
                    <td style="padding:12px 15px;color:#1f2937;">Total Paid</td>
                    <td style="padding:12px 15px;color:#1f2937;">₹${totalAmount.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              <div style="margin-bottom:30px;">
                <h3 style="margin:0 0 12px;color:#1f2937;font-size:20px;">Validity</h3>
                <p style="margin:6px 0;color:#4b5563;font-size:14px;">
                  Starts: ${topListing.starts_at.toLocaleDateString('en-IN')}<br>
                  Expires: ${topListing.expires_at.toLocaleDateString('en-IN')}
                </p>
              </div>
              <div style="text-align:center;margin:30px 0;">
                <a href="https://yourdomain.com/support" style="display:inline-block;padding:12px 32px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-size:15px;">
                  Contact Support
                </a>
              </div>
            </div>
            <div style="background:#f8fafc;padding:20px;text-align:center;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">
              <p style="margin:4px 0;">Your Company Name • GSTIN: XXXXX</p>
              <p style="margin:4px 0;">support@yourdomain.com • www.yourdomain.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await subscriptionPlanSendEmail(
          user.email,
          'Your Top Listing Invoice',
          invoiceHtml
        );
      } catch (emailErr) {
        console.error('Top listing invoice email failed:', emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Top listing payment verified successfully',
      topListing,
      paymentHistory,
      invoiceSent: !!user?.email,
    });
  } catch (error) {
    console.error('Verify Top Listing Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

exports.cancelTopListing = async (req, res) => {
  try {
    const { top_listing_payment_id } = req.body;

    if (!top_listing_payment_id) {
      return res.status(400).json({ success: false, message: 'Top listing payment ID is required' });
    }

    const payment = await TopListingPayment.findByIdAndDelete(top_listing_payment_id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Top listing payment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Top listing deleted successfully',
    });
  } catch (error) {
    console.error('Cancel Top Listing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel top listing',
      error: error.message,
    });
  }
};

exports.getActiveTopListing = async (req, res) => {
  try {
    const userId = req.user?.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const now = new Date();

    // 1️⃣ Fetch active paid listing
    let active = await TopListingPayment.findOne({
      user_id: userId,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
    });

    // 2️⃣ Auto-expire if expired
    if (active && active.expires_at && active.expires_at <= now) {
      active.status = STATUS.EXPIRED_CAP;
      active.remaining_days = 0;
      await active.save();
      active = null;
    }

    let activeResponse = null;

    // 3️⃣ Calculate + STORE remaining days
    if (active && active.expires_at) {
      const remainingMs = active.expires_at - now;
      const remainingDays = Math.max(
        0,
        Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
      );

      // 🔥 STORE IN DB (only if changed)
      if (active.remaining_days !== remainingDays) {
        active.remaining_days = remainingDays;
        await active.save();
      }

      activeResponse = {
        _id: active._id,
        subscription_id: active.subscription_id,
        totalDays: active.days,
        remainingDays: remainingDays,
        amount: active.amount,
        starts_at: active.starts_at,
        expires_at: active.expires_at,
        status: active.status,
        payment_status: active.payment_status,
      };
    }

    // 4️⃣ Pending listing (unpaid)
    const pending = await TopListingPayment.findOne({
      user_id: userId,
      payment_status: STATUS.CREATED,
      status: STATUS.ACTIVE_CAP,
    }).select("days amount payment_status status subscription_id");

    return res.status(200).json({
      success: true,
      activeTopListing: activeResponse,
      pendingTopListing: pending || null,
    });
  } catch (error) {
    console.error("Get Active Top Listing Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top listing data",
      error: error.message,
    });
  }
};


// ────────────────────────────────────────────────
// Upgrade / Extend Top Listing (add more days to existing active plan)
// ────────────────────────────────────────────────

exports.upgradeTopListing = async (req, res) => {
  try {
    const {
      user_id,
      old_top_listing_payment_id,
      days,
      subscription_id,
    } = req.body;

    // 1️⃣ Validation
    if (!user_id || !days || !subscription_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (user_id, days, subscription_id)",
      });
    }

    if (!Number.isInteger(days) || days < 1) {
      return res.status(400).json({
        success: false,
        message: "days must be a positive integer",
      });
    }

    // 2️⃣ Fetch pricing configs
    const { pricePerMonth } = await getTopListingMonthlyRate(); // per-day price in your case
    const dbGstPercentage = await getGSTPercentage();
    const gstPercentage = req.body.gst_percentage !== undefined ? Number(req.body.gst_percentage) : dbGstPercentage;

    // 3️⃣ NEW PAYMENT (only added days)
    const newBaseAmount = days * pricePerMonth;
    const newGstAmount = (newBaseAmount * gstPercentage) / 100;
    const newTotalAmount = newBaseAmount + newGstAmount;

    // 4️⃣ Validate subscription
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL, STATUS.ACTIVE] },
    }).populate("subscription_plan_id");

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive subscription",
      });
    }

    if (subscription.subscription_plan_id?.plan_code === "FREE") {
      return res.status(403).json({
        success: false,
        message: "Top Listing upgrades are not allowed for Free plan users. Please upgrade to a paid plan first.",
      });
    }

    // 5️⃣ Handle existing active Top Listing
    let totalDays = days;

    if (old_top_listing_payment_id) {
      const oldPayment = await TopListingPayment.findOne({
        _id: old_top_listing_payment_id,
        user_id,
        payment_status: STATUS.PAID,
        status: STATUS.ACTIVE_CAP,
        $or: [
          { expires_at: { $gt: new Date() } },
          { expires_at: null }
        ],
      });

      if (oldPayment) {
        const remainingMs = oldPayment.expires_at - new Date();
        const remainingDays = Math.max(
          0,
          Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
        );

        totalDays += remainingDays;

        await TopListingPayment.findByIdAndUpdate(oldPayment._id, {
          status: STATUS.CANCELLED_CAP,
          updated_at: new Date(),
        });
      }
    }

    // 6️⃣ FINAL ACTIVE PLAN VALUE (total days)
    const finalBaseAmount = totalDays * pricePerMonth;
    const finalGstAmount = (finalBaseAmount * gstPercentage) / 100;

    // 7️⃣ Razorpay order (ONLY new payment)
    const receipt = `tl_up_${user_id}_${Date.now()}`.slice(0, 39);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(newTotalAmount * 100),
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes: {
        purpose: "Top Listing Upgrade",
        days_added: days.toString(),
        total_days: totalDays.toString(),
      },
    });

    // 8️⃣ Payment history (NEW PAYMENT ONLY)
    const paymentHistory = await PaymentHistory.create({
      user_id,
      payment_type: PAYMENT_TYPES.TOP_LISTING,
      user_subscription_id: subscription_id,
      razorpay_order_id: razorpayOrder.id,
      receipt,
      amount: Math.round(newBaseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(newGstAmount * 100),
      total_amount: Math.round(newTotalAmount * 100),
      currency: "INR",
      status: STATUS.CREATED,
      notes: `Top Listing Upgrade: +${days} day(s)`,
    });

    // 9️⃣ Active TopListingPayment (TOTAL PLAN STATE)
    const newTopListing = await TopListingPayment.create({
      user_id,
      subscription_id,
      days: totalDays,
      amount: finalBaseAmount,
      gst_percentage: gstPercentage,
      gst_amount: finalGstAmount,
      razorpay_order_id: razorpayOrder.id,
      payment_status: STATUS.CREATED,
      status: STATUS.ACTIVE_CAP,
      payment_history_id: paymentHistory._id,
    });

    await PaymentHistory.findByIdAndUpdate(paymentHistory._id, {
      top_listing_payment_id: newTopListing._id
    });

    // 🔟 Response
    return res.status(201).json({
      success: true,
      message: "Top listing upgraded successfully",
      pricing: {
        pricePerDay: pricePerMonth,
        daysAdded: days,
        totalDays,
        newBaseAmount,
        newGstAmount: newGstAmount.toFixed(2),
        newTotalAmount: newTotalAmount.toFixed(2),
        finalBaseAmount,
        finalGstAmount: finalGstAmount.toFixed(2),
      },
      order: razorpayOrder,
    });
  } catch (error) {
    console.error("Upgrade Top Listing Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upgrade top listing",
      error: error.message,
    });
  }
};


exports.getTopListingMonthlyRate = async (req, res) => {
  try {
    const plan = await CommonSubscriptionPlan.findOne({
      name: { $regex: /^top listing$/i }, // 👈 case-insensitive match
      category: "service",
      durationType: "per_day",
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Top Listing pricing plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        pricePerMonth: plan.price,
        durationValue: plan.durationValue, // usually 1
        durationType: plan.durationType
      },
    });
  } catch (error) {
    console.error("Top Listing Rate Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Top Listing monthly rate",
      error: error.message,
    });
  }
};

exports.getGSTConfig = async (req, res) => {
  try {
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: { $regex: /^gst$/i }, // 👈 case-insensitive match
      category: "gst",
      durationType: "percentage",
    });

    if (!gstPlan) {
      return res.status(404).json({
        success: false,
        message: "GST configuration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        gstPercentage: gstPlan.price, // 18
        durationType: gstPlan.durationType, // percentage
      },
    });
  } catch (error) {
    console.error("GST Config Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch GST configuration",
      error: error.message,
    });
  }
};




exports.getTopListingSellerProducts = async (req, res) => {
  try {
    const now = new Date();

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Step 1: Get paginated list of unique active top-listing users (latest payment per user)
    const latestPaymentsAgg = await TopListingPayment.aggregate([
      {
        $match: {
          payment_status: STATUS.PAID,
          status: STATUS.ACTIVE_CAP,
          $or: [
            { expires_at: { $gte: now } },
            { expires_at: null }
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user_id",
          latestPayment: { $first: "$$ROOT" },
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "merchants",
          localField: "_id",
          foreignField: "user_id",
          as: "merchant",
        },
      },
      { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "addresses",
          let: { userId: "$_id" },
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
          ],
          as: "companyAddress",
        },
      },
      { $unwind: { path: "$companyAddress", preserveNullAndEmptyArrays: true } },
    ]);

    if (!latestPaymentsAgg.length) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          hasNextPage: false,
          totalPages: 0,
        },
      });
    }

    const response = [];

    for (const doc of latestPaymentsAgg) {
      const userId = doc._id;

      // Get products mapped to this latest payment
      const mappedProducts = await TopListingProduct.find({
        user_id: userId,
        topListingPaymentId: doc.latestPayment._id,
      })
        .select("product_id")
        .lean();

      if (!mappedProducts.length) continue;

      const productIds = mappedProducts.map((p) => p.product_id);

      // Fetch verified products + trending points
      const productsWithTrending = await Product.aggregate([
        {
          $match: {
            _id: { $in: productIds },
            product_verified_by_admin: true,
          },
        },
        {
          $lookup: {
            from: "trendingpoints",
            localField: "_id",
            foreignField: "product_id",
            as: "trendingData",
          },
        },
        {
          $addFields: {
            totalTrendingPoints: {
              $ifNull: [{ $sum: "$trendingData.trending_points" }, 0],
            },
          },
        },
        { $unset: "trendingData" },

        // ────────────────────────────────────────────────
        // SORT: Highest trending points first
        // ────────────────────────────────────────────────
        {
          $sort: {
            totalTrendingPoints: -1,      // Primary: highest score first
            createdAt: -1,                // Secondary: newer products first
            _id: -1,                      // Tertiary tie-breaker (stable order)
          },
        },

        // Limit number of products per seller (safety + performance)
        { $limit: 20 },
      ]);

      if (!productsWithTrending.length) continue;

      // Enrich with attributes
      const enrichedProducts = await Promise.all(
        productsWithTrending.map(async (product) => {
          const attributes = await ProductAttribute.find({
            product_id: product._id,
          })
            .select("attribute_key attribute_value")
            .lean();

          return {
            ...product,
            attributes, // [{ attribute_key, attribute_value }, ...]
          };
        })
      );

      // TrustShield check
      let trustshield = false;
      try {
        const trustSeal = await TrustSealRequest.findOne({
          user_id: userId,
          status: "verified",
          expiryDate: { $gte: now },
        }).lean();
        trustshield = !!trustSeal;
      } catch (err) {
        console.warn(`TrustSeal check failed for user ${userId}:`, err.message);
      }

      response.push({
        user: {
          _id: doc.user?._id,
          name: doc.user?.name,
          email: doc.user?.email,
          phone: doc.user?.phone,
        },
        seller: {
          _id: doc.merchant?._id,
          company_name: doc.merchant?.company_name,
          company_email: doc.merchant?.company_email,
          company_phone_number: doc.merchant?.company_phone_number,
          gst_number: doc.merchant?.gst_number,
          trustshield,
          verified_status: doc.merchant?.verified_status,
        },
        companyAddress: doc.companyAddress || null,
        products: enrichedProducts,
      });
    }

    // Approximate total for pagination
    const totalActiveUsers = await TopListingPayment.distinct("user_id", {
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
      expires_at: { $gte: now },
    }).then((ids) => ids.length);

    const totalPages = Math.ceil(totalActiveUsers / limit);

    return res.status(200).json({
      success: true,
      data: response,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Top Listing Seller Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top listing products",
      error: error.message,
    });
  }
};
