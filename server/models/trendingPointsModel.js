const mongoose=require('mongoose');
const TrendingPointsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
      index: true,
    },

    trending_points: {
      type: Number,
      default: 0,
    },

    favorite_point_given: {
      type: Boolean,
      default: false,
    },

    last_added_value: {
      type: Number,
      default: 0,
    },

    last_updated_date: {
      type: Date,
      required: true,
      index: true,
    },

    last_trending_date: {
      type: Date,
      index: true,
    },

    last_favorite_date: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true }
);

TrendingPointsSchema.index(
  { user_id: 1, product_id: 1 },
  { unique: true }
);

module.exports = mongoose.model("TrendingPoints", TrendingPointsSchema);
