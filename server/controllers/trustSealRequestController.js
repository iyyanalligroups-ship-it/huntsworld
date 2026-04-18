
const { STATUS } = require("../constants/subscriptionConstants");

// const razorpay = require("../config/razorpay");
// const crypto = require("crypto");
// const Address = require("../models/addressModel");
// const Merchant = require("../models/MerchantModel");
// const User = require("../models/userModel");
// const CommonSubscriptionPlan = require("../models/commonSubcriptionPlanModel");
// const { default: mongoose } = require("mongoose");
// const axios = require("axios");
// const Role = require("../models/roleModel");
// const subscriptionPlanSendEmail = require("../utils/subscriptionPlanSendEmail");
// const SubscriptionPlan = require("../models/subscriptionPlanModel");
// const Point = require("../models/pointsModel");
// const PaymentHistory = require("../models/paymentHistoryModel");


// exports.createTrustSealRequest = async (req, res) => {
//   try {
//     const { user_id, amount, subscription_id } = req.body;

//     if (!user_id || !amount || !subscription_id) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // 1. Fetch Merchant Profile
//     const merchant = await Merchant.findOne({ user_id });
//     if (!merchant) {
//       return res.status(400).json({
//         success: false,
//         message: "Please complete your business profile first.",
//         action_required: "Go to Profile → Business Details",
//         redirect_to: "/profile/business",
//       });
//     }

//     // 2. Fetch Company Address
//     const companyAddress = await Address.findOne({
//       user_id,
//       address_type: "company",
//     });

//     if (!companyAddress) {
//       return res.status(400).json({
//         success: false,
//         message: "Company address is required",
//         action_required: "Please add company address",
//         redirect_to: "/profile/address?type=company",
//       });
//     }

//     // 3. Validate required fields
//     const requiredAddressFields = ["address_line_1", "city", "state", "pincode"];
//     const missingAddress = requiredAddressFields.filter(
//       (field) => !companyAddress[field]?.trim()
//     );

//     const companyName = (merchant.company_name || "").trim();
//     const gstNumber = (merchant.gst_number || "").trim();

//     const missingFields = [];
//     if (!companyName) missingFields.push("company_name");
//     if (missingAddress.length > 0) missingFields.push(...missingAddress);

//     if (missingFields.length > 0) {
//       const fieldLabels = {
//         company_name: "Company Name",
//         gst_number: "GST Number",
//         address_line_1: "Address Line 1",
//         city: "City",
//         state: "State",
//         pincode: "Pincode",
//       };

//       return res.status(400).json({
//         success: false,
//         message: "Incomplete business details",
//         missing_fields: missingFields,
//         action_required: `Please complete: ${missingFields
//           .map((f) => fieldLabels[f] || f)
//           .join(", ")}`,
//       });
//     }

//     // 4. Validate active subscription
//     const subscription = await UserSubscription.findOne({
//       _id: subscription_id,
//       user_id,
//       status: "paid",
//     });
//     if (!subscription) {
//       return res.status(400).json({ message: "Invalid or inactive subscription" });
//     }

//     // 5. Prevent duplicate pending requests
//     const existingRequest = await TrustSealRequest.findOne({
//       user_id,
//       status: { $in: ["pending", "student_verified", "under_review"] },
//     });
//     if (existingRequest) {
//       return res.status(409).json({
//         success: false,
//         message: "You already have a pending Trust Seal request",
//         existingRequestId: existingRequest._id,
//         status: existingRequest.status,
//       });
//     }

//     // 6. GST Calculation
//     const gstPlan = await CommonSubscriptionPlan.findOne({
//       name: "GST",
//       category: "gst",
//       durationType: "percentage",
//     });

//     if (!gstPlan) {
//       return res.status(500).json({ message: "GST configuration not found" });
//     }

//     const gstPercentage = gstPlan.price || 18;
//     const baseAmount = Number(amount);
//     const gstAmount = (baseAmount * gstPercentage) / 100;
//     const totalAmount = baseAmount + gstAmount;

//     // 7. Create Razorpay Order
//     const receipt = `ts_${user_id.slice(-10)}_${Date.now().toString().slice(-9)}`;

//     const razorpayOrder = await razorpay.orders.create({
//       amount: Math.round(totalAmount * 100), // in paise
//       currency: "INR",
//       receipt,
//       payment_capture: 1,
//       notes: {
//         purpose: "Trust Seal Request",
//         user_id: user_id.toString(),
//       },
//     });

//     // 8. ★★★ Create Payment History Record ★★★
//     const paymentHistory = new PaymentHistory({
//       user_id,
//       payment_type: "trust_seal",

//       trust_seal_id: null, // will be updated after trust seal is created
//       user_subscription_id: subscription_id,

//       razorpay_order_id: razorpayOrder.id,
//       receipt,

//       amount: baseAmount,
//       gst_percentage: gstPercentage,
//       gst_amount: gstAmount,
//       total_amount: totalAmount,
//       currency: "INR",

//       status: "created", // will be updated to paid/failed later
//       notes: `Trust Seal Request - ₹${totalAmount.toFixed(2)} incl GST`,
//     });

//     await paymentHistory.save();

//     // 9. Create Trust Seal Request
//     const trustSealRequest = new TrustSealRequest({
//       user_id,
//       subscription_id,
//       amount: baseAmount,
//       gst_percentage: gstPercentage,
//       gst_amount: gstAmount,
//       total_amount: totalAmount,
//       razorpay_order_id: razorpayOrder.id,
//       status: "pending",
//       isRead: false,
//       payment_history_id: paymentHistory._id, // ← optional but very useful
//     });

//     await trustSealRequest.save();

//     // 10. Update payment history with trust seal reference (two-way relation)
//     paymentHistory.trust_seal_id = trustSealRequest._id;
//     await paymentHistory.save();

//     // 11. Notify admin (socket + SMS) – same as before
//     const user = await User.findById(user_id).select("name");
//     const userName = user?.name || "Merchant";

//     global.io
//       .of("/trust-seal-notifications")
//       .to("trust-seal:admin")
//       .emit("newTrustSealRequest", {
//         _id: trustSealRequest._id,
//         user_id,
//         userName,
//         amount: baseAmount,
//         totalAmount,
//         status: "pending",
//         created_at: trustSealRequest.createdAt,
//       });

//     // const adminRole = await Role.findOne({ role: "ADMIN" });
//     // if (adminRole) {
//     //   const smsAdmins = await User.find({ role: adminRole._id }).select("phone name");
//     //   const currentDate = new Date().toLocaleDateString("en-IN", {
//     //     day: "numeric",
//     //     month: "long",
//     //     year: "numeric",
//     //   });
//     //   const smsText = `New Trust Seal Request!\n${userName} paid ₹${totalAmount.toFixed(2)} (incl GST) on ${currentDate}.\nVerify & approve. - HUNTSWORLD`;

//     //   for (const admin of smsAdmins) {
//     //     if (admin.phone) {
//     //       try {
//     //         const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${admin.phone}&text=${encodeURIComponent(smsText)}`;
//     //         await axios.get(smsApiUrl);
//     //         
//     //       } catch (err) {
//     //         console.error(`SMS failed for ${admin.phone}`, err.message);
//     //       }
//     //     }
//     //   }
//     // }
//     // 12. Final success response
//     res.status(201).json({
//       success: true,
//       message: "Trust Seal request created. Proceed to payment.",
//       order: razorpayOrder,
//       trustSealRequest,
//       paymentHistoryId: paymentHistory._id, // useful for frontend tracking
//       gst: {
//         percentage: gstPercentage,
//         amount: gstAmount,
//         total: totalAmount.toFixed(2),
//       },
//     });
//   } catch (error) {
//     console.error("Trust Seal Request Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create trust seal request",
//       error: error.message,
//     });
//   }
// };

// exports.verifyTrustSealPayment = async (req, res) => {
//   try {
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

//     if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required payment verification fields",
//       });
//     }

//     const secret = process.env.RAZORPAY_KEY_SECRET;
//     if (!secret) {
//       throw new Error("Razorpay key secret is not configured");
//     }

//     // 1. Verify Razorpay signature
//     const generatedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment signature - possible tampering",
//       });
//     }

//     // 2. Find the trust seal request
//     const trustSealRequest = await TrustSealRequest.findOne({
//       razorpay_order_id,
//       status: "pending", // only process pending ones
//     });
//     //     if (!trustSealRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Trust seal request not found or already processed",
//       });
//     }

//     // 3. Update TrustSealRequest
//     trustSealRequest.razorpay_payment_id = razorpay_payment_id;
//     trustSealRequest.razorpay_signature = razorpay_signature;
//     // trustSealRequest.status = "payment_verified";
//     trustSealRequest.updated_at = new Date();

//     await trustSealRequest.save();

//     // 4. Update / Create PaymentHistory
//     let paymentHistory = await PaymentHistory.findOne({
//       razorpay_order_id,
//       payment_type: "trust_seal",
//     });

//     if (paymentHistory) {
//       // Update existing record
//       paymentHistory.razorpay_payment_id = razorpay_payment_id;
//       paymentHistory.razorpay_signature = razorpay_signature;
//       paymentHistory.status = "paid";
//       paymentHistory.captured = true;
//       paymentHistory.paid_at = new Date();
//       paymentHistory.payment_method = "razorpay"; // you can get from webhook later if needed
//       await paymentHistory.save();
//     } else {
//       // Rare case - create if missing
//       paymentHistory = new PaymentHistory({
//         user_id: trustSealRequest.user_id,
//         payment_type: "trust_seal",
//         trust_seal_id: trustSealRequest._id,
//         user_subscription_id: trustSealRequest.subscription_id,
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//         amount: trustSealRequest.amount,
//         gst_percentage: trustSealRequest.gst_percentage,
//         gst_amount: trustSealRequest.gst_amount,
//         total_amount: trustSealRequest.total_amount,
//         currency: "INR",
//         status: "paid",
//         captured: true,
//         paid_at: new Date(),
//         receipt: `trustseal_${trustSealRequest.user_id}_${Date.now()}`,
//         notes: "Trust Seal Payment Verified",
//       });
//       await paymentHistory.save();
//     }

//     // 5. Fetch additional data for invoice & notifications
//     const user = await User.findById(trustSealRequest.user_id).select("name email");
//     const subscription = await UserSubscription.findById(trustSealRequest.subscription_id);
//     const plan = subscription
//       ? await SubscriptionPlan.findById(subscription.subscription_plan_id).select("plan_name")
//       : null;

//     const paidAt = trustSealRequest.updated_at.toLocaleDateString("en-IN", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//     const totalAmount = trustSealRequest.total_amount;

//     // 6. Generate professional invoice HTML (improved version)
//     const invoiceHtml = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <title>Trust Seal Invoice</title>
//       </head>
//       <body style="font-family: 'Helvetica Neue', Arial, sans-serif; margin:0; padding:0; background:#f9fafb;">
//         <div style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

//           <!-- Header -->
//           <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding:40px 30px; text-align:center; color:white;">
//             <h1 style="margin:0; font-size:28px;">Trust Seal Payment Invoice</h1>
//             <p style="margin:8px 0 0; font-size:15px; opacity:0.9;">Payment Successful • Thank You!</p>
//           </div>

//           <!-- Content -->
//           <div style="padding:30px;">
//             <div style="margin-bottom:30px;">
//               <h3 style="margin:0 0 12px; color:#1f2937; font-size:20px;">Payment Details</h3>
//               <table style="width:100%; border-collapse:collapse; font-size:14px;">
//                 <tr style="background:#f8fafc;">
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Merchant Name</td>
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;"><strong>${user?.name || "N/A"}</strong></td>
//                 </tr>
//                 <tr>
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Plan</td>
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">${plan?.plan_name || "Trust Seal Service"}</td>
//                 </tr>
//                 <tr style="background:#f8fafc;">
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Base Amount</td>
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">₹${trustSealRequest?.amount?.toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">GST (${trustSealRequest?.gst_percentage}%)</td>
//                   <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">₹${(trustSealRequest?.gst_amount || 0).toFixed(2)}</td>
//                 </tr>
//                 <tr style="background:#f8fafc; font-weight:bold;">
//                   <td style="padding:12px 15px; color:#1f2937;">Total Paid</td>
//                   <td style="padding:12px 15px; color:#1f2937;">₹${totalAmount?.toFixed(2)}</td>
//                 </tr>
//               </table>
//             </div>

//             <div style="margin-bottom:30px;">
//               <h3 style="margin:0 0 12px; color:#1f2937; font-size:20px;">Transaction Info</h3>
//               <p style="margin:6px 0; color:#4b5563; font-size:14px;">
//                 <strong>Payment ID:</strong> ${razorpay_payment_id}<br>
//                 <strong>Order ID:</strong> ${razorpay_order_id}<br>
//                 <strong>Date:</strong> ${paidAt}
//               </p>
//             </div>

//             <div style="text-align:center; margin:30px 0;">
//               <a href="https://yourdomain.com/support"
//                  style="display:inline-block; padding:12px 32px; background:#4f46e5; color:white; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">
//                 Contact Support
//               </a>
//             </div>
//           </div>

//           <!-- Footer -->
//           <div style="background:#f8fafc; padding:20px; text-align:center; font-size:13px; color:#6b7280; border-top:1px solid #e5e7eb;">
//             <p style="margin:4px 0;">Your Company Name • GSTIN: XXXXX</p>
//             <p style="margin:4px 0;">support@yourdomain.com • www.yourdomain.com</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     // 7. Send invoice email
//     if (user?.email) {
//       await subscriptionPlanSendEmail(user.email, "Trust Seal Payment Invoice", invoiceHtml);
//     }

//     // 8. Notify admins via socket
//     global.io.of("/trust-seal-notifications").to("trust-seal:admin").emit("trustSealPaymentVerified", {
//       _id: trustSealRequest._id,
//       user_id: trustSealRequest.user_id,
//       merchantName: user?.name || "Unknown",
//       amount: trustSealRequest.total_amount,
//       paymentId: razorpay_payment_id,
//       paidAt,
//       status: trustSealRequest.status,
//     });

//     // 9. Final success response
//     res.status(200).json({
//       success: true,
//       message: "Payment verified successfully",
//       trustSealRequest,
//       paymentHistory,
//       invoiceSent: !!user?.email,
//     });
//   } catch (error) {
//     console.error("Trust Seal Payment Verification Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Payment verification failed",
//       error: error.message,
//     });
//   }
// };

// exports.getTrustSealRequests = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       status = "all",
//       startDate,
//       endDate
//     } = req.query;

//     const query = {};

//     

//     // === Status Filter ===
//     // Only this part matters – make sure it's exactly like this:
//     if (status && status !== "all" && status !== "read" && status !== "unread") {
//       query.status = status;
//     }
//     if (status === "read") query.isRead = true;
//     if (status === "unread") query.isRead = false;

//     if (startDate || endDate) {
//       query.created_at = {};
//       if (startDate) query.created_at.$gte = new Date(startDate);
//       if (endDate) query.created_at.$lte = new Date(endDate);
//     }

//     const total = await TrustSealRequest.countDocuments(query);

//     const trustSealRequests = await TrustSealRequest.find(query)
//       .populate("user_id", "name email")
//       .populate("picked_by", "name")
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .sort({ created_at: -1 })
//       .lean();

//     const formattedRequests = trustSealRequests.map((request) => ({
//       ...request,
//       merchantName: request.user_id?.name || "Unknown",
//       picked_by_name: request.picked_by?.name || "N/A",
//     }));

//     // THIS IS THE EXACT PLACE TO PASTE
//     

//     res.status(200).json({
//       success: true,
//       data: formattedRequests,
//       total,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (error) {
//     console.error("Get Trust Seal Requests Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch trust seal requests",
//       error: error.message || "Internal server error",
//     });
//   }
// };

// exports.updateTrustSealRequestStatus = async (req, res) => {
//   try {
//     const { request_id, status, notes } = req.body;

//     if (!request_id || !status) {
//       return res.status(400).json({
//         message: "Request ID and status are required",
//       });
//     }

//     if (!["verified", "rejected"].includes(status)) {
//       return res.status(400).json({
//         message: "Invalid status. Must be verified or rejected",
//       });
//     }

//     const trustSealRequest = await TrustSealRequest.findById(request_id);

//     if (!trustSealRequest) {
//       return res.status(404).json({
//         message: "Trust seal request not found",
//       });
//     }

//     /* ==========================
//        HANDLE REJECTION
//     =========================== */
//     if (status === "rejected") {
//       trustSealRequest.status = "rejected";
//       trustSealRequest.notes = notes || "";
//       trustSealRequest.issueDate = null;
//       trustSealRequest.expiryDate = null;
//       trustSealRequest.isRead = true;
//       trustSealRequest.updated_at = Date.now();

//       await trustSealRequest.save();
//     }

//     /* ==========================
//        HANDLE VERIFICATION
//     =========================== */
//     if (status === "verified") {
//       // 🔑 Fetch trust seal duration config
//       const durationConfig = await Point.findOne({
//         point_name: "Trust_Seal_Duration",
//       });

//       if (!durationConfig) {
//         return res.status(500).json({
//           message:
//             "Trust Seal duration configuration not found in Points table",
//         });
//       }

//       const duration = Number(durationConfig.time_duration);
//       const unit = durationConfig.time_unit.toLowerCase();

//       if (!duration || duration <= 0) {
//         return res.status(400).json({
//           message: "Invalid trust seal duration configuration",
//         });
//       }

//       const issueDate = new Date();
//       const expiryDate = new Date(issueDate);

//       // ✅ Dynamic expiry calculation
//       switch (unit) {
//         case "seconds":
//           expiryDate.setSeconds(expiryDate.getSeconds() + duration);
//           break;

//         case "minutes":
//           expiryDate.setMinutes(expiryDate.getMinutes() + duration);
//           break;

//         case "hours":
//           expiryDate.setHours(expiryDate.getHours() + duration);
//           break;

//         case "month":
//           expiryDate.setMonth(expiryDate.getMonth() + duration);
//           break;

//         case "year":
//           expiryDate.setFullYear(expiryDate.getFullYear() + duration);
//           break;

//         default:
//           return res.status(400).json({
//             message: `Unsupported time unit: ${unit}`,
//           });
//       }

//       trustSealRequest.status = "verified";
//       trustSealRequest.notes = notes || "";
//       trustSealRequest.issueDate = issueDate;
//       trustSealRequest.expiryDate = expiryDate;
//       trustSealRequest.isRead = true;
//       trustSealRequest.updated_at = Date.now();

//       await trustSealRequest.save();
//     }

//     /* ==========================
//        SOCKET NOTIFICATION
//     =========================== */
//     

//     global.io
//       .of("/trust-seal-notifications")
//       .to(`trust-seal:${trustSealRequest.user_id}`)
//       .emit("trustSealRequestUpdated", {
//         _id: trustSealRequest._id,
//         user_id: trustSealRequest.user_id,
//         amount: trustSealRequest.amount,
//         status: trustSealRequest.status,
//         isRead: trustSealRequest.isRead,
//         notes: trustSealRequest.notes,
//         issueDate: trustSealRequest.issueDate,
//         expiryDate: trustSealRequest.expiryDate,
//         updated_at: trustSealRequest.updated_at,
//         merchantName: req.user?.name || "Unknown Merchant",
//       });

//     return res.status(200).json({
//       message: "Trust seal request updated successfully",
//       trustSealRequest,
//     });
//   } catch (error) {
//     console.error("Update Trust Seal Request Error:", error);
//     return res.status(500).json({
//       message: "Failed to update trust seal request",
//       error: error.message,
//     });
//   }
// };

// exports.getUserTrustSealStatus = async (req, res) => {
//   try {
//     const { user_id } = req.params;

//     let trustSealRequest = await TrustSealRequest.findOne({
//       user_id,
//       status: { $in: ["pending", "verified", "expired"] },
//     }).sort({ created_at: -1 });

//     if (trustSealRequest && trustSealRequest.status === 'verified' && new Date(trustSealRequest.expiryDate) < new Date()) {
//       trustSealRequest.status = 'expired';
//       await trustSealRequest.save();
//     }

//     res.status(200).json({ trustSealRequest });
//   } catch (error) {
//     console.error("Get User Trust Seal Status Error:", error);
//     res.status(500).json({
//       message: "Failed to fetch trust seal status",
//       error: error.message,
//     });
//   }
// };

// // In TrustSealRequestApi.js or controller file

// exports.getUserTrustSealStatus = async (req, res) => {
//   try {
//     const { user_id } = req.params;

//     // Find the most recent active/verified/pending request
//     let trustSealRequest = await TrustSealRequest.findOne({
//       user_id,
//       status: { $in: ['pending', 'verified'] },
//     })
//       .sort({ created_at: -1 });

//     if (!trustSealRequest) {
//       return res.status(200).json({ trustSealRequest: null });
//     }

//     // Auto-expire if verified but date has passed
//     if (
//       trustSealRequest.status === 'verified' &&
//       trustSealRequest.expiryDate &&
//       new Date(trustSealRequest.expiryDate) < new Date()
//     ) {
//       trustSealRequest.status = 'expired';
//       await trustSealRequest.save();

//       // Emit update via socket
//       global.io
//         ?.of('/trust-seal-notifications')
//         ?.to(`trust-seal:${user_id}`)
//         ?.emit('trustSealRequestUpdated', {
//           _id: trustSealRequest._id,
//           status: 'expired',
//           expiryDate: trustSealRequest.expiryDate,
//         });
//     }

//     res.status(200).json({ trustSealRequest });
//   } catch (error) {
//     console.error('Get User Trust Seal Status Error:', error);
//     res.status(500).json({
//       message: 'Failed to fetch trust seal status',
//       error: error.message,
//     });
//   }
// };
// exports.markTrustSealNotificationAsRead = async (req, res) => {
//   try {
//     const { request_id } = req.body;

//     if (!request_id) {
//       return res.status(400).json({ message: "Request ID is required" });
//     }

//     const trustSealRequest = await TrustSealRequest.findByIdAndUpdate(
//       request_id,
//       { isRead: true },
//       { new: true }
//     );

//     if (!trustSealRequest) {
//       return res.status(404).json({ message: "Trust seal request not found" });
//     }

//     // Notify admin of read status
//     
//     global.io
//       .of("/trust-seal-notifications")
//       .to("trust-seal:admin")
//       .emit("trustSealNotificationRead", {
//         _id: trustSealRequest._id,
//         isRead: trustSealRequest.isRead,
//       });

//     res
//       .status(200)
//       .json({ message: "Notification marked as read", trustSealRequest });
//   } catch (error) {
//     console.error("Mark Trust Seal Notification As Read Error:", error);
//     res.status(500).json({
//       message: "Failed to mark notification as read",
//       error: error.message,
//     });
//   }
// };

// exports.updateTrustSealImages = async (req, res) => {
//   try {
//     const { request_id, imageUrls } = req.body;

//     if (!imageUrls || imageUrls.length === 0) {
//       return res.status(400).json({ message: "No image URLs provided" });
//     }

//     const trustSealRequest = await TrustSealRequest.findById(request_id);

//     if (!trustSealRequest) {
//       return res.status(404).json({ message: "Trust seal request not found" });
//     }

//     if (trustSealRequest.status !== "in_process") {
//       return res.status(400).json({ message: "Request not in process" });
//     }

//     trustSealRequest.images = imageUrls;
//     trustSealRequest.status = "student_verified";
//     await trustSealRequest.save();

//     res.status(200).json({
//       message: "Images updated successfully",
//       data: trustSealRequest,
//     });
//   } catch (error) {
//     console.error("Update Trust Seal Images Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// // Pick trust seal request
// exports.pickTrustSealRequest = async (req, res) => {
//   try {
//     const { request_id } = req.params;
//     const { student_id } = req.body;

//     const trustSealRequest = await TrustSealRequest.findById(request_id);

//     if (!trustSealRequest) {
//       return res.status(404).json({ message: "Trust seal request not found" });
//     }

//     if (trustSealRequest.status !== "pending") {
//       return res
//         .status(400)
//         .json({ message: "Request already picked or processed" });
//     }

//     trustSealRequest.status = "in_process";
//     trustSealRequest.picked_by = student_id;
//     await trustSealRequest.save();

//     res.status(200).json({
//       message: "Trust seal request picked successfully",
//       data: trustSealRequest,
//     });
//   } catch (error) {
//     console.error("Pick Trust Seal Request Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getTrustSealRequestsByPincode = async (req, res) => {
//   try {
//     const { student_id } = req.params;

//     // Step 1: Get student's company address
//     const studentAddress = await Address.findOne({
//       user_id: student_id,
//       address_type: "company",
//       entity_type: "student",
//     });

//     if (!studentAddress) {
//       return res.status(404).json({
//         message:
//           "Student address not found. kindly fill your address to see the trust seal requests ",
//       });
//     }

//     const studentPincode = studentAddress.pincode;
//     const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

//     // Step 2: Find sellers with matching pincode or nearby pincodes
//     const sellerAddresses = await Address.find({
//       address_type: "company",
//       entity_type: "merchant",
//       $or: [
//         { pincode: studentPincode }, // Exact match
//         {
//           // Nearby pincodes (±10 range)
//           pincode: {
//             $gte: String(parseInt(studentPincode) - 10).padStart(6, "0"),
//             $lte: String(parseInt(studentPincode) + 10).padStart(6, "0"),
//           },
//         },
//       ],
//     }).lean();

//     if (!sellerAddresses.length) {
//       return res.status(200).json({
//         message: "No matching sellers found",
//         data: [],
//       });
//     }

//     const sellerUserIds = sellerAddresses.map((addr) => addr.user_id);

//     // Step 3: Get trust seal requests from matching sellers
//     const trustSealRequests = await TrustSealRequest.find({
//       user_id: { $in: sellerUserIds },
//       status: { $in: ["pending", "in_process", "student_verified"] },
//     }).lean();

//     // Step 4: Fetch seller company details from Merchant
//     const merchants = await Merchant.find({
//       user_id: { $in: sellerUserIds },
//     }).lean();

//     // Step 5: Fetch seller user info from User model
//     const users = await User.find({ _id: { $in: sellerUserIds } })
//       .select("name email phone")
//       .lean();

//     // Step 6: Create maps for quick lookup
//     const merchantMap = {};
//     merchants.forEach((merchant) => {
//       merchantMap[merchant.user_id.toString()] = merchant;
//     });

//     const userMap = {};
//     users.forEach((user) => {
//       userMap[user._id.toString()] = user;
//     });

//     const addressMap = {};
//     sellerAddresses.forEach((addr) => {
//       addressMap[addr.user_id.toString()] = addr;
//     });

//     // Step 7: Attach seller info and filter requests
//     const filteredRequests = trustSealRequests
//       .map((req) => {
//         const userId = req.user_id.toString();
//         const requestPincode = addressMap[userId]?.pincode;
//         const isSamePincode = requestPincode === studentPincode;
//         const isOlderThanTwoDays = new Date(req.created_at) <= twoDaysAgo;
//         const isNotPicked = !req.picked_by;

//         // Include request if:
//         // - It matches the student's pincode, OR
//         // - It's from a nearby pincode, older than 2 days, and not picked
//         if (isSamePincode || (isOlderThanTwoDays && isNotPicked)) {
//           return {
//             ...req,
//             seller_company_details: merchantMap[userId] || {},
//             seller_user_info: userMap[userId] || {},
//             request_pincode: requestPincode, // Optional: for debugging
//           };
//         }
//         return null;
//       })
//       .filter((req) => req !== null);

//     res.status(200).json({
//       message: "Trust seal requests retrieved successfully",
//       data: filteredRequests,
//     });
//   } catch (error) {
//     console.error("Get Trust Seal Requests Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// exports.adminVerifyTrustSealRequest = async (req, res) => {
//   try {
//     const { request_id, status } = req.body;

//     if (!["verified", "rejected"].includes(status)) {
//       return res.status(400).json({
//         message: "Invalid status. Must be 'verified' or 'rejected'.",
//       });
//     }

//     const trustSealRequest = await TrustSealRequest.findById(request_id);

//     if (!trustSealRequest) {
//       return res.status(404).json({ message: "Trust seal request not found" });
//     }

//     if (trustSealRequest.status !== "student_verified") {
//       return res.status(400).json({
//         message: "Request must be in 'student_verified' status to proceed",
//       });
//     }

//     /* =======================
//        HANDLE REJECTION
//     ======================== */
//     if (status === "rejected") {
//       trustSealRequest.status = "rejected";
//       trustSealRequest.issueDate = null;
//       trustSealRequest.expiryDate = null;
//       await trustSealRequest.save();

//       global.io
//         ?.of("/trust-seal-notifications")
//         ?.to(`trust-seal:${trustSealRequest.user_id}`)
//         ?.emit("trustSealRequestUpdated", {
//           _id: trustSealRequest._id,
//           status: "rejected",
//         });

//       return res.status(200).json({
//         message: "Trust seal request rejected successfully",
//         data: trustSealRequest,
//       });
//     }

//     /* =======================
//        HANDLE VERIFICATION
//     ======================== */
//     if (status === "verified") {
//       // ✅ Correct point_name match
//       const durationConfig = await Point.findOne({
//         point_name: "Trust_Seal_Duration",
//       });

//       if (!durationConfig) {
//         return res.status(500).json({
//           message:
//             "Trust Seal duration configuration not found in Points table.",
//         });
//       }

//       const duration = Number(durationConfig.time_duration);
//       const unit = durationConfig.time_unit.toLowerCase();

//       if (!duration || duration <= 0) {
//         return res.status(400).json({
//           message: "Invalid trust seal duration configuration",
//         });
//       }

//       const issueDate = new Date();
//       const expiryDate = new Date(issueDate);

//       // ✅ Dynamic expiry calculation
//       switch (unit) {
//         case "seconds":
//           expiryDate.setSeconds(expiryDate.getSeconds() + duration);
//           break;

//         case "minutes":
//           expiryDate.setMinutes(expiryDate.getMinutes() + duration);
//           break;

//         case "hours":
//           expiryDate.setHours(expiryDate.getHours() + duration);
//           break;

//         case "month":
//           expiryDate.setMonth(expiryDate.getMonth() + duration);
//           break;

//         case "year":
//           expiryDate.setFullYear(expiryDate.getFullYear() + duration);
//           break;

//         default:
//           return res.status(400).json({
//             message: `Unsupported time unit: ${unit}`,
//           });
//       }

//       // Save trust seal details
//       trustSealRequest.status = "verified";
//       trustSealRequest.issueDate = issueDate;
//       trustSealRequest.expiryDate = expiryDate;

//       await trustSealRequest.save();

//       // Notify merchant
//       global.io
//         ?.of("/trust-seal-notifications")
//         ?.to(`trust-seal:${trustSealRequest.user_id}`)
//         ?.emit("trustSealRequestUpdated", {
//           _id: trustSealRequest._id,
//           status: "verified",
//           issueDate,
//           expiryDate,
//         });

//       return res.status(200).json({
//         message: "Trust seal request verified successfully",
//         data: trustSealRequest,
//       });
//     }
//   } catch (error) {
//     console.error("Admin Verify Trust Seal Request Error:", error);
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// exports.getAllActiveTrustSealUsers = async (req, res) => {
//   const { page = 1, limit = 10, status = "verified" } = req.query;

//   const query = { status };

//   const total = await TrustSealRequest.countDocuments(query);
//   const requests = await TrustSealRequest.find(query)
//     .populate("user_id", "name email phone avatarUrl")
//     .skip((page - 1) * limit)
//     .limit(Number(limit))
//     .sort({ updated_at: -1 });

//   res.json({
//     data: requests,
//     total,
//     page: Number(page),
//     limit: Number(limit),
//   });
// };

// exports.getTrustSealPrice = async (req, res) => {
//   try {
//     const product = await CommonSubscriptionPlan.findOne({
//       name: "Digital Book",
//       category: "ebook",
//       durationType: "per_book",
//     });

//     const durationConfig = await Point.findOne({
//       point_name: "trust_seal_duration",
//     });

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         price: product.price,
//         duration: durationConfig?.time_duration,
//         unit: durationConfig?.time_unit,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching product:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// exports.getMerchantTrustSealDetails = async (req, res) => {
//   try {
//     const { userId } = req.params; // Assuming route is /api/trust-seal/details/:userId

//     // Find merchant by user_id
//     const merchant = await Merchant.findOne({ user_id: userId }).exec();
//     if (!merchant) {
//       return res.status(404).json({ message: "Merchant not found" });
//     }

//     // Get address by address_id with specific conditions
//     const address = await Address.findOne({
//       user_id: merchant.user_id,
//       entity_type: { $in: ["merchant", "service_provider"] },
//       address_type: "company",
//     }).exec();

//     if (!address) {
//       return res.status(404).json({ message: "Company address not found" });
//     }

//     // Construct the full address
//     const fullAddress = `${address.address_line_1}${address.address_line_2 ? `, ${address.address_line_2}` : ""
//       }, ${address.city}, ${address.state}, ${address.country}, ${address.pincode
//       }`;

//     // Prepare the response details
//     const details = {
//       companyName: merchant.company_name,
//       director: merchant.company_name, // Assuming director is not explicitly stored; use company_name as fallback
//       gstin: merchant.gst_number || "N/A", // Using gst_number as gstin
//       iec: "N/A", // IEC not present in schema, set to N/A or fetch from another source if available
//       address: {
//         fullAddress,
//       },
//       companyPhone: merchant.company_phone_number,
//       companyEmail: merchant.company_email,
//       msmeCertificateNumber: merchant.msme_certificate_number || "N/A",
//       pan: merchant.pan || "N/A",
//       aadhar: merchant.aadhar,
//       verifiedStatus: merchant.verified_status,
//       trustshield: merchant.trustshield,
//       companyType: merchant.company_type,
//       numberOfEmployees: merchant.number_of_employees,
//       yearOfEstablishment: merchant.year_of_establishment,
//     };

//     res.status(200).json(details);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// //check trust seal exist for the merchant

// exports.checkTrustSealRequest = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     

//     if (!user_id) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     // ✅ Check both user_id and verified status
//     const existingRequest = await TrustSealRequest.findOne({
//       user_id: new mongoose.Types.ObjectId(user_id),
//       status: "verified",
//     });

//     if (existingRequest) {
//       return res.status(200).json({
//         exists: true,
//         request: existingRequest, // full details if you want them
//       });
//     } else {
//       return res.status(200).json({ exists: false });
//     }
//   } catch (error) {
//     console.error("Error checking trust seal request:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
// exports.checkTrustSealStatus = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     const now = new Date();

//     const trustSealRequest = await TrustSealRequest.findOne({
//       user_id,
//       status: "verified",
//       expiryDate: { $gte: now },
//     }).lean();

//     return res.status(200).json({
//       trustshield: !!trustSealRequest,
//     });

//   } catch (error) {
//     console.error("Error checking trust seal status:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// exports.getTrustSealRequestDetails = async (req, res) => {
//   const { id } = req.params;

//   const trustSealRequest = await TrustSealRequest.findById(id)
//     .populate("user_id", "name email")
//     .populate("subscription_id", "plan_name") // Assuming UserSubscription has a plan_name
//     .lean();

//   if (!trustSealRequest) {
//     res.status(404);
//     throw new Error("Trust seal request not found");
//   }
//   

//   if (!req.user?.role) {
//     res.status(403);
//     throw new Error("Not authorized to view this trust seal request");
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       ...trustSealRequest,
//       merchantName: trustSealRequest.user_id?.name || "Unknown",
//     },
//   });
// };

// // controllers/trustSealRequestController.js (or wherever it is)
// exports.getMyVerifiedCompanies = async (req, res) => {
//   try {
//     const { student_id } = req.params;

//     if (!student_id) {
//       return res.status(400).json({
//         success: false,
//         message: "student_id is required",
//       });
//     }

//     // Find all verified requests picked by this student
//     const verifiedRequests = await TrustSealRequest.find({
//       picked_by: student_id,
//       status: "verified",
//     })
//       .select("user_id amount issueDate expiryDate") // Only needed fields
//       .lean();

//     if (verifiedRequests.length === 0) {
//       return res.status(200).json({
//         success: true,
//         data: [],
//       });
//     }

//     // Extract merchant user_ids
//     const merchantUserIds = verifiedRequests.map((req) => req.user_id);

//     // Fetch all merchants in one query
//     const merchants = await Merchant.find({
//       user_id: { $in: merchantUserIds },
//     })
//       .select("user_id company_name gst_number")
//       .lean();

//     // Create lookup map: user_id → merchant details
//     const merchantMap = {};
//     merchants.forEach((m) => {
//       merchantMap[m.user_id.toString()] = {
//         company_name: m.company_name || "Unknown Company",
//         gst_number: m.gst_number || "N/A",
//       };
//     });

//     // Enrich requests with merchant data
//     const enrichedRequests = verifiedRequests.map((request) => {
//       const merchantInfo = merchantMap[request.user_id.toString()] || {
//         company_name: "Unknown Company",
//         gst_number: "N/A",
//       };

//       // Also populate merchant name from populated user (if you still want it)
//       // But since we don't populate User here, we skip merchant_name or set fallback
//       return {
//         _id: request._id,
//         company_name: merchantInfo.company_name,
//         gst_number: merchantInfo.gst_number,
//         merchant_name: "N/A", // optional - can remove column if not needed
//         amount: request.amount,
//         issueDate: request.issueDate,
//         expiryDate: request.expiryDate,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: enrichedRequests,
//     });
//   } catch (error) {
//     console.error("Get My Verified Companies Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };
// exports.deleteTrustSealRequest = async (req, res) => {
//   try {
//     const { request_id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(request_id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid request ID format",
//       });
//     }

//     const trustSealRequest = await TrustSealRequest.findById(request_id);

//     if (!trustSealRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Trust seal request not found",
//       });
//     }

//     // ────────────────────────────────────────────────
//     //   REMOVED: the status protection block
//     // ────────────────────────────────────────────────

//     // Delete the record
//     await TrustSealRequest.findByIdAndDelete(request_id);

//     // Optional: clean up linked payment history (still safe to keep)
//     if (trustSealRequest.payment_history_id) {
//       await PaymentHistory.findByIdAndDelete(trustSealRequest.payment_history_id).catch(() => {
//         // silent fail
//       });
//     }

//     // Notify other admins (still useful)
//     global.io
//       .of("/trust-seal-notifications")
//       .to("trust-seal:admin")
//       .emit("trustSealRequestDeleted", {
//         request_id,
//         user_id: trustSealRequest.user_id?.toString(),
//         merchantName: trustSealRequest.merchantName || "Unknown", // if you have it
//       });

//     return res.status(200).json({
//       success: true,
//       message: "Trust seal request deleted successfully",
//       deletedId: request_id,
//     });
//   } catch (error) {
//     console.error("Delete Trust Seal Request Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete trust seal request",
//       error: error.message,
//     });
//   }
// };

const TrustSealRequest = require("../models/trustSealRequestModel");
const TrustSealAssignment = require("../models/trustSealAssignModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Address = require("../models/addressModel");
const Merchant = require("../models/MerchantModel");
const User = require("../models/userModel");
const CommonSubscriptionPlan = require("../models/commonSubcriptionPlanModel");
const { default: mongoose } = require("mongoose");
const axios = require("axios");
const Role = require("../models/roleModel");
const subscriptionPlanSendEmail = require("../utils/subscriptionPlanSendEmail");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const Point = require("../models/pointsModel");
const PaymentHistory = require("../models/paymentHistoryModel");


exports.createTrustSealRequest = async (req, res) => {
  try {
    const { user_id, amount, subscription_id } = req.body;

    if (!user_id || !amount || !subscription_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Fetch Merchant Profile
    const merchant = await Merchant.findOne({ user_id });
    if (!merchant) {
      return res.status(400).json({
        success: false,
        message: "Please complete your business profile first.",
        action_required: "Go to Profile → Business Details",
        redirect_to: "/profile/business",
      });
    }

    // 2. Fetch Company Address
    const companyAddress = await Address.findOne({
      user_id,
      address_type: "company",
    });

    if (!companyAddress) {
      return res.status(400).json({
        success: false,
        message: "Company address is required",
        action_required: "Please add company address",
        redirect_to: "/profile/address?type=company",
      });
    }

    // 3. Validate required fields
    const requiredAddressFields = ["address_line_1", "city", "state", "pincode"];
    const missingAddress = requiredAddressFields.filter(
      (field) => !companyAddress[field]?.trim()
    );

    const companyName = (merchant.company_name || "").trim();
    const gstNumber = (merchant.gst_number || "").trim();

    const missingFields = [];
    if (!companyName) missingFields.push("company_name");
    if (missingAddress.length > 0) missingFields.push(...missingAddress);

    if (missingFields.length > 0) {
      const fieldLabels = {
        company_name: "Company Name",
        gst_number: "GST Number",
        address_line_1: "Address Line 1",
        city: "City",
        state: "State",
        pincode: "Pincode",
      };

      return res.status(400).json({
        success: false,
        message: "Incomplete business details",
        missing_fields: missingFields,
        action_required: `Please complete: ${missingFields
          .map((f) => fieldLabels[f] || f)
          .join(", ")}`,
      });
    }

    // 4. Validate active subscription
    const subscription = await UserSubscription.findOne({
      _id: subscription_id,
      user_id,
      status: "paid",
    }).populate("subscription_plan_id");

    if (!subscription) {
      return res.status(400).json({ message: "Invalid or inactive subscription" });
    }

    // 5. Prevent duplicate pending requests
    const existingRequest = await TrustSealRequest.findOne({
      user_id,
      status: { $in: [STATUS.PENDING, STATUS.STUDENT_VERIFIED, STATUS.UNDER_REVIEW] },
    });
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending Trust Seal request",
        existingRequestId: existingRequest._id,
        status: existingRequest.status,
      });
    }

    // 6. GST Calculation
    const gstPlan = await CommonSubscriptionPlan.findOne({
      name: "GST",
      category: "gst",
      durationType: "percentage",
    });

    if (!gstPlan) {
      return res.status(500).json({ message: "GST configuration not found" });
    }

    const gstPercentage = gstPlan.price !== undefined ? gstPlan.price : 18;
    const baseAmount = Number(amount);
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    // 7. Create Razorpay Order
    const receipt = `ts_${user_id.slice(-10)}_${Date.now().toString().slice(-9)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes: {
        purpose: "Trust Seal Request",
        user_id: user_id.toString(),
      },
    });

    // 8. ★★★ Create Payment History Record ★★★
    const paymentHistory = new PaymentHistory({
      user_id,
      payment_type: "trust_seal",

      trust_seal_id: null, // will be updated after trust seal is created
      user_subscription_id: subscription_id,

      razorpay_order_id: razorpayOrder.id,
      receipt,

      amount: baseAmount,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      currency: "INR",

      status: STATUS.CREATED, // will be updated to paid/failed later
      notes: `Trust Seal Request - ₹${totalAmount.toFixed(2)} incl GST`,
    });

    await paymentHistory.save();

    // 9. Create Trust Seal Request
    const trustSealRequest = new TrustSealRequest({
      user_id,
      subscription_id,
      amount: baseAmount,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      razorpay_order_id: razorpayOrder.id,
      status: STATUS.PENDING,
      isRead: false,
      payment_history_id: paymentHistory._id, // ← optional but very useful
    });

    await trustSealRequest.save();

    // 10. Update payment history with trust seal reference (two-way relation)
    paymentHistory.trust_seal_id = trustSealRequest._id;
    await paymentHistory.save();

    // 11. Notify admin (socket + SMS)
    // Fetch user info for notifications
    const user = await User.findById(user_id).select("name phone");
    const userName = user?.name || "Merchant";

    // 🔥 Emit real-time socket notification to all connected admins
    try {
      const io = global.io;
      if (io) {
        io.of("/trust-seal-notifications")
          .to("trust-seal:admin")
          .emit("newTrustSealRequest", {
            _id: trustSealRequest._id,
            user_id,
            merchantName: userName,
            amount: baseAmount,
            totalAmount,
            status: STATUS.PENDING,
            isRead: false,
            created_at: trustSealRequest.created_at || new Date(),
          });
      }
    } catch (socketErr) {
      console.error("⚠️ [TrustSeal] Socket emit failed:", socketErr.message);
    }

    // === SMS TO USER: REQUEST RECEIVED ===
    try {
      if (user?.phone) {
        const currentDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const smsText = `Dear ${userName}, your Trust Seal request for Rs. ${totalAmount.toFixed(2)} submitted on ${currentDate} has been received and is under review. – HUNTSWORLD`;

        const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=${encodeURIComponent(smsText)}`;
        await axios.get(smsApiUrl);
      }
    } catch (err) {
      console.error(`SMS failed for user`, err.message);
    }
    // 12. Final success response
    res.status(201).json({
      success: true,
      message: "Trust Seal request created. Proceed to payment.",
      order: razorpayOrder,
      trustSealRequest,
      paymentHistoryId: paymentHistory._id, // useful for frontend tracking
      gst: {
        percentage: gstPercentage,
        amount: gstAmount,
        total: totalAmount.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Trust Seal Request Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create trust seal request",
      error: error.message,
    });
  }
};

exports.verifyTrustSealPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay key secret is not configured");
    }

    // 1. Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature - possible tampering",
      });
    }

    // 2. Find the trust seal request
    const trustSealRequest = await TrustSealRequest.findOne({
      razorpay_order_id,
      status: STATUS.PENDING, // only process pending ones
    });
    if (!trustSealRequest) {
      return res.status(404).json({
        success: false,
        message: "Trust seal request not found or already processed",
      });
    }

    // 3. Update TrustSealRequest
    trustSealRequest.razorpay_payment_id = razorpay_payment_id;
    trustSealRequest.razorpay_signature = razorpay_signature;
    // trustSealRequest.status = "payment_verified";
    trustSealRequest.updated_at = new Date();

    await trustSealRequest.save();

    // 4. Update / Create PaymentHistory
    let paymentHistory = await PaymentHistory.findOne({
      razorpay_order_id,
      payment_type: "trust_seal",
    });

    if (paymentHistory) {
      // Update existing record
      paymentHistory.razorpay_payment_id = razorpay_payment_id;
      paymentHistory.razorpay_signature = razorpay_signature;
      paymentHistory.status = "paid";
      paymentHistory.captured = true;
      paymentHistory.paid_at = new Date();
      paymentHistory.payment_method = "razorpay"; // you can get from webhook later if needed
      await paymentHistory.save();
    } else {
      // Rare case - create if missing
      paymentHistory = new PaymentHistory({
        user_id: trustSealRequest.user_id,
        payment_type: "trust_seal",
        trust_seal_id: trustSealRequest._id,
        user_subscription_id: trustSealRequest.subscription_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: trustSealRequest.amount,
        gst_percentage: trustSealRequest.gst_percentage,
        gst_amount: trustSealRequest.gst_amount,
        total_amount: trustSealRequest.total_amount,
        currency: "INR",
        status: STATUS.PAID,
        captured: true,
        paid_at: new Date(),
        receipt: `trustseal_${trustSealRequest.user_id}_${Date.now()}`,
        notes: "Trust Seal Payment Verified",
      });
      await paymentHistory.save();
    }

    // 5. Fetch additional data for invoice & notifications
    const user = await User.findById(trustSealRequest.user_id).select("name email");
    const subscription = await UserSubscription.findById(trustSealRequest.subscription_id);
    const plan = subscription
      ? await SubscriptionPlan.findById(subscription.subscription_plan_id).select("plan_name")
      : null;

    const paidAt = trustSealRequest.updated_at.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const totalAmount = trustSealRequest.total_amount;

    // 6. Generate professional invoice HTML (improved version)
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Trust Seal Invoice</title>
      </head>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; margin:0; padding:0; background:#f9fafb;">
        <div style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding:40px 30px; text-align:center; color:white;">
            <h1 style="margin:0; font-size:28px;">Trust Seal Payment Invoice</h1>
            <p style="margin:8px 0 0; font-size:15px; opacity:0.9;">Payment Successful • Thank You!</p>
          </div>

          <!-- Content -->
          <div style="padding:30px;">
            <div style="margin-bottom:30px;">
              <h3 style="margin:0 0 12px; color:#1f2937; font-size:20px;">Payment Details</h3>
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Merchant Name</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;"><strong>${user?.name || "N/A"}</strong></td>
                </tr>
                <tr>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Plan</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">${plan?.plan_name || "Trust Seal Service"}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">Base Amount</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">₹${trustSealRequest?.amount?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#4b5563;">GST (${trustSealRequest?.gst_percentage}%)</td>
                  <td style="padding:12px 15px; border-bottom:1px solid #e5e7eb; color:#1f2937;">₹${(trustSealRequest?.gst_amount || 0).toFixed(2)}</td>
                </tr>
                <tr style="background:#f8fafc; font-weight:bold;">
                  <td style="padding:12px 15px; color:#1f2937;">Total Paid</td>
                  <td style="padding:12px 15px; color:#1f2937;">₹${totalAmount?.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom:30px;">
              <h3 style="margin:0 0 12px; color:#1f2937; font-size:20px;">Transaction Info</h3>
              <p style="margin:6px 0; color:#4b5563; font-size:14px;">
                <strong>Payment ID:</strong> ${razorpay_payment_id}<br>
                <strong>Order ID:</strong> ${razorpay_order_id}<br>
                <strong>Date:</strong> ${paidAt}
              </p>
            </div>

            <div style="text-align:center; margin:30px 0;">
              <a href="https://yourdomain.com/support"
                 style="display:inline-block; padding:12px 32px; background:#4f46e5; color:white; text-decoration:none; border-radius:8px; font-size:15px; font-weight:500;">
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
    // 7. Send invoice email (Safely)
    let emailSent = false;
    if (user?.email) {
      try {
        await subscriptionPlanSendEmail(user.email, "Trust Seal Payment Invoice", invoiceHtml);
        emailSent = true;
      } catch (emailErr) {
        console.error("Non-critical Email Error:", emailErr.message);
      }
    }

    // 8. Notify admins via socket (Safely)
    try {
      if (global.io) {
        global.io.of("/trust-seal-notifications").to("trust-seal:admin").emit("trustSealPaymentVerified", {
          _id: trustSealRequest._id,
          user_id: trustSealRequest.user_id,
          merchantName: user?.name || "Unknown",
          amount: trustSealRequest.total_amount,
          paymentId: razorpay_payment_id,
          paidAt,
          status: STATUS.PAYMENT_VERIFIED,
        });
      }
    } catch (socketErr) {
      console.error("Socket notification failed:", socketErr.message);
    }

    // 9. Final success response
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      trustSealRequest,
      paymentHistory,
      invoiceSent: emailSent,
    });

  } catch (error) {
    console.error("Trust Seal Payment Verification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message, // This is where "Failed to send email" was coming from
    });
  }
};

exports.getTrustSealRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      startDate,
      endDate
    } = req.query;

    const query = {};
    // === Status Filter ===
    // Only this part matters – make sure it's exactly like this:
    if (status && status !== "all" && status !== "read" && status !== "unread") {
      query.status = status;
    }
    if (status === "read") query.isRead = true;
    if (status === "unread") query.isRead = false;

    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    const total = await TrustSealRequest.countDocuments(query);

    const trustSealRequests = await TrustSealRequest.find(query)
      .populate({
        path: "user_id",
        select: "name email phone role",
        populate: {
          path: "role",
          select: "role",
        },
      })
      .populate("picked_by", "name email phone")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ isRead: 1, created_at: -1 })
      .lean();

    // Enrich with Merchant and Address details
    const formattedRequests = await Promise.all(
      trustSealRequests.map(async (request) => {
        const userId = request.user_id?._id || request.user_id;

        // Fetch Merchant details
        const merchant = await Merchant.findOne({ user_id: userId }).lean();

        // Fetch Company Address
        const address = await Address.findOne({
          user_id: userId,
          entity_type: "merchant",
          address_type: "company",
        }).lean();

        return {
          ...request,
          merchantName: request.user_id?.name || "Unknown",
          personal_email: request.user_id?.email || "N/A",
          personal_phone: request.user_id?.phone || "N/A",
          roleName: request.user_id?.role?.role || "N/A",
          picked_by_name: request.picked_by?.name || "N/A",
          seller_company_details: merchant || {},
          seller_address: address || {},
        };
      })
    );

    // THIS IS THE EXACT PLACE TO PASTE
    res.status(200).json({
      success: true,
      data: formattedRequests,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get Trust Seal Requests Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trust seal requests",
      error: error.message || "Internal server error",
    });
  }
};

exports.updateTrustSealRequestStatus = async (req, res) => {
  try {
    const { request_id, status, notes } = req.body;

    if (!request_id || !status) {
      return res.status(400).json({
        message: "Request ID and status are required",
      });
    }

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be verified or rejected",
      });
    }

    const trustSealRequest = await TrustSealRequest.findById(request_id);

    if (!trustSealRequest) {
      return res.status(404).json({
        message: "Trust seal request not found",
      });
    }

    /* ==========================
       HANDLE REJECTION
    =========================== */
    if (status === "rejected") {
      trustSealRequest.status = "rejected";
      trustSealRequest.notes = notes || "";
      trustSealRequest.issueDate = null;
      trustSealRequest.expiryDate = null;
      trustSealRequest.isRead = true;
      trustSealRequest.updated_at = Date.now();

      await trustSealRequest.save();

      // 🔥 REJECTION SMS
      try {
        const user = await User.findById(trustSealRequest.user_id)
          .select("name phone");

        if (user && user.phone) {
          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const smsText = `Dear ${user.name} your Trust Seal payment of Rs ${trustSealRequest.amount} dated ${currentDate} has been rejected due to verification issues. Please contact admin or support for further assistance. – HUNTSWORLD`;

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=${encodeURIComponent(smsText)}`;

          await axios.get(smsApiUrl);
        }
      } catch (smsError) {
        console.error("Trust Seal rejection SMS failed:", smsError.message);
      }
    }

    /* ==========================
       HANDLE VERIFICATION
    =========================== */
    if (status === "verified") {
      const durationConfig = await Point.findOne({
        point_name: "Trust_Seal_Duration",
      });

      if (!durationConfig) {
        return res.status(500).json({
          message:
            "Trust Seal duration configuration not found in Points table",
        });
      }

      const duration = Number(durationConfig.time_duration);
      const unit = durationConfig.time_unit.toLowerCase();

      if (!duration || duration <= 0) {
        return res.status(400).json({
          message: "Invalid trust seal duration configuration",
        });
      }

      const issueDate = new Date();
      const expiryDate = new Date(issueDate);

      switch (unit) {
        case "seconds":
          expiryDate.setSeconds(expiryDate.getSeconds() + duration);
          break;
        case "minutes":
          expiryDate.setMinutes(expiryDate.getMinutes() + duration);
          break;
        case "hours":
          expiryDate.setHours(expiryDate.getHours() + duration);
          break;
        case "month":
          expiryDate.setMonth(expiryDate.getMonth() + duration);
          break;
        case "year":
          expiryDate.setFullYear(expiryDate.getFullYear() + duration);
          break;
        default:
          return res.status(400).json({
            message: `Unsupported time unit: ${unit}`,
          });
      }

      trustSealRequest.status = "verified";
      trustSealRequest.notes = notes || "";
      trustSealRequest.issueDate = issueDate;
      trustSealRequest.expiryDate = expiryDate;
      trustSealRequest.isRead = true;
      trustSealRequest.updated_at = Date.now();

      await trustSealRequest.save();

      // 🔥 VERIFIED SMS
      try {
        const user = await User.findById(trustSealRequest.user_id)
          .select("name phone");

        if (user && user.phone) {
          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const smsText = `Dear ${user.name},your Trust Seal payment of Rs ${trustSealRequest.amount} has been successfully verified on ${currentDate}. Your profile is now marked as verified. - HUNTSWORLD`;

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=${encodeURIComponent(smsText)}`;

          await axios.get(smsApiUrl);
        }
      } catch (smsError) {
        console.error("Trust Seal verification SMS failed:", smsError.message);
      }
    }

    /* ==========================
       SOCKET NOTIFICATION
    =========================== */
    global.io
      .of("/trust-seal-notifications")
      .to(`trust-seal:${trustSealRequest.user_id}`)
      .emit("trustSealRequestUpdated", {
        _id: trustSealRequest._id,
        user_id: trustSealRequest.user_id,
        amount: trustSealRequest.amount,
        status: trustSealRequest.status,
        isRead: trustSealRequest.isRead,
        notes: trustSealRequest.notes,
        issueDate: trustSealRequest.issueDate,
        expiryDate: trustSealRequest.expiryDate,
        updated_at: trustSealRequest.updated_at,
        merchantName: req.user?.name || "Unknown Merchant",
      });

    return res.status(200).json({
      message: "Trust seal request updated successfully",
      trustSealRequest,
    });

  } catch (error) {
    console.error("Update Trust Seal Request Error:", error);
    return res.status(500).json({
      message: "Failed to update trust seal request",
      error: error.message,
    });
  }
};

// exports.getUserTrustSealStatus = async (req, res) => {
//   try {
//     const { user_id } = req.params;

//     let trustSealRequest = await TrustSealRequest.findOne({
//       user_id,
//       status: { $in: ["pending", "verified", "expired"] },
//     }).sort({ created_at: -1 });

//     if (trustSealRequest && trustSealRequest.status === 'verified' && new Date(trustSealRequest.expiryDate) < new Date()) {
//       trustSealRequest.status = 'expired';
//       await trustSealRequest.save();
//     }

//     res.status(200).json({ trustSealRequest });
//   } catch (error) {
//     console.error("Get User Trust Seal Status Error:", error);
//     res.status(500).json({
//       message: "Failed to fetch trust seal status",
//       error: error.message,
//     });
//   }
// };

// In TrustSealRequestApi.js or controller file

exports.getUserTrustSealStatus = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Find the most recent active/verified/pending request
    let trustSealRequest = await TrustSealRequest.findOne({
      user_id,
      status: { $in: [STATUS.PENDING, STATUS.VERIFIED] },
    })
      .sort({ created_at: -1 });

    if (!trustSealRequest) {
      return res.status(200).json({ trustSealRequest: null });
    }

    // Auto-expire if verified but date has passed
    if (
      trustSealRequest.status === 'verified' &&
      trustSealRequest.expiryDate &&
      new Date(trustSealRequest.expiryDate) < new Date()
    ) {
      trustSealRequest.status = 'expired';
      await trustSealRequest.save();

      // Emit update via socket
      global.io
        ?.of('/trust-seal-notifications')
        ?.to(`trust-seal:${user_id}`)
        ?.emit('trustSealRequestUpdated', {
          _id: trustSealRequest._id,
          status: STATUS.EXPIRED,
          expiryDate: trustSealRequest.expiryDate,
        });
    }

    res.status(200).json({ trustSealRequest });
  } catch (error) {
    console.error('Get User Trust Seal Status Error:', error);
    res.status(500).json({
      message: 'Failed to fetch trust seal status',
      error: error.message,
    });
  }
};
exports.markTrustSealNotificationAsRead = async (req, res) => {
  try {
    const { request_id } = req.body;

    if (!request_id) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    const trustSealRequest = await TrustSealRequest.findByIdAndUpdate(
      request_id,
      { isRead: true },
      { new: true }
    );

    if (!trustSealRequest) {
      return res.status(404).json({ message: "Trust seal request not found" });
    }

    // Notify admin of read status
    global.io
      .of("/trust-seal-notifications")
      .to("trust-seal:admin")
      .emit("trustSealNotificationRead", {
        _id: trustSealRequest._id,
        isRead: trustSealRequest.isRead,
      });

    res
      .status(200)
      .json({ message: "Notification marked as read", trustSealRequest });
  } catch (error) {
    console.error("Mark Trust Seal Notification As Read Error:", error);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

exports.updateTrustSealImages = async (req, res) => {
  try {
    const { request_id, imageUrls } = req.body;

    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ message: "No image URLs provided" });
    }

    const trustSealRequest = await TrustSealRequest.findById(request_id);

    if (!trustSealRequest) {
      return res.status(404).json({ message: "Trust seal request not found" });
    }

    if (trustSealRequest.status !== "in_process") {
      return res.status(400).json({ message: "Request not in process" });
    }

    trustSealRequest.images = imageUrls;
    trustSealRequest.status = "student_verified";
    await trustSealRequest.save();

    res.status(200).json({
      message: "Images updated successfully",
      data: trustSealRequest,
    });
  } catch (error) {
    console.error("Update Trust Seal Images Error:", error);
    res.status(500).json({ message: error.message });
  }
};
// Pick trust seal request
exports.pickTrustSealRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { student_id } = req.body;

    const trustSealRequest = await TrustSealRequest.findById(request_id);

    if (!trustSealRequest) {
      return res.status(404).json({ message: "Trust seal request not found" });
    }

    if (trustSealRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request already picked or processed" });
    }

    trustSealRequest.status = "in_process";
    trustSealRequest.picked_by = student_id;
    await trustSealRequest.save();

    res.status(200).json({
      message: "Trust seal request picked successfully",
      data: trustSealRequest,
    });
  } catch (error) {
    console.error("Pick Trust Seal Request Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.deleteTrustSealRequest = async (req, res) => {
  try {
    const { request_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(request_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID format",
      });
    }

    const trustSealRequest = await TrustSealRequest.findById(request_id);

    if (!trustSealRequest) {
      return res.status(404).json({
        success: false,
        message: "Trust seal request not found",
      });
    }

    // ────────────────────────────────────────────────
    //   REMOVED: the status protection block
    // ────────────────────────────────────────────────

    // Delete the record
    await TrustSealRequest.findByIdAndDelete(request_id);

    // Optional: clean up linked payment history (still safe to keep)
    if (trustSealRequest.payment_history_id) {
      await PaymentHistory.findByIdAndDelete(trustSealRequest.payment_history_id).catch(() => {
        // silent fail
      });
    }

    // Notify other admins (still useful)
    global.io
      .of("/trust-seal-notifications")
      .to("trust-seal:admin")
      .emit("trustSealRequestDeleted", {
        request_id,
        user_id: trustSealRequest.user_id?.toString(),
        merchantName: trustSealRequest.merchantName || "Unknown", // if you have it
      });

    return res.status(200).json({
      success: true,
      message: "Trust seal request deleted successfully",
      deletedId: request_id,
    });
  } catch (error) {
    console.error("Delete Trust Seal Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete trust seal request",
      error: error.message,
    });
  }
};

exports.getTrustSealRequestsByPincode = async (req, res) => {
  try {
    const { student_id } = req.params;

    // Step 1: Get student's address to determine their location
    let studentAddress = await Address.findOne({
      user_id: student_id,
      address_type: "company",
      entity_type: "student",
    });

    if (!studentAddress) {
      studentAddress = await Address.findOne({
        user_id: student_id,
        address_type: "personal",
        entity_type: "student",
      });
    }

    if (!studentAddress) {
      return res.status(404).json({
        message:
          "Student address not found. Kindly fill your address to see the trust seal requests.",
      });
    }

    const studentPincode = studentAddress.pincode;
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // Step 2: Fetch all explicit assignments for this student (Admin Assigned)
    const assignments = await TrustSealAssignment.find({ student_id }).select("request_id").lean();
    const assignedRequestIds = assignments.map((a) => a.request_id.toString());

    // Step 3: Identify merchants in the student's area (Exact or Nearby)
    const localMerchantAddresses = await Address.find({
      address_type: { $in: ["company", "personal"] },
      entity_type: "merchant",
      $or: [
        { pincode: studentPincode },
        {
          pincode: {
            $gte: String(parseInt(studentPincode) - 10).padStart(6, "0"),
            $lte: String(parseInt(studentPincode) + 10).padStart(6, "0"),
          },
        },
      ],
    }).select("user_id pincode").lean();

    const localMerchantUserIds = localMerchantAddresses.map((addr) => addr.user_id.toString());
    const trustSealRequests = await TrustSealRequest.find({
      $or: [
        { _id: { $in: assignedRequestIds } },
        { user_id: { $in: localMerchantUserIds }, status: STATUS.PENDING },
        { picked_by: student_id, status: { $in: [STATUS.IN_PROCESS, STATUS.STUDENT_VERIFIED] } }
      ]
    }).lean();

    if (!trustSealRequests.length) {
      return res.status(200).json({
        message: "No trust seal requests found",
        data: [],
      });
    }

    // Step 5: Consolidate User IDs for all matched requests
    const matchedUserIds = [...new Set(trustSealRequests.map((r) => r.user_id.toString()))];

    // Step 6: Fetch all required details for the matched merchants
    const [allAddresses, allMerchants, allUsers] = await Promise.all([
      Address.find({
        user_id: { $in: matchedUserIds },
        address_type: { $in: ["company", "personal"] },
        entity_type: "merchant",
      }).lean(),
      Merchant.find({ user_id: { $in: matchedUserIds } }).lean(),
      User.find({ _id: { $in: matchedUserIds } }).select("name email phone").lean()
    ]);

    // Step 7: Create lookup maps
    const addressMap = {};
    allAddresses.forEach((addr) => {
      const userId = addr.user_id.toString();
      // Prioritize company address if both exist
      if (!addressMap[userId] || addr.address_type === "company") {
        addressMap[userId] = addr;
      }
    });

    const merchantMap = {};
    allMerchants.forEach((m) => (merchantMap[m.user_id.toString()] = m));

    const userMap = {};
    allUsers.forEach((u) => (userMap[u._id.toString()] = u));

    // Step 8: Final Filtering and Data Attachment
    const filteredRequests = trustSealRequests
      .map((req) => {
        const requestIdStr = req._id.toString();
        const userId = req.user_id.toString();
        const requestPincode = addressMap[userId]?.pincode;

        const isAdminAssigned = assignedRequestIds.includes(requestIdStr);
        const isPickedByMe = req.picked_by && req.picked_by.toString() === student_id.toString();
        const isNotPicked = !req.picked_by;
        const isSamePincode = requestPincode === studentPincode;
        const isOlderThanTwoDays = new Date(req.created_at) <= twoDaysAgo;

        let shouldInclude = false;

        // Condition for visibility:
        // 1. If explicitly assigned by admin -> ALWAYS INCLUDE (bypass location)
        // 2. If already picked by me -> ALWAYS INCLUDE
        // 3. If Discoverable (Pending and matches location rules) -> INCLUDE
        if (isAdminAssigned || isPickedByMe) {
          shouldInclude = true;
        } else if (isNotPicked) {
          if (isSamePincode || isOlderThanTwoDays) {
            shouldInclude = true;
          }
        }

        if (shouldInclude) {
          return {
            ...req,
            seller_company_details: merchantMap[userId] || {},
            seller_user_info: userMap[userId] || {},
            request_pincode: requestPincode,
          };
        }
        return null;
      })
      .filter((req) => req !== null);

    res.status(200).json({
      message: "Trust seal requests retrieved successfully",
      data: filteredRequests,
    });
  } catch (error) {
    console.error("Get Trust Seal Requests Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.adminVerifyTrustSealRequest = async (req, res) => {
  try {
    const { request_id, status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'verified' or 'rejected'.",
      });
    }

    const trustSealRequest = await TrustSealRequest.findById(request_id);

    if (!trustSealRequest) {
      return res.status(404).json({ message: "Trust seal request not found" });
    }

    if (trustSealRequest.status !== "student_verified") {
      return res.status(400).json({
        message: "Request must be in 'student_verified' status to proceed",
      });
    }

    /* =======================
       HANDLE REJECTION
    ======================== */
    if (status === "rejected") {
      trustSealRequest.status = "rejected";
      trustSealRequest.issueDate = null;
      trustSealRequest.expiryDate = null;
      await trustSealRequest.save();

      global.io
        ?.of("/trust-seal-notifications")
        ?.to(`trust-seal:${trustSealRequest.user_id}`)
        ?.emit("trustSealRequestUpdated", {
          _id: trustSealRequest._id,
          status: STATUS.REJECTED,
        });

      // 🔥 REJECTION SMS
      try {
        const user = await User.findById(trustSealRequest.user_id)
          .select("name phone");

        if (user && user.phone) {
          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const smsText = `Dear ${user.name} your Trust Seal payment of Rs ${trustSealRequest.amount} dated ${currentDate} has been rejected due to verification issues. Please contact admin or support for further assistance. – HUNTSWORLD`;

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=${encodeURIComponent(smsText)}`;

          await axios.get(smsApiUrl);
        }
      } catch (smsError) {
        console.error("Trust Seal rejection SMS failed:", smsError.message);
      }

      return res.status(200).json({
        message: "Trust seal request rejected successfully",
        data: trustSealRequest,
      });
    }

    /* =======================
       HANDLE VERIFICATION
    ======================== */
    if (status === "verified") {
      // ✅ Correct point_name match
      const durationConfig = await Point.findOne({
        point_name: "Trust_Seal_Duration",
      });

      if (!durationConfig) {
        return res.status(500).json({
          message:
            "Trust Seal duration configuration not found in Points table.",
        });
      }

      const duration = Number(durationConfig.time_duration);
      const unit = durationConfig.time_unit.toLowerCase();

      if (!duration || duration <= 0) {
        return res.status(400).json({
          message: "Invalid trust seal duration configuration",
        });
      }

      const issueDate = new Date();
      const expiryDate = new Date(issueDate);

      // ✅ Dynamic expiry calculation
      switch (unit) {
        case "seconds":
          expiryDate.setSeconds(expiryDate.getSeconds() + duration);
          break;

        case "minutes":
          expiryDate.setMinutes(expiryDate.getMinutes() + duration);
          break;

        case "hours":
          expiryDate.setHours(expiryDate.getHours() + duration);
          break;

        case "month":
          expiryDate.setMonth(expiryDate.getMonth() + duration);
          break;

        case "year":
          expiryDate.setFullYear(expiryDate.getFullYear() + duration);
          break;

        default:
          return res.status(400).json({
            message: `Unsupported time unit: ${unit}`,
          });
      }

      // Save trust seal details
      trustSealRequest.status = "verified";
      trustSealRequest.issueDate = issueDate;
      trustSealRequest.expiryDate = expiryDate;

      await trustSealRequest.save();

      // Notify merchant
      global.io
        ?.of("/trust-seal-notifications")
        ?.to(`trust-seal:${trustSealRequest.user_id}`)
        ?.emit("trustSealRequestUpdated", {
          _id: trustSealRequest._id,
          status: STATUS.VERIFIED,
          issueDate,
          expiryDate,
        });

      // 🔥 VERIFIED SMS
      try {
        const user = await User.findById(trustSealRequest.user_id)
          .select("name phone");

        if (user && user.phone) {
          const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const smsText = `Dear ${user.name},your Trust Seal payment of Rs ${trustSealRequest.amount} has been successfully verified on ${currentDate}. Your profile is now marked as verified. - HUNTSWORLD`;

          const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=${encodeURIComponent(smsText)}`;

          await axios.get(smsApiUrl);
        }
      } catch (smsError) {
        console.error("Trust Seal verification SMS failed:", smsError.message);
      }

      return res.status(200).json({
        message: "Trust seal request verified successfully",
        data: trustSealRequest,
      });
    }
  } catch (error) {
    console.error("Admin Verify Trust Seal Request Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getAllActiveTrustSealUsers = async (req, res) => {
  const { page = 1, limit = 10, status = "verified" } = req.query;

  const query = { status };

  const total = await TrustSealRequest.countDocuments(query);
  const requests = await TrustSealRequest.find(query)
    .populate("user_id", "name email phone avatarUrl")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ updated_at: -1 });

  res.json({
    data: requests,
    total,
    page: Number(page),
    limit: Number(limit),
  });
};

exports.getTrustSealPrice = async (req, res) => {
  try {
    const product = await CommonSubscriptionPlan.findOne({
      name: "Trust seal",
      category: "wallet",
      durationType: "one_time",
    });

    const durationConfig = await Point.findOne({
      point_name: "trust_seal_duration",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        price: product.price,
        duration: durationConfig?.time_duration,
        unit: durationConfig?.time_unit,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getMerchantTrustSealDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Assuming route is /api/trust-seal/details/:userId

    // Find merchant by user_id
    const merchant = await Merchant.findOne({ user_id: userId }).exec();
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    // Get address by address_id with specific conditions
    let address = await Address.findOne({
      user_id: merchant.user_id,
      entity_type: { $in: ["merchant", "service_provider"] },
      address_type: "company",
    }).exec();

    // Fallback to personal if company not found
    if (!address) {
      address = await Address.findOne({
        user_id: merchant.user_id,
        entity_type: { $in: ["merchant", "service_provider"] },
        address_type: "personal",
      }).exec();
    }

    if (!address) {
      return res.status(404).json({ message: "Merchant address not found" });
    }

    // Construct the full address
    const fullAddress = `${address.address_line_1}${address.address_line_2 ? `, ${address.address_line_2}` : ""
      }, ${address.city}, ${address.state}, ${address.country}, ${address.pincode
      }`;

    // Prepare the response details
    const details = {
      companyName: merchant.company_name,
      director: merchant.company_name, // Assuming director is not explicitly stored; use company_name as fallback
      gstin: merchant.gst_number || "N/A", // Using gst_number as gstin
      iec: "N/A", // IEC not present in schema, set to N/A or fetch from another source if available
      address: {
        fullAddress,
      },
      companyPhone: merchant.company_phone_number,
      companyEmail: merchant.company_email,
      msmeCertificateNumber: merchant.msme_certificate_number || "N/A",
      pan: merchant.pan || "N/A",
      aadhar: merchant.aadhar,
      verifiedStatus: merchant.verified_status,
      trustshield: merchant.trustshield,
      companyType: merchant.company_type,
      numberOfEmployees: merchant.number_of_employees,
      yearOfEstablishment: merchant.year_of_establishment,
    };

    res.status(200).json(details);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//check trust seal exist for the merchant

exports.checkTrustSealRequest = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // ✅ Check both user_id and verified status
    const existingRequest = await TrustSealRequest.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
      status: STATUS.VERIFIED,
    });

    if (existingRequest) {
      return res.status(200).json({
        exists: true,
        request: existingRequest, // full details if you want them
      });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking trust seal request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.checkTrustSealStatus = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Find the most recent verified trust seal request for this user
    let trustSealRequest = await TrustSealRequest.findOne({ 
      user_id,
      status: 'verified' 
    }).sort({ created_at: -1 });

    if (!trustSealRequest) {
      return res.status(200).json({ status: null, data: null });
    }

    // Check for expiration
    if (trustSealRequest.expiryDate && new Date(trustSealRequest.expiryDate) < new Date()) {
      // Auto-update status to expired if the date has passed
      trustSealRequest.status = 'expired';
      await trustSealRequest.save();

      return res.status(200).json({ 
        status: 'expired', 
        data: null 
      });
    }

    return res.status(200).json({ 
      status: trustSealRequest.status, 
      data: trustSealRequest 
    });
  } catch (error) {
    console.error("Error checking trust seal status:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTrustSealRequestDetails = async (req, res) => {
  const { id } = req.params;

  const trustSealRequest = await TrustSealRequest.findById(id)
    .populate("user_id", "name email")
    .populate("subscription_id", "plan_name") // Assuming UserSubscription has a plan_name
    .lean();

  if (!trustSealRequest) {
    res.status(404);
    throw new Error("Trust seal request not found");
  }
  if (!req.user?.role) {
    res.status(403);
    throw new Error("Not authorized to view this trust seal request");
  }

  res.status(200).json({
    success: true,
    data: {
      ...trustSealRequest,
      merchantName: trustSealRequest.user_id?.name || "Unknown",
    },
  });
};

// controllers/trustSealRequestController.js (or wherever it is)
exports.getMyVerifiedCompanies = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "student_id is required",
      });
    }

    // Find all verified requests picked by this student
    const verifiedRequests = await TrustSealRequest.find({
      picked_by: student_id,
      status: STATUS.VERIFIED,
    })
      .select("user_id amount issueDate expiryDate") // Only needed fields
      .lean();

    if (verifiedRequests.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Extract merchant user_ids
    const merchantUserIds = verifiedRequests.map((req) => req.user_id);

    // Fetch all merchants in one query
    const merchants = await Merchant.find({
      user_id: { $in: merchantUserIds },
    })
      .select("user_id company_name gst_number")
      .lean();

    // Create lookup map: user_id → merchant details
    const merchantMap = {};
    merchants.forEach((m) => {
      merchantMap[m.user_id.toString()] = {
        company_name: m.company_name || "Unknown Company",
        gst_number: m.gst_number || "N/A",
      };
    });

    // Enrich requests with merchant data
    const enrichedRequests = verifiedRequests.map((request) => {
      const merchantInfo = merchantMap[request.user_id.toString()] || {
        company_name: "Unknown Company",
        gst_number: "N/A",
      };

      // Also populate merchant name from populated user (if you still want it)
      // But since we don't populate User here, we skip merchant_name or set fallback
      return {
        _id: request._id,
        company_name: merchantInfo.company_name,
        gst_number: merchantInfo.gst_number,
        merchant_name: "N/A", // optional - can remove column if not needed
        amount: request.amount,
        issueDate: request.issueDate,
        expiryDate: request.expiryDate,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedRequests,
    });
  } catch (error) {
    console.error("Get My Verified Companies Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
