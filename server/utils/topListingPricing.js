const CommonSubscriptionPlan = require("../models/commonSubcriptionPlanModel");

exports.getTopListingMonthlyRate = async () => {
  const plan = await CommonSubscriptionPlan.findOne({
    name: "Top Listing",
    category: "service",
    durationType: "per_day",
  });

  if (!plan) {
    throw new Error("Top Listing pricing plan not found");
  }

  return {
    pricePerMonth: plan.price,
    durationValue: plan.durationValue, // usually 1
  };
};

exports.getGSTPercentage = async () => {
  const gstPlan = await CommonSubscriptionPlan.findOne({
    name: "GST",
    category: "gst",
    durationType: "percentage",
  });

  return gstPlan?.price !== undefined ? gstPlan.price : 18;
};
