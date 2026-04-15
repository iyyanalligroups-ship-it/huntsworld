import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, School, Store, ShoppingBasket } from "lucide-react";
import { Link } from "react-router-dom";

const EntityProfile = ({ profile, entityType }) => {
  const [imgError, setImgError] = useState(false);

  if (!profile) return null;

  let name = "";
  let logo = "";
  let verified = false;
  let subText = ""; // Highlighted sub-text
  let Icon = Store; // Default icon
  let themeColor = "text-blue-600 bg-blue-50"; // Default theme

  // Logic mapping for different entities
  if (entityType === "GrocerySeller") {
    name = profile?.shop_name;
    logo = profile?.company_logo;
    verified = profile?.verified_status;
    subText = "Grocery Partner";
    Icon = ShoppingBasket;
    themeColor = "text-emerald-600 bg-emerald-50";
  } else if (entityType === "Merchant") {
    name = profile?.company_name;
    logo = profile?.company_logo;
    verified = profile?.verified_status;
    subText = "Verified Merchant";
    Icon = Store;
    themeColor = "text-indigo-600 bg-indigo-50";
  } else if (entityType === "Student") {
    name = profile?.college_name;
    verified = profile?.verified;
    subText = profile?.university_name;
    Icon = School;
    themeColor = "text-amber-600 bg-amber-50";
  }

  const firstLetter = name?.charAt(0)?.toUpperCase() || "A";

  const companySlug = entityType === "Merchant" 
    ? name?.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") 
    : null;

  return (
    <div className="group relative flex items-start gap-4 p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
      
      {/* Avatar Section with Status Ring */}
      <div className="relative">
        <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
          {logo && !imgError && (
            <AvatarImage src={logo} alt={name} onError={() => setImgError(true)} />
          )}
          <AvatarFallback className={`${themeColor} text-xl font-bold`}>
            {firstLetter}
          </AvatarFallback>
        </Avatar>
        {/* Entity Type Floating Icon */}
        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${themeColor}`}>
          <Icon size={12} />
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {entityType === "Merchant" ? (
            <Link
              to={`/company/${companySlug}`}
              className="font-bold text-slate-900 text-lg hover:text-indigo-600 transition-colors truncate"
            >
              {name}
            </Link>
          ) : (
            <span className="font-bold text-slate-900 text-lg truncate">{name}</span>
          )}
          
          {verified && (
            <CheckCircle className="text-blue-500 fill-blue-50" size={18} />
          )}
        </div>

        {/* Highlighted Subtext */}
        <p className={`text-sm font-medium mt-0.5 ${themeColor.split(' ')[0]}`}>
          {subText}
        </p>

        {/* Extra Info for Students (Date Range) */}
        {entityType === "Student" && (
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>{new Date(profile?.college_start_month_year).getFullYear()}</span>
            <span className="h-px w-3 bg-slate-300"></span>
            <span>{new Date(profile?.college_end_month_year).getFullYear()}</span>
          </div>
        )}

        {/* Badge for Verification Status */}
        {verified && (
          <Badge variant="secondary" className="w-fit mt-3 bg-blue-50 text-blue-700 border-blue-100 px-2 py-0">
            Official Account
          </Badge>
        )}
      </div>
    </div>
  );
};

export default EntityProfile;