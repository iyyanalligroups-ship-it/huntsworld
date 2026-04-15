
const Banner = require('../models/bannerModel');

// Create a new banner
exports.createBanner = async (req, res) => {
    try {
        const { user_id, subscription_id, banner_payment_id, title, company_name, banner_image, rectangle_logo } = req.body;
        const banner = await Banner.create({ user_id, subscription_id, banner_payment_id, title, company_name, banner_image, rectangle_logo });
        res.status(201).json(banner);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all banners
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.findAll();
        res.json(banners);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a specific banner by ID
exports.getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ message: "Banner not found" });
        res.json(banner);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a banner
exports.updateBanner = async (req, res) => {
    try {
        const { user_id, subscription_id, banner_payment_id, title, company_name, banner_image, rectangle_logo } = req.body;
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ message: "Banner not found" });

        await banner.update({ user_id, subscription_id, banner_payment_id, title, company_name, banner_image, rectangle_logo });
        res.json(banner);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ message: "Banner not found" });

        await banner.destroy();
        res.json({ message: "Banner deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
