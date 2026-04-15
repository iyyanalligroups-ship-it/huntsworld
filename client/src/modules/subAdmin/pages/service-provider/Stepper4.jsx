import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

const Stepper4 = ({ data, onChange, entityType, companyName, nextStep, prevStep }) => {
  const [logoFile, setLogoFile] = useState(null);
  const [travelImageFiles, setTravelImageFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);

  console.log("Loaded Stepper4.jsx - 2025-04-18-fix-v5");
  const IMAGE_SERVER_URL = `${import.meta.env.VITE_API_IMAGE_URL}/service-provider-images`;
  console.log("Stepper4 props:", { entityType, companyName, data });
  console.log("VITE_IMAGE_SERVER_URL (from .env):", import.meta.env.VITE_IMAGE_SERVER_URL);
  console.log("Using IMAGE_SERVER_URL:", IMAGE_SERVER_URL);
  console.log("Logo upload URL:", `${IMAGE_SERVER_URL}/upload-logo`);
  console.log("Images upload URL:", `${IMAGE_SERVER_URL}/upload-company-image`);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
        setUploadError("Logo must be JPEG, PNG, GIF, or WebP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Logo file exceeds 5MB");
        return;
      }
      setLogoFile(file);
      console.log("Logo selected:", { name: file.name, size: file.size / 1024 / 1024 + "MB", type: file.type });
    }
  };

  const handleTravelImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + travelImageFiles.length > 5) {
      setUploadError("You can upload up to 5 travel images.");
      return;
    }
    const validFiles = files.filter((file) => {
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
        setUploadError(`File ${file.name} must be JPEG, PNG, GIF, or WebP`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File ${file.name} exceeds 5MB`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) {
      setUploadError("No valid travel images selected");
      return;
    }
    setTravelImageFiles([...travelImageFiles, ...validFiles]);
    console.log(
      "Travel images selected:",
      validFiles.map((f) => ({ name: f.name, size: f.size / 1024 / 1024 + "MB", type: f.type }))
    );
  };

  const removeTravelImage = (index) => {
    setTravelImageFiles(travelImageFiles.filter((_, i) => i !== index));
    console.log("Removed travel image at index:", index);
  };

  const handleNext = async () => {
    if (!companyName || !companyName.trim()) {
      setUploadError("Company name is required.");
      console.log("Validation failed: Invalid companyName:", companyName);
      return;
    }
  
    if (travelImageFiles.length === 0) {
      setUploadError("Please select at least one travel image.");
      console.log("No travel images selected");
      return;
    }
  
    console.log("Received entityType:", entityType);
    const FIXED_ENTITY_TYPE = "service_provider";
  
    setUploading(true);
    setUploadError(null);
  
    try {
      let logoUrl = data.logoUrl || "";
      let travelImageUrls = data.travelImageUrls ? [...data.travelImageUrls] : [];
  
      // Upload logo if selected
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("logo", logoFile);
        logoFormData.append("company_name", companyName);
  
        console.log("Uploading logo:", { name: logoFile.name, size: logoFile.size / 1024 / 1024 + "MB" });
        const logoResponse = await axios.post(`${IMAGE_SERVER_URL}/upload-logo`, logoFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
  
        if (!logoResponse.data.logoUrl) {
          throw new Error("Logo upload response missing logoUrl");
        }
        logoUrl = logoResponse.data.logoUrl;
        console.log("Logo upload response:", logoResponse.data);
      } else {
        console.log("No logo file selected");
      }
  
      // Upload travel images
      const imagesFormData = new FormData();
      travelImageFiles.forEach((file, index) => {
        imagesFormData.append("files", file);
        console.log(`Appending file ${index}:`, { name: file.name, size: file.size / 1024 / 1024 + "MB" });
      });
      imagesFormData.append("entity_type", FIXED_ENTITY_TYPE);
      imagesFormData.append("company_name", companyName);
  
      console.log("Travel images FormData:", {
        files: travelImageFiles.map((f) => f.name),
        entity_type: FIXED_ENTITY_TYPE,
        company_name: companyName,
      });
  
      const imagesResponse = await axios.post(`${IMAGE_SERVER_URL}/upload-company-image`, imagesFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      console.log("Images upload full response:", {
        status: imagesResponse.status,
        headers: imagesResponse.headers,
        data: imagesResponse.data,
      });
  
      if (!imagesResponse.data.success) {
        throw new Error(`Images upload failed: ${imagesResponse.data.message || "Unknown error"}`);
      }
      if (!Array.isArray(imagesResponse.data.files) || imagesResponse.data.files.length === 0) {
        throw new Error("No files returned in images upload response");
      }
  
      travelImageUrls = imagesResponse.data.files.map((file, index) => {
        if (!file.fileUrl) {
          throw new Error(`Missing fileUrl for file ${index}`);
        }
        return file.fileUrl;
      });
      console.log("Parsed travelImageUrls:", travelImageUrls);
  
      // Update parent form data and wait for state update
      const updatedData = { ...data, logoUrl, travelImageUrls };
      console.log("Updating formData:", updatedData);
  
      // Await the onChange to ensure parent state is updated
      await onChange(updatedData);
  
      // Proceed to next step
      console.log("Advancing to Stepper 5");
      nextStep();
    } catch (error) {
      console.error("Image upload error:", {
        message: error.message,
        response: error.response
          ? {
              status: error.response.status,
              data: error.response.data,
            }
          : null,
      });
      setUploadError(error.response?.data?.message || error.message || "Failed to upload images.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Step 4: Verification</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company Logo (1 image)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleLogoChange}
            className="w-full p-2 border rounded text-sm"
          />
          {logoFile && <p className="text-sm text-gray-500 mt-1">{logoFile.name}</p>}
          {data.logoUrl && (
            <img src={data.logoUrl} alt="Logo" className="mt-2 h-20 w-20 object-cover" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Travel Images (up to 5, required)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleTravelImagesChange}
            className="w-full p-2 border rounded text-sm"
          />
          {travelImageFiles.length > 0 && (
            <div className="mt-2">
              {travelImageFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">{file.name}</p>
                  <button
                    type="button"
                    onClick={() => removeTravelImage(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {data.travelImageUrls && data.travelImageUrls.length > 0 && (
            <div className="mt-2 flex space-x-2">
              {data.travelImageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Travel ${index}`}
                  className="h-20 w-20 object-cover"
                />
              ))}
            </div>
          )}
        </div>
        {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
      </div>
      <div className="flex justify-between mt-4">
        <Button
          onClick={prevStep}
          variant="outline"
          className="text-sm"
          disabled={uploading}
        >
          Prev
        </Button>
        <Button
          onClick={handleNext}
          className="bg-[#0c1f4d] text-white text-sm"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Stepper4;

