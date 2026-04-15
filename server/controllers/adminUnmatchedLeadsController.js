const PostByRequirement = require('../models/postByRequirementModel');
const GrocerySellerRequirement = require('../models/grocerySellerRequirementModel');
const BuyLead = require('../models/buyLeadsModel');

exports.getUnmatchedLeads = async (req, res) => {
    try {
        const { type = 'postByRequirement', page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let Model;
        let populateOptions = {
            path: 'user_id',
            select: '-password',
            populate: { path: 'role', select: 'role' }
        };

        if (type === 'postByRequirement') {
            Model = PostByRequirement;
        } else if (type === 'grocerySellerRequirement') {
            Model = GrocerySellerRequirement;
        } else if (type === 'buyLead') {
            Model = BuyLead;
            populateOptions = { path: 'user_id', select: 'name phone email' };
        } else {
            return res.status(400).json({ success: false, message: 'Invalid lead type requested' });
        }

        const query = { is_unmatched: true };

        const total = await Model.countDocuments(query);
        const leads = await Model.find(query)
            .populate(populateOptions)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            message: 'Fetched unmatched leads successfully',
            data: leads,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit),
            }
        });

    } catch (error) {
        console.error('Error fetching unmatched leads:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
