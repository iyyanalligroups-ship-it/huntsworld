const mongoose = require('mongoose');
const path = require('path');
// Use absolute path for the model
const modelPath = path.resolve('d:/projects/final-huntsworld/Huntsworld/server/models/userTrendingPointPaymentModel.js');
const TrendingPointsPayment = require(modelPath);

require('dotenv').config({ path: path.resolve(__dirname, 'server/.env') });

async function test() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to:', mongoUri);
    if (!mongoUri) throw new Error('MONGO_URI is missing in .env');
    await mongoose.connect(mongoUri);

    const payment = new TrendingPointsPayment({
      user_id: new mongoose.Types.ObjectId(),
      subscription_id: null,
      points: 100,
      amount: 45,
      razorpay_order_id: null,
      payment_status: 'created',
      status: 'Active'
    });

    try {
      await payment.validate();
      console.log('Validation passed!');
    } catch (err) {
      console.error('Validation FAILED:');
      console.error(JSON.stringify(err.errors, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('Setup error:', err);
    process.exit(1);
  }
}

test();
