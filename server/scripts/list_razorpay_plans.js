const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function listPlans() {
  try {
    console.log("Fetching plans from Razorpay...");
    const plans = await razorpay.plans.all();
    console.log("\n--- Razorpay Plans Found ---\n");
    if (plans.items.length === 0) {
      console.log("No plans found in this Razorpay account.");
    } else {
      console.table(plans.items.map(p => ({
        ID: p.id,
        Name: p.item.name,
        Amount: p.item.amount / 100,
        Currency: p.item.currency,
        Period: p.period,
        Interval: p.interval
      })));
    }
  } catch (err) {
    console.error("Failed to fetch plans:", err);
  }
}

listPlans();
