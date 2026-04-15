// controllers/adminDashboardController.js
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const GrocerySellerRequirement = require('../models/grocerySellerRequirementModel');
const BuyLead = require('../models/buyLeadsModel');
const Complaint = require('../models/ComplaintFormModel');
const UserSubscription = require('../models/userSubscriptionPlanModel');
const { STATUS } = require('../constants/subscriptionConstants');

exports.getDashboardData = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear + 1}-01-01`);

    // ─────────────────────────────────────────────────────────────────────
    // 1. Build role map first (all other queries depend on it)
    // ─────────────────────────────────────────────────────────────────────
    const roles = await Role.find({}).lean();
    const roleMap = {};
    roles.forEach(r => (roleMap[r.role] = r._id));

    // ─────────────────────────────────────────────────────────────────────
    // 2. Fire ALL independent queries in parallel (was ~9 sequential calls)
    // ─────────────────────────────────────────────────────────────────────
    const [
      totalUsers,
      totalMerchants,
      totalServiceProviders,
      totalStudents,
      totalGrocerySellers,
      totalAdmins,
      totalSubAdmins,
      newUsersBarDataRaw,
      newProductsLineDataRaw,
      subscriptionPlansRaw,
      latestBuyLeadsRaw,
      latestComplaintsRaw,
      latestRequirementsRaw,
    ] = await Promise.all([
      User.countDocuments({ role: roleMap['USER'] }),
      User.countDocuments({ role: roleMap['MERCHANT'] }),
      User.countDocuments({ role: roleMap['SERVICE_PROVIDER'] }),
      User.countDocuments({ role: roleMap['STUDENT'] }),
      User.countDocuments({ role: roleMap['GROCERY_SELLER'] }),
      User.countDocuments({ role: roleMap['ADMIN'] }),
      User.countDocuments({ role: roleMap['SUB_ADMIN'] }),

      // Users registered this year, grouped by month
      User.aggregate([
        { $match: { created_at: { $gte: yearStart, $lt: yearEnd } } },
        { $group: { _id: { $month: '$created_at' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Requirements created this year, grouped by month
      GrocerySellerRequirement.aggregate([
        { $match: { createdAt: { $gte: yearStart, $lt: yearEnd } } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Subscription plan breakdown (paid, non-FREE)
      UserSubscription.aggregate([
        {
          $match: {
            status: STATUS.PAID,
            razorpay_payment_id: { $exists: true, $ne: null },
          },
        },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'subscription_plan_id',
            foreignField: '_id',
            as: 'plan',
          },
        },
        { $unwind: '$plan' },
        {
          $match: {
            'plan.plan_code': { $ne: 'FREE' },
            'plan.plan_name': { $ne: 'FREE' },
          },
        },
        { $group: { _id: '$plan.plan_name', count: { $sum: 1 } } },
        { $project: { plan: '$_id', count: 1, _id: 0 } },
      ]),

      // Latest 5 buy leads
      BuyLead.find().sort({ createdAt: -1 }).limit(5).lean(),

      // Latest 5 complaints (with user name)
      Complaint.find().populate('user_id', 'name').sort({ createdAt: -1 }).limit(5).lean(),

      // Latest 5 grocery requirements (with user name)
      GrocerySellerRequirement.find().populate('user_id', 'name').sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // ─────────────────────────────────────────────────────────────────────
    // 3. Format chart data
    // ─────────────────────────────────────────────────────────────────────
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const newUsersBarData = Array.from({ length: 12 }, (_, i) => ({ name: months[i], count: 0 }));
    newUsersBarDataRaw.forEach(d => { newUsersBarData[d._id - 1].count = d.count; });

    const newProductsLineData = Array.from({ length: 12 }, (_, i) => ({ month: months[i], count: 0 }));
    newProductsLineDataRaw.forEach(d => { newProductsLineData[d._id - 1].count = d.count; });

    const subscriptionPlans = subscriptionPlansRaw.length > 0
      ? subscriptionPlansRaw
      : [{ plan: 'Basic', count: 0 }, { plan: 'Pro', count: 0 }, { plan: 'Enterprise', count: 0 }];

    // ─────────────────────────────────────────────────────────────────────
    // 4. Map raw documents to response shape
    // ─────────────────────────────────────────────────────────────────────
    const latestBuyLeads = latestBuyLeadsRaw.map((lead, i) => ({
      id: i + 1,
      product: lead.searchTerm,
      type: lead.type || 'N/A',
      date: lead.createdAt.toISOString().split('T')[0],
    }));

    const latestComplaints = latestComplaintsRaw.map((c, i) => ({
      id: i + 1,
      user: c.user_id ? c.user_id.name : 'Unknown',
      issue: c.option,
      date: c.createdAt.toISOString().split('T')[0],
    }));

    const latestRequirements = latestRequirementsRaw.map((r, i) => ({
      id: i + 1,
      seller: r.user_id ? r.user_id.name : 'Unknown',
      req: r.product_or_service,
      date: r.createdAt.toISOString().split('T')[0],
    }));

    res.json({
      totalUsers,
      totalMerchants,
      totalServiceProviders,
      totalStudents,
      totalGrocerySellers,
      totalAdmins,
      totalSubAdmins,
      newUsersBarData,
      newProductsLineData,
      subscriptionPlans,
      latestBuyLeads,
      latestComplaints,
      latestRequirements,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
