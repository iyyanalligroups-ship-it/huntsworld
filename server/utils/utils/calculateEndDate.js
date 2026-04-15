function calculateEndDate(startDate, durationValue) {
  if (!durationValue || !durationValue.data || !durationValue.unit) {
    throw new Error("Invalid duration value");
  }

  const value = Number(durationValue.data);
  const unit = durationValue.unit.toLowerCase();

  const endDate = new Date(startDate);

  if (unit === "day" || unit === "days") {
    endDate.setDate(endDate.getDate() + value);
  }
  else if (unit === "month" || unit === "months") {
    endDate.setMonth(endDate.getMonth() + value);
  }
  else if (unit === "year" || unit === "years") {
    endDate.setFullYear(endDate.getFullYear() + value);
  }
  else {
    throw new Error("Unsupported duration unit");
  }

  return endDate;
}

module.exports = calculateEndDate;
