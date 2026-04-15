const mongoose = require("mongoose");
const Counter = require("../models/counterModel");

// Register models used in cascading delete hooks to prevent MissingSchemaError
require("../models/addressModel");
require("../models/trustSealAssignModel");
require("../models/buyLeadsModel");

const StudentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    college_email: { type: String, unique: true, sparse: true },
    id_card: { type: String },
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    student_code: {
      type: String,
      unique: true,
      index: true,
    },

    college_name: { type: String, },
    university_name: { type: String, },
    email_verified: { type: Boolean, default: false },
    number_verified: { type: Boolean, default: false },

    email_otp: { type: String },
    number_otp: { type: String },
    otpExpires: { type: Date },
    verified: { type: Boolean, default: false },
    expiry_date: { type: Date },
    college_start_month_year: { type: Date, },
    college_end_month_year: { type: Date, },
    markAsRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

StudentSchema.index({ markAsRead: 1 });
// 🔥 AUTO INCREMENT STUDHW001
StudentSchema.pre("save", async function (next) {
  try {
    // 🔥 AUTO INCREMENT STUDHW001
    if (this.isNew && !this.student_code) {
      const counter = await Counter.findOneAndUpdate(
        { _id: "student_code" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.student_code = `STUDHW${String(counter.seq).padStart(3, "0")}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// CASCADE DELETE: Clean up Student-specific profile data
// ----------------------------------------------------
StudentSchema.pre(
  ["deleteOne", "findOneAndDelete", "deleteMany"],
  async function (next) {
    try {
      const mongoose = require("mongoose");

      // 1. Identify the students and associated user IDs being deleted
      const query = this.getQuery();
      const docs = await this.model.find(query).select("_id user_id").lean();

      const studentIds = docs.map((d) => d._id);
      const userIds = docs.map((d) => d.user_id);

      if (!userIds.length) return next();

      // 2. Cleanup related records
      await Promise.all([
        // Delete Student-specific Address (protects 'personal' and 'company' types)
        mongoose.model("Address").deleteMany({
          user_id: { $in: userIds },
          entity_type: "student"
        }),

        // Delete Trust Seal Assignments (if they were verifying merchants as students)
        mongoose.model("TrustSealAssignment").deleteMany({
          student_id: { $in: userIds }
        }),

        // Delete any BuyLeads specifically tagged as 'student'
        mongoose.model("BuyLead").deleteMany({
          user_id: { $in: userIds },
          type: "student"
        }),

        // If you have Student-specific payments (like premium student features)
        // mongoose.model("EbookPayment").deleteMany({ user_id: { $in: userIds } })
      ]);

      next();
    } catch (err) {
      next(err);
    }
  }
);
module.exports =
  mongoose.models.Student ||
  mongoose.model("Student", StudentSchema);
