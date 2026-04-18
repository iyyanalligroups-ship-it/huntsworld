/**
 * Central constants for the Subscription system.
 * Use these instead of hardcoded strings in controllers.
 */

module.exports = {
  // 🔹 Subscription Plan Business Types
  PLAN_TYPES: {
    FREE: 'free',
    MERCHANT: 'merchant',
    GROCERY: 'grocery_seller',
  },

  // 🔹 Standard Plan Codes (if needed for specific logic)
  PLAN_CODES: {
    FREE: 'FREE',
    ROYAL: 'ROYAL',
  },

  // 🔹 Feature Codes (Linked to SubscriptionPlanElement.feature_code)
  // These mapping must match what is in the database.
  FEATURES: {
    DURATION: 'SUBSCRIPTION_DURATION',
    TREND_POINT: 'TREND_POINT',
    VERIFICATION: 'VERIFICATION',
    PRODUCTS_VIDEO: 'PRODUCTS_VIDEO',
    COMPANY_VIDEO: 'COMPANY_VIDEO',
    PRODUCT_PHOTOS: 'PRODUCT_PHOTOS',
    DIGITAL_BOOK: 'DIGITAL_BOOK',
    PRODUCT_LIMIT: 'PRODUCT',
    CHAT_SYSTEM: 'CHAT_SYSTEM',
    BUY_LEADS: 'BUY_LEADS',
    NEW_USER: 'NEW_USER',
    TRUST_SEAL: 'TRUST_SEAL',
    ADDING_OF_DEALERS: 'ADDING_OF_DEALERS',
    PERSONAL_MANAGER: 'PERSONAL_MANAGER',
  },

  // 🔹 Subscription Statuses
  STATUS: {
    CREATED: 'created',
    PAID: 'paid',
    ACTIVE: 'active',
    ACTIVE_CAP: 'Active',
    ACTIVE_RENEWAL: 'active_renewal',
    EXPIRED: 'expired',
    EXPIRED_CAP: 'Expired',
    CANCELLED: 'cancelled',
    CANCELLED_CAP: 'Cancelled',
    INACTIVE: 'inactive',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    UPGRADED_AWAY: 'upgraded_away',
    PENDING: 'pending',
    STUDENT_VERIFIED: 'student_verified',
    UNDER_REVIEW: 'under_review',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    IN_PROCESS: 'in_process',
    PAYMENT_VERIFIED: 'payment_verified',
    PENDING_CAP: 'Pending',
  },

  // 🔹 Payment Types (Linked to PaymentHistory.payment_type)
  PAYMENT_TYPES: {
    SUBSCRIPTION: 'subscription',
    E_BOOK: 'e_book',
    TRENDING_POINT: 'trending_point',
    TRENDING_POINT_FREE: 'trending_point_free',
    TOP_LISTING: 'top_listing',
    BANNER: 'banner',
  },

  // 🔹 Point Names (Linked to Points model)
  POINTS: {
    E_BOOK: 'E_Book',
    TRENDING_POINTS: 'Trending_Points',
    TOP_LISTING: 'Top_Listing',
  }
};
