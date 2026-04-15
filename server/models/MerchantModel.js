
const mongoose = require("mongoose");
const Product = require("../models/productModel");
const Counter = require("../models/counterModel");

// Register models used in hooks to prevent MissingSchemaError
require("../models/addressModel");
require("../models/bannerModel");
require("../models/trustSealRequestModel");
require("../models/buyLeadsModel");
require("../models/distributionRequestModel");
require("../models/subdealerModel");
require("../models/mobileNumberAccessModel");
require("../models/trendingPointsModel");
require("../models/trustSealAssignModel"); // Added for completeness based on comments

const merchantSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      index: true,
    },

    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    merchant_code: {
      type: String,
      unique: true,
      index: true,
    },

    company_email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      validate: {
        validator: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Please enter a valid email address",
      },
    },

    company_phone_number: {
      type: String,
      unique: true,
      sparse: true,
    },

    company_name: String,
    msme_certificate_number: { type: String, unique: true, sparse: true },
    gst_number: { type: String, unique: true, sparse: true },
    pan: { type: String, unique: true, sparse: true },
    aadhar: { type: String, unique: true, sparse: true },

    // ──────────────────────────────────────────────────────────────
    // NEW FIELD: Domain Name
    // ──────────────────────────────────────────────────────────────
    domain_name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    email_verified: { type: Boolean, default: false },
    number_verified: { type: Boolean, default: false },

    email_otp: { type: String },
    number_otp: { type: String },
    otpExpires: { type: Date },

    verified_status: { type: Boolean, default: false },
    trustshield: { type: Boolean, default: false },

    company_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyType",
      // remove enum
    },

    company_logo: String,
    company_images: [String],
    company_video: String,
    description: {
      type: String,
      validate: {
        validator: (v) => {
          if (!v) return true;
          const words = v.trim().split(/\s+/).length;
          return words >= 10 && words <= 3000;
        },
        message: "Description must be between 10 and 3000 words.",
      },
    },

    number_of_employees: {
      type: Number,
      min: [1, "Number of employees must be at least 1"],
    },

    year_of_establishment: {
      type: Number,
      validate: {
        validator: (v) => {
          if (!v) return true;
          const year = new Date().getFullYear();
          return v >= 1800 && v <= year;
        },
        message: "Enter a valid year of establishment.",
      },
    },

    // Tracking
    merchant_progress: { type: Number, default: 0 },
    is_profile_completed: { type: Boolean, default: false },
    mark_as_read: { type: Boolean, default: false },
    has_uploaded_first_product: { type: Boolean, default: false },
    last_activity: { type: Date, default: Date.now },
    modifiedFields: { type: [String], default: [] },
  },
  { timestamps: true }
);

merchantSchema.index({ company_type: 1 });

// ----------------------------------------------------
merchantSchema.pre("save", async function (next) {
  try {
    // Convert empty strings to undefined for unique sparse fields so MongoDB ignores them
    const uniqueFields = ["msme_certificate_number", "gst_number", "pan", "aadhar", "company_email", "company_phone_number", "domain_name"];
    uniqueFields.forEach(field => {
      if (this[field] === "" || this[field] === null) {
        this[field] = undefined;
      }
    });

    let progress = 0;

    if (this.company_name) progress += 10;
    if (this.company_email) progress += 10;
    if (this.company_phone_number) progress += 10;
    if (this.company_logo) progress += 10;
    if (this.company_images?.length) progress += 10;
    if (this.domain_name) progress += 10;           // ← NEW
    if (this.gst_number) progress += 15;
    if (this.pan) progress += 10;
    if (this.description) progress += 15;
    if (this.number_of_employees) progress += 5;
    if (this.year_of_establishment) progress += 5;

    this.merchant_progress = progress;
    this.is_profile_completed = progress >= 90;
    this.last_activity = new Date();

    /* AUTO MERCHANT CODE */
    if (this.isNew && !this.merchant_code) {
      const counter = await Counter.findOneAndUpdate(
        { _id: "merchant_code" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.merchant_code = `MERHW${String(counter.seq).padStart(3, "0")}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// HARD DELETE → CASCADE PRODUCTS (unchanged)
// merchantSchema.pre(
//   ["deleteOne", "findOneAndDelete", "deleteMany"],
//   async function (next) {
//     try {
//       let merchantIds = [];
//       if (this._id) {
//         merchantIds = [this._id];
//       } else {
//         const docs = await this.model.find(this.getQuery()).select("_id").lean();
//         merchantIds = docs.map((d) => d._id);
//       }
//       if (!merchantIds.length) return next();
//       await Product.deleteMany({
//         seller_id: { $in: merchantIds },
//         sellerModel: "Merchant",
//       });
//       next();
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// -------------------------------------------------------------------------
// CASCADE DELETE: When Merchant is deleted, clean up all merchant-related data
// -------------------------------------------------------------------------
merchantSchema.pre(
  ["deleteOne", "findOneAndDelete", "deleteMany"],
  async function (next) {
    try {
      const mongoose = require("mongoose");
      let merchantIds = [];
      let userIds = [];

      // 1. Capture the Merchant IDs and User IDs being deleted
      if (this.getQuery()._id) {
        const docs = await this.model.find(this.getQuery()).select("_id user_id").lean();
        merchantIds = docs.map((d) => d._id);
        userIds = docs.map((d) => d.user_id);
      } else {
        // Fallback for direct document deletion if applicable
        const doc = await this.model.findOne(this.getQuery()).lean();
        if (doc) {
          merchantIds = [doc._id];
          userIds = [doc.user_id];
        }
      }

      if (!merchantIds.length) return next();

      // 2. Define the cleanup operations
      // We only delete data where the entity is acting as a "Merchant"
      await Promise.all([
        // Delete all products owned by this merchant
        mongoose.model("Product").deleteMany({
          seller_id: { $in: merchantIds },
          sellerModel: "Merchant"
        }),

        // Delete Merchant-specific Address (using entity_type to protect personal address)
        mongoose.model("Address").deleteMany({
          user_id: { $in: userIds },
          entity_type: "merchant"
        }),

        // Delete Banner data
        mongoose.model("Banner").deleteMany({ user_id: { $in: userIds } }),

        // Delete Trust Seal Requests & Assignments
        mongoose.model("TrustSealRequest").deleteMany({ user_id: { $in: userIds } }),

        // Delete Buy Leads/Requirements shared as a merchant
        mongoose.model("BuyLead").deleteMany({
          user_id: { $in: userIds },
          type: { $in: ["manufacture", "sub_dealer", "supplier"] }
        }),

        // Delete Distributor Requests (where they are the manufacturer)
        mongoose.model("DistributorRequest").deleteMany({
          $or: [
            { manufacturer_id: { $in: userIds } },
            { initiated_by: { $in: userIds } }
          ]
        }),

        // Delete Sub-dealer profiles linked to this merchant
        mongoose.model("SubDealer").deleteMany({ merchant_id: { $in: merchantIds } }),

        // Delete Mobile Number Access permissions
        mongoose.model("MobileNumberAccess").deleteMany({ sellerId: { $in: merchantIds } }),

        // Delete Trending Points for products that were just deleted
        mongoose.model("TrendingPoints").deleteMany({ user_id: { $in: userIds } })
      ]);

      next();
    } catch (err) {
      next(err);
    }
  }
);

module.exports =
  mongoose.models.Merchant || mongoose.model("Merchant", merchantSchema);
