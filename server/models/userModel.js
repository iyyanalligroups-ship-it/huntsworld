const mongoose = require('mongoose');
const Counter = require("./counterModel");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  referral_code: { type: String, unique: true },
  referred_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, sparse: true, unique: true },
  phone: { type: String, sparse: true, unique: true },
  gender: { type: String },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  number_otp: { type: String },
  password: { type: String },
  number_verified: { type: Boolean, default: false },
  email_otp: { type: String },
  otpExpires: { type: Date, default: null },
  email_verified: { type: Boolean, default: false },
  profile_pic: { type: String },
  date_of_birth: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  user_code: {
    type: String,
    unique: true,
    index: true,
  },
  deactivated_at: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true   // New users are active by default
  },
  hasSentOneTimeMessage: { type: Boolean, default: false }, // New field to track one-time message
  markAsRead: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.index({ markAsRead: 1 });
userSchema.index({ role: 1 });

userSchema.pre("save", async function (next) {
  try {
    /* =========================
       REFERRAL CODE - New Format
    ========================= */
    if (!this.referral_code) {
      // 1. First two letters of name (fallback if name is too short)
      let namePart = "XX"; // default fallback
      if (this.name && this.name.trim().length > 0) {
        namePart = this.name.trim().substring(0, 2).toUpperCase();
      }

      // 2. Last 5 digits of phone (or fallback if no phone / too short)
      let phoneDigits = "00000";
      if (this.phone && /^\d+$/.test(this.phone)) {
        const cleaned = this.phone.replace(/\D/g, ""); // remove non-digits
        if (cleaned.length >= 5) {
          phoneDigits = cleaned.slice(-5);
        } else if (cleaned.length > 0) {
          phoneDigits = cleaned.padStart(5, "0");
        }
      }

      // 3. 3 to 5 random letters (A-Z)
      const randomLength = Math.floor(Math.random() * 3) + 3; // 3,4 or 5
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let randomLetters = "";
      for (let i = 0; i < randomLength; i++) {
        randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
      }

      // Combine
      this.referral_code = `${namePart}${phoneDigits}${randomLetters}`;

      // Check for uniqueness (up to 8 attempts)
      let existing = await mongoose.model("User").findOne({
        referral_code: this.referral_code,
      });

      let attempts = 0;
      while (existing && attempts < 8) {
        // regenerate only the random part
        const newRandomLength = Math.floor(Math.random() * 3) + 3;
        let newRandom = "";
        for (let i = 0; i < newRandomLength; i++) {
          newRandom += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        this.referral_code = `${namePart}${phoneDigits}${newRandom}`;

        existing = await mongoose.model("User").findOne({
          referral_code: this.referral_code,
        });

        attempts++;
      }

      if (existing) {
        // Very rare — but better to fail explicitly than create duplicate
        return next(new Error("Could not generate unique referral code after multiple attempts"));
      }
    }

    /* =========================
       DEFAULT ROLE
    ========================= */
    if (!this.role) {
      const defaultRole = await mongoose.model("Role").findOne({ role: "USER" });
      if (defaultRole) {
        this.role = defaultRole._id;
      }
    }

    /* =========================
       AUTO USER CODE (USERHW001)
    ========================= */
    if (this.isNew && !this.user_code) {
      const counter = await Counter.findOneAndUpdate(
        { _id: "user_code" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.user_code = `USERHW${String(counter.seq).padStart(3, "0")}`;
    }

    this.updated_at = new Date();
    next();
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------------------
// CASCADE DELETE: When a User is deleted, wipe all associated data
// -------------------------------------------------------------------------
userSchema.pre(
  ["deleteOne", "findOneAndDelete", "deleteMany"],
  async function (next) {
    try {
      const mongoose = require("mongoose");

      // 🚨 CRITICAL: Ensure all dependent models are registered before access
      // We require them inside the hook to guarantee registration at the moment of deletion
      const models = {
        roleModel: "./roleModel",
        Merchant: "./MerchantModel",
        GrocerySeller: "./grocerySellerModel",
        Student: "./studentModel",
        ServiceProvider: "./serviceProviderModel",
        SubDealer: "./subdealerModel",
        Admin: "./adminModel",
        Address: "./addressModel",
        Access: "./accessModel",
        PhoneVisibility: "./phoneVisibilityModel",
        PaymentAccount: "./paymentAccountModel",
        Message: "./messageModel",
        Notification: "./couponsNotificationModel",
        UserSubscription: "./userSubscriptionPlanModel",
        UserActiveFeature: "./UserActiveFeature",
        PaymentHistory: "./paymentHistoryModel",
        BannerPayment: "./bannerPaymentModel",
        EbookPayment: "./ebookPaymentModel",
        TrendingPointsPayment: "./userTrendingPointPaymentModel",
        TopListingPayment: "./topListingPaymentModel",
        ViewPoint: "./viewPointsModel",
        TrendingPoints: "./trendingPointsModel",
        RedeemPoints: "./redeemPointsModel",
        FavoriteProduct: "./favoriteProductModel",
        FavoriteCompany: "./favoriteCompanyModel",
        FavoriteServiceProvider: "./favoriteServiceProvider",
        Review: "./reviewModel",
        PostByRequirement: "./postByRequirementModel",
        GrocerySellerRequirement: "./grocerySellerRequirementModel",
        BuyLead: "./buyLeadsModel",
        HelpRequest: "./helpRequestModel",
        Complaint: "./ComplaintFormModel",
        Testimonial: "./testimonialModel",
        Testweb: "./testWebModel",
        PhoneNumberAccessRequest: "./phoneNumberAccessRequestModel",
        Report: "./reportFileModel",
      };

      for (const [name, path] of Object.entries(models)) {
        if (name !== 'roleModel' && !mongoose.models[name]) {
          try { require(path); } catch(e) { console.error(`Failed to load model ${name} from ${path}`); }
        } else if (name === 'roleModel' && !mongoose.models.Role) {
           try { require(path); } catch(e) { console.error(`Failed to load model Role from ${path}`); }
        }
      }

      const query = this.getQuery();
      const docs = await this.model.find(query).select("_id").lean();
      const userIds = docs.map((d) => d._id);

      if (!userIds.length) return next();

      // We use Promise.all to run these deletions in parallel for performance
      await Promise.all([
        // 1. PRIMARY ROLE PROFILES (These have their own cascade hooks)
        mongoose.model("Merchant").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("GrocerySeller").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("Student").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("ServiceProvider").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("SubDealer").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("Admin").deleteMany({ user_id: { $in: userIds } }),

        // 2. PERSONAL DATA & LOGS
        mongoose.model("Address").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("Access").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("PhoneVisibility").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("PaymentAccount").deleteMany({ user_id: { $in: userIds } }),

        // 3. MESSAGES & COMMUNICATIONS (Both sides)
        mongoose.model("Message").deleteMany({
          $or: [{ sender: { $in: userIds } }, { receiver: { $in: userIds } }]
        }),
        mongoose.model("Notification").deleteMany({
          $or: [{ recipient: { $in: userIds } }, { "readBy.userId": { $in: userIds } }]
        }),

        // 4. PAYMENTS & SUBSCRIPTIONS
        mongoose.model("UserSubscription").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("UserActiveFeature").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("PaymentHistory").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("BannerPayment").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("EbookPayment").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("TrendingPointsPayment").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("TopListingPayment").deleteMany({ user_id: { $in: userIds } }),

        // 5. POINTS & ACTIVITY
        mongoose.model("ViewPoint").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("TrendingPoints").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("RedeemPoints").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("FavoriteProduct").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("FavoriteCompany").deleteMany({ user: { $in: userIds } }),
        mongoose.model("FavoriteServiceProvider").deleteMany({ user: { $in: userIds } }),
        mongoose.model("Review").deleteMany({ userId: { $in: userIds } }),

        // 6. REQUESTS & TICKETS
        mongoose.model("PostByRequirement").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("GrocerySellerRequirement").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("BuyLead").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("HelpRequest").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("Complaint").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("Testimonial").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("Testweb").deleteMany({ user_id: { $in: userIds } }),
        mongoose.model("PhoneNumberAccessRequest").deleteMany({
          $or: [{ customer_id: { $in: userIds } }, { seller_id: { $in: userIds } }]
        }),

        // 7. REPORTS (Wipe reports made by them OR against them)
        mongoose.model("Report").deleteMany({
          $or: [{ reported_by: { $in: userIds } }, { reported_user_id: { $in: userIds } }]
        })
      ]);

      next();
    } catch (err) {
      next(err);
    }
  }
);

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
