const FavoriteProduct = require("../models/favoriteProductModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");
const TrackFavorite=require('../models/trackFavoriteModel');

// Add to favorites
exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyFavorited = await FavoriteProduct.findOne({
      user_id: req.user._id,
      product: productId,
    });

    if (alreadyFavorited) {
      return res.status(400).json({ message: "Product already in favorites" });
    }

    const favorite = new FavoriteProduct({
      user_id: req.user._id,
      product: productId,
    });

    await favorite.save();
    res.status(201).json({ message: "Product added to favorites", favorite: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get favorites of logged-in user
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteProduct.find({
      user_id: req.user._id,
    }).populate("product");
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFavoriteProductsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const favoriteProducts = await FavoriteProduct.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },

      // Lookup merchant (seller)
      {
        $lookup: {
          from: "merchants",
          localField: "productDetails.seller_id",
          foreignField: "_id",
          as: "merchantInfo",
        },
      },
      {
        $unwind: {
          path: "$merchantInfo",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup user info (seller)
      {
        $lookup: {
          from: "users",
          localField: "merchantInfo.user_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup address
      {
        $lookup: {
          from: "addresses",
          let: { userId: "$userInfo._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$address_type", "company"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "companyAddress",
        },
      },
      {
        $unwind: {
          path: "$companyAddress",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup trending points
      {
        $lookup: {
          from: "trendingpoints",
          localField: "productDetails._id",
          foreignField: "product_id",
          as: "trendingData",
        },
      },
      {
        $addFields: {
          totalTrendingPoints: {
            $sum: "$trendingData.trending_points",
          },
        },
      },

      // Final shape
      {
        $project: {
          favoriteId: "$_id", // this is the ObjectId of the FavoriteProduct document
          productId: "$productDetails._id",
          product_name: "$productDetails.product_name",
          description: "$productDetails.description",
          price: "$productDetails.price",
          stock_quantity: "$productDetails.stock_quantity",
          product_image: "$productDetails.product_image",
          createdAt: "$productDetails.createdAt",
          totalTrendingPoints: 1,

          sellerInfo: {
            name: "$userInfo.name",
            email: "$userInfo.email",
            _id:"$merchantInfo._id",
            company_name: "$merchantInfo.company_name",
            company_email: "$merchantInfo.company_email",
            company_phone_number: "$merchantInfo.company_phone_number",
            company_logo: "$merchantInfo.company_logo",
            company_images: "$merchantInfo.company_images",
            company_type: "$merchantInfo.company_type",
            gst_number: "$merchantInfo.gst_number",
            msme_certificate_number: "$merchantInfo.msme_certificate_number",
            pan: "$merchantInfo.pan",
            aadhar: "$merchantInfo.aadhar",
            trustshield: "$merchantInfo.trustshield",
            verified_status: "$merchantInfo.verified_status",
            number_of_employees: "$merchantInfo.number_of_employees",
            year_of_establishment: "$merchantInfo.year_of_establishment",
            companyAddress: "$companyAddress",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Favorite products fetched successfully",
      data: favoriteProducts,
    });
  } catch (error) {
    console.error("Error fetching favorite products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorite products",
      error: error.message,
    });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId; // Assuming authMiddleware sets req.user._id

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required"
      });
    }

    // Check if already in favorites
    const existing = await FavoriteProduct.findOne({
      user_id: userId,
      product: productId,
    });
    if (existing) {
      await FavoriteProduct.deleteOne({ _id: existing._id });
      return res.status(200).json({
        success: true,
        message: "Removed from favorites",
        isFavorited: false
      });
    }

    // Add to favorites
    const newFavorite = await FavoriteProduct.create({
      user_id: userId,
      product: productId,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to favorites",
      isFavorited: true
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to toggle favorite",
      details: error.message
    });
  }
};

exports.getFavoritesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const favorites = await FavoriteProduct.find({ user_id: userId }).populate("product");
    res.status(200).json({ favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { favoriteId } = req.params;

    const favorite = await FavoriteProduct.findById(favoriteId);

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    if (favorite.user_id.toString() !== req.user.userId.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await favorite.deleteOne();
    return res.status(200).json({ message: "Product removed from favorites" });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.trackFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const action = req.body.action || "toggle";
    const timestamp = new Date();

    const trackRecord = new TrackFavorite({
      userId,
      productId,
      action,
      timestamp,
    });

    await trackRecord.save();

    res.status(200).json({ message: "Favorite tracked successfully", trackRecord });
  } catch (error) {
    console.error("Track favorite error:", error);
    res.status(500).json({ error: "Failed to track favorite", details: error.message });
  }
};
