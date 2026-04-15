// const mongoose = require('mongoose');

// const trustSealRequestSchema = new mongoose.Schema({
//   user_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   subscription_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'UserSubscription',
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'verified', 'rejected'],
//     default: 'pending',
//   },
//   isRead: {
//     type: Boolean,
//     default: false,
//   },
//   razorpay_order_id: {
//     type: String,
//   },
//   razorpay_payment_id: {
//     type: String,
//   },
//   razorpay_signature: {
//     type: String,
//   },
//   created_at: {
//     type: Date,
//     default: Date.now,
//   },
//   updated_at: {
//     type: Date,
//     default: Date.now,
//   },
//   notes: {
//     type: String,
//     default: '',
//   },
// });

// module.exports = mongoose.model('TrustSealRequest', trustSealRequestSchema);


const mongoose = require('mongoose');

const trustSealRequestSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true,
  },
  gst_percentage: {
    type: Number,
  },
  gst_amount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'in_process','payment_verified', 'student_verified', 'verified', 'rejected', 'expired'],
    default: 'pending',
  },
  picked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Add these fields
  issueDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  images: [{
    url: {
      type: String,
      required: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    }
  }],
  isRead: {
    type: Boolean,
    default: false,
  },
  razorpay_order_id: {
    type: String,
  },
  razorpay_payment_id: {
    type: String,
  },
  razorpay_signature: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  },
  is_student_paid: {
    type: Boolean,
    default: false,
  },
});

// Update timestamp on save
trustSealRequestSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('TrustSealRequest', trustSealRequestSchema);
