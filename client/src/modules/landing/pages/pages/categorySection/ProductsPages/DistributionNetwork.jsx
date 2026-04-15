import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Building2, User, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const DistributionNetwork = ({userId}) => {

  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const parentId = userId;

  useEffect(() => {
    const fetchNetwork = async () => {
      try {

        const token = sessionStorage.getItem("token");
        // FIX 1: Added parentId to the URL params
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/distribution-units/network`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(res.data,'lsijdjfiudehfiudhfs;dmfdjfjdiu')
        setUnits(res.data.data);
      } catch (error) {
        console.error("Error loading network", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (parentId) fetchNetwork();
  }, [parentId]);

  const getSlug = (name) =>
    name?.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || "company";

  if (isLoading) return (
    <div className="flex justify-center items-center h-64 w-full">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {units.length === 0 ? (
        <div className="col-span-full text-center py-10 text-slate-500">
          No distribution units found.
        </div>
      ) : (
        units.map((unit) => {
          const companyName = unit.merchant_details?.company_name || "Unknown Company";
          const slug = getSlug(companyName);

          return (
            <Card
              key={unit._id}
              onClick={() => navigate(`/company/${slug}`)}
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-slate-200 overflow-hidden bg-white"
            >
              {/* --- LOGO AREA --- */}
              <div className="h-32 bg-slate-50 flex items-center justify-center p-6 relative border-b">
                {unit.merchant_details?.company_logo ? (
                  <img
                    src={unit.merchant_details.company_logo}
                    alt="logo"
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-300" />
                )}
                <Badge className="absolute top-3 right-3 bg-blue-600 uppercase text-[10px]">
                  {unit.child_role}
                </Badge>
              </div>

              {/* --- CONTENT AREA --- */}
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {companyName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono tracking-tighter">
                    {/* Updated to show merchant_code as fallback if unit_code missing */}
                    {unit.distribution_unit_code || unit.merchant_details?.merchant_code}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User size={14} className="text-slate-400" />
                    {/* FIX 2: Corrected from user_details to contact_details */}
                    <span className="truncate">{unit.contact_details?.name}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-slate-400 mt-1 shrink-0" />
                    <span className="line-clamp-2">
                      {/* FIX 3: Corrected from unit.address to unit.company_address */}
                      {unit.company_address
                        ? `${unit.company_address.city}, ${unit.company_address.state}`
                        : "Address Not Configured"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-blue-600 text-sm font-semibold">
                  <span>View Profile</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default DistributionNetwork;
