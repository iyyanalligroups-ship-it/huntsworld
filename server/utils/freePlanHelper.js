function parseDuration(valueObj) {
  if (!valueObj) throw new Error('Duration value is missing');

  let rawValue;

  // Handle new universal value structure: { type, data, unit }
  if (typeof valueObj === 'object' && valueObj !== null) {
    if (valueObj.data === undefined || valueObj.data === null) {
      throw new Error('Duration data is missing in value object');
    }
    rawValue = String(valueObj.data).trim();
  }
  // Backward compatibility: if somehow value is still a plain string
  else if (typeof valueObj === 'string') {
    rawValue = valueObj.trim();
  } else {
    throw new Error('Invalid duration value format');
  }

  if (!rawValue) throw new Error('Duration value is empty after trimming');

  const parts = rawValue.split(/\s+/);
  let num = 0;
  let unit = 'month';

  if (parts.length === 1) {
    // Only number provided, e.g., "6"
    num = parseFloat(parts[0]);
  } else {
    // Number + unit, e.g., "6 months"
    num = parseFloat(parts[0]);
    unit = parts.slice(1).join(' ').toLowerCase();
  }

  if (isNaN(num) || num <= 0) throw new Error('Invalid duration number');

  let totalMonths = 0;

  if (unit.startsWith('year')) {
    totalMonths = Math.round(num * 12);
  } else if (unit.startsWith('month')) {
    totalMonths = Math.round(num);
  } else if (unit.startsWith('week')) {
    totalMonths = Math.round(num * 7 / 30); // ~4.345 weeks per month
  } else if (unit.startsWith('day')) {
    totalMonths = Math.round(num / 30);
  } else {
    throw new Error(`Unsupported duration unit: ${unit}`);
  }

  return totalMonths;
}

function parseVideoDuration(value) {
  if (!value || !value.type || value.data == null) {
    return null;
  }

  /* =========================
     TEXT TYPE (Enable / Disable)
  ========================= */
  if (value.type === "TEXT") {
    const text = String(value.data).toLowerCase().trim();

    if (["enable", "enabled", "yes", "true"].includes(text)) {
      return {
        enabled: true,
        unlimited: true,
        total_seconds: null,
        original_value: null,
        original_unit: null,
      };
    }

    return null;
  }

  /* =========================
     NUMBER TYPE (Duration)
  ========================= */
  if (value.type !== "NUMBER" || !value.unit) return null;

  const amount = Number(value.data);
  const unit = String(value.unit).toLowerCase().trim();

  if (isNaN(amount) || amount <= 0) return null;

  if (unit.startsWith("sec")) {
    return {
      enabled: true,
      unlimited: false,
      total_seconds: amount,
      original_value: amount,
      original_unit: "seconds",
    };
  }

  if (unit.startsWith("min")) {
    return {
      enabled: true,
      unlimited: false,
      total_seconds: amount * 60,
      original_value: amount,
      original_unit: "minutes",
    };
  }

  if (unit.startsWith("hour") || unit.startsWith("hr")) {
    return {
      enabled: true,
      unlimited: false,
      total_seconds: amount * 3600,
      original_value: amount,
      original_unit: "hours",
    };
  }

  return null;
}


function parseQuotaValue(value) {
  if (!value || value.data == null) return null;

  const dataStr = String(value.data).trim().toLowerCase();
  const unitStr = value.unit ? String(value.unit).trim().toLowerCase() : null;

  // ✅ UNLIMITED CASE
  if (dataStr === "unlimited") {
    return {
      is_unlimited: true,
      total: 0,
      used: 0,
      remaining: 0
    };
  }

  // ✅ NUMERIC CASE (e.g. "5", "50")
  const count = parseInt(dataStr, 10);
  if (!isNaN(count) && count >= 0) {
    return {
      is_unlimited: false,
      total: count,
      used: 0,
      remaining: count
    };
  }

  return null;
}


/**
 * Calculate end date with support for decimal quantities
 * Examples:
 *   { data: "1.5", unit: "year" }   → +1 year and +6 months
 *   { data: "0.5", unit: "month" } → +15–16 days (half current month)
 *   { data: "2.25", unit: "year" } → +2 years and +3 months
 *
 * @param {Date|string} startDate
 * @param {{ data: string|number, unit: string }} value
 * @returns {Date}
 */
 const calculateEndDate = (startDate, value) => {
  let qty = Number(value.data);
  if (isNaN(qty) || qty <= 0) {
    throw new Error(`Invalid duration quantity: "${value.data}" – must be a positive number`);
  }

  const unit = (value.unit || "").toLowerCase().trim();
  if (!unit) {
    throw new Error("Duration unit is missing");
  }

  const date = new Date(startDate);

  // Split into whole and fractional parts
  const wholeQty = Math.floor(qty);
  const fraction = qty - wholeQty;

  // Helper: Add whole units
  const addWholeUnits = () => {
    if (unit === "day" || unit === "days") {
      date.setDate(date.getDate() + wholeQty);
    } else if (unit === "month" || unit === "months") {
      date.setMonth(date.getMonth() + wholeQty);
    } else if (unit === "year" || unit === "years") {
      date.setFullYear(date.getFullYear() + wholeQty);
    } else {
      throw new Error(`Invalid duration unit: "${value.unit}"`);
    }
  };

  // Step 1: Add whole units
  addWholeUnits();

  // Step 2: Handle fractional part (if any)
  if (fraction > 0) {
    if (unit === "day" || unit === "days") {
      // Fractional days → add partial day (rounded)
      const fractionalDays = Math.round(fraction * 1); // 0.5 day ≈ 0.5 day
      date.setDate(date.getDate() + fractionalDays);

    } else if (unit === "month" || unit === "months") {
      // Fractional months → convert to days based on current month length
      const daysInCurrentMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const additionalDays = Math.round(fraction * daysInCurrentMonth);
      date.setDate(date.getDate() + additionalDays);

    } else if (unit === "year" || unit === "years") {
      // Fractional years → convert to months (most accurate)
      const additionalMonths = Math.round(fraction * 12);
      date.setMonth(date.getMonth() + additionalMonths);
    }
  }

  return date;
};

module.exports={calculateEndDate,parseQuotaValue,parseVideoDuration,parseDuration}
