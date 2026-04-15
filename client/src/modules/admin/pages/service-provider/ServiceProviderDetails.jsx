import React, { useState } from "react";
import {
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  Shield,
  Hash,
  Truck,
  MapPin,
  Image as ImageIcon,
  FileText as DescriptionIcon,
} from "lucide-react";
import { useGetServiceProviderByIdQuery } from "@/redux/api/ServiceProviderApi";
import { Badge } from "@/components/ui/badge";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import VehicleView from "./VehicleView";

const ServiceProviderDetails = ({ providerId, onClose }) => {
  const [showVehicles, setShowVehicles] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [zoomMessage, setZoomMessage] = useState("");
  const { data: provider, isLoading, error } = useGetServiceProviderByIdQuery(providerId, {
    skip: !providerId,
  });

  // Debug provider data
  console.log("Provider data:", provider);

  const handleViewVehicles = () => {
    console.log("View Vehicles button clicked, setting showVehicles to true");
    setShowVehicles(true);
  };

  const handleBack = () => {
    console.log("Back button clicked, setting showVehicles to false");
    setShowVehicles(false);
  };

  const handleTogglePhone = () => setShowPhone(!showPhone);

  const handleZoom = () => {
    setZoomMessage("Image zoomed in!");
    setTimeout(() => setZoomMessage(""), 2000);
  };

  const handleUnzoom = () => {
    setZoomMessage("Image zoomed out!");
    setTimeout(() => setZoomMessage(""), 2000);
  };

  return (
    <div className="flex min-h-screen bg-white p-6">
      {/* Left Section (Company Info and Images) */}
      <div className="w-1/3 pr-4">
        <div className="bg-white p-6 rounded-lg shadow-lg sticky top-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-black"
          >
            ✕
          </button>
          {zoomMessage && (
            <div className="mb-4 p-2 bg-gray-100 text-black rounded-md">
              {zoomMessage}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#32242C]" />
              <span className="ml-2 text-black">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-10 text-red-500">
              <AlertCircle className="w-6 h-6 mr-2 text-[#32242C]" />
              <span className="text-black">
                {error.status === 404
                  ? "Service Provider not found"
                  : `Error: ${error.data?.message || error.message}`}
              </span>
            </div>
          ) : provider ? (
            <>
              {/* Company Logo, Name, and Email (Horizontal Layout) */}
              <div className="flex items-center mb-4">
                {provider.company_logo && (
                  <Zoom onZoom={handleZoom} onUnzoom={handleUnzoom}>
                    <img
                      src={provider.company_logo}
                      alt="Company Logo"
                      className="w-16 h-16 rounded-full mr-4 cursor-pointer"
                    />
                  </Zoom>
                )}
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-black">
                    {provider.travels_name || "N/A"}
                  </h3>
                  <p className="flex items-center text-sm text-black">
                    <Mail className="w-4 h-4 mr-2 text-[#32242C]" />
                    {provider.company_email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              <p
                onClick={handleTogglePhone}
                className="flex items-center text-sm text-[#32242C] cursor-pointer mb-4"
              >
                <Phone className="w-4 h-4 mr-2 text-[#32242C]" />
                {showPhone ? provider.company_phone_number || "N/A" : "View Number"}
              </p>

              {/* Address */}
              {provider.address_id && (
                <div className="mb-4">
                  <h3 className="flex items-center text-lg font-semibold text-black mb-2">
                    <MapPin className="w-5 h-5 mr-2 text-[#32242C]" />
                    Address
                  </h3>
                  <p className="text-black">
                    {provider.address_id.address_line1}, {provider.address_id.city},{" "}
                    {provider.address_id.state}, {provider.address_id.country},{" "}
                    {provider.address_id.postal_code}
                  </p>
                </div>
              )}

              {/* Company Images */}
              {provider.company_images && provider.company_images.length > 0 && (
                <div className="mb-4">
                  <h3 className="flex items-center text-lg font-semibold text-black mb-2">
                    <ImageIcon className="w-5 h-5 mr-2 text-[#32242C]" />
                    Company Images
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {provider.company_images.map((image, index) => (
                      <Zoom key={index} onZoom={handleZoom} onUnzoom={handleUnzoom}>
                        <img
                          src={image}
                          alt={`Company Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md shadow-sm cursor-pointer"
                        />
                      </Zoom>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-2">
                <button className="bg-[#32242C] text-white px-4 py-2 rounded-md hover:bg-[#e03733]">
                  Contact Traveller
                </button>
                <button
                  onClick={handleViewVehicles}
                  className="bg-[#32242C] text-white px-4 py-2 rounded-md hover:bg-[#e03733]"
                >
                  View Vehicles
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-black">No provider data available</div>
          )}
        </div>
      </div>

      {/* Right Section (Company Details or Vehicles) */}
      <div className="w-2/3">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {showVehicles ? (
            <VehicleView provider={provider} handleBack={handleBack} />
          ) : (
            <>
              <h2 className="text-xl font-bold text-black mb-4">Company Details</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#32242C]" />
                  <span className="ml-2 text-black">Loading...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-10 text-red-500">
                  <AlertCircle className="w-6 h-6 mr-2 text-[#32242C]" />
                  <span className="text-black">
                    {error.status === 404
                      ? "Service Provider not found"
                      : `Error: ${error.data?.message || error.message}`}
                  </span>
                </div>
              ) : provider ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-[#32242C]" />
                    <span className="font-semibold text-black mr-2">License Number:</span>
                    <span className="text-black">{provider.license_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-[#32242C]" />
                    <span className="font-semibold text-black mr-2">Verified Status:</span>
                    <Badge
                      variant={provider.verified_status ? "default" : "destructive"}
                      className={
                        provider.verified_status
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {provider.verified_status ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-[#32242C]" />
                    <span className="font-semibold text-black mr-2">Trust Shield:</span>
                    <span className="text-black">{provider.trust_shield ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center">
                    <Hash className="w-5 h-5 mr-2 text-[#32242C]" />
                    <span className="font-semibold text-black mr-2">Number of Vehicles:</span>
                    <span className="text-black">{provider.number_of_vehicles || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-[#32242C]" />
                    <span className="font-semibold text-black mr-2">Vehicle Type:</span>
                    <span className="text-black capitalize">{provider.vehicle_type || "N/A"}</span>
                  </div>
                  <div className="flex items-start">
                    <DescriptionIcon className="w-5 h-5 mr-2 text-[#32242C] mt-1" />
                    <span className="font-semibold text-black mr-2">Description:</span>
                    <span
                      className="text-black p-2 rounded"
                      style={{ minHeight: "1.5em" }}
                    >
                      {provider.description?.trim() || "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-black">No provider data available</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDetails;