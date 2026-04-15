import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  ShoppingBag,
  Package,
  MapPin,
  MessageSquare,
  ChevronDown,
  CheckCircle2,
  Store,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import noImage from "@/assets/images/no-image.jpg";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';

const BaseMemberCard = ({ member, viewType = "grid" }) => {
  const navigate = useNavigate();
  const { setSelectedUser } = useSelectedUser();

  const [showPhone, setShowPhone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  /* ---------------- Contact Access Check ---------------- */
  const sellerUserId = member?.user_id?._id || member?.user_id || member?.grocerySeller?.user_id;
  const { data: subscriptionData } = useCheckUserSubscriptionQuery(sellerUserId, {
    skip: !sellerUserId
  });
  const hasContactAccess = subscriptionData?.hasSubscription || false;

  /* ---------------- Safe Data Mapping from JSON ---------------- */
  const user = member?.user_id || {};
  const grocerySeller = member?.grocerySeller || {};
  const address = grocerySeller?.address_id || {};
  const req = member?.latestRequirement || null;

  const shopName = grocerySeller?.shop_name?.replace(/_/g, " ").toUpperCase() || user?.name || "Anonymous User";
  const shopPhone = grocerySeller?.shop_phone_number || "N/A";
  const shopCode = grocerySeller?.grocery_code || "";

  const logo = grocerySeller?.company_logo || user?.profile_pic || noImage;
  const isVerified = grocerySeller?.verified_status === true;

  const city = address?.city || "Location not shared";
  const state = address?.state || "";

  const rawMemberType = grocerySeller?.member_type;
  const memberType = rawMemberType?.name 
    ? rawMemberType.name.replace(/_/g, " ") 
    : (typeof rawMemberType === "string" ? rawMemberType : "Base Member");

  /* ---------------- Requirement Logic ---------------- */
  const hasRequirement = !!req;
  const isBuy = req?.requirement_type === "buy";
  const productName = req?.product_name || "Looking for products";
  const quantity = req?.quantity ? `${req.quantity} ${req.unit_of_measurement || ""}` : "";
  const description = req?.description || "Interested in business inquiries.";

  /* ---------------- Navigation ---------------- */
  // const handleProfileClick = () => {
  //   const slug = (grocerySeller?.shop_name || user?.name || "user").toLowerCase().replace(/\s+/g, "-");
  //   navigate(`/member/${user?._id}/${slug}`);
  // };

  const handleChatClick = (e) => {
    e.stopPropagation();
    setSelectedUser({ _id: user?._id });
    navigate("/chat");
  };

  const isList = viewType === "list";

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-200 ${
        isList ? "flex flex-col md:flex-row p-0" : "flex flex-col"
      }`}
     
    >
      {/* ---------- Image / Media Section ---------- */}
      <div className={`relative bg-slate-50 shrink-0 overflow-hidden flex items-center justify-center ${
        isList ? "w-full md:w-52 h-52 border-r" : "w-full h-48 border-b"
      }`}>
        <img
          src={logo}
          alt={shopName}
          onError={(e) => (e.currentTarget.src = noImage)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isVerified && (
            <div className="bg-white/90 backdrop-blur-sm p-1 rounded-full shadow-sm">
               <CheckCircle2 className="w-5 h-5 text-emerald-500" fill="white" />
            </div>
          )}
        </div>

      
      </div>

      {/* ---------- Content Section ---------- */}
      <div className="flex-1 flex flex-col p-5">
        <CardHeader className="p-0 space-y-1">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <CardTitle className="text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                {shopName}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                <Store size={14} />
                {memberType}
              </div>
            </div>

            {hasRequirement && (
              <Badge className={`uppercase text-[10px] font-black ${isBuy ? "bg-blue-500 hover:bg-blue-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                {isBuy ? "Urgent Need" : "Now Selling"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="truncate">{city}{state ? `, ${state}` : ""}</span>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4 flex-1">
          {/* Requirement Card (Nested visual) */}
          <div className={`p-3 rounded-xl border ${isBuy ? "bg-blue-50/30 border-blue-100" : "bg-emerald-50/30 border-emerald-100"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              {isBuy ? (
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              ) : (
                <Package className="w-4 h-4 text-emerald-600" />
              )}
              <span className="text-sm font-bold text-slate-800 line-clamp-1">{productName}</span>
            </div>

            {quantity && (
              <div className="text-[11px] font-bold text-slate-500 mb-1">
                QUANTITY: <span className="text-slate-900">{quantity}</span>
              </div>
            )}

            <p className={`text-xs text-slate-600 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              {description}
            </p>

            {description.length > 60 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-indigo-600 text-[11px] font-bold flex items-center gap-0.5 mt-2 hover:underline"
              >
                {expanded ? "Less Info" : "View Specs"}
                <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </CardContent>

        {/* ---------- Action Buttons ---------- */}
        <CardFooter className="p-0 pt-5 mt-auto flex flex-col sm:flex-row gap-3 border-t border-slate-100">
          {hasContactAccess ? (
            <>
              <Button
                variant="outline"
                className={`flex-1 h-10 text-xs font-bold transition-all ${showPhone ? "bg-slate-100 text-slate-900" : "text-slate-600"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhone(!showPhone);
                }}
              >
                <Phone className={`w-3.5 h-3.5 mr-2 ${showPhone ? "text-emerald-500" : ""}`} />
                {showPhone ? shopPhone : "Call Shop"}
              </Button>

              <Button
                className="flex-1 h-10 text-xs font-bold bg-[#0c1f4d] hover:bg-[#152e6d] shadow-md shadow-blue-900/10"
                onClick={handleChatClick}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                Message
              </Button>
            </>
          ) : (
            <div className="w-full text-center py-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact restricted to paid plans</p>
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  );
};

export default BaseMemberCard;
