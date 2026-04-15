import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  ShieldCheck,
  CheckCircle,
  User,
  Briefcase
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CompanyCard = ({ company, viewType = "grid" }) => {
  const navigate = useNavigate();
  const [showPhone, setShowPhone] = useState(false);

  /* ---------------- Data Mapping from JSON ---------------- */
  // Correctly mapping owner name per your requirement
  const ownerName = company.user_id?.name || "N/A";
  const companyName = company.company_name?.replace(/-/g, " ").toUpperCase() || "N/A";
  const type = company.company_type || "Business";
  const email = company.company_email;
  const phone = company.company_phone_number || "N/A";

  const verified = company.verified_status === true;
  const trustShield = company.trustshield === true;
  const merchantCode = company.merchant_code;

  /* ---------------- Address Logic ---------------- */
  // Only show address keys if the value exists
  const addressObj = company.address_id || {};
  const hasAddress = Object.keys(addressObj).length > 0;

  const addressFields = [
    { label: "Line 1", value: addressObj.address_line_1 },
    { label: "City", value: addressObj.city },
    { label: "State", value: addressObj.state },
    { label: "Pincode", value: addressObj.pincode },
  ].filter(field => field.value); // Hides keys if value is missing

  /* ---------------- Navigation ---------------- */
  const handleCompanyClick = () => {
    const slug = company.company_name?.toLowerCase().replace(/\s+/g, "-");
    navigate(`/company/${slug}`);
  };

  return (
    <Card
      className={`group overflow-hidden border-slate-200 transition-all duration-300 hover:shadow-xl hover:border-slate-300 ${
        viewType === "list" ? "flex flex-col md:flex-row" : "flex flex-col"
      }`}
      onClick={handleCompanyClick}
    >
      {/* Media Section */}
      <div className={`shrink-0 bg-slate-50 flex items-center justify-center border-slate-100 ${
        viewType === "grid" ? "w-full h-40 border-b" : "w-32 h-32 md:w-40 md:h-40 border rounded-lg m-4"
      }`}>
        {company.company_logo ? (
          <img
            src={company.company_logo}
            alt={companyName}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <ImageIcon className="w-10 h-10 text-slate-300" />
        )}
      </div>

      <div className="flex-1 flex flex-col p-5">
        <CardHeader className="p-0 space-y-1">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl font-bold text-slate-900 leading-tight">
              {companyName}
            </CardTitle>
            {verified && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 px-2 py-0.5">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          <CardDescription className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Briefcase size={14} className="text-slate-400" />
            {type} • {merchantCode}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 mt-4 flex-1">
          <div className="space-y-3">
            {/* Owner Section */}
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-indigo-500" />
              <span className="text-slate-500">Owner:</span>
              <span className="font-bold text-slate-800">{ownerName}</span>
            </div>

            {/* Address Section: Conditionally Hidden */}
            {hasAddress && (
              <div className="pt-2 border-t border-slate-50">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-x-1">
                    {addressFields.map((field, idx) => (
                      <span key={idx}>
                        {field.value}{idx < addressFields.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="pt-2 flex flex-col gap-2 border-t border-slate-50">
              {email && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-5">
          <Button
            variant="outline"
            className="flex-1 h-10 text-xs border-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              setShowPhone(!showPhone);
            }}
          >
            <Phone className={`w-3.5 h-3.5 mr-2 ${showPhone ? "text-emerald-500" : "text-slate-400"}`} />
            {showPhone ? <span className="font-bold">{phone}</span> : "View Number"}
          </Button>
          <Button
            className="flex-1 h-10 cursor-pointer text-xs bg-[#0c1f4d] hover:bg-[#1a326b]"
            onClick={(e) => { e.stopPropagation(); alert("Enquiry modal"); }}
          >
            Send Enquiry
          </Button>
        </div>
      </div>

      {/* Bottom Trust Line */}
      {trustShield && <div className="h-1 w-full bg-blue-500 absolute bottom-0" />}
    </Card>
  );
};

export default CompanyCard;
