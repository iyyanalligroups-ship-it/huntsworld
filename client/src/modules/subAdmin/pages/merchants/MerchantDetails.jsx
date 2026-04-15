import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ViewProducts from "./ViewProducts";

// Small Card Component (Left Side)
const SmallCard = ({ merchant, onViewProducts }) => {
  const [showPhone, setShowPhone] = useState(false);
  const [imageErrors, setImageErrors] = useState([]);

  // Base64 placeholder image to avoid dependency on public folder
  const PLACEHOLDER_IMAGE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGUrgk9WAAAAABJRU5ErkJggg==";

  // Log merchant data for debugging
  console.log("Merchant data:", {
    company_name: merchant.company_name,
    company_logo_url: merchant.company_logo_url,
    company_image_urls: merchant.company_image_urls,
    all_fields: Object.keys(merchant),
  });

  // Use company_logo_url or fallback to placeholder
  const logoUrl = merchant.company_logo && typeof merchant.company_logo === "string"
    ? merchant.company_logo
    : PLACEHOLDER_IMAGE;

  // Use company_image_urls or fallback to empty array, filter out invalid URLs
  const imageUrls = Array.isArray(merchant.company_images)
    ? merchant.company_images.filter((url) => url && typeof url === "string")
    : [];

  // Handle image load errors, but skip for placeholder
  const handleImageError = (e, index, url) => {
    if (url === PLACEHOLDER_IMAGE) {
      console.warn("Placeholder image failed to load, skipping error handling.");
      return; // Prevent infinite loop if placeholder fails
    }
    console.error(`Failed to load image: ${url}`);
    setImageErrors((prev) => [...new Set([...prev, url])]); // Avoid duplicate errors
    e.target.src = PLACEHOLDER_IMAGE; // Set placeholder on error
  };

  return (
    <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center mb-4">
        <img
          src={logoUrl}
          alt={`${merchant.company_name || "Merchant"} Logo`}
          className="w-12 h-12 rounded-full mr-4 object-cover"
          onError={(e) => handleImageError(e, -1, logoUrl)}
        />
        <div>
          <h3 className="text-xl font-bold">{merchant.company_name || "Unnamed Merchant"}</h3>
          <a
            href={`mailto:${merchant.company_email}`}
            className="text-blue-600 hover:underline"
          >
            {merchant.company_email || "No email provided"}
          </a>
        </div>
      </div>
      <button
        onClick={() => setShowPhone(!showPhone)}
        className="text-blue-600 hover:underline mb-4"
      >
        {showPhone ? "Hide Phone Number" : "View Phone Number"}
      </button>
      <div className="space-y-2 mb-4">
        {showPhone && (
          <p>
            <strong>Phone:</strong> {merchant.company_phone_number || "No phone provided"}
          </p>
        )}
        <p>
          <strong>Year of Establishment:</strong>{" "}
          {merchant.year_of_establishment || "Not specified"}
        </p>
        <p>
          <strong>No. of Employees:</strong>{" "}
          {merchant.number_of_employees || "Not specified"}
        </p>
        <p>
          <strong>Nature of Business:</strong> {merchant.company_type || "Not specified"}
        </p>
      </div>
      {/* Company Images as Thumbnails */}
      <div className="mb-4">
        {imageErrors.length > 0 && (
          <p className="text-red-500 text-sm">
            Failed to load {imageErrors.length} image(s). Using placeholder.
          </p>
        )}
        {imageUrls.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((image, index) => (
              <a
                key={index}
                href={image}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={image}
                  alt={`Company Image ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-md hover:opacity-80"
                  onError={(e) => handleImageError(e, index, image)}
                />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No company images available</p>
        )}
      </div>
      <div className="flex gap-4">
        <Button
          onClick={onViewProducts}
          className="bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          View Products
        </Button>
        <Button
          onClick={() => (window.location.href = `mailto:${merchant.company_email}`)}
          className="bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          Contact Supplier
        </Button>
      </div>
    </div>
  );
};

// Large Card Component (Right Side)
const LargeCard = ({ merchant, showProducts, setShowProducts }) => {
  return (
    <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col">
      {showProducts ? (
        <ViewProducts
          merchant={merchant}
          onBack={() => setShowProducts(false)}
        />
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-4">Company Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <p>
              <strong>GST:</strong> {merchant.gst_number || "Not provided"}
            </p>
            <p>
              <strong>MSME Certificate:</strong>{" "}
              {merchant.msme_certificate_number || "Not provided"}
            </p>
            <p>
              <strong>PAN:</strong> {merchant.pan || "Not provided"}
            </p>
            <p>
              <strong>Aadhar:</strong> {merchant.aadhar || "Not provided"}
            </p>
            <p>
              <strong>Verified:</strong> {merchant.verified_status ? "Yes" : "No"}
            </p>
            <p>
              <strong>Trustshield:</strong> {merchant.trustshield ? "Yes" : "No"}
            </p>
          </div>
          <p className="mt-4">
            <strong>Description:</strong> {merchant.description || "No description available"}
          </p>
        </div>
      )}
    </div>
  );
};

// Main MerchantDetails Component
const MerchantDetails = ({ merchant, onClose }) => {
  const [showProducts, setShowProducts] = useState(false);

  const handleViewProducts = () => {
    setShowProducts(true);
  };

  return (
    <div className="relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
      >
        ✕
      </button>
      <div className="flex flex-col md:flex-row gap-6">
        <SmallCard merchant={merchant} onViewProducts={handleViewProducts} />
        <LargeCard
          merchant={merchant}
          showProducts={showProducts}
          setShowProducts={setShowProducts}
        />
      </div>
    </div>
  );
};

export default MerchantDetails;