import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Building2,
    MapPin,
    Mail,
    ShieldCheck,
    ArrowUpRight,
    Loader2,
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MySupplierCard = ({userId}) => {
    const [parent, setParent] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchParent = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/distribution-units/my-parent/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setParent(res.data.data);
            } catch (error) {
                console.error("Error fetching supplier info:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchParent();
    }, []);

    if (loading) return (
        <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-blue-600" />
        </div>
    );

    if (!parent) return (
        <div className="p-6 border-2 border-dashed rounded-xl text-center text-slate-400">
            No linked manufacturer found.
        </div>
    );

    const { parent_details, parent_address, role_assigned_by_parent } = parent;

    return (
        <Card className="w-full max-w-2xl border-none shadow-lg overflow-hidden bg-white group">
            {/* Top Accent Bar */}
            <div className="h-2 bg-blue-600 w-full" />

            <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 p-6">
                <div className="h-16 w-16 rounded-lg bg-white border flex items-center justify-center p-2 shadow-sm">
                    {parent_details.company_logo ? (
                        <img
                            src={parent_details.company_logo}
                            alt="logo"
                            className="max-h-full object-contain"
                        />
                    ) : (
                        <Building2 className="text-slate-300 w-8 h-8" />
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold text-slate-900">
                            {parent_details.company_name}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                            {role_assigned_by_parent}
                        </Badge>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Primary Supplier</p>
                </div>

                <Button variant="outline" onClick={() => navigate(`/company/${parent_details.company_name}`)} size="sm" className="hidden sm:flex gap-2">
                    View Profile <ExternalLink size={14} />
                </Button>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                        Contact Details
                    </h4>
                    <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 bg-slate-100 rounded-full">
                            <Mail size={16} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium truncate">{parent_details.company_email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 bg-slate-100 rounded-full">
                            <ShieldCheck size={16} className="text-green-600" />
                        </div>
                        <span className="text-sm font-mono">{parent_details.merchant_code}</span>
                    </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                        Business Location
                    </h4>
                    <div className="flex items-start gap-3 text-slate-600">
                        <div className="p-2 bg-slate-100 rounded-full shrink-0">
                            <MapPin size={16} className="text-red-500" />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-slate-800">
                                {parent_address?.city}, {parent_address?.state}
                            </p>
                            <p className="text-slate-500 leading-relaxed mt-1">
                                {parent_address?.address_line_1} <br />
                                {parent_address?.pincode}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MySupplierCard;
