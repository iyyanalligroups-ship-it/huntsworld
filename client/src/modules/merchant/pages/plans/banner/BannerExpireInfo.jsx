import React from "react";
import { getBannerExpiryInfo } from "@/modules/merchant/utils/BannerExpire"; // Ensure this path is correct
import {
  TriangleAlert,
  CircleCheck,
  CircleX,
  Clock
} from "lucide-react";

const BannerExpiryInfo = ({ expiresAt, onRenew }) => {
  const info = getBannerExpiryInfo(expiresAt);

  // UI Theme Configuration Map
  const styles = {
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-700",
      // Lucide icons inherit size/color via className naturally
      icon: <Clock className="w-5 h-5 text-gray-500" />,
      button: "hidden",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: <CircleCheck className="w-5 h-5 text-green-600" />,
      button: "hidden",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      icon: <TriangleAlert className="w-5 h-5 text-orange-600" />,
      button: "text-orange-700 hover:bg-orange-100",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: <CircleX className="w-5 h-5 text-red-600" />,
      button: "text-red-700 hover:bg-red-100",
    },
  };

  const currentStyle = styles[info.theme] || styles.gray;
  const showAction = info.status === "EXPIRING_SOON" || info.status === "EXPIRED";

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border ${currentStyle.bg} ${currentStyle.border}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon Wrapper */}
        <div className="mt-0.5 sm:mt-0 flex-shrink-0">
          {currentStyle.icon}
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-1">
          <h4 className={`text-sm font-bold ${currentStyle.text}`}>
            {info.label}
          </h4>

          {/* Detailed Message based on status */}
          {info.status === "EXPIRING_SOON" && (
            <p className="text-xs opacity-90 text-orange-900 leading-snug">
              Your banner visibility will end soon. Please renew to keep it active.
            </p>
          )}
          {info.status === "EXPIRED" && (
            <p className="text-xs opacity-90 text-red-900 leading-snug">
              Your banner is no longer visible to customers.
            </p>
          )}
        </div>
      </div>

      {/* Action Button (Only shows if expiring/expired) */}
      {showAction && onRenew && (
        <button
          onClick={onRenew}
          className={`mt-3 sm:mt-0 ml-0 sm:ml-4 text-xs font-semibold px-4 py-2 sm:py-1.5 rounded-md transition-colors border border-current whitespace-nowrap ${currentStyle.button}`}
        >
          Renew Now
        </button>
      )}
    </div>
  );
};

export default BannerExpiryInfo;
