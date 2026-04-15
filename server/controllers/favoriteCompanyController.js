const FavoriteCompany = require("../models/FavoriteCompany");
const Merchant = require("../models/Merchant");

// Add to favorites
exports.addFavoriteCompany = async (req, res) => {
  try {
    const { merchantId } = req.body;

    // Check if merchant exists
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    // Check if already favorited
    const alreadyFavorited = await FavoriteCompany.findOne({
      user: req.user._id,
      merchant: merchantId,
    });

    if (alreadyFavorited) {
      return res.status(400).json({ message: "Merchant already in favorites" });
    }

    // Add to favorites
    const favorite = new FavoriteCompany({
      user: req.user._id,
      merchant: merchantId,
    });

    await favorite.save();
    res.status(201).json({ message: "Merchant added to favorites", favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get favorites of logged-in user
exports.getFavoriteCompanies = async (req, res) => {
  try {
    const favorites = await FavoriteCompany.find({ user: req.user._id }).populate("merchant");
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove from favorites
exports.removeFavoriteCompany = async (req, res) => {
  try {
    const favorite = await FavoriteCompany.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Ensure user owns the favorite
    if (favorite.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await favorite.deleteOne();
    res.status(200).json({ message: "Merchant removed from favorites" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
