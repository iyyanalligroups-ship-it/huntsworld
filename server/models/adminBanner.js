const mongoose=require('mongoose');
const adminBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["DEFAULT", "NORMAL"],
      required: true,
    },

    image_urls: [
      {
        type: String,
        required: true,
      },
    ],

    link: {                 // ← NEW FIELD
      type: String,
      trim: true,
      default: "",          // or you can make it required: true if you want
    },

    is_active: {
      type: Boolean,
      default: true,
    },
    banner_image_approved:{
      type:Boolean,
      default:true
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminBanner", adminBannerSchema);
