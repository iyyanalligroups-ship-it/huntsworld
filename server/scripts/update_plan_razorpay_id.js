const mongoose = require('mongoose');
require('dotenv').config();

// Define the Schema (minimal for update)
const SubscriptionPlanSchema = new mongoose.Schema({
  plan_code: String,
  razorpay_plan_id: String
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

async function updatePlanId(planCode, razorpayId) {
  try {
    // Replace with your actual Mongo URI from .env
    const uri = process.env.MONGO_URI || "your_mongodb_uri_here"; 
    await mongoose.connect(uri);
    
    const result = await SubscriptionPlan.findOneAndUpdate(
      { plan_code: planCode.toUpperCase() },
      { razorpay_plan_id: razorpayId },
      { new: true }
    );

    if (result) {
      console.log(`✅ Success! Plan ${planCode} updated with ID: ${razorpayId}`);
    } else {
      console.log(`❌ Error: Plan with code ${planCode} not found.`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Update failed:", err);
  }
}

// USAGE: 
// 1. Fill in the Plan Code and your Razorpay Plan ID below
// 2. Run: node update_plan.js
const PLAN_TO_UPDATE = 'SILVER'; // Change this to your plan code (e.g. GOLD, PRO)
const RAZORPAY_ID = 'plan_PRP0123456789'; // Change this to your actual plan_id from Razorpay

updatePlanId(PLAN_TO_UPDATE, RAZORPAY_ID);
