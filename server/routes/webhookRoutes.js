const express = require("express");
const router = express.Router();
const { razorpayWebhook } = require("../controllers/razorpayWebhookController");

// ✅ RAW BODY MUST BE HERE
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);
module.exports = router;
