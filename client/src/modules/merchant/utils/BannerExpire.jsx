import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday"; // Import isToday plugin

dayjs.extend(relativeTime);
dayjs.extend(isToday);

export const getBannerExpiryInfo = (expiresAt) => {
  if (!expiresAt) {
    return {
      label: "No expiry date",
      shortLabel: "N/A",
      theme: "gray",
      status: "UNKNOWN",
      daysLeft: null,
    };
  }

  const expiry = dayjs(expiresAt);
  const now = dayjs();

  // Calculate exact days left (rounding up makes logical sense for "days remaining")
  // If it expires in 25 hours, that is 1 full day and a bit, so 1 day left.
  const daysLeft = expiry.diff(now, "day");

  // 1. Handle Expired
  if (expiry.isBefore(now)) {
    return {
      label: `Expired on ${expiry.format("DD MMM YYYY")}`,
      shortLabel: "Expired",
      theme: "red",
      status: "EXPIRED",
      daysLeft: 0,
    };
  }

  // 2. Handle "Expires Today" specifically
  if (expiry.isToday()) {
    return {
      label: `Expires Today (${expiry.format("h:mm A")})`,
      shortLabel: "Expires Today",
      theme: "orange",
      status: "EXPIRING_SOON",
      daysLeft: 0,
    };
  }

  // 3. Handle "Expiring Soon" (3 days or less)
  if (daysLeft <= 3) {
    const timeText = daysLeft === 0 ? "Tomorrow" : `in ${daysLeft} days`;

    return {
      label: `Expires ${timeText} (${expiry.format("DD MMM")})`,
      shortLabel: `Expires ${timeText}`,
      theme: "orange", // or amber
      status: "EXPIRING_SOON",
      daysLeft,
    };
  }

  // 4. Active / Healthy
  return {
    label: `Expires on ${expiry.format("DD MMM YYYY")}`,
    shortLabel: `${daysLeft} days left`,
    theme: "green",
    status: "ACTIVE",
    daysLeft,
  };
};
