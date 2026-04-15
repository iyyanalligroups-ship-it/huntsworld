
// const mongoose = require('mongoose');

// const BannerSchema = new mongoose.Schema({
//   user_id: {
//     type: String,
//     required: true
//   },
//   subcription_id: {
//     type: String,
//     required: true,
//     maxlength: 255
//   },
//   banner_payment_id: {
//     type: String,
//     required: true,
//     maxlength: 255
//   },
//   title: {
//     type: String
//   },
//   circle_logo: {
//     type: String
//   },
//   banner_image: {
//     type: String
//   },
//   rectangle_logo: {
//     type: String
//   },
//   created_at: {
//     type: Date,
//     default: Date.now
//   },
//   updated_at: {
//     type: Date,
//     default: Date.now
//   }
// }, {
// timestamps:true
// });


// module.exports = mongoose.model('Banner', BannerSchema);
const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserSubscription',
      required: true,
    },

    banner_payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BannerPayment',
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    company_name: {
      type: String,
      required: true,
      trim: true,
    },

    // ==============================
    // 🔹 Premium Banner Image
    // ==============================
    banner_image: {
      type: String,
      default: null,
    },

    banner_image_approved: {
      type: Boolean,
      default: false,
    },

    // ==============================
    // 🔹 Rectangle Logo (Free Banner)
    // ==============================
    rectangle_logo: {
      type: String,
      default: null,
    },

    rectangle_logo_approved: {
      type: Boolean,
      default: false,
    },

    created_at: {
      type: Date,
      default: Date.now,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },

    markAsRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One banner per user
BannerSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('Banner', BannerSchema);
