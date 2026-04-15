const crypto = require("crypto");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const { STATUS } = require("../constants/subscriptionConstants");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const SubscriptionPlanElementMapping = require("../models/subscriptionPlanElementMappingModel");
const UserActiveFeature = require("../models/UserActiveFeature");
const { calculateEndDate } = require("../utils/freePlanHelper");

exports.razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // 1️⃣ Verify webhook signature
        const receivedSignature = req.headers["x-razorpay-signature"];
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(req.body)
            .digest("hex");

        if (receivedSignature !== expectedSignature) {
            console.error("❌ Invalid Razorpay webhook signature");
            return res.status(400).send("Invalid signature");
        }

        const event = req.body.event;
        const payload = req.body.payload;

        // 2️⃣ Handle ONLY renewal payment
        if (event !== "invoice.paid") {
            return res.sendStatus(200);
        }

        const invoice = payload.invoice.entity;
        const razorpaySubscriptionId = invoice.subscription_id;

        // 3️⃣ Find user subscription
        const userSubscription = await UserSubscription.findOne({
            razorpay_subscription_id: razorpaySubscriptionId,
            auto_renew: true,
        });

        if (!userSubscription) {
            return res.sendStatus(200);
        }

        const now = new Date();

        // 4️⃣ Track renewal
        userSubscription.renewal_count += 1;
        userSubscription.last_invoice_id = invoice.id;
        userSubscription.last_renewed_at = now;

        // 5️⃣ Apply dynamic plan on renewal
        let endDate;

        if (userSubscription.apply_latest_plan_on_renewal) {
            const latestPlan = await SubscriptionPlan.findById(
                userSubscription.subscription_plan_id
            );

            if (!latestPlan) {
                console.error("❌ Latest plan not found");
                return res.sendStatus(200);
            }

            const latestMappings = await SubscriptionPlanElementMapping.find({
                subscription_plan_id: latestPlan._id,
                is_enabled: true,
            })
                .populate("feature_id", "feature_name feature_code")
                .lean();

            const durationFeature = latestMappings.find(
                m => m.feature_id?.feature_code === FEATURES.DURATION
            );

            if (!durationFeature?.value) {
                console.error("❌ Duration feature missing");
                return res.sendStatus(200);
            }

            endDate = calculateEndDate(
                userSubscription.end_date || now,
                durationFeature.value
            );

            // Deactivate old features
            await UserActiveFeature.updateMany(
                { user_id: userSubscription.user_id },
                { status: "renewed" }
            );

            // Activate latest features
            for (const mapping of latestMappings) {
                await UserActiveFeature.create({
                    user_id: userSubscription.user_id,
                    user_subscription_id: userSubscription._id,
                    feature_id: mapping.feature_id._id,
                    feature_code: mapping.feature_id.feature_code,
                    activated_at: now,
                    expires_at: endDate,
                    status: STATUS.ACTIVE,
                });
            }

            userSubscription.amount = latestPlan.price * 100;
        } else {
            // Locked renewal fallback
            endDate = calculateEndDate(
                userSubscription.end_date || now,
                userSubscription.plan_snapshot
            );
        }

        // 6️⃣ Finalize renewal
        userSubscription.end_date = endDate;
        userSubscription.next_renewal_at = endDate;
        userSubscription.status = STATUS.ACTIVE_RENEWAL;
        userSubscription.razorpay_subscription_status = "active";
        userSubscription.captured = true;

        await userSubscription.save();

        return res.sendStatus(200);
    } catch (err) {
        console.error("Webhook Error:", err);
        return res.sendStatus(200);
    }
};
