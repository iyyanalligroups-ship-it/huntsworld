const TopListingPayment = require('../models/topListingPaymentModel');
const { STATUS } = require('../constants/subscriptionConstants');
const TopListingProduct=require('../models/topListingProductModel');
const CommonSubscriptionPlan = require('../models/commonSubcriptionPlanModel');


exports.addTopListingProduct = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    const activePlan = await getActivePlan(user_id);

    if (!activePlan) {
      return res.status(400).json({
        success: false,
        message: "No active top listing plan",
      });
    }

    const existingProducts = await TopListingProduct.find({
      topListingPaymentId: activePlan._id,
    });

    // Fetch dynamic limit
    const limitPlan = await CommonSubscriptionPlan.findOne({
      name: { $regex: /^Top-listing-product-count$/i },
    }).select("price");

    const maxLimit = limitPlan ? Number(limitPlan.price) : 5;

    if (existingProducts.length >= maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxLimit} products allowed`,
      });
    }

    const alreadyExists = await TopListingProduct.findOne({
      topListingPaymentId: activePlan._id,
      product_id,
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Product already added",
      });
    }

    const newProduct = await TopListingProduct.create({
      topListingPaymentId: activePlan._id,
      user_id,
      product_id,
    });

    res.json({
      success: true,
      message: "Product added to top listing",
      data: newProduct,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getSellerTopListingProducts = async (req, res) => {
  try {
    const { user_id } = req.params;
    let { page = 1, limit = 5 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const activePlan = await getActivePlan(user_id);

    if (!activePlan) {
      return res.json({ success: true, data: [], total: 0, hasMore: false });
    }

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      TopListingProduct.find({
        topListingPaymentId: activePlan._id,
      })
        .populate("product_id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TopListingProduct.countDocuments({
        topListingPaymentId: activePlan._id,
      })
    ]);

    res.json({
      success: true,
      data: products,
      total: totalCount,
      hasMore: totalCount > skip + products.length
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.updateTopListingProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_product_id } = req.body;

    const updated = await TopListingProduct.findByIdAndUpdate(
      id,
      { product_id: new_product_id },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Top listing product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updated,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTopListingProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TopListingProduct.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product removed from top listing",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getHomepageTopListingProducts = async (req, res) => {
  try {
    const activePlans = await TopListingPayment.find({
      status: STATUS.ACTIVE_CAP,
      payment_status: STATUS.PAID,
      expires_at: { $gte: new Date() },
    });

    const planIds = activePlans.map(plan => plan._id);

    const products = await TopListingProduct.find({
      topListingPaymentId: { $in: planIds },
    })
      .populate({
        path: "product_id",
        populate: {
          path: "seller_id", // Populates the Merchant/ServiceProvider
          populate: {
            path: "user_id", // Populates the actual User (Director)
            select: "name phone email" // Only get what we need
          }
        }
      })
      .limit(50);

    res.json({
      success: true,
      data: products,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getActivePlan = async (user_id) => {
  return await TopListingPayment.findOne({
    user_id,
    status: STATUS.ACTIVE_CAP,
    payment_status: STATUS.PAID,
    expires_at: { $gte: new Date() },
  });
};
