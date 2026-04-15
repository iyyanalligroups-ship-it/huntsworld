// server/jobs/trustSealExpiryJob.js

const cron = require('node-cron');
const TrustSealRequest = require('../models/trustSealRequestModel');
const { STATUS } = require('../constants/subscriptionConstants');


// Run every day at 2:00 AM server time
cron.schedule('0 2 * * *', async () => {

  try {
    const now = new Date();

    // Find all Trust Seals that are currently 'verified' but have passed their expiry date
    const expiredTrustSeals = await TrustSealRequest.find({
      status: STATUS.VERIFIED,
      expiryDate: { $lt: now },
    }).select('user_id _id expiryDate');

    if (expiredTrustSeals.length === 0) {
      return;
    }


    // Extract IDs for bulk update
    const expiredIds = expiredTrustSeals.map(req => req._id);

    // Bulk update status to 'expired'
    const updateResult = await TrustSealRequest.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: STATUS.EXPIRED } }
    );


    // Notify each merchant via Socket.IO in real-time
    expiredTrustSeals.forEach((request) => {
      const userId = request.user_id.toString();

      global.io
        ?.of('/trust-seal-notifications')
        ?.to(`trust-seal:${userId}`)
        ?.emit('trustSealRequestUpdated', {
          _id: request._id,
          user_id: request.user_id,
          status: STATUS.EXPIRED,
          expiryDate: request.expiryDate,
          message: 'Your Trust Seal has expired. Please renew to continue displaying the verified badge.',
        });

    });


  } catch (error) {
    console.error('[Trust Seal Expiry Cron] Error during expiry job:', error.message);
    console.error(error.stack);
  }
});

