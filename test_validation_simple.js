const mongoose = require('mongoose');

const TrendingPointsPaymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  subscription_id: { type: mongoose.Schema.Types.ObjectId, default: null, required :true },
  points: { type: Number, required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  gst_percentage: { type: Number },
  gst_amount: { type: Number },
  razorpay_order_id: { type: String, required: false },
  razorpay_subscription_id: { type: String, default: null },
  payment_status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active' },
}, { timestamps: true });

const TrendingPointsPayment = mongoose.model('TestModel', TrendingPointsPaymentSchema);

const payment = new TrendingPointsPayment({
  user_id: new mongoose.Types.ObjectId(),
  subscription_id: null,
  points: 100,
  amount: 45,
  razorpay_order_id: null,
});

const err = payment.validateSync();
if (err) {
  console.log('Validation FAILED:');
  console.log(JSON.stringify(err.errors, null, 2));
} else {
  console.log('Validation PASSED!');
}
