const AskPriceRequest = require('../models/askPriceRequestModel');
const Product = require('../models/productModel');
const Merchant = require('../models/MerchantModel');
const ServiceProvider = require('../models/serviceProviderModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const mongoose = require('mongoose');
const axios = require('axios');

exports.createAskPriceRequest = async (req, res) => {
    try {
        const { product_id, user_id, name, phone, email, reason } = req.body;

        if (!product_id || !name || !phone || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Product ID, name, phone, and reason are required.',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(product_id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        // 1. Find the product
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const merchant_id = product.seller_id;
        if (!merchant_id) {
            return res.status(400).json({ success: false, message: 'Product does not have an attached merchant' });
        }

        // 2. Resolve ownerUserId (Merchant or ServiceProvider → User._id)
        let ownerUserId = null;
        const merchant = await Merchant.findOne({ _id: merchant_id });
        if (merchant?.user_id) {
            ownerUserId = merchant.user_id;
        } else {
            const serviceProvider = await ServiceProvider.findOne({ _id: merchant_id });
            if (serviceProvider?.user_id) {
                ownerUserId = serviceProvider.user_id;
            }
        }

        if (!ownerUserId) {
            return res.status(400).json({ success: false, message: 'Product owner user not found' });
        }

        // 3. Save the ask-price record
        const askPriceRequest = new AskPriceRequest({
            product_id,
            merchant_id,
            user_id: user_id || null,
            name,
            phone,
            email: email || '',
            reason,
            status: 'Pending',
        });
        await askPriceRequest.save();

        // 4. Build the HTML chat message (same pattern as createQuote)
        const autoMessageContent = `
<div style="border-left:5px solid #e8630a;background:linear-gradient(135deg,#fff8f3,#fff0e6);border-radius:12px;padding:16px;margin:10px 0;max-width:340px;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 4px 16px rgba(232,99,10,.15);border:1px solid #ffe0cc">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <div style="background:#e8630a;color:white;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:bold">PRICE ENQUIRY</div>
    <span style="font-size:11px;color:#888">Just Now</span>
  </div>
  <h3 style="margin:8px 0;font-size:16px;color:#1a1a1a;font-weight:600">
    ${product.product_name || 'Product Inquiry'}
  </h3>
  <div style="font-size:14px;color:#2d3748;line-height:1.7;background:#fff;padding:12px;border-radius:8px;border:1px dashed #ffe0cc">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span style="color:#666">From</span>
      <strong>${name}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;padding-top:8px;border-top:1px dashed #ddd">
      <span style="color:#666">Contact</span>
      <strong style="color:#e8630a">${phone}</strong>
    </div>
    ${email ? `<div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px dashed #ddd"><span style="color:#666">Email</span><strong>${email}</strong></div>` : ''}
    <div style="margin-top:10px;padding-top:8px;border-top:1px dashed #ddd">
      <span style="color:#666;display:block;margin-bottom:4px">Message</span>
      <em style="color:#444">"${reason}"</em>
    </div>
  </div>
  <div style="margin-top:16px;text-align:center">
    <a href="tel:${phone}" style="background:#e8630a;color:white;text-decoration:none;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:bold;display:inline-block;box-shadow:0 4px 12px rgba(232,99,10,.3)">
      Call Now
    </a>
  </div>
</div>`.trim();

        // 5. Use system user_id: if guest, use a placeholder; prefer actual user_id
        const senderId = user_id && mongoose.Types.ObjectId.isValid(user_id)
            ? user_id
            : ownerUserId; // fallback so message is still stored

        // 6. Save message to DB
        const io = global.io?.of('/messages');
        const onlineUsers = req.app.get('onlineUsers') || new Map();

        const [senderUser, receiverUser] = await Promise.all([
            user_id ? User.findById(user_id).select('name profile_pic').lean() : Promise.resolve({ name, profile_pic: null }),
            User.findById(ownerUserId).select('name profile_pic').lean(),
        ]);

        let savedMessage;
        try {
            const newMessage = new Message({
                sender: senderId,
                receiver: ownerUserId,
                content: autoMessageContent,
                read: false,
                deleted: false,
            });
            savedMessage = await newMessage.save();
        } catch (err) {
            console.error('Failed to save ask-price chat message:', err.message);
        }

        // 7. Emit via Socket.IO
        if (savedMessage && io) {
            const messageObject = {
                _id: savedMessage._id,
                sender: senderId,
                receiver: ownerUserId,
                content: savedMessage.content,
                createdAt: savedMessage.createdAt,
                read: false,
                deleted: false,
                senderUser: senderUser || { name, profile_pic: null },
                receiverUser: receiverUser || { name: 'Seller', profile_pic: null },
                isAutoRequirement: true,
            };

            const receiverSocketId = onlineUsers.get(ownerUserId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', messageObject);
            }

            if (user_id) {
                const senderSocketId = onlineUsers.get(user_id.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit('receiveMessage', { ...messageObject, fromMe: true });
                }
            }
        }

        // 8. SMS to product owner
        try {
            let ownerPhone = null;
            const ownerAsUser = await User.findById(ownerUserId).select('phone').lean();
            if (ownerAsUser?.phone) {
                ownerPhone = ownerAsUser.phone;
            } else if (merchant?.company_phone_number) {
                ownerPhone = merchant.company_phone_number;
            }

            if (ownerPhone) {
                const productName = product.product_name || 'a product';
                const smsText = `Price enquiry from ${name} for ${productName}. Contact: ${phone}. Team HUNTSWORLD`;
                const smsApiUrl = `https://online.chennaisms.com/api/mt/SendSMS?user=huntsworld&password=india123&senderid=HWHUNT&channel=Trans&DCS=0&flashsms=0&number=${ownerPhone}&text=${encodeURIComponent(smsText)}`;
                await axios.get(smsApiUrl);
            }
        } catch (smsErr) {
            console.error('SMS notification failed (non-blocking):', smsErr.message);
        }

        // 9. Trigger real-time unread count update for Admin
        const adminSocketHelpers = req.app.get("adminSocketHelpers");
        if (adminSocketHelpers) {
            adminSocketHelpers.updateUnreadCount();
        }

        // Notify Merchant specifically via their userId room (consistent with phoneNumberAccessSocket)
        const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
        if (merchantSocketHelpers) {
            merchantSocketHelpers.broadcastToUser(ownerUserId);
        }

        return res.status(201).json({
            success: true,
            message: 'Price request sent successfully.',
            data: askPriceRequest,
        });
    } catch (error) {
        console.error('Error creating ask price request:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

exports.getMerchantAskPriceRequests = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find the merchant profile belonging to this user
        const UserMerchant = require('../models/MerchantModel');
        const merchant = await UserMerchant.findOne({ user_id: userId });

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant profile not found.',
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await AskPriceRequest.countDocuments({ merchant_id: merchant._id });
        const requests = await AskPriceRequest.find({ merchant_id: merchant._id })
            .populate('product_id', 'product_name product_image price unitOfMeasurement')
            .sort({ isReadByMerchant: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching merchant ask price requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};
exports.updateAskPriceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Contacted', 'Closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Must be Pending, Contacted, or Closed.',
            });
        }

        const userId = req.user.userId;
        const UserMerchant = require('../models/MerchantModel');
        const merchant = await UserMerchant.findOne({ user_id: userId });

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant profile not found.',
            });
        }

        const updatedRequest = await AskPriceRequest.findOneAndUpdate(
            { _id: id, merchant_id: merchant._id },
            { status },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({
                success: false,
                message: 'Ask Price Request not found or not authorized for this merchant.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully.',
            data: updatedRequest,
        });

    } catch (error) {
        console.error('Error updating ask price status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const Merchant = require('../models/MerchantModel');
        const merchant = await Merchant.findOne({ user_id: userId });

        if (!merchant) {
            return res.status(404).json({ success: false, message: 'Merchant profile not found.' });
        }

        const updated = await AskPriceRequest.findOneAndUpdate(
            { _id: id, merchant_id: merchant._id },
            { isReadByMerchant: true },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        // Broadcast updated count
        const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
        if (merchantSocketHelpers) {
            merchantSocketHelpers.broadcastToUser(userId);
        }

        return res.status(200).json({ success: true, message: 'Marked as read.' });
    } catch (error) {
        console.error('Error marking as read:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const Merchant = require('../models/MerchantModel');
        const merchant = await Merchant.findOne({ user_id: userId });

        if (!merchant) {
            return res.status(404).json({ success: false, message: 'Merchant profile not found.' });
        }

        await AskPriceRequest.updateMany(
            { merchant_id: merchant._id, isReadByMerchant: { $ne: true } },
            { isReadByMerchant: true }
        );

        // Broadcast updated count
        const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
        if (merchantSocketHelpers) {
            merchantSocketHelpers.broadcastToUser(userId);
        }

        return res.status(200).json({ success: true, message: 'All marked as read.' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteAskPriceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const Merchant = require('../models/MerchantModel');
        const merchant = await Merchant.findOne({ user_id: userId });

        if (!merchant) {
            return res.status(404).json({ success: false, message: 'Merchant profile not found.' });
        }

        // Delete only if it belongs to this merchant
        const deleted = await AskPriceRequest.findOneAndDelete({
            _id: id,
            merchant_id: merchant._id
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Request not found or unauthorized.' });
        }

        // Invalidate counts via socket if needed
        const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
        if (merchantSocketHelpers) {
            merchantSocketHelpers.broadcastToUser(userId);
        }

        return res.status(200).json({ success: true, message: 'Lead deleted successfully.' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
