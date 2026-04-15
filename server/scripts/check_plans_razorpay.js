const mongoose = require('mongoose');
require('dotenv').config();

// Define a minimal schema for diagnostics
const SubscriptionPlanSchema = new mongoose.Schema({
  plan_code: String,
  plan_name: String,
  price: Number,
  razorpay_plan_id: String,
  business_type: String
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

async function checkPlans() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ Error: MONGO_URI not found in .env file.");
      return;
    }

    console.log("Connecting to database...");
    await mongoose.connect(uri);
    
    const plans = await SubscriptionPlan.find({}).lean();

    console.log("\n--- Subscription Plans Diagnostic ---\n");
    console.table(plans.map(p => ({
      Code: p.plan_code,
      Name: p.plan_name,
      Price: p.price,
      Type: p.business_type,
      "Razorpay Plan ID": p.razorpay_plan_id || "MISSING ❌"
    })));

    console.log("\n⚠️ IMPORTANT: For Auto-Renewal to work, the 'Razorpay Plan ID' MUST be populated.");
    console.log("You can use the 'update_plan_razorpay_id.js' script to fill these in.");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Diagnostic failed:", err);
  }
}

checkPlans();
