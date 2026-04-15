// services/digitalBookService.js

const UserActiveFeature = require('../models/UserActiveFeature');
const { STATUS } = require('../constants/subscriptionConstants');
const EbookPayment = require('../models/ebookPaymentModel');
const Merchant = require('../models/MerchantModel');

/**
 * @returns {Promise<{ canAccess: boolean, reason: string, needsPayment: boolean }>}
 */
async function checkCityAccess(userId, targetCity) {
  if (!targetCity?.trim()) {
    return { canAccess: false, reason: 'invalid_city', needsPayment: false };
  }

  const normalized = targetCity.trim().toLowerCase();

  // 1. Always allow own city
  const merchant = await Merchant.findOne({ user_id: userId });
  if (!merchant?.city) {
    return { canAccess: false, reason: 'no_merchant_profile', needsPayment: false };
  }

  if (normalized === merchant.city.trim().toLowerCase()) {
    return { canAccess: true, reason: 'own_city_free', needsPayment: false };
  }

  // 2. Check if already selected in plan quota
  const planFeature = await UserActiveFeature.findOne({
    user_id: userId,
    feature_code: FEATURES.DIGITAL_BOOK,
    status: STATUS.ACTIVE,
    $or: [
      { expires_at: { $gte: new Date() } },
      { expires_at: null }
    ]
  });

  if (planFeature) {
    if (planFeature.selected_plan_cities.some(c => c.toLowerCase() === normalized)) {
      return { canAccess: true, reason: 'plan_quota_selected', needsPayment: false };
    }

    if (planFeature.remaining_plan_city_count > 0) {
      return {
        canAccess: true,
        reason: 'plan_quota_available',
        needsPayment: false,
        canSelectNow: true, // frontend may show "Add this city to your plan quota?"
      };
    }
  }

  // 3. Check if bought as extra
  const hasExtra = await EbookPayment.exists({
    user_id: userId,
    payment_status: STATUS.CAPTURED,
    status: STATUS.ACTIVE_CAP,
    extra_cities: { $in: [new RegExp(`^${normalized}$`, 'i')] },
    $or: [
      { access_expires_at: { $gte: new Date() } },
      { access_expires_at: null }
    ]
  });

  if (hasExtra) {
    return { canAccess: true, reason: 'extra_paid_city', needsPayment: false };
  }

  // Final case → needs to pay for extra city
  return {
    canAccess: false,
    reason: 'limit_reached',
    needsPayment: true,
    remainingPlanCities: planFeature?.remaining_plan_city_count || 0
  };
}

/**
 * Try to consume one slot from plan quota
 * @returns {Promise<boolean>} success
 */
async function tryConsumePlanCity(userId, cityName) {
  const normalized = cityName.trim().toLowerCase();

  const feature = await UserActiveFeature.findOneAndUpdate(
    {
      user_id: userId,
      feature_code: FEATURES.DIGITAL_BOOK,
      status: STATUS.ACTIVE,
      remaining_plan_city_count: { $gt: 0 },
      $or: [{ expires_at: { $gte: new Date() } }, { expires_at: null }]
    },
    {
      $inc: { remaining_plan_city_count: -1 },
      $push: { selected_plan_cities: normalized }
    },
    { new: true }
  );

  return !!feature;
}

module.exports = {
  checkCityAccess,
  tryConsumePlanCity
};
