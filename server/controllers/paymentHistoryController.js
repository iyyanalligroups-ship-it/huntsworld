// // controllers/adminPaymentController.js
// const PaymentHistory = require('../models/paymentHistoryModel');
// const UserSubscription = require('../models/userSubscriptionPlanModel'); // your existing model

// exports.getAllPaymentHistory = async (req, res) => {
//   try {
//     // ────────────────────────────────────────────────
//     // Query parameters from frontend
//     // ────────────────────────────────────────────────
//     const {
//       page = 1,
//       limit = 10,
//       search = '',
//       payment_type,
//       from_date,
//       to_date,
//     } = req.query;

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     // ────────────────────────────────────────────────
//     // Build aggregation pipeline
//     // ────────────────────────────────────────────────
//     const pipeline = [];

//     // 1. Lookup user (for name/email/phone search)
//     pipeline.push({
//       $lookup: {
//         from: 'users',                        // ← IMPORTANT: must match your actual users collection name
//         localField: 'user_id',
//         foreignField: '_id',
//         as: 'user'
//       }
//     });

//     pipeline.push({
//       $unwind: {
//         path: '$user',
//         preserveNullAndEmptyArrays: true
//       }
//     });

//     // 2. Lookup subscription plan
//     pipeline.push({
//       $lookup: {
//         from: 'subscriptionplans',           // ← adjust if your collection name is different
//         localField: 'subscription_plan_id',
//         foreignField: '_id',
//         as: 'subscription_plan_id'
//       }
//     });
//     pipeline.push({
//       $unwind: {
//         path: '$subscription_plan_id',
//         preserveNullAndEmptyArrays: true
//       }
//     });

//     // 3. Lookup user subscription
//     pipeline.push({
//       $lookup: {
//         from: 'usersubscriptions',          // ← adjust if needed
//         localField: 'user_subscription_id',
//         foreignField: '_id',
//         as: 'user_subscription_id'
//       }
//     });
//     pipeline.push({
//       $unwind: {
//         path: '$user_subscription_id',
//         preserveNullAndEmptyArrays: true
//       }
//     });

//     // Optional: Add more lookups only if needed in list view
//     // pipeline.push({ $lookup: { from: 'banners', localField: 'banner_id', foreignField: '_id', as: 'banner_id' } });
//     // pipeline.push({ $unwind: { path: '$banner_id', preserveNullAndEmptyArrays: true } });

//     // ────────────────────────────────────────────────
//     // Build $match stage
//     // ────────────────────────────────────────────────
//     const matchConditions = {};

//     // Search on user fields
//     if (search?.trim()) {
//       const regex = new RegExp(search.trim(), 'i');
//       matchConditions.$or = [
//         { 'user.name': regex },
//         { 'user.email': regex },
//         { 'user.phone': regex },
//         // { 'user.user_code': regex }, // add if you have this field
//       ];
//     }

//     // Payment type
//     if (payment_type && payment_type !== 'all') {
//       matchConditions.payment_type = payment_type;
//     }

//     // Date range
//     if (from_date || to_date) {
//       matchConditions.createdAt = {};
//       if (from_date) {
//         const start = new Date(from_date);
//         if (!isNaN(start.getTime())) {
//           matchConditions.createdAt.$gte = start;
//         }
//       }
//       if (to_date) {
//         const end = new Date(to_date);
//         end.setHours(23, 59, 59, 999);
//         if (!isNaN(end.getTime())) {
//           matchConditions.createdAt.$lte = end;
//         }
//       }
//     }

//     if (Object.keys(matchConditions).length > 0) {
//       pipeline.push({ $match: matchConditions });
//     }

//     // ────────────────────────────────────────────────
//     // Sort + skip + limit
//     // ────────────────────────────────────────────────
//     pipeline.push({ $sort: { createdAt: -1 } });
//     pipeline.push({ $skip: skip });
//     pipeline.push({ $limit: limitNum });

//     // ────────────────────────────────────────────────
//     // Execute main query
//     // ────────────────────────────────────────────────
//     let payments = await PaymentHistory.aggregate(pipeline);

//     // ────────────────────────────────────────────────
//     // Count total (separate lightweight pipeline)
//     // ────────────────────────────────────────────────
//     const countPipeline = [];
//     countPipeline.push({
//       $lookup: {
//         from: 'users',
//         localField: 'user_id',
//         foreignField: '_id',
//         as: 'user'
//       }
//     });
//     countPipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });

//     if (Object.keys(matchConditions).length > 0) {
//       countPipeline.push({ $match: matchConditions });
//     }

//     countPipeline.push({ $count: 'total' });

//     const countResult = await PaymentHistory.aggregate(countPipeline);
//     const total = countResult.length > 0 ? countResult[0].total : 0;

//     // ────────────────────────────────────────────────
//     // Final response
//     // ────────────────────────────────────────────────
//     res.status(200).json({
//       success: true,
//       payments,
//       pagination: {
//         total,
//         page: pageNum,
//         limit: limitNum,
//         pages: Math.ceil(total / limitNum),
//         hasNext: pageNum * limitNum < total,
//         hasPrev: pageNum > 1,
//       }
//     });

//   } catch (error) {
//     console.error('Error in getAllPaymentHistory:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payment history',
//       error: error.message
//     });
//   }
// };

// exports.getPaymentHistoryById = async (req, res) => {
//   try {
//     const payment = await PaymentHistory.findById(req.params.id)
//       .populate('user_id', 'name email phone')
//       .populate('subscription_plan_id', 'plan_name plan_code price')
//       .populate('user_subscription_id');

//     if (!payment) {
//       return res.status(404).json({ success: false, message: 'Payment not found' });
//     }

//     res.status(200).json({ success: true, payment });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// exports.getUserPaymentHistory = async (req, res) => {
//   try {
//     const { user_id } = req.params;

//     // Optional: Validate ObjectId if needed
//     // if (!mongoose.Types.ObjectId.isValid(user_id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Count total documents
//     const total = await PaymentHistory.countDocuments({ user_id });

//     // Fetch payment history and populate user info + other references
//     const history = await PaymentHistory.find({ user_id })
//       .sort({ createdAt: -1 }) // Newest first
//       .skip(skip)
//       .limit(limit)
//       // Populate user details (name, email, phone, etc.)
//       .populate({
//         path: 'user_id',
//         select: 'name email phone', // Choose fields you want
//       })
//       .populate('subscription_plan_id', 'plan_name price')
//       .populate('banner_id', 'title')
//       .populate('trust_seal_id', 'name')
//       .populate('ebook_id', 'title')
//       .populate('trending_point_payment_id', 'points')
//       .populate('user_subscription_id', 'status start_date end_date')
//       .exec();

//     res.json({
//       success: true,
//       data: history,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching payment history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching payment history',
//     });
//   }
// };

// exports.updatePaymentHistory = async (req, res) => {
//   try {
//     const updates = req.body;

//     if (updates.notes) {
//       updates.notes = `[Admin Edit - ${new Date().toLocaleString('en-IN')}]: ${updates.notes}`;
//     }

//     const updated = await PaymentHistory.findByIdAndUpdate(
//       req.params.id,
//       { $set: updates },
//       { new: true, runValidators: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ success: false, message: 'Payment history not found' });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Payment history updated',
//       payment: updated
//     });
//   } catch (error) {
//     console.error('Update error:', error);
//     res.status(500).json({ success: false, message: 'Update failed' });
//   }
// };

// exports.createManualPayment = async (req, res) => {
//   try {
//     const data = req.body;
//     data.is_manual_entry = true;
//     if (!data.notes) data.notes = 'Manual payment created by admin';

//     const payment = await PaymentHistory.create(data);

//     res.status(201).json({
//       success: true,
//       message: 'Manual payment recorded',
//       payment
//     });
//   } catch (error) {
//     console.error('Manual payment error:', error);
//     res.status(500).json({ success: false, message: 'Failed to create manual payment' });
//   }
// };


// controllers/adminPaymentController.js
const PaymentHistory = require('../models/paymentHistoryModel');
const UserSubscription = require('../models/userSubscriptionPlanModel'); // your existing model


exports.getAllPaymentHistory = async (req, res) => {
  try {
    // ────────────────────────────────────────────────
    // Query parameters from frontend
    // ────────────────────────────────────────────────
    const {
      page = 1,
      limit = 10,
      search = '',
      payment_type,
      from_date,
      to_date,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // ────────────────────────────────────────────────
    // Build aggregation pipeline
    // ────────────────────────────────────────────────
    const pipeline = [];

    // 1. Lookup user (for name/email/phone search)
    pipeline.push({
      $lookup: {
        from: 'users',                        // ← IMPORTANT: must match your actual users collection name
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    });

    // 2. Lookup subscription plan
    pipeline.push({
      $lookup: {
        from: 'subscriptionplans',           // ← adjust if your collection name is different
        localField: 'subscription_plan_id',
        foreignField: '_id',
        as: 'subscription_plan_id'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$subscription_plan_id',
        preserveNullAndEmptyArrays: true
      }
    });

    // 3. Lookup user subscription
    pipeline.push({
      $lookup: {
        from: 'usersubscriptions',          // ← adjust if needed
        localField: 'user_subscription_id',
        foreignField: '_id',
        as: 'user_subscription_id'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$user_subscription_id',
        preserveNullAndEmptyArrays: true
      }
    });

    // Optional: Add more lookups only if needed in list view
    // 4. Lookup Banner Payment
    pipeline.push({
      $lookup: {
        from: 'bannerpayments',
        localField: 'banner_id',
        foreignField: '_id',
        as: 'banner_id'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$banner_id',
        preserveNullAndEmptyArrays: true
      }
    });

    // 5. Lookup Trust Seal Request
    pipeline.push({
      $lookup: {
        from: 'trustsealrequests',
        localField: 'trust_seal_id',
        foreignField: '_id',
        as: 'trust_seal_id'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$trust_seal_id',
        preserveNullAndEmptyArrays: true
      }
    });

    // 6. Lookup Ebook Payment
    pipeline.push({
      $lookup: {
        from: 'ebookpayments',
        localField: 'ebook_id',
        foreignField: '_id',
        as: 'ebook_id'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$ebook_id',
        preserveNullAndEmptyArrays: true
      }
    });

    // 7. Lookup Trending Point Payment
    pipeline.push({
      $lookup: {
        from: 'trendingpointspayments',
        localField: 'trending_point_payment_id',
        foreignField: '_id',
        as: 'trending_point_payment_id'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$trending_point_payment_id',
        preserveNullAndEmptyArrays: true
      }
    });

    // 8. Lookup Top Listing Payment
    pipeline.push({
      $lookup: {
        from: 'toplistingpayments',
        localField: 'top_listing_payment_id',
        foreignField: '_id',
        as: 'top_listing_payment_id'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$top_listing_payment_id',
        preserveNullAndEmptyArrays: true
      }
    });
    // ────────────────────────────────────────────────
    // Build $match stage
    // ────────────────────────────────────────────────
    const matchConditions = {
      status: 'paid'
    };

    // Search on user fields
    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      matchConditions.$or = [
        { 'user.name': regex },
        { 'user.email': regex },
        { 'user.phone': regex },
        // { 'user.user_code': regex }, // add if you have this field
      ];
    }

    // Payment type
    if (payment_type && payment_type !== 'all') {
      matchConditions.payment_type = payment_type;
    }

    // Date range
    if (from_date || to_date) {
      matchConditions.createdAt = {};
      if (from_date) {
        const start = new Date(from_date);
        if (!isNaN(start.getTime())) {
          matchConditions.createdAt.$gte = start;
        }
      }
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime())) {
          matchConditions.createdAt.$lte = end;
        }
      }
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // ────────────────────────────────────────────────
    // Sort + skip + limit
    // ────────────────────────────────────────────────
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    // ────────────────────────────────────────────────
    // Execute main query
    // ────────────────────────────────────────────────
    let payments = await PaymentHistory.aggregate(pipeline);

    // ────────────────────────────────────────────────
    // Count total (separate lightweight pipeline)
    // ────────────────────────────────────────────────
    const countPipeline = [];
    countPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    });
    countPipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });

    if (Object.keys(matchConditions).length > 0) {
      countPipeline.push({ $match: matchConditions });
    }

    countPipeline.push({ $count: 'total' });

    const countResult = await PaymentHistory.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // ────────────────────────────────────────────────
    // Final response
    // ────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      payments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      }
    });

  } catch (error) {
    console.error('Error in getAllPaymentHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

exports.getPaymentHistoryById = async (req, res) => {
  try {
    const payment = await PaymentHistory.findOne({ _id: req.params.id, status: 'paid' })
      .populate('user_id', 'name email phone')
      .populate('subscription_plan_id', 'plan_name plan_code price')
      .populate('user_subscription_id')
      .populate('banner_id')
      .populate('trust_seal_id')
      .populate('ebook_id')
      .populate('trending_point_payment_id')
      .populate('top_listing_payment_id');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserPaymentHistory = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Optional: Validate ObjectId if needed
    // if (!mongoose.Types.ObjectId.isValid(user_id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count total documents
    const total = await PaymentHistory.countDocuments({ user_id, status: 'paid' });

    // Fetch payment history and populate user info + other references
    const history = await PaymentHistory.find({ user_id, status: 'paid' })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      // Populate user details (name, email, phone, etc.)
      .populate({
        path: 'user_id',
        select: 'name email phone', // Choose fields you want
      })
      .populate('subscription_plan_id', 'plan_name price')
      .populate('banner_id')
      .populate('trust_seal_id')
      .populate('ebook_id')
      .populate('trending_point_payment_id', 'points amount status')
      .populate('top_listing_payment_id')
      .populate('user_subscription_id')
      .exec();

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment history',
    });
  }
};

exports.updatePaymentHistory = async (req, res) => {
  try {
    const updates = req.body;

    if (updates.notes) {
      updates.notes = `[Admin Edit - ${new Date().toLocaleString('en-IN')}]: ${updates.notes}`;
    }

    const updated = await PaymentHistory.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Payment history not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Payment history updated',
      payment: updated
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

exports.createManualPayment = async (req, res) => {
  try {
    const data = req.body;
    data.is_manual_entry = true;
    if (!data.notes) data.notes = 'Manual payment created by admin';

    const payment = await PaymentHistory.create(data);

    res.status(201).json({
      success: true,
      message: 'Manual payment recorded',
      payment
    });
  } catch (error) {
    console.error('Manual payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create manual payment' });
  }
};
