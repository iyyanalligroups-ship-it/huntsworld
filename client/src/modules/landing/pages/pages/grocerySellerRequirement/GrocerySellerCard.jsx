import React, { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, MapPin, Phone, User as UserIcon, ExternalLink, Store } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';

import DEFAULT_LOGO from "@/assets/images/no-image.jpg";

// --- 1. Lightweight Helper (Memoized) ---
const Truncate = memo(({ text }) => {
  const displayText = text || "N/A";
  const isLong = displayText.length > 18;
  const truncated = isLong ? `${displayText.slice(0, 18)}…` : displayText;

  if (!isLong) return <span>{displayText}</span>;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{truncated}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-[#0c1f4d] text-white text-xs border-none">
          {displayText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// --- 2. Main Component (Memoized for Performance) ---
const GrocerySellerCard = memo(({ seller, onChatClick }) => {
  const sellerUserId = seller.user?._id || seller.user; // Normalizing ID
  const { data: subscriptionData } = useCheckUserSubscriptionQuery(sellerUserId, {
    skip: !sellerUserId // Skip if no ID available
  });

  const hasContactAccess = subscriptionData?.hasSubscription || false;
  const [imgError, setImgError] = useState(false);
  const logoSrc = imgError || !seller.company_logo ? DEFAULT_LOGO : seller.company_logo;
console.log(seller ,'seller infor fotessdf');

  return (
    // transform-gpu triggers hardware acceleration
    <div className="group relative bg-white flex flex-col h-full rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 ease-out transform-gpu hover:-translate-y-1 will-change-transform">

      {/* Optimization: Static decorative elements instead of animated ones */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-[#0c1f4d] transition-colors duration-300 rounded-t-2xl" />

      <div className="p-5 flex flex-col h-full z-10">

        {/* --- Header --- */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            {/* Removed heavy zoom on small list items if not strictly needed, or keep lightweight */}
            <div className="w-16 h-16 rounded-full border-2 border-gray-100 overflow-hidden bg-gray-50">
              <img
                src={logoSrc}
                alt={seller.shop_name}
                onError={() => setImgError(true)}
                loading="lazy"    // Vital for latency
                decoding="async"  // Prevents main thread blocking
                className="w-full h-full object-cover"
              />
            </div>
            {/* Simple Status Dot (No pulse animation to save CPU) */}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-bold text-lg text-gray-900 leading-tight truncate group-hover:text-[#0c1f4d] transition-colors">
              <Truncate text={seller.shop_name} />
            </h3>
          { seller.domain_name && (
  <a
    href={`https://${seller.domain_name}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
  >
    <ExternalLink size={13} className="opacity-80" />
    {seller.domain_name}
  </a>
)}
            <span className="inline-block mt-1 text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md uppercase tracking-wide">
              {seller.member_type || "Member"}
            </span>
          </div>
        </div>

        {/* --- Info Rows (Standard Flexbox, no Framer Motion) --- */}
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon size={14} className="mr-2.5 text-gray-400 shrink-0" />
            <span className="truncate">@{seller.user?.name || "Unknown"}</span>
          </div>

          {
            hasContactAccess && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone size={14} className="mr-2.5 text-gray-400 shrink-0" />
                <span className="truncate">{seller.shop_phone_number || "N/A"}</span>
              </div>
            )
          }

          <div className="flex items-start text-sm text-gray-600">
            <MapPin size={14} className="mr-2.5 text-gray-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-snug">{seller.location || "No Location"}</span>

          </div>
        </div>

        {/* --- Gallery (Only render if exists) --- */}
        {/* {seller.company_images?.length > 0 && (
          <div className="mt-4 flex gap-2 pt-4 border-t border-gray-50">
            {seller.company_images.slice(0, 3).map((img, i) => (
              <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 relative bg-gray-50 hover:opacity-80 transition-opacity">
                <img
                  src={img || DEFAULT_LOGO}
                  alt="Gallery"
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = DEFAULT_LOGO; }}
                />
              </div>
            ))}
          </div>
        )} */}

        {/* --- Footer Action --- */}
        <div className="mt-5 pt-2">
          {hasContactAccess ? (
            <Button
              onClick={() => onChatClick(seller.user?._id)}
              className="w-full bg-white border border-gray-200 text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white hover:border-[#0c1f4d] transition-colors duration-200 font-semibold shadow-sm text-xs h-10 tracking-wide uppercase cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Seller
            </Button>
          ) : (
             <div className="text-center py-2 bg-gray-50 rounded-lg border border-dashed border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contact restricted to paid plans</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
});

export default GrocerySellerCard;
