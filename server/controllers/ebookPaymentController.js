const crypto = require("crypto");
const EbookPayment = require("../models/ebookPaymentModel");
const razorpay = require("../config/razorpay");
const Merchant = require("../models/MerchantModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const UserSubscription = require('../models/userSubscriptionPlanModel');
const SubscriptionPlan = require('../models/subscriptionPlanModel');
const CommonSubscriptionPlan = require('../models/commonSubcriptionPlanModel');
const subscriptionPlanSendEmail = require('../utils/subscriptionPlanSendEmail');
const UserActiveFeature = require("../models/UserActiveFeature");
const Points = require("../models/pointsModel");
const PaymentHistory = require("../models/paymentHistoryModel");
const { STATUS, FEATURES, PAYMENT_TYPES } = require("../constants/subscriptionConstants");
// Updated createEbookOrder Controller

exports.createEbookOrder = async (req, res) => {
  try {
    const { user_id, subscription_id, locations: requestedCities } = req.body;

    // 1. Basic validation
    if (!user_id || !subscription_id || !Array.isArray(requestedCities) || requestedCities.length === 0) {
      return res.status(400).json({ error: "Missing required fields or empty cities array" });
    }

    // 2. Validate active subscription
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
    }).populate("subscription_plan_id");

    if (!subscription) {
      return res.status(400).json({ error: "Invalid or inactive subscription" });
    }

    if (subscription.subscription_plan_id?.plan_code === "FREE") {
      return res.status(403).json({
        error: "E-book purchases are not allowed for Free plan users. Please upgrade to a paid plan first.",
      });
    }

    // Normalize cities (trim & lowercase for comparison)
    const normalizedRequestedCities = requestedCities.map(c => c.trim().toLowerCase());

    // 2. Fetch E-Book amount from Points model
    const ebookPoint = await Points.findOne({ point_name: "E_Book" });
    if (!ebookPoint) {
      return res.status(404).json({ error: "E-Book pricing not found in points configuration" });
    }

    const pricePerCity = ebookPoint.point_amount; // e.g., 1200
    const baseAmount = pricePerCity * normalizedRequestedCities.length;

    // 3. Fetch GST percentage
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: 'GST',
      category: 'gst',
      durationType: 'percentage',
    });

    if (!gstPlan && req.body.gst_percentage === undefined) {
      return res.status(404).json({ error: "GST configuration not found" });
    }

    const gstPercentage = req.body.gst_percentage !== undefined ? Number(req.body.gst_percentage) : (gstPlan.price !== undefined ? gstPlan.price : 18); // fallback if not found
    const gstAmount = Math.round((baseAmount * gstPercentage) / 100);
    const totalAmount = baseAmount + gstAmount;

    // 4. Check for duplicate / already purchased cities
    // ── A. Check in paid extra cities (EbookPayment)
    const existingPayments = await EbookPayment.find({
      user_id,
      payment_status: { $in: [STATUS.CREATED, STATUS.AUTHORIZED, STATUS.CAPTURED] },
      status: STATUS.ACTIVE_CAP,
    }).select('extra_cities');

    const alreadyPaidCities = new Set(
      existingPayments.flatMap(p => (p.extra_cities || []).map(c => c.trim().toLowerCase()))
    );

    // ── B. Check in plan free quota (UserActiveFeature - DIGITAL_BOOK)
    const activeDigitalBook = await UserActiveFeature.findOne({
      user_id,
      feature_code: FEATURES.DIGITAL_BOOK,
      status: STATUS.ACTIVE,
      $or: [
        { expires_at: { $gte: new Date() } },
        { expires_at: null }
      ]
    }).select('selected_plan_cities');

    const freeQuotaCities = new Set(
      (activeDigitalBook?.selected_plan_cities || []).map(c => c.trim().toLowerCase())
    );

    // ── Find overlapping cities
    const duplicates = normalizedRequestedCities.filter(city =>
      alreadyPaidCities.has(city) || freeQuotaCities.has(city)
    );

    if (duplicates.length > 0) {
      return res.status(400).json({
        error: "Some cities are already unlocked (either paid or part of your plan quota)",
        duplicateCities: duplicates
      });
    }

    // 5. Create Razorpay order
    const shortUserId = String(user_id).slice(-6);
    const shortTimestamp = Date.now().toString().slice(-6);

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // in paisa
      currency: "INR",
      receipt: `ebk_${shortUserId}_${shortTimestamp}`,
    });

    // 6. Create Payment History entry (status = 'created')
    const paymentHistory = new PaymentHistory({
      user_id,
      payment_type: 'e_book',
      ebook_id: null, // will be updated later in webhook or verifyPayment
      razorpay_order_id: order.id,
      razorpay_payment_id: null,
      razorpay_signature: null,

      amount: Math.round(baseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: order.receipt,

      status: STATUS.CREATED,
      captured: false,
      paid_at: null,
      refunded_at: null,
      payment_method: null,
      notes: `E-Book order for ${requestedCities.length} cities: ${requestedCities.join(', ')}`,
      is_manual_entry: false,
    });

    await paymentHistory.save();

    // 7. Success response
    res.status(200).json({
      success: true,
      order,
      paymentHistoryId: paymentHistory._id,
      pricing: {
        pricePerCity,
        baseAmount,
        gstPercentage,
        gstAmount,
        totalAmount,
      },
      message: "Order created successfully. Please proceed to payment."
    });

  } catch (error) {
    console.error("Create Ebook Order Error:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.message
    });
  }
};

// Updated verifyEbookPayment Controller
exports.verifyEbookPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // 1. Verify Razorpay signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 2. Find Payment History
    const paymentHistory = await PaymentHistory.findOne({
      razorpay_order_id,
      payment_type: 'e_book',
    });

    if (!paymentHistory) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    if (paymentHistory.status === STATUS.PAID) {
      return res.status(400).json({ error: "This payment has already been processed" });
    }

    // 3. Extract metadata from notes
    // Format: `E-Book order for ${requestedCities.length} cities: ${requestedCities.join(', ')}`
    let extra_cities = [];
    if (paymentHistory.notes) {
      const parts = paymentHistory.notes.split('cities: ');
      if (parts.length > 1) {
        extra_cities = parts[1].split(',').map(c => c.trim());
      }
    }

    // 4. Create EbookPayment record (Only NOW after payment)
    const ebookPayment = new EbookPayment({
      user_id: paymentHistory.user_id,
      subscription_id: paymentHistory.user_subscription_id,
      extra_cities,
      amount: paymentHistory.amount / 100,
      gst_percentage: paymentHistory.gst_percentage,
      gst_amount: paymentHistory.gst_amount / 100,
      total_amount: paymentHistory.total_amount / 100,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_status: STATUS.CAPTURED,
      status: STATUS.ACTIVE_CAP,
      payment_history_id: paymentHistory._id,
    });

    await ebookPayment.save();

    // Handle Upgrade Cancellation
    if (ebookPayment.upgraded_from_id) {
      await EbookPayment.findByIdAndUpdate(ebookPayment.upgraded_from_id, {
        status: STATUS.EXPIRED_CAP,
        updatedAt: new Date(),
      });
    }

    // 5. Update PaymentHistory
    paymentHistory.razorpay_payment_id = razorpay_payment_id;
    paymentHistory.razorpay_signature = razorpay_signature;
    paymentHistory.status = STATUS.PAID;
    paymentHistory.captured = true;
    paymentHistory.paid_at = new Date();
    paymentHistory.ebook_id = ebookPayment._id;
    await paymentHistory.save();

    // 6. Fetch user & plan info for invoice
    const user = await User.findById(ebookPayment.user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await UserSubscription.findById(ebookPayment.subscription_id);
    const plan = subscription
      ? await SubscriptionPlan.findById(subscription.subscription_plan_id)
      : null;

    // 5. Prepare invoice data
    const paidAt = ebookPayment.updatedAt.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const totalAmount = ebookPayment.amount + (ebookPayment.gst_amount || 0);

    // 6. Your existing invoice HTML (unchanged)
    const invoiceHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 0; border-radius: 8px;">
  <!-- Header -->
  <div style="background: linear-gradient(90deg, #4f46e5, #7c3aed); padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">E-Book City Access Invoice</h1>
    <p style="color: #e2e8f0; font-size: 14px; margin: 5px 0;">Thank you for your purchase!</p>
  </div>

  <!-- Body -->
  <div style="padding: 20px; background-color: #ffffff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
    <!-- Customer Details -->
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 18px; color: #1f2937; margin: 0 0 10px;">Customer Information</h2>
      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><strong>Name:</strong> ${user.name || 'N/A'}</p>
      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><strong>Email:</strong> ${user.email || 'N/A'}</p>
    </div>

    <!-- Purchase Details -->
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 18px; color: #1f2937; margin: 0 0 10px;">Purchase Details</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="background-color: #f1f5f9;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Plan</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${plan?.plan_name || 'Extra Cities Access'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Extra Cities Purchased</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">
            ${ebookPayment.extra_cities?.length > 0 ? ebookPayment.extra_cities.join(', ') : 'N/A'}
          </td>
        </tr>
        <tr style="background-color: #f1f5f9;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Base Amount</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">₹${Number(ebookPayment.amount || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">GST (${ebookPayment.gst_percentage !== undefined ? ebookPayment.gst_percentage : 18}%)</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">₹${Number(ebookPayment.gst_amount || 0).toFixed(2)}</td>
        </tr>
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Total Paid</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">₹${totalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Payment ID</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${ebookPayment.razorpay_payment_id || 'N/A'}</td>
        </tr>
        <tr style="background-color: #f1f5f9;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Paid On</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${paidAt}</td>
        </tr>
      </table>
    </div>

    <!-- Support -->
    <div style="text-align: center; margin: 20px 0;">
      <a href="mailto:support@huntsworld.com"
         style="display: inline-block; padding: 10px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
        Contact Support
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
      <p>Huntsworld • support@huntsworld.com • www.huntsworld.com</p>
    </div>
  </div>
</div>
`;

    // 7. Send invoice email
    let emailSent = false;
    if (user.email) {
      try {
        await subscriptionPlanSendEmail(user.email, "Your E-Book Cities Invoice", invoiceHtml);
        emailSent = true;
      } catch (emailErr) {
        console.error("Failed to send invoice email:", emailErr);
      }
    }

    // 8. Success response
    res.status(200).json({
      success: true,
      ebookPayment,
      message: emailSent
        ? "Payment verified successfully and invoice sent"
        : user.email
          ? "Payment verified successfully (invoice email failed)"
          : "Payment verified successfully (no email provided)",
    });
  } catch (error) {
    console.error("Verify Ebook Payment Error:", error);
    res.status(500).json({
      error: "Failed to verify payment",
      details: error.message,
    });
  }
};

exports.upgradeEbook = async (req, res) => {
  try {
    const { user_id, subscription_id, old_ebook_payment_id, locations } = req.body;
    if (!user_id || !subscription_id || !locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
    }).populate("subscription_plan_id");
    if (!subscription) {
      return res.status(400).json({ error: 'Invalid or inactive subscription' });
    }
    if (subscription.subscription_plan_id?.plan_code === "FREE") {
      return res.status(403).json({
        error: "E-book upgrades are not allowed for Free plan users. Please upgrade to a paid plan first.",
      });
    }
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: 'GST',
      category: 'gst',
      durationType: 'percentage',
    });
    if (!gstPlan?.price) {
      return res.status(404).json({ error: 'GST plan not configured' });
    }
    const ebookPlan = await CommonSubscriptionPlan.findOne({ category: 'ebook' });
    const pricePerCity = ebookPlan?.price ?? 500;
    const payableCities = locations.filter(city => city !== 'Pondicherry');
    const baseAmount = payableCities.length * pricePerCity;
    const gstPercentage = gstPlan.price !== undefined ? gstPlan.price : 18;
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;
    let allLocations = [...locations];
    if (old_ebook_payment_id) {
      const oldPayment = await EbookPayment.findOne({
        _id: old_ebook_payment_id,
        user_id,
        status: STATUS.ACTIVE_CAP,
        payment_status: STATUS.PAID,
      });
      if (!oldPayment) {
        return res.status(400).json({ error: 'Old ebook payment not found or invalid' });
      }
      allLocations = [...new Set([...(oldPayment.locations || oldPayment.extra_cities || []), ...locations])];
    }
    const shortUserId = String(user_id).slice(-6);
    const shortTimestamp = Date.now().toString().slice(-6);
    const receiptId = `ebk_upg_${shortUserId}_${shortTimestamp}`;

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // in paisa
      currency: 'INR',
      receipt: receiptId,
    });

    // Create Payment History entry (missing in original code)
    const paymentHistory = new PaymentHistory({
      user_id,
      payment_type: PAYMENT_TYPES.E_BOOK,
      user_subscription_id: subscription_id,
      razorpay_order_id: order.id,
      amount: Math.round(baseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: order.receipt,
      status: STATUS.CREATED,
      notes: `E-Book Upgrade for ${locations.length} new cities: ${locations.join(', ')}`,
    });
    await paymentHistory.save();

    const ebookPayment = new EbookPayment({
      user_id,
      subscription_id,
      upgraded_from_id: old_ebook_payment_id || null, // track upgrade
      amount: baseAmount,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      extra_cities: allLocations, // fix: used locations instead of extra_cities
      razorpay_order_id: order.id,
      payment_status: STATUS.CREATED,
      status: STATUS.PENDING_CAP, // use Pending
      purchased_at: new Date(),
    });
    await ebookPayment.save();

    // Link back
    paymentHistory.ebook_id = ebookPayment._id;
    await paymentHistory.save();
    res.json({
      order,
      ebookPayment,
      gst: { percentage: gstPercentage, amount: gstAmount, totalAmount },
    });
  } catch (error) {
    console.error('Upgrade Ebook Error:', error);
    res.status(500).json({ error: 'Failed to upgrade ebook', details: error.message });
  }
};

exports.cancelEbook = async (req, res) => {
  try {
    const { ebook_payment_id } = req.body;
    if (!ebook_payment_id) {
      return res.status(400).json({ error: "Ebook payment ID required" });
    }
    const ebookPayment = await EbookPayment.findByIdAndDelete(ebook_payment_id);
    if (!ebookPayment) {
      return res.status(404).json({ error: "Ebook payment not found" });
    }
    res.status(200).json({ success: true, message: "Ebook payment deleted successfully" });
  } catch (error) {
    console.error("Cancel Ebook Error:", error);
    res.status(500).json({ error: "Failed to cancel ebook" });
  }
};

exports.getActiveEbookPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const merchant = await Merchant.findOne({ user_id: userId }).lean();
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found for this user' });
    }
    const activePayment = await EbookPayment.findOne({
      user_id: merchant._id,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
    }).lean();
    if (!activePayment) {
      return res.status(404).json({ message: 'No active payment found' });
    }
    return res.status(200).json(activePayment);
  } catch (error) {
    console.error('Get Active Ebook Payment Error:', error);
    res.status(500).json({ error: 'Failed to fetch active ebook payment' });
  }
};




exports.getProductBySellerId = async (req, res) => {
  try {
    let sellerId = req.query.user_id || (req.user && req.user.userId);

    if (!sellerId) {
      return res.status(400).json({ success: false, message: "user_id required" });
    }

    // Find ALL active payments for this user
    const payments = await EbookPayment.find({
      user_id: sellerId,
      payment_status: { $in: [STATUS.AUTHORIZED, STATUS.CAPTURED] },
      status: STATUS.ACTIVE_CAP,
      $or: [
        { access_expires_at: { $gte: new Date() } },
        { access_expires_at: null }
      ]
    })
      .select('extra_cities amount total_amount createdAt razorpay_order_id')
      .sort({ createdAt: -1 }) // newest first — optional
      .lean();

    if (!payments.length) {
      return res.status(200).json({
        success: true,
        activePayment: null,
        purchasedCities: [],
        totalPaidCities: 0,
        paymentsCount: 0,
        message: "No active extra city payments found"
      });
    }

    // Combine all cities (unique, preserve original case)
    const allCitiesSet = new Set();
    payments.forEach(payment => {
      (payment.extra_cities || []).forEach(city => {
        if (city && typeof city === 'string') {
          allCitiesSet.add(city.trim());
        }
      });
    });

    const purchasedCities = Array.from(allCitiesSet);

    res.status(200).json({
      success: true,
      purchasedCities,                // ← this is what frontend really needs
      paymentsCount: payments.length,
      totalPaidCities: purchasedCities.length,
      // Optional: return all raw payments if you want details
      payments: payments.map(p => ({
        _id: p._id,
        extra_cities: p.extra_cities,
        createdAt: p.createdAt,
        amount: p.amount,
        total_amount: p.total_amount
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};






exports.getAllActiveEbookPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;
    const total = await EbookPayment.countDocuments({ status: STATUS.ACTIVE_CAP });
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
      });
    }
    if (skip >= total && total > 0) {
      return res.status(200).json({
        success: true,
        message: 'No more active e-book purchases found for this page',
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      });
    }

    // Fetch paginated e-book payments with validation for references
    const ebookPayments = await EbookPayment.find({
      status: STATUS.ACTIVE_CAP,
      user_id: { $exists: true, $ne: null },
      subscription_id: { $exists: true, $ne: null }
    })
      .populate({
        path: 'user_id',
        select: 'name email phone',
        model: User,
        match: { _id: { $exists: true } },
      })
      .populate({
        path: 'subscription_id',
        select: 'subscription_plan_id',
        model: UserSubscription,
        match: { subscription_plan_id: { $exists: true, $ne: null } },
        populate: {
          path: 'subscription_plan_id',
          select: 'plan_name price',
          model: SubscriptionPlan,
          match: { _id: { $exists: true } },
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    if (ebookPayments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active e-book purchases found',
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      });
    }
    const formattedEbookPayments = ebookPayments.map((payment) => {
      if (!payment.user_id) {
        console.warn(`Missing user_id for ebook payment: ${payment._id}`);
      }
      if (!payment.subscription_id || !payment.subscription_id.subscription_plan_id) {
        console.warn(`Missing subscription_id or subscription_plan_id for ebook payment: ${payment._id}`);
      }
      return {
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
        amount: payment.amount || 0,
        locations: payment.locations || [],
        payment_status: payment.payment_status || 'N/A',
        status: payment.status || 'N/A',
        razorpay_order_id: payment.razorpay_order_id || 'N/A',
        razorpay_payment_id: payment.razorpay_payment_id || 'N/A',
        createdAt: payment.createdAt || null,
        paid_at: payment.updatedAt || null,
      };
    });
    res.status(200).json({
      success: true,
      message: 'Active e-book purchases retrieved successfully',
      data: formattedEbookPayments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching active e-book payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};




exports.getDigitalBookStatus = async (req, res) => {
  try {
    // const userId = req.user.userId; // from auth middleware
    let userId = req.query.user_id;
    if (!userId && req.user && req.user.userId) {
      userId = req.user.userId;
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "user_id is required (via query ?user_id=...)"
      });
    }
    // 1. Find the CURRENT ACTIVE subscription (most recent paid one)
    const activeSubscription = await UserSubscription.findOne({
      user_id: userId,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      end_date: { $gte: new Date() }
    })
      .sort({ paid_at: -1 }) // most recent first
      .lean();

    if (!activeSubscription) {
      return res.status(200).json({
        success: true,
        hasDigitalBook: false,
        maxCities: 0,
        remainingCities: 0,
        selectedCities: [],
        homeCity: null,
        activeSubscriptionId: null,
        message: "No active paid subscription found"
      });
    }

    // 2. Find DIGITAL_BOOK feature tied specifically to this subscription
    const feature = await UserActiveFeature.findOne({
      user_id: userId,
      user_subscription_id: activeSubscription._id,
      feature_code: FEATURES.DIGITAL_BOOK,
      status: STATUS.ACTIVE,
      $or: [
        { expires_at: { $gte: new Date() } },
        { expires_at: null }
      ]
    }).lean();

    // 3. Get user's home city
    const merchant = await Merchant.findOne({ user_id: userId })
      .populate('address_id', 'city')
      .select('address_id')
      .lean();

    const homeCity = merchant?.address_id?.city?.trim() || null;

    // 4. Response
    if (!feature) {
      return res.status(200).json({
        success: true,
        hasDigitalBook: false,
        maxCities: 0,
        remainingCities: 0,
        selectedCities: [],
        homeCity,
        activeSubscriptionId: activeSubscription._id.toString(),
        message: "No digital book feature in current subscription"
      });
    }

    res.status(200).json({
      success: true,
      hasDigitalBook: true,
      maxCities: feature.initial_plan_city_count === -1 ? "Unlimited" : (feature.initial_plan_city_count || 0),
      remainingCities: feature.remaining_plan_city_count === -1 ? "Unlimited" : (feature.remaining_plan_city_count || 0),
      selectedCities: feature.selected_plan_cities || [],
      homeCity,
      activeSubscriptionId: activeSubscription._id.toString()
    });
  } catch (error) {
    console.error("getDigitalBookStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching digital book status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * Add free cities from plan quota
 * @route POST /api/digital-book/select-free-cities
 * @body { cities: string[] }
 */

exports.selectFreeCities = async (req, res) => {
  try {
    // ── Flexible userId resolution (supports both merchant + admin calls)
    let userId = req.query.user_id || req.body.user_id;

    // If middleware is active → fallback to authenticated user
    if (!userId && req.user && req.user.userId) {
      userId = req.user.userId;
    }

    // Final validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "user_id is required (via query ?user_id=... or body)"
      });
    }

    const { cities } = req.body;

    // Input validation
    if (!Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "cities must be a non-empty array of strings"
      });
    }

    // 1. Find current active subscription
    const activeSubscription = await UserSubscription.findOne({
      user_id: userId,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      end_date: { $gte: new Date() }
    })
      .sort({ paid_at: -1 })
      .lean();

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: "No active paid subscription found"
      });
    }

    // 2. Normalize cities (lowercase, trim)
    const normalizedCities = cities.map(c => c.trim().toLowerCase()).filter(Boolean);

    if (normalizedCities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid cities provided after normalization"
      });
    }

    // 3. Find feature tied to this specific subscription
    const feature = await UserActiveFeature.findOne({
      user_id: userId,
      user_subscription_id: activeSubscription._id,
      feature_code: FEATURES.DIGITAL_BOOK,
      status: STATUS.ACTIVE,
      $or: [
        { remaining_plan_city_count: { $gte: normalizedCities.length } },
        { remaining_plan_city_count: -1 }
      ],
      $and: [
        {
          $or: [
            { expires_at: { $gte: new Date() } },
            { expires_at: null }
          ]
        }
      ]
    });

    if (!feature) {
      return res.status(403).json({
        success: false,
        message: "No active digital book feature found or insufficient remaining quota"
      });
    }

    // 4. Check for duplicates & exclude already selected cities
    const currentSelected = new Set(
      (feature.selected_plan_cities || []).map(c => c.toLowerCase())
    );

    const toAdd = normalizedCities.filter(city => !currentSelected.has(city));

    if (toAdd.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All provided cities are already selected",
        selectedCities: feature.selected_plan_cities || [],
        addedCount: 0,
        remainingCities: feature.remaining_plan_city_count
      });
    }

    // 5. Final quota check (after duplicate removal)
    if (feature.remaining_plan_city_count !== -1 && toAdd.length > feature.remaining_plan_city_count) {
      return res.status(403).json({
        success: false,
        message: `Not enough remaining quota. You can add up to ${feature.remaining_plan_city_count} more cities`
      });
    }

    // 6. Update the document
    const updateQuery = {
      $push: { selected_plan_cities: { $each: toAdd } }
    };

    if (feature.remaining_plan_city_count !== -1) {
      updateQuery.$inc = { remaining_plan_city_count: -toAdd.length };
    }

    await UserActiveFeature.updateOne(
      { _id: feature._id },
      updateQuery
    );

    // 7. Response
    const updatedSelected = [...(feature.selected_plan_cities || []), ...toAdd];

    res.status(200).json({
      success: true,
      message: `Successfully added ${toAdd.length} new cities`,
      selectedCities: updatedSelected,
      addedCount: toAdd.length,
      remainingCities: feature.remaining_plan_city_count === -1 ? "Unlimited" : (feature.remaining_plan_city_count - toAdd.length)
    });

  } catch (error) {
    console.error("selectFreeCities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while selecting free cities",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



exports.getAllAtOnceActiveEbookPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    // ── Aggregation pipeline ────────────────────────────────────────
    const pipeline = [
      // Only active payments
      { $match: { status: STATUS.ACTIVE_CAP } },

      // Group by user_id → combine cities + get latest info
      {
        $group: {
          _id: "$user_id",
          user_id: { $first: "$user_id" },
          total_cities: { $addToSet: { $arrayElemAt: ["$extra_cities", 0] } }, // or $push if you allow duplicates
          latest_createdAt: { $max: "$createdAt" },
          latest_payment_id: { $max: "$_id" }, // optional — for reference
          // You can add more fields if needed (e.g. latest razorpay_payment_id, total_amount spent, etc.)
        }
      },

      // Lookup user data
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Optional: sort by most recent activity
      { $sort: { latest_createdAt: -1 } },

      // Pagination
      { $skip: skip },
      { $limit: limit },

      // Final projection
      {
        $project: {
          _id: "$latest_payment_id", // or use some composite id — or omit
          user: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            phone: "$user.phone",
          },
          locations: "$total_cities", // renamed to match frontend expectation
          createdAt: "$latest_createdAt", // keep for sorting/reference (but we'll remove from UI)
          // Add other summary fields if useful:
          // total_amount_spent: { $sum: "$amount" } — but requires different grouping
        },
      },
    ];

    const aggregated = await EbookPayment.aggregate(pipeline);

    // Count total unique users with active payments
    const countPipeline = [
      { $match: { status: STATUS.ACTIVE_CAP } },
      { $group: { _id: "$user_id" } },
      { $count: "total" },
    ];
    const countResult = await EbookPayment.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    if (aggregated.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active e-book purchases found",
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      });
    }

    // Format (keep similar shape to what frontend expects)
    const formatted = aggregated.map((doc) => ({
      _id: doc._id || doc.user?._id, // fallback
      user: doc.user || { name: "N/A", email: "N/A", phone: "N/A" },
      locations: doc.locations || [],
      createdAt: doc.createdAt,
      // subscription / amount etc. omitted since we're summarizing per user now
    }));

    res.status(200).json({
      success: true,
      message: "Active e-book purchases (grouped by user) retrieved",
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in getAllActiveEbookPayments:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
