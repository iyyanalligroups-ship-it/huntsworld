// utils/featureExpiryCalculator.js  (NEW FILE - Recommended)

const mongoose = require("mongoose");

/**
 * Calculates the expiry date for a feature based on its value object from SubscriptionPlanElementMapping
 *
 * @param {Date} activationDate - The date when the feature is activated (usually 'now')
 * @param {Object} value - The value object: { type: "DURATION|NUMBER|BOOLEAN|TEXT", data: ..., unit: ... }
 * @param {Date} planEndDate - Fallback: main subscription end date
 * @returns {Date|null} - Expiry date or null if unlimited
 */
function calculateFeatureExpiry(activationDate, value, planEndDate) {
  if (!value || !activationDate) return planEndDate;

  const dataStr = String(value.data || "").toLowerCase().trim();
  const unit = value.unit ? value.unit.toLowerCase().trim() : null;

  // 1. Explicitly "Unlimited" → never expires
  if (dataStr === "unlimited") {
    return null;
  }

  // 2. Explicitly disabled ("No")
  if (dataStr === "no") {
    return null; // treat as not active
  }

  // 3. Time-based units: day(s), month(s), year(s)
  const timeUnits = ["day", "days", "month", "months", "year", "years"];
  const isTimeUnit = unit && timeUnits.some(u => unit.includes(u));

  if (isTimeUnit) {
    const amount = parseInt(value.data);
    if (isNaN(amount) || amount <= 0) return planEndDate;

    const end = new Date(activationDate);

    if (unit.includes("day")) {
      end.setDate(end.getDate() + amount);
    } else if (unit.includes("month")) {
      end.setMonth(end.getMonth() + amount);
    } else if (unit.includes("year")) {
      end.setFullYear(end.getFullYear() + amount);
    }

    return end;
  }

  // 4. DURATION type → always time-based
  if (value.type === "DURATION") {
    const amount = parseInt(value.data);
    if (isNaN(amount) || amount <= 0 || !unit) return planEndDate;

    const end = new Date(activationDate);
    if (unit.includes("day")) end.setDate(end.getDate() + amount);
    else if (unit.includes("month")) end.setMonth(end.getMonth() + amount);
    else if (unit.includes("year")) end.setFullYear(end.getFullYear() + amount);
    else return planEndDate;

    return end;
  }

  // 5. NUMBER type with non-time unit (e.g., points, photos)
  if (value.type === "NUMBER") {
    // Examples: 1000 points, 5 photos → not time-based → expires with plan
    return planEndDate;
  }

  // 6. BOOLEAN or TEXT enabled values
// 6. Handle TEXT and BOOLEAN types intelligently (FIXED VERSION)
if (["BOOLEAN", "TEXT"].includes(value.type)) {
  // Explicitly unlimited
  if (dataStr === "unlimited") {
    return null; // never expires
  }

  // Explicitly disabled
  if (dataStr === "no") {
    return null; // do not activate
  }

  // Clear enabled indicators
  if (["enable", "enabled", "yes", "free"].includes(dataStr)) {
    return planEndDate;
  }

  // Special case: video duration like "2,min" or "5 min"
  if (dataStr.includes(",min") || dataStr.endsWith("min")) {
    return planEndDate;
  }

  // Numeric values in TEXT field (e.g., "28" days for top listing, "5" photos, "1000" points)
  // These are clearly limits, not "disabled"
  if (dataStr !== "" && !isNaN(parseFloat(dataStr)) && isFinite(dataStr)) {
    return planEndDate;
  }

  // Any other non-empty text (future-proof for "Basic", "Premium", etc.)
  if (dataStr !== "" && dataStr !== "none" && dataStr !== "null") {
    return planEndDate;
  }

  // Finally, if nothing matches → disabled
  return null;
}
  // Default fallback: tie to main plan
  return planEndDate;
}

module.exports = { calculateFeatureExpiry };
