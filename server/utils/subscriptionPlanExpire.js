// server/jobs/subscriptionExpiryJob.js

const cron = require('node-cron');
const UserSubscription = require('../models/userSubscriptionPlanModel');
const UserActiveFeature = require('../models/UserActiveFeature');
const { STATUS } = require('../constants/subscriptionConstants');

// Import your free plan assignment function
// Adjust path according to your project structure
const { assignFreePlan } = require('../utils/assignFreePlan'); // ← change path if needed


// Run every day at 2:00 AM server time (same as trust seal job)
cron.schedule('0 2 * * *', async () => {

  try {
    const now = new Date();

    // Find subscriptions that are still marked active/paid but have passed expiry, or prematurely marked 'expired'
    const expiredSubscriptions = await UserSubscription.find({
      status: { $in: [STATUS.PAID, STATUS.ACTIVE, STATUS.ACTIVE_RENEWAL, STATUS.EXPIRED] },
      end_date: { $lt: now },
    })
      .select('_id user_id end_date')
      .lean();

    if (expiredSubscriptions.length === 0) {
      return;
    }


    // Track users who already received free plan (prevent duplicates)
    const processedUsers = new Set();

    for (const sub of expiredSubscriptions) {
      const userId = sub.user_id.toString();
      const subscriptionId = sub._id.toString();

      try {
        // 1. Delete the expired subscription record
        const deleteSubResult = await UserSubscription.deleteOne({ _id: sub._id });

        if (deleteSubResult.deletedCount === 0) {
          console.warn(`[WARN] Subscription ${subscriptionId} was already deleted or not found`);
          continue;
        }


        // 2. Delete all active features that were tied to this subscription
        const deleteFeaturesResult = await UserActiveFeature.deleteMany({
          user_id: sub.user_id,
          user_subscription_id: sub._id,
          status: STATUS.ACTIVE,
        });


        // 3. Assign free plan — but only **once** per user
        if (!processedUsers.has(userId)) {
          const result = await assignFreePlan(userId, true);
          if (result && result.success) {
            processedUsers.add(userId);
          } else {
            console.error(`[Subscription Expiry] Failed to assign FREE plan to user ${userId}:`, result?.message || 'Unknown error');
          }
        }

        // Optional: real-time notification via Socket.IO (similar to trust seal)
        if (global.io) {
          global.io
            .of('/subscription-notifications')
            .to(`user:${userId}`)
            .emit('subscriptionExpired', {
              user_id: userId,
              expired_subscription_id: subscriptionId,
              expired_at: sub.end_date,
              message: 'Your subscription has expired. You have been moved to the Free plan.',
            });

        }

      } catch (innerError) {
        console.error(
          `[Subscription Expiry] Failed to process subscription ${subscriptionId} for user ${userId}:`,
          innerError.message
        );
        console.error(innerError.stack);
        // Continue with next record – don't stop whole job
      }
    }


  } catch (error) {
    console.error('[Subscription Expiry Cron] Critical error in job execution:', error.message);
    console.error(error.stack);
  }
});

