const ProductQuote = require("../models/productQuoteModel");
const Product = require("../models/productModel");
const ViewPoint = require("../models/viewPointsModel");
const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const cron = require("node-cron");
const User = require("../models/userModel");
const mongoose = require('mongoose');
const Message = require("../models/messageModel");
const axios = require("axios");



exports.createQuote = async (req, res) => {
  try {
    const { productId, quantity, unit, phoneNumber, matchQuotes, userId } = req.body;

    // 1. Find the product
    const product = await Product.findById(productId).populate("seller_id", "name");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productOwnerId = product.seller_id;

    // 2. Find ownerUserId (Merchant or ServiceProvider → User)
    let ownerUserId = null;
    const merchant = await Merchant.findOne({ _id: productOwnerId });
    if (merchant?.user_id) {
      ownerUserId = merchant.user_id;
    } else {
      const serviceProvider = await ServiceProvider.findOne({ _id: productOwnerId });
      if (serviceProvider?.user_id) {
        ownerUserId = serviceProvider.user_id;
      }
    }

    if (!ownerUserId) {
      return res.status(400).json({ message: "Product owner user not found" });
    }

    // 2.1 Block self-enquiry
    if (userId.toString() === ownerUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot send an enquiry for your own product.",
      });
    }

    // 3. Save the quote
    const newQuote = new ProductQuote({
      productId,
      quantity,
      unit,
      phoneNumber,
      matchQuotes,
      userId,
      productOwnerId,
    });
    await newQuote.save();

    // ALWAYS SEND AUTO REQUIREMENT MESSAGE (No conversation check!)
    const io = global.io?.of("/messages");
    const onlineUsers = req.app.get("onlineUsers") || new Map();

    // Fetch sender & receiver details
    const [senderUser, receiverUser] = await Promise.all([
      User.findById(userId).select("name profile_pic").lean(),
      User.findById(ownerUserId).select("name profile_pic").lean(),
    ]);

    const autoMessageContent = `
<div style="border-left:5px solid #4361ee;background:linear-gradient(135deg,#f8f9ff,#eef0ff);border-radius:12px;padding:16px;margin:10px 0;max-width:340px;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 4px 16px rgba(67,97,238,.15);border:1px solid #e0e7ff">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <div style="background:#4361ee;color:white;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:bold">NEW REQUIREMENT</div>
    <span style="font-size:11px;color:#888">Just Now</span>
  </div>
  <h3 style="margin:8px 0;font-size:16px;color:#1a1a1a;font-weight:600">
    ${product.product_name || "Product Inquiry"}
  </h3>
  <div style="font-size:14px;color:#2d3748;line-height:1.7;background:#fff;padding:12px;border-radius:8px;border:1px dashed #e0e7ff">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span style="color:#666">Quantity Needed</span>
      <strong>${quantity} ${unit}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px dashed #ddd">
      <span style="color:#666">Contact</span>
      <strong style="color:#4361ee">${phoneNumber}</strong>
    </div>
  </div>
  <div style="margin-top:16px;text-align:center">
    <a href="tel:${phoneNumber}" style="background:#4361ee;color:white;text-decoration:none;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:bold;display:inline-block;box-shadow:0 4px 12px rgba(67,97,238,.3)">
      Call Now
    </a>
  </div>
</div>
`.trim();

    // SAVE MESSAGE TO DB (Always!)
    let savedMessage;
    try {
      const newMessage = new Message({
        sender: userId,
        receiver: ownerUserId,
        content: autoMessageContent,
        read: false,
        deleted: false,
      });
      savedMessage = await newMessage.save();
    } catch (err) {
      console.error("Failed to save auto message:", err.message);
    }

    // SEND VIA SOCKET.IO if online
    if (savedMessage && io) {
      const messageObject = {
        _id: savedMessage._id,
        sender: userId,
        receiver: ownerUserId,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        read: false,
        deleted: false,
        senderUser: senderUser || { name: "User", profile_pic: null },
        receiverUser: receiverUser || { name: "Seller", profile_pic: null },
        isAutoRequirement: true,
      };

      // To product owner
      const receiverSocketId = onlineUsers.get(ownerUserId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messageObject);
      }

      // To buyer (for their chat history)
      const senderSocketId = onlineUsers.get(userId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", { ...messageObject, fromMe: true });
      }
    }

    // ── SMS Notification to Product Owner ──
    try {
      // Step 1: Resolve owner phone
      // ownerUserId = the User._id of the product owner
      let ownerPhone = null;
      const ownerAsUser = await User.findById(ownerUserId).select("phone").lean();
      if (ownerAsUser?.phone) {
        ownerPhone = ownerAsUser.phone;
      } else {
        // Fallback: get company_phone_number from the Merchant record
        const ownerMerchant = await Merchant.findById(productOwnerId).select("company_phone_number").lean();
        if (ownerMerchant?.company_phone_number) {
          ownerPhone = ownerMerchant.company_phone_number;
        }
      }

      if (ownerPhone) {
        // Step 2: Get buyer name from User model
        const buyerUser = await User.findById(userId).select("name").lean();
        const buyerName = buyerUser?.name || "A customer";

        // Step 4: Build SMS text (DLT registered template)
        const productName = product.product_name || "a product";
        const smsText = `User ${buyerName} has shown interest in the product ${productName}. You may reach them at ${phoneNumber}. Team HUNTSWORLD`;

        const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${ownerPhone}&text=${encodeURIComponent(smsText)}`;
        const smsResponse = await axios.get(smsApiUrl);
      } else {
        console.warn("⚠️ Product owner phone not found — SMS not sent.");
      }
    } catch (smsErr) {
      console.error("❌ SMS notification failed (non-blocking):", smsErr.message);
    }

    // Success response
    res.status(201).json({
      success: true,
      message: "Quote created & requirement sent!",
      quote: newQuote,
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Get all quotes (optionally filter by productOwnerId) with pagination
exports.getQuotes = async (req, res) => {
  try {
    const { ownerId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await ProductQuote.aggregate([
      // 🔹 Join Product
      {
        $lookup: {
          from: "products", 
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 🔹 Match seller
      {
        $match: {
          "product.seller_id": new mongoose.Types.ObjectId(ownerId),
        },
      },

      // 🔹 Join User
      {
        $lookup: {
          from: "users",
          localField: "userId",
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

      // 🔹 Facet for pagination and total count
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                quantity: 1,
                unit: 1,
                phoneNumber: 1,
                matchQuotes: 1,
                respondedAt: 1,
                processed: 1,
                pointsGiven: 1,
                createdAt: 1,
                productId: 1,
                product_name: {
                  $ifNull: ["$product.product_name", "$product.name"],
                },
                user: {
                  _id: "$user._id",
                  name: "$user.name",
                  email: "$user.email",
                },
              },
            },
          ],
        },
      },
    ]);

    const quotes = result[0].data;
    const totalRecords = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      message: "Quotes fetched successfully",
      quote: quotes,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get single quote by ID
exports.getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await ProductQuote.findById(id)
      .populate("productId", "name")
      .populate("userId", "name email");

    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fetch Quotes Successfully",
      quote: quote,
    });
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update quote by ID
exports.updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const quote = await ProductQuote.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Quote updated successfully", quote });
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete quote by ID
exports.deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await ProductQuote.findByIdAndDelete(id);

    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Quote deleted successfully" });
  } catch (error) {
    console.error("Error deleting quote:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// respond to user
exports.respondToQuote = async (req, res) => {
  try {
    const { quoteId } = req.body;
    const userId = req.user.userId;

    // Find merchant
    const merchant = await Merchant.findOne({ user_id: userId });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found for this user",
      });
    }

    const sellerId = merchant._id;

    // Find quote
    const quote = await ProductQuote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    // Check owner
    if (quote.productOwnerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You are not the product owner",
      });
    }

    // Find or create ViewPoint
    let viewPoint = await ViewPoint.findOne({ user_id: userId });
    if (!viewPoint) {
      viewPoint = new ViewPoint({ user_id: userId, view_points: 0 });
    }

    // ------------------------------
    // 💡 Prevent Duplicate Points
    // ------------------------------

    // Only process points if NOT already processed for this quote
    if (!quote.pointsGiven) {
      quote.respondedAt = new Date();
      const createdAt = quote.createdAt;
      const respondedAt = quote.respondedAt;

      const timeDiffInHours = (respondedAt - createdAt) / (1000 * 60 * 60);
      const timeDiffInDays = timeDiffInHours / 24;

      // Give or deduct points only once
      if (timeDiffInDays <= 2) {
        viewPoint.view_points += 5; // respond within 2 days
      } else {
        viewPoint.view_points = Math.max(0, viewPoint.view_points - 2); // respond after 2 days
      }

      quote.pointsGiven = true; // <--- VERY IMPORTANT
    }

    quote.processed = true;
    await quote.save();

    // -------------------------------
    // 🔍 Handle Unanswered Old Quotes
    // -------------------------------
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const unansweredQuotes = await ProductQuote.find({
      productOwnerId: sellerId,
      respondedAt: null,
      createdAt: { $lte: twoDaysAgo },
      processed: false,
    });

    for (const unansweredQuote of unansweredQuotes) {
      // Deduct only once per quote
      if (!unansweredQuote.pointsGiven) {
        viewPoint.view_points = Math.max(0, viewPoint.view_points - 2);
        unansweredQuote.pointsGiven = true;
      }

      unansweredQuote.processed = true;
      await unansweredQuote.save();
    }

    // Save points
    await viewPoint.save();

    res.status(200).json({
      success: true,
      message: "Response recorded and points updated",
      viewPoints: viewPoint.view_points,
    });

  } catch (error) {
    console.error("Error responding to quote:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//node cron-jobs

exports.job = cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      // Calculate date 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // Find all unprocessed, unanswered quotes older than 2 days
      const unansweredQuotes = await ProductQuote.find({
        respondedAt: null,
        createdAt: { $lte: twoDaysAgo },
        processed: false, // Only process unprocessed quotes to avoid duplicates
      });
      if (unansweredQuotes.length === 0) {
        return;
      }

      // Process each quote
      for (const quote of unansweredQuotes) {
        try {
          // Get the merchant ID (productOwnerId)
          const sellerId = quote.productOwnerId;

          // Find the merchant to get user_id
          const merchant = await Merchant.findById(sellerId);
          if (!merchant) {
            console.warn(
              `Merchant not found for quote ${quote._id}. Skipping.`
            );
            continue;
          }

          const userId = merchant.user_id;

          // Find or create the user's ViewPoint record
          let viewPoint = await ViewPoint.findOne({ user_id: userId });
          if (!viewPoint) {
            viewPoint = new ViewPoint({ user_id: userId, view_points: 0 });
          }

          // Deduct 2 points (ensure non-negative)
          viewPoint.view_points = Math.max(0, viewPoint.view_points - 2);

          // Save the ViewPoint
          await viewPoint.save();

          // Mark the quote as processed to prevent duplicate deductions
          quote.processed = true;
          await quote.save();
        } catch (quoteError) {
          console.error(`Error processing quote ${quote._id}:`, quoteError);
          // Continue with next quote, don't stop the entire job
        }
      }
    } catch (error) {
      console.error("Error in daily unanswered quotes job:", error);
    }
  },
  {
    scheduled: true,
    timezone: "UTC", // Adjust to your timezone if needed (e.g., 'Asia/Kolkata')
  }
);
