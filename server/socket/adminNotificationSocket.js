const User = require("../models/userModel");
const Merchant = require("../models/MerchantModel");
const Student = require("../models/studentModel");
const GrocerySeller = require("../models/grocerySellerModel");
const Role = require("../models/roleModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const SubCategory = require("../models/subCategoryModel");
const SuperSubCategory = require("../models/superSubCategoryModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const { STATUS } = require("../constants/subscriptionConstants");
const DeepSubCategory = require("../models/deepSubCategoryModel");
const RedeemPoints = require("../models/redeemPointsModel");
const TrustSealRequest = require("../models/trustSealRequestModel");
const Banner = require("../models/bannerModel");
const ReferralCommission = require("../models/referralCommissionModel");

const getUnreadCountsData = async () => {
    let userQuery = { markAsRead: { $ne: true } };
    try {
        const userRole = await Role.findOne({ role: "USER" });
        if (userRole) {
            userQuery.role = userRole._id;
        }
    } catch (err) {
        console.error("Error finding USER role for unread counts:", err);
    }

    // Products
    const notVerifiedProductsCount = await Product.countDocuments({
        product_verified_by_admin: false,
        markAsRead: { $ne: true }
    });

    // Other Products
    const [cat, sub, ssub, dsub] = await Promise.all([
        Category.findOne({ category_name: { $regex: /^others$/i } }).select("_id").lean(),
        SubCategory.findOne({ sub_category_name: { $regex: /^others$/i } }).select("_id").lean(),
        SuperSubCategory.findOne({ super_sub_category_name: { $regex: /^others$/i } }).select("_id").lean(),
        DeepSubCategory.findOne({ deep_sub_category_name: { $regex: /^others$/i } }).select("_id").lean(),
    ]);

    const othersIds = [cat?._id, sub?._id, ssub?._id, dsub?._id].filter(Boolean);
    let otherProductsCount = 0;
    if (othersIds.length > 0) {
        otherProductsCount = await Product.countDocuments({
            $or: [
                { category_id: { $in: othersIds } },
                { sub_category_id: { $in: othersIds } },
                { super_sub_category_id: { $in: othersIds } },
                { deep_sub_category_id: { $in: othersIds } },
            ],
            status: STATUS.ACTIVE_CAP,
            markAsRead: { $ne: true }
        });
    }

    // Requests
    const [
        userCount,
        merchantCount,
        studentCount,
        groceryCount,
        redeemRequestsCount,
        trustSealCount,
        referralRequestsCount
    ] = await Promise.all([
        User.countDocuments(userQuery),
        Merchant.countDocuments({ mark_as_read: { $ne: true } }),
        Student.countDocuments({ markAsRead: { $ne: true } }),
        GrocerySeller.countDocuments({ markAsRead: { $ne: true } }),
        RedeemPoints.countDocuments({ status: "pending", markAsRead: { $ne: true } }),
        TrustSealRequest.countDocuments({ status: "pending", isRead: { $ne: true } }),
        ReferralCommission.countDocuments({ status: "CLAIM_REQUESTED", markAsRead: { $ne: true } })
    ]);

    // Pending Banners (Using the aggregation pipeline logic)
    const pendingBannersResult = await Banner.aggregate([
        // Ensure image fields exist and banner is not marked as read
        {
            $match: {
                markAsRead: { $ne: true },
                $or: [
                    { banner_image: { $exists: true, $ne: null, $ne: "" } },
                    { rectangle_logo: { $exists: true, $ne: null, $ne: "" } }
                ]
            }
        },
        // Count unapproved banners
        {
            $project: {
                hasUnapprovedPremium: {
                    $and: [
                        { $ne: ["$banner_image", null] },
                        { $ne: ["$banner_image", ""] },
                        { $ne: ["$banner_image_approved", true] }
                    ]
                },
                hasUnapprovedRectangle: {
                    $and: [
                        { $ne: ["$rectangle_logo", null] },
                        { $ne: ["$rectangle_logo", ""] },
                        { $ne: ["$rectangle_logo_approved", true] }
                    ]
                }
            }
        },
        {
            $match: {
                $or: [
                    { hasUnapprovedPremium: true },
                    { hasUnapprovedRectangle: true }
                ]
            }
        },
        // Unwind to count individual unapproved items if we want total pending items
        // Since getPendingBannersForAdmin counts images individually, we will replicate that count
        {
            $project: {
                unapprovedCount: {
                    $add: [
                        { $cond: ["$hasUnapprovedPremium", 1, 0] },
                        { $cond: ["$hasUnapprovedRectangle", 1, 0] }
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                totalPending: { $sum: "$unapprovedCount" }
            }
        }
    ]);

    const bannerVerifyCount = pendingBannersResult[0]?.totalPending || 0;

    return {
        users: userCount,
        merchants: merchantCount,
        students: studentCount,
        grocery: groceryCount,
        notVerifiedProducts: notVerifiedProductsCount,
        otherProducts: otherProductsCount,
        redeemRequests: redeemRequestsCount,
        trustSeal: trustSealCount,
        bannerVerify: bannerVerifyCount,
        referralRequests: referralRequestsCount
    };
};

module.exports = (adminIo) => {
    adminIo.on("connection", (socket) => {
        // console.log("Admin connected to /admin-notifications");

        // Initial broadcast of unread counts
        const broadcastUnreadCounts = async () => {
            try {
                const counts = await getUnreadCountsData();
                socket.emit("admin-unread-counts", counts);
            } catch (error) {
                console.error("Error broadcasting unread counts:", error);
            }
        };

        broadcastUnreadCounts();

        socket.on("get-unread-counts", broadcastUnreadCounts);

        socket.on("disconnect", () => {
            // console.log("Admin disconnected from /admin-notifications");
        });
    });

    const broadcastToAllAdmins = async () => {
        try {
            const counts = await getUnreadCountsData();
            adminIo.emit("admin-unread-counts", counts);
        } catch (error) {
            console.error("Error broadcasting unread counts to all:", error);
        }
    };

    return {
        notifyNewRegistration: async (type, data) => {
            adminIo.emit(`new-${type}`, data);
            await broadcastToAllAdmins();
        },
        updateUnreadCount: async () => {
            await broadcastToAllAdmins();
        },
    };
};
