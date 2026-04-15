const mongoose = require("mongoose");
const Counter = require("../models/counterModel");
const BaseMemberType = require("../models/baseMemberTypeModel"); // Import for population if needed

// Register models used in cascading delete hooks to prevent MissingSchemaError
require("../models/addressModel");
require("../models/grocerySellerRequirementModel");
require("../models/productModel");
require("../models/buyLeadsModel");
require("../models/trendingPointsModel");

const GrocerySellerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    grocery_code: {
      type: String,
      unique: true,
      index: true,
    },

    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },

    shop_email: {
      type: String,
      unique: true,
      sparse: true, // ✅ allows multiple nulls
      lowercase: true,
      trim: true,
    },

    shop_phone_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    domain_name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [
        /^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i,
        "Please enter a valid domain name (example: myshop.in)",
      ],
    },

    msme_certificate_number: {
      type: String,
      trim: true,
      unique: true,     // ← add back
      sparse: true,     // allows multiple null / missing / ""
    },
    gst_number: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    aadhar: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    shop_name: {
      type: String,
      trim: true,
      index: true,
    },

    company_logo: {
      type: String,
    },

    company_images: {
      type: [String],
      default: [],
    },

    email_verified: { type: Boolean, default: false },
    number_verified: { type: Boolean, default: false },

    email_otp: { type: String },
    number_otp: { type: String },
    otpExpires: { type: Date },

    verified_status: { type: Boolean, default: false, index: true, },

    member_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseMemberType",
      required: true,
      index: true,
    },
    markAsRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

GrocerySellerSchema.index({ markAsRead: 1 });

/* 🔥 AUTO INCREMENT BASEHW001 */
GrocerySellerSchema.pre("save", async function (next) {
  if (!this.isNew || this.grocery_code) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "grocery_seller_code" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.grocery_code = `BASEHW${String(counter.seq).padStart(3, "0")}`;
    next();
  } catch (error) {
    next(error);
  }
});

/* 🔍 TEXT SEARCH INDEX */
GrocerySellerSchema.index({ shop_name: "text" });

// ----------------------------------------------------
// CASCADE DELETE: Clean up Grocery Seller business data
// ----------------------------------------------------
GrocerySellerSchema.pre(
  ["deleteOne", "findOneAndDelete", "deleteMany"],
  async function (next) {
    try {
      const mongoose = require("mongoose");

      // 1. Identify the documents being deleted from the query
      const query = this.getQuery();
      const docs = await this.model.find(query).select("_id user_id").lean();

      const sellerIds = docs.map((d) => d._id);
      const userIds = docs.map((d) => d.user_id);

      if (!sellerIds.length) return next();

      // 2. Perform concurrent cleanup of related business data
      await Promise.all([
        // Delete shop-specific addresses (leaves 'personal' types safe)
        mongoose.model("Address").deleteMany({
          user_id: { $in: userIds },
          entity_type: "grocery_seller"
        }),

        // Delete all business requirements (buy/sell leads) for this grocery profile
        mongoose.model("GrocerySellerRequirement").deleteMany({
          user_id: { $in: userIds }
        }),

        // Delete products listed by this grocery seller
        mongoose.model("Product").deleteMany({
          seller_id: { $in: sellerIds },
          sellerModel: "GrocerySeller" // Ensure your Product enum supports this string
        }),

        // Delete any buy leads from the general BuyLead table
        mongoose.model("BuyLead").deleteMany({
          user_id: { $in: userIds },
          type: "base_member"
        }),

        // Clean up trending points associated with this user's grocery products
        mongoose.model("TrendingPoints").deleteMany({
          user_id: { $in: userIds }
        })
      ]);

      next();
    } catch (err) {
      next(err);
    }
  }
);

/* ✅ SAFE EXPORT */
module.exports =
  mongoose.models.GrocerySeller ||
  mongoose.model("GrocerySeller", GrocerySellerSchema);
