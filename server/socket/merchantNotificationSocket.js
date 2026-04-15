const AskPriceRequest = require("../models/askPriceRequestModel");
const DistributorRequest = require("../models/distributionRequestModel");
const Merchant = require("../models/MerchantModel");
const mongoose = require("mongoose");

const getMerchantUnreadCounts = async (userId) => {
    try {
        // Find merchant by user_id first
        const merchant = await Merchant.findOne({ user_id: userId }).select("_id").lean();
        if (!merchant) return { askPrice: 0 };

        const [askPriceCount, distributorCount] = await Promise.all([
            AskPriceRequest.countDocuments({
                merchant_id: merchant._id,
                isReadByMerchant: { $ne: true }
            }),
            DistributorRequest.countDocuments({
                status: 'pending',
                isReadByRecipient: { $ne: true },
                $or: [
                    { manufacturer_id: userId, initiated_by: { $ne: userId } },
                    { child_id: userId, initiated_by: { $ne: userId } }
                ]
            })
        ]);

        return { askPrice: askPriceCount, distributor: distributorCount };
    } catch (err) {
        console.error("[merchantNotificationSocket] Error getting unread counts:", err.message);
        return { askPrice: 0 };
    }
};

module.exports = (merchantIo) => {
    merchantIo.on("connection", (socket) => {
        // Client emits their userId (NOT merchant _id) — consistent with other socket patterns
        socket.on("join-merchant-room", async (userId) => {
            if (!userId) return;
            socket.join(userId);   // Room = userId string (consistent with phoneNumberAccessSocket)

            // Send initial unread counts
            const counts = await getMerchantUnreadCounts(userId);
            socket.emit("merchant-unread-counts", counts);
        });

        socket.on("get-unread-counts", async (userId) => {
            if (!userId) return;
            const counts = await getMerchantUnreadCounts(userId);
            socket.emit("merchant-unread-counts", counts);
        });

        socket.on("disconnect", () => {});
    });

    return {
        // Call this with the merchant's user_id (User._id) to broadcast updates
        broadcastToUser: async (userId) => {
            try {
                if (!userId) return;
                const counts = await getMerchantUnreadCounts(userId.toString());
                merchantIo.to(userId.toString()).emit("merchant-unread-counts", counts);
                merchantIo.to(userId.toString()).emit("refresh-ask-price-leads");
                merchantIo.to(userId.toString()).emit("refresh-distributor-requests");
            } catch (err) {
                console.error("[merchantNotificationSocket] broadcastToUser error:", err.message);
            }
        }
    };
};
