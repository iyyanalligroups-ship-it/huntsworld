import React, { useState } from 'react';
import {
  Mail, Phone, Building2, Calendar, Users,
  FileText, ShieldCheck, BadgeCheck, Info,
  Image as ImageIcon, CreditCard, Fingerprint,
  Copy, CheckCircle2, Factory, MapPin, Globe, Video
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const CompanyDetailListPage = ({ merchantData, noImage }) => {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Helper component for Compliance Rows
  const CredentialRow = ({ label, value, icon: Icon, colorClass, type }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group overflow-y-scroll min-h-full">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`p-2 rounded-md ${colorClass} bg-opacity-10 shrink-0`}>
          <Icon size={16} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
          <span className="text-sm font-bold text-slate-800 font-mono truncate">
            {value || 'N/A'}
          </span>
        </div>
      </div>
      {value && value !== 'N/A' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-indigo-600"
          onClick={() => handleCopy(value, type)}
        >
          {copied === type ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </Button>
      )}
    </div>
  );

  // Helper to safely get company type name
  const getCompanyTypeDisplay = () => {
    const ct = merchantData?.company_type;

    // If it's populated object
    if (ct && typeof ct === 'object' && !Array.isArray(ct)) {
      return ct.displayName || ct.name || 'Business Type';
    }

    // If it's still ObjectId string (fallback)
    if (typeof ct === 'string' && ct.length > 15) {
      return 'Business Type';
    }

    // Otherwise use whatever is there
    return ct || 'General Business Entity';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6 bg-slate-50/30 min-h-screen">

      {/* 1. BRAND HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Factory size={120} />
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          {/* Logo Box */}
          <div className="shrink-0">
            {merchantData.company_logo ? (
              <Zoom>
                <div className="h-28 w-28 md:h-32 md:w-32 rounded-xl border-2 border-slate-100 bg-white p-2 shadow-sm flex items-center justify-center">
                  <img
                    src={merchantData.company_logo}
                    alt="Company Logo"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => { e.currentTarget.src = noImage; }}
                  />
                </div>
              </Zoom>
            ) : (
              <div className="h-28 w-28 md:h-32 md:w-32 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-slate-200 border-dashed">
                <ImageIcon className="text-slate-400 w-10 h-10" />
              </div>
            )}
          </div>

          {/* Title & Badges */}
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {merchantData.verified_status && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 gap-1.5">
                    <BadgeCheck size={14} className="fill-emerald-100" /> Verified Supplier
                  </Badge>
                )}
                {merchantData.trustshield && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 gap-1.5">
                    <ShieldCheck size={14} className="fill-blue-100" /> TrustShield Protected
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {merchantData.company_name}
              </h1>
              <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                <Building2 size={16} className="text-slate-400" />
                {getCompanyTypeDisplay()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN DATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* COL 1: Contact & Stats */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 py-4 border-b border-slate-100">
              <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> Business Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-1">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-400">Company Email Address</p>
                    {merchantData.email_verified && (
                      <Badge variant="outline" className="h-4 p-0 px-1.5 text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800 break-all">{merchantData.company_email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-1">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-400">Phone Number</p>
                    {merchantData.number_verified && (
                      <Badge variant="outline" className="h-4 p-0 px-1.5 text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800">{merchantData.company_phone_number || 'Not Available'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0 mt-1">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Website / Domain</p>
                  {merchantData.domain_name ? (
                    <a
                      href={`https://${merchantData.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-emerald-700 hover:underline break-all"
                    >
                      {merchantData.domain_name}
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">Not Provided</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600 shrink-0 mt-1">
                  <Video size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Company Video</p>
                  {merchantData.company_video ? (
                    <a
                      href={merchantData.company_video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-red-700 hover:underline break-all"
                    >
                      View Video Link
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">Not Provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <Calendar className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-amber-700 font-semibold mb-1">Established</p>
                  <p className="text-lg font-black text-slate-800">{merchantData.year_of_establishment || 'N/A'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-blue-700 font-semibold mb-1">Team Size</p>
                  <p className="text-lg font-black text-slate-800">{merchantData.number_of_employees || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COL 2 & 3: Compliance & Description */}
        <div className="lg:col-span-2 space-y-6">

          {/* COMPLIANCE SOP SECTION */}
          <Card className="border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-indigo-600" /> Compliance & Legal Ledger
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">SOP Verified</Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CredentialRow
                  label="GST Registration"
                  value={merchantData.gst_number}
                  icon={FileText}
                  colorClass="text-teal-600 bg-teal-600"
                  type="gst"
                />
                <CredentialRow
                  label="PAN Number"
                  value={merchantData.pan}
                  icon={CreditCard}
                  colorClass="text-blue-600 bg-blue-600"
                  type="pan"
                />
                <CredentialRow
                  label="MSME / Udyam"
                  value={merchantData.msme_certificate_number}
                  icon={Factory}
                  colorClass="text-amber-600 bg-amber-600"
                  type="msme"
                />
                <CredentialRow
                  label="Authorized Aadhar"
                  value={merchantData.aadhar_number}
                  icon={Fingerprint}
                  colorClass="text-purple-600 bg-purple-600"
                  type="aadhar"
                />
              </div>
            </CardContent>
          </Card>

          {/* Description Section */}
          {merchantData.description && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-3 mb-4">
                About the Organization
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                {merchantData.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. IMAGE GALLERY SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
          <h3 className="text-lg font-bold text-slate-900">Infrastructure Gallery</h3>
        </div>

        {merchantData.company_images?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {merchantData.company_images.map((image, index) => (
              <Zoom key={index}>
                <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Facility ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.currentTarget.src = noImage; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                </div>
              </Zoom>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-12 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm font-medium">No facility images uploaded.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetailListPage;
