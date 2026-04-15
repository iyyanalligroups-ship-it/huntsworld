/**
 * Central constants for the Subscription system (Frontend).
 * Use these instead of hardcoded strings in components.
 */

export const PLAN_TYPES = {
  FREE: 'free',
  MERCHANT: 'merchant',
  GROCERY: 'grocery_seller',
};

export const PLAN_CODES = {
  FREE: 'FREE',
  ROYAL: 'ROYAL',
};

export const STATUS = {
  PAID: 'paid',
  ACTIVE: 'active',
  ACTIVE_RENEWAL: 'active_renewal',
  CREATED: 'created',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  INACTIVE: 'inactive',
};

export const FEATURES = {
  DURATION: 'SUBSCRIPTION_DURATION',
  TREND_POINT: 'TREND_POINT',
};
