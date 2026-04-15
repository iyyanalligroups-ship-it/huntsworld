const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referred_user_id: {
      type: mongoose.Schema.Types.ObjectId, // assuming it references User collection
      ref: "User",
      required: true,
      unique: true,
    },
    referral_code_used: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    points_awarded: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false, // since your Sequelize model had timestamps: false
    },
  }
);

module.exports = mongoose.model("Referral", referralSchema);
