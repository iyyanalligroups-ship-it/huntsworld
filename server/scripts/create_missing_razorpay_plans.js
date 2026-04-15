const mongoose = require('mongoose');
const Razorpay = require('razorpay');
require('dotenv').config();

const SubscriptionPlan = require('../models/subscriptionPlanModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createAndSyncPlans() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not found");

    await mongoose.connect(uri);
    console.log("Connected to database...");

    const plans = await SubscriptionPlan.find({ 
      razorpay_plan_id: { $in: [null, ""] },
      price: { $gt: 1 } // Ignore free plans
    });

    if (plans.length === 0) {
      console.log("No missing Razorpay Plan IDs found in database.");
      process.exit(0);
    }

    console.log(`Found ${plans.length} plans to sync with Razorpay...`);

    for (const plan of plans) {
      try {
        console.log(`Creating Razorpay plan for: ${plan.plan_name} (₹${plan.price}/year)...`);
        
        const razorpayPlan = await razorpay.plans.create({
          period: "yearly",
          interval: 1,
          item: {
            name: plan.plan_name,
            amount: plan.price * 100, // in paise
            currency: "INR",
            description: plan.description || `Yearly ${plan.plan_name} subscription`
          }
        });

        plan.razorpay_plan_id = razorpayPlan.id;
        await plan.save();
        
        console.log(`✅ Success: ${plan.plan_name} synced with ID: ${razorpayPlan.id}`);
      } catch (err) {
        console.error(`❌ Failed to create plan for ${plan.plan_name}:`, err.message);
      }
    }

    console.log("\nAll plans processed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Critical failure:", err);
    process.exit(1);
  }
}

createAndSyncPlans();
