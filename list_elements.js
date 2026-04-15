const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'server/.env') });

const SubscriptionPlanElement = require('./server/models/subscriptionPlanElementModel');

async function listElements() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const elements = await SubscriptionPlanElement.find({});
    console.log('ELEMENTS:');
    elements.forEach(e => {
        console.log(`- [${e.feature_code}] "${e.feature_name}"`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listElements();
