const AdminBanner = require("../models/adminBanner");

/**
 * ✅ CREATE BANNER (DB only)
 * Frontend sends image_urls[]
 */
exports.createBanner = async (req, res) => {
  try {
    const { title, type, imageUrls, link } = req.body;   // ← added link
    const adminId = req.user.userId;

    if (!title || !type || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        message: "title, type and imageUrls are required",
      });
    }

    // Only ONE DEFAULT banner active
    if (type === "DEFAULT") {
      await AdminBanner.updateMany(
        { type: "DEFAULT" },
        { is_active: false }
      );
    }

    const banner = await AdminBanner.create({
      title,
      type,
      image_urls:imageUrls,
      link: link || "",          // ← added (use empty string if not provided)
      created_by: adminId,
    });

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Create Banner Error:", error);
    res.status(500).json({ message: error.message });
  }
};
/**
 * ✏️ UPDATE BANNER (DB only)
 */
exports.updateBanner = async (req, res) => {
  try {
    const { banner_id } = req.params;
    const { title, type, imageUrls, link, is_active } = req.body;   // ← add link here

    const banner = await AdminBanner.findById(banner_id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // If changing to DEFAULT → disable others
    if (type === "DEFAULT" && banner.type !== "DEFAULT") {
      await AdminBanner.updateMany(
        { type: "DEFAULT" },
        { is_active: false }
      );
    }

    // Update only provided fields (nullish coalescing)
    banner.title      = title      ?? banner.title;
    banner.type       = type       ?? banner.type;
    banner.image_urls = imageUrls ?? banner.image_urls;
    banner.link       = link       ?? banner.link;           // ← ADD THIS LINE
    banner.is_active  = is_active  ?? banner.is_active;

    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Update Banner Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ❌ DELETE BANNER (DB only)
 */
exports.deleteBanner = async (req, res) => {
  try {
    const { banner_id } = req.params;

    const banner = await AdminBanner.findByIdAndDelete(banner_id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 📥 GET ALL ACTIVE BANNERS
 */
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await AdminBanner.find({ is_active: true })
      .sort({ type: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("Get Banner Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 📥 GET ALL BANNERS (Admin View)
 */
// GET /admin-banner/all?page=1&limit=10
exports.getAllBanners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [banners, total] = await Promise.all([
      AdminBanner.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdminBanner.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: banners,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + banners.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * 🔁 TOGGLE ACTIVE STATUS
 */
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { banner_id } = req.params;
    const { is_active } = req.body;

    const banner = await AdminBanner.findById(banner_id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // 🚫 DEFAULT RULE: only one active
    if (banner.type === "DEFAULT" && is_active === true) {
      await AdminBanner.updateMany(
        { type: "DEFAULT", _id: { $ne: banner_id } },
        { is_active: false }
      );
    }

    banner.is_active = is_active;
    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner status updated",
      data: banner,
    });
  } catch (error) {
    console.error("Toggle Banner Error:", error);
    res.status(500).json({ message: error.message });
  }
};
