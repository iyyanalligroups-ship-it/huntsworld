
const TrendingPointsPayment = require('../models/userTrendingPointPaymentModel');
const UserSubscription = require('../models/userSubscriptionPlanModel');
const razorpay = require('../config/razorpay');
const User = require('../models/userModel');
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const CommonSubscriptionPlan = require("../models/commonSubcriptionPlanModel")
const subscriptionPlanSendEmail = require('../utils/subscriptionPlanSendEmail');
const Role = require("../models/roleModel");
const crypto = require('crypto');
const PaymentHistory = require("../models/paymentHistoryModel");
const { STATUS, PAYMENT_TYPES } = require("../constants/subscriptionConstants");
// Updated createTrendingPointsOrder Controller
exports.createTrendingPointsOrder = async (req, res) => {
  try {
    const { user_id, points, amount, subscription_id } = req.body;

    // 1. Basic input validation
    if (!user_id || !points || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing: { user_id, points, amount, subscription_id: !!subscription_id },
      });
    }

    // 2. Validate amount calculation (points × rate)
    const pointRate = await getPointRate(); // Your rate fetching logic

    if (
      typeof amount !== 'number' ||
      amount <= 0 ||
      Math.abs(amount - points * pointRate) > 0.01
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid amount. Must be exactly points × ₹${pointRate} per point`,
        expected: points * pointRate,
        received: amount,
      });
    }

    if (typeof points !== 'number' || points <= 0 || !Number.isInteger(points)) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a positive integer',
      });
    }

    // 3. Optional: Validate subscription if provided
    let subscription = null;
    if (subscription_id) {
      subscription = await UserSubscription.findOne({
        _id: subscription_id,
        user_id,
        status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
      }).populate("subscription_plan_id");

      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive subscription provided',
        });
      }

      if (subscription.subscription_plan_id?.plan_code === "FREE") {
        return res.status(403).json({
          success: false,
          message: "Trending points purchases are not allowed for Free plan users. Please upgrade to a paid plan first.",
        });
      }
    }

    // 4. GST Calculation
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: 'GST',
      category: 'gst',
      durationType: 'percentage',
    });

    if (!gstPlan && req.body.gst_percentage === undefined) {
      return res.status(500).json({
        success: false,
        message: 'GST configuration not found in system',
      });
    }

    const gstPercentage = req.body.gst_percentage !== undefined ? Number(req.body.gst_percentage) : (gstPlan.price !== undefined ? gstPlan.price : 18); // fallback
    const baseAmount = Number(amount);
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    // 5. Create Razorpay order
    const receipt = `tp_${user_id.slice(-6)}_${Date.now().toString().slice(-6)}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: 'INR',
      receipt,
      payment_capture: 1,
      notes: {
        purpose: 'Trending Points Purchase',
        user_id: user_id.toString(),
        points: points.toString(),
      },
    });

    // 6. ★★★ Create Payment History Record ★★★
    const paymentHistory = new PaymentHistory({
      user_id,
      payment_type: PAYMENT_TYPES.TRENDING_POINT,

      trending_point_payment_id: null, // will be updated after saving main record
      user_subscription_id: subscription_id || null,

      razorpay_order_id: razorpayOrder.id,
      receipt,

      amount: Math.round(baseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: 'INR',

      status: STATUS.CREATED, // → will become "paid" on successful verification
      notes: `Purchase of ${points} trending points (₹${totalAmount.toFixed(2)} incl. GST)`,
    });

    await paymentHistory.save();

    // 7. Success response
    res.status(201).json({
      success: true,
      message: 'Trending points order initialized. Please proceed to payment.',
      order: razorpayOrder,
      paymentHistoryId: paymentHistory._id,
      gst: {
        percentage: gstPercentage,
        amount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Create Trending Points Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trending points order',
      error: error.message,
    });
  }
};

// Updated verifyTrendingPointsPayment Controller
exports.verifyTrendingPointsPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // 1. Validate required fields
    if ((!razorpay_order_id && !req.body.razorpay_subscription_id) || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields',
      });
    }

    // 2. Verify Razorpay signature
    const signaturePayload = razorpay_order_id
      ? `${razorpay_order_id}|${razorpay_payment_id}`
      : `${razorpay_payment_id}|${req.body.razorpay_subscription_id}`;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(signaturePayload)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature - possible tampering',
      });
    }

    // 3. Find and verify Payment History
    const historyQuery = { 
        payment_type: PAYMENT_TYPES.TRENDING_POINT,
        status: { $ne: STATUS.PAID } // only process unpaid ones
    };
    if (razorpay_order_id) {
      historyQuery.razorpay_order_id = razorpay_order_id;
    } else if (req.body.razorpay_subscription_id) {
      historyQuery.razorpay_subscription_id = req.body.razorpay_subscription_id;
    }

    const paymentHistory = await PaymentHistory.findOne(historyQuery);

    if (!paymentHistory) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found or already processed',
      });
    }

    // 4. Extract points from notes
    // Format: `Purchase of ${points} trending points ...`
    let points = 0;
    if (paymentHistory.notes) {
        const pointsMatch = paymentHistory.notes.match(/Purchase of (\d+) trending points/);
        points = pointsMatch ? parseInt(pointsMatch[1]) : 0;
    }

    // 5. Create TrendingPointsPayment record (Only NOW after payment)
    const trendingPayment = new TrendingPointsPayment({
      user_id: paymentHistory.user_id,
      subscription_id: paymentHistory.user_subscription_id || null,
      points,
      amount: paymentHistory.amount / 100,
      gst_percentage: paymentHistory.gst_percentage,
      gst_amount: paymentHistory.gst_amount / 100,
      razorpay_order_id: razorpay_order_id || null,
      razorpay_subscription_id: req.body.razorpay_subscription_id || null,
      razorpay_payment_id,
      razorpay_signature,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP, // Activate the record
      payment_history_id: paymentHistory._id,
    });

    await trendingPayment.save();

    // 6. Update PaymentHistory record
    paymentHistory.razorpay_payment_id = razorpay_payment_id;
    paymentHistory.razorpay_signature = razorpay_signature;
    paymentHistory.status = STATUS.PAID;
    paymentHistory.captured = true;
    paymentHistory.paid_at = new Date();
    paymentHistory.payment_method = 'razorpay';
    paymentHistory.trending_point_payment_id = trendingPayment._id;
    await paymentHistory.save();

    /* ------------------------------------------------
       7️⃣ Prepare Invoice Data
    ------------------------------------------------ */
    const user = await User.findById(trendingPayment.user_id).select('name email');
    const subscription = await UserSubscription.findById(trendingPayment.subscription_id);
    const plan = subscription
      ? await SubscriptionPlan.findById(subscription.subscription_plan_id).select('plan_name')
      : null;

    // Safe date formatting
    const paidAt = trendingPayment.updated_at?.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) || 'N/A';

    const totalAmount = trendingPayment.amount + (trendingPayment.gst_amount || 0);

    // 6. Modern invoice HTML (improved version)
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Trending Points Invoice</title>
      </head>
      <body style="margin:0; padding:0; font-family:'Helvetica Neue',Arial,sans-serif; background:#f9fafb;">
        <div style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding:40px 30px; text-align:center; color:white;">
            <h1 style="margin:0; font-size:28px;">Trending Points Invoice</h1>
            <p style="margin:8px 0 0; font-size:15px; opacity:0.9;">Payment Successful • Thank You!</p>
          </div>

          <!-- Content -->
          <div style="padding:30px;">
            <div style="margin-bottom:30px;">
              <h3 style="margin:0 0 12px; color:#1f2937; font-size:20px;">Payment Summary</h3>
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Merchant</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;"><strong>${user?.name || 'N/A'}</strong></td>
                </tr>
                <tr>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Plan</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">${plan?.plan_name || 'Trending Points Purchase'}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Points Purchased</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">${trendingPayment.points}</td>
                </tr>
                <tr>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Base Amount</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">₹${trendingPayment.amount.toFixed(2)}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">GST (${trendingPayment.gst_percentage}%)</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">₹${(trendingPayment.gst_amount || 0).toFixed(2)}</td>
                </tr>
                <tr style="background:#f8fafc; font-weight:bold;">
                  <td style="padding:12px 15px; color:#1f2937;">Total Paid</td>
                  <td style="padding:12px 15px; color:#1f2937;">₹${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom:30px;">
              <h3 style="margin:0 0 12px; color:#1f2937; font-size:20px;">Transaction Details</h3>
              <p style="margin:6px 0; color:#4b5563; font-size:14px;">
                <strong>Payment ID:</strong> ${razorpay_payment_id}<br>
                <strong>Order ID:</strong> ${razorpay_order_id}<br>
                <strong>Paid on:</strong> ${paidAt}
              </p>
            </div>

            <div style="text-align:center; margin:30px 0;">
              <a href="https://yourdomain.com/support"
                 style="display:inline-block; padding:12px 32px; background:#4f46e5; color:white; text-decoration:none; border-radius:8px; font-size:15px;">
                Contact Support
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc; padding:20px; text-align:center; font-size:13px; color:#6b7280; border-top:1px solid #e5e7eb;">
            <p style="margin:4px 0;">Your Company Name • GSTIN: XXXXX</p>
            <p style="margin:4px 0;">support@yourdomain.com • www.yourdomain.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 7. Send invoice email (non-blocking)
    if (user?.email) {
      try {
        await subscriptionPlanSendEmail(
          user.email,
          'Your Trending Points Invoice',
          invoiceHtml
        );
      } catch (emailErr) {
        console.error('Trending points invoice email failed:', emailErr.message);
        // Email failure doesn't affect payment success
      }
    }

    // 8. Optional: Admin notification (socket/email/SMS)
    // global.io.of("/trending-points").to("admin").emit("trendingPaymentVerified", { ... });

    // 9. Success response
    res.status(200).json({
      success: true,
      message: 'Trending points payment verified successfully',
      trendingPayment,
      paymentHistory,
      invoiceSent: !!user?.email,
    });
  } catch (error) {
    console.error('Verify Trending Points Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

exports.upgradeTrendingPoints = async (req, res) => {
  try {
    const { user_id, old_trending_points_payment_id, points, amount, subscription_id } = req.body;

    if (!user_id || !points || !amount || !subscription_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const pointRate = await getPointRate();
    if (typeof amount !== 'number' || amount <= 0 || Math.abs(amount - (points * pointRate)) > 0.01) {
      return res.status(400).json({
        message: `Invalid amount: must be points * ₹${pointRate} per point`,
        expected_amount: points * pointRate,
      });
    }

    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
    }).populate("subscription_plan_id");

    if (!subscription) {
      return res.status(400).json({ message: 'Invalid or inactive subscription' });
    }

    if (subscription.subscription_plan_id?.plan_code === "FREE") {
      return res.status(403).json({
        message: "Trending points upgrades are not allowed for Free plan users. Please upgrade to a paid plan first.",
      });
    }

    // Fetch GST plan
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: 'GST',
      category: 'gst',
      durationType: 'percentage',
    });
    if (!gstPlan && req.body.gst_percentage === undefined) {
      return res.status(404).json({ message: 'GST plan not found' });
    }

    const gstPercentage = req.body.gst_percentage !== undefined ? Number(req.body.gst_percentage) : (gstPlan.price !== undefined ? gstPlan.price : 18); // fallback
    const baseAmount = amount; // Base amount (points * pointRate)
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    // Check for existing payment
    let totalPoints = points; // Default to new points
    let totalAmountValue = baseAmount;
    let totalGstAmountValue = gstAmount;

    if (old_trending_points_payment_id) {
      const oldPayment = await TrendingPointsPayment.findOne({
        _id: old_trending_points_payment_id,
        user_id,
        status: STATUS.ACTIVE_CAP,
        payment_status: STATUS.PAID,
      });
      if (oldPayment) {
        totalPoints = (oldPayment.points || 0) + points; // Sum existing points with new points
        totalAmountValue = (oldPayment.amount || 0) + baseAmount;
        totalGstAmountValue = (oldPayment.gst_amount || 0) + gstAmount;

        // Note: We don't cancel the old payment here anymore. 
        // We wait for verification to succeed first.
      }
    }

    const receipt = `trending_points_upgrade_${Math.floor(Math.random() * 1000000)}`;
    const options = {
      amount: Math.round(totalAmount * 100), // Convert total to paise
      currency: 'INR',
      receipt,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    const newPayment = new TrendingPointsPayment({
      user_id,
      subscription_id,
      points: totalPoints, // Use total points (existing + new)
      amount: totalAmountValue,
      gst_percentage: gstPercentage,
      gst_amount: totalGstAmountValue,
      razorpay_order_id: order.id,
      payment_status: STATUS.CREATED,
      status: STATUS.PENDING_CAP,
      upgraded_from_id: old_trending_points_payment_id || null,
    });

    await newPayment.save();

    // Create PaymentHistory record for the upgrade
    const paymentHistory = new PaymentHistory({
      user_id,
      payment_type: PAYMENT_TYPES.TRENDING_POINT,
      trending_point_payment_id: newPayment._id,
      user_subscription_id: subscription_id,
      razorpay_order_id: order.id,
      receipt,
      amount: Math.round(baseAmount * 100),
      gst_percentage: gstPercentage,
      gst_amount: Math.round(gstAmount * 100),
      total_amount: Math.round(totalAmount * 100),
      currency: 'INR',
      status: STATUS.CREATED,
      notes: `Trending Points Upgrade - ${points} new points (total: ${totalPoints} points)`,
    });

    await paymentHistory.save();

    // Link PaymentHistory to TrendingPointsPayment
    newPayment.payment_history_id = paymentHistory._id;
    await newPayment.save();

    res.status(201).json({
      order,
      trendingPointsPayment: newPayment,
      paymentHistoryId: paymentHistory._id,
      gst: {
        percentage: gstPercentage,
        amount: gstAmount,
        totalAmount: totalAmount,
      },
    });
  } catch (error) {
    console.error('Upgrade Trending Points Error:', error);
    res.status(500).json({ message: 'Failed to upgrade trending points', error: error.message });
  }
};

exports.cancelTrendingPoints = async (req, res) => {
  try {
    const { trending_points_payment_id } = req.body;
    if (!trending_points_payment_id) {
      return res.status(400).json({ message: 'Trending points payment ID is required' });
    }

    const payment = await TrendingPointsPayment.findByIdAndUpdate(
      trending_points_payment_id,
      { status: STATUS.CANCELLED_CAP, updated_at: Date.now() },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Trending points payment not found' });
    }

    res.status(200).json({ message: 'Trending points subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel Trending Points Error:', error);
    res.status(500).json({ message: 'Failed to cancel trending points', error: error.message });
  }
};

/**
 * @route   POST /api/trending-points-payment/free-grant
 * @desc    Admin grants free trending points (update if exists, create if not)
 * @access  Private - Admin only
 */
exports.grantFreeTrendingPoints = async (req, res) => {
  try {
    const { user_id, subscription_id, points, reason } = req.body;

    // 1. Input validation
    if (!user_id || !subscription_id || !points) {
      return res.status(400).json({
        success: false,
        message: 'user_id, subscription_id and points are required',
      });
    }

    if (typeof points !== 'number' || points <= 0 || !Number.isInteger(points)) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a positive integer',
      });
    }

    // 2. Find user and populate role
    const user = await User.findById(user_id).populate('role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const roleName = user.role?.role?.toUpperCase();

    if (!roleName || !['MERCHANT', 'SERVICE_PROVIDER'].includes(roleName)) {
      return res.status(403).json({
        success: false,
        message: 'Free trending points can only be granted to merchants or service providers',
      });
    }

    // 3. Validate active subscription
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id: user_id,
      status: { $in: [STATUS.PAID, STATUS.ACTIVE_RENEWAL] },
    });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive subscription. Merchant must have an active paid subscription.',
      });
    }

    // 4. Generate dummy razorpay_order_id (required by schema)
    const dummyOrderId = `FREE-GRANT-${Date.now()}-${user_id.toString().slice(-8)}`;

    // 5. Check if merchant already has an active trending points record
    let trendingPointsPayment = await TrendingPointsPayment.findOne({
      user_id: user_id,
      status: STATUS.ACTIVE_CAP,
    });

    if (trendingPointsPayment) {
      // ─── UPDATE EXISTING RECORD ───
      trendingPointsPayment.points += points;                    // add new free points
      trendingPointsPayment.amount += 0;                         // free → add 0 (keeps old paid amount)
      trendingPointsPayment.reason = reason || trendingPointsPayment.reason || 'Admin free grant';
      trendingPointsPayment.updated_at = new Date();

      // Optional: append reason to notes
      if (reason) {
        trendingPointsPayment.notes = trendingPointsPayment.notes
          ? `${trendingPointsPayment.notes}\nFree grant added: ${reason} (+${points} points)`
          : `Free grant added: ${reason} (+${points} points)`;
      }

      await trendingPointsPayment.save();

      // Optional: update PaymentHistory log
      await PaymentHistory.findOneAndUpdate(
        { trending_point_payment_id: trendingPointsPayment._id },
        {
          $set: {
            notes: `Updated: Added ${points} free points (total now ${trendingPointsPayment.points})${reason ? ` (${reason})` : ''}`,
            updated_at: new Date(),
          },
        }
      );
    } else {
      // ─── CREATE NEW RECORD ───
      trendingPointsPayment = new TrendingPointsPayment({
        user_id,
        subscription_id,
        points,
        amount: 0,                                           // new free grant → amount starts at 0
        reason: reason || 'Admin free grant',
        gst_percentage: 0,
        gst_amount: 0,
        razorpay_order_id: dummyOrderId,
        payment_status: STATUS.PAID,
        status: STATUS.ACTIVE_CAP,
        payment_method: 'admin_free_grant',
        isFreeGrant: true,
        grantedBy: req.user?._id || null,
        grantReason: reason || 'Admin free grant',
        notes: reason ? `Free grant - ${reason}` : 'Free grant by admin',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await trendingPointsPayment.save();

      // Create PaymentHistory for new record
      const paymentHistory = new PaymentHistory({
        user_id,
        payment_type: PAYMENT_TYPES.TRENDING_POINT_FREE,
        trending_point_payment_id: trendingPointsPayment._id,
        user_subscription_id: subscription_id,
        razorpay_order_id: dummyOrderId,
        amount: 0,
        gst_percentage: 0,
        gst_amount: 0,
        total_amount: 0,
        currency: 'INR',
        status: STATUS.PAID,
        captured: true,
        paid_at: new Date(),
        payment_method: 'admin_free_grant',
        notes: `Free Trending Points Grant - ${points} points${reason ? ` (${reason})` : ''}`,
        grantedBy: req.user?._id || null,
        receipt: `free_tp_${user_id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
      });

      await paymentHistory.save();

      trendingPointsPayment.payment_history_id = paymentHistory._id;
      await trendingPointsPayment.save();
    }

    // 6. Optional: Send email notification
    if (user.email) {
      try {
        const emailHtml = `
          <h2>Free Trending Points Added</h2>
          <p>Dear ${user.name || 'Merchant'},</p>
          <p>An admin has added <strong>${points} free trending points</strong> to your account.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>Total active points updated successfully.</p>
          <p>Thank you!</p>
        `;

        await subscriptionPlanSendEmail(user.email, 'Free Trending Points Added', emailHtml);
      } catch (emailErr) {
        console.error('Failed to send free grant email:', emailErr.message);
      }
    }

    // 7. Success response
    res.status(200).json({
      success: true,
      message: `Successfully granted ${points} free trending points`,
      trendingPointsPayment,
      action: trendingPointsPayment.wasNew ? 'created' : 'updated',
    });
  } catch (error) {
    console.error('Grant Free Trending Points Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grant free trending points',
      error: error.message,
    });
  }
};
exports.getTrendingPointsConfig = async (req, res) => {
  try {
    const pointRate = await getPointRate(); // Fetch from DB or config
    res.status(200).json({ pointRate });
  } catch (error) {
    console.error('Get Trending Points Config Error:', error);
    res.status(500).json({ message: 'Failed to fetch config', error: error.message });
  }
};

exports.getActiveTrendingPoints = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find active payment (paid and Active status)
    const activeTrendingPointsPayment = await TrendingPointsPayment.findOne({
      user_id: userId,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
    }).select('points amount payment_status status subscription_id');

    // Find pending payment (created status)
    const pendingTrendingPointsPayment = await TrendingPointsPayment.findOne({
      user_id: userId,
      payment_status: STATUS.CREATED,
      status: STATUS.ACTIVE_CAP,
    }).select('points amount payment_status status subscription_id');

    res.status(200).json({
      trendingPointsPayment: activeTrendingPointsPayment || null,
      pendingTrendingPointsPayment: pendingTrendingPointsPayment || null,
    });
  } catch (error) {
    console.error('Get Active Trending Points Error:', error);
    res.status(500).json({ message: 'Failed to fetch active trending points', error: error.message });
  }
};

// Helper function to get point rate from DB or config
async function getPointRate() {
  // Replace with actual DB query or config fetch
  return 45 / 100; // ₹45 per 100 points
}





exports.searchMerchants = async (req, res) => {
  try {
    let { query } = req.query;
    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    query = query.trim();

    // Find users matching email or phone
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    }).select("email name phone _id role"); // Include role field

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    // Check each user's role
    for (const user of users) {
      // Assuming role field in User model references Role model _id
      const role = await Role.findById(user.role);

      if (role && ['MERCHANT', 'SERVICE_PROVIDER'].includes(role.role)) {
        // Return the first matching user with allowed role
        return res.status(200).json({
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: role.role
          }
        });
      }
    }

    // If no user with matching role is found
    return res.status(404).json({ message: "No users found with role MERCHANT or SERVICE_PROVIDER" });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllActiveTrendingPointUsers = async (req, res) => {
  try {
    const activeTrendingPointUsers = await TrendingPointsPayment.aggregate([
      {
        $match: {
          payment_status: STATUS.PAID,
          status: STATUS.ACTIVE_CAP,
        },
      },

      // Join User
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Join Merchant using user_id
      {
        $lookup: {
          from: "merchants",
          localField: "user_id",
          foreignField: "user_id",
          as: "merchant",
        },
      },
      {
        $unwind: {
          path: "$merchant",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          user_id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          phone: "$user.phone",

          points: 1,
          amount: 1,
          payment_status: 1,
          status: 1,
          subscription_id: 1,
          created_at: 1,
          updated_at: 1,

          company_name: "$merchant.company_name",
          company_phone_number: "$merchant.company_phone_number",
          company_email: "$merchant.company_email",
        },
      },
    ]);

    res.status(200).json({
      data: activeTrendingPointUsers,
      total: activeTrendingPointUsers.length,
    });

  } catch (error) {
    console.error("Get All Active Trending Point Users Error:", error);
    res.status(500).json({
      message: "Failed to fetch active trending point users",
      error: error.message,
    });
  }
};
