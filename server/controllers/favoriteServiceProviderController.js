const FavoriteServiceProvider = require("../models/favoriteServiceProvider");
const ServiceProvider = require("../models/ServiceProvider");

// Add to favorites
exports.addFavoriteServiceProvider = async (req, res) => {
  try {
    const { serviceProviderId } = req.body;

    // Check if service provider exists
    const serviceProvider = await ServiceProvider.findById(serviceProviderId);
    if (!serviceProvider) {
      return res.status(404).json({ message: "Service Provider not found" });
    }

    // Check if already favorited
    const alreadyFavorited = await FavoriteServiceProvider.findOne({
      user: req.user._id,
      serviceProvider: serviceProviderId,
    });

    if (alreadyFavorited) {
      return res.status(400).json({ message: "Service Provider already in favorites" });
    }

    // Add to favorites
    const favorite = new FavoriteServiceProvider({
      user: req.user._id,
      serviceProvider: serviceProviderId,
    });

    await favorite.save();
    res.status(201).json({ message: "Service Provider added to favorites", favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get favorites of logged-in user
exports.getFavoriteServiceProviders = async (req, res) => {
  try {
    const favorites = await FavoriteServiceProvider.find({ user: req.user._id })
      .populate("serviceProvider");
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove from favorites
exports.removeFavoriteServiceProvider = async (req, res) => {
  try {
    const favorite = await FavoriteServiceProvider.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Ensure user owns the favorite
    if (favorite.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await favorite.deleteOne();
    res.status(200).json({ message: "Service Provider removed from favorites" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
