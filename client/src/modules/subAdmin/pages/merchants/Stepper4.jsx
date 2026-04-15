

import React, { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Stepper4 = ({ formData, setFormData, error, setError, handleNext, handleBack }) => {
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Log to confirm file load
  console.log("Loaded Stepper4.jsx (Merchant) - 2025-04-18-fix-v7");

  // Use environment variable for base URL
  const IMAGE_SERVER_URL = import.meta.env.VITE_API_IMAGE_URL;

  // Log props and env
  console.log("Stepper4 props:", { formData, entityType: formData.entity_type, companyName: formData.company_name });
  console.log("VITE_IMAGE_SERVER_URL:", IMAGE_SERVER_URL);
  console.log("Logo upload URL:", `${IMAGE_SERVER_URL}/merchant-images/upload-logo`);
  console.log("Images upload URL:", `${IMAGE_SERVER_URL}/merchant-images/upload-company-image`);

  const handleFileChange = (e, type) => {
    const files = e.target.files;
    if (files.length === 0) return;

    if (type === "logo") {
      const file = files[0];
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
        setError("Logo must be JPEG, PNG, GIF, or WebP");
        console.log("Invalid logo type:", file.type);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo file exceeds 5MB");
        console.log("Logo too large:", file.size / 1024 / 1024, "MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      console.log("Logo selected:", { name: file.name, size: file.size / 1024 / 1024 + "MB", type: file.type });
    } else if (type === "images") {
      const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
      const validFiles = newFiles.filter((file) => {
        if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
          setError(`File ${file.name} must be JPEG, PNG, GIF, or WebP`);
          console.log("Invalid image type:", file.type);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} exceeds 5MB`);
          console.log("Image too large:", file.size / 1024 / 1024, "MB");
          return false;
        }
        return true;
      });
      if (validFiles.length === 0) {
        setError("No valid images selected");
        return;
      }
      setImageFiles((prev) => [...prev, ...validFiles].slice(0, 5));
      setImagePreviews((prev) => [
        ...prev,
        ...validFiles.map((f) => URL.createObjectURL(f)),
      ].slice(0, 5));
      console.log(
        "Images selected:",
        validFiles.map((f) => ({ name: f.name, size: f.size / 1024 / 1024 + "MB", type: f.type }))
      );
    }
  };

  const handleRemoveImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    console.log("Removed image at index:", index);
  };

  const uploadImages = async () => {
    if (!formData.company_name || !formData.company_name.trim()) {
      setError("Company name is required from Step 3.");
      console.log("Validation failed: Invalid company_name:", formData.company_name);
      return false;
    }
    if (!formData.entity_type) {
      setError("Entity type is required from Step 2.");
      console.log("Validation failed: Invalid entity_type:", formData.entity_type);
      return false;
    }
    if (!logoFile) {
      setError("Company logo is required.");
      console.log("Validation failed: No logo file");
      return false;
    }
    if (imageFiles.length === 0) {
      setError("At least one company image is required.");
      console.log("Validation failed: No images");
      return false;
    }

    setUploading(true);
    setError(null);

    try {
      let company_logo_url = formData.company_logo_url || "";
      let company_image_urls = formData.company_image_urls ? [...formData.company_image_urls] : [];

      // Upload logo
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("logo", logoFile);
        logoFormData.append("company_name", formData.company_name);

        console.log("Uploading logo:", { name: logoFile.name, size: logoFile.size / 1024 / 1024 + "MB" });
        const logoResponse = await axios.post(`${IMAGE_SERVER_URL}/merchant-images/upload-logo`, logoFormData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        });

        console.log("Logo upload response:", logoResponse.data);
        if (!logoResponse.data.logoUrl) {
          throw new Error("Logo upload response missing logoUrl");
        }
        company_logo_url = logoResponse.data.logoUrl;
      } else {
        console.log("No logo file selected");
      }

      // Upload company images
      const imagesFormData = new FormData();
      imageFiles.forEach((file, index) => {
        imagesFormData.append("files", file);
        console.log(`Appending file ${index}:`, { name: file.name, size: file.size / 1024 / 1024 + "MB" });
      });
      imagesFormData.append("entity_type", "merchant");
      imagesFormData.append("company_name", formData.company_name);

      console.log("Images FormData:", {
        files: imageFiles.map((f) => f.name),
        entity_type: "merchant",
        company_name: formData.company_name,
      });

      const imagesResponse = await axios.post(`${IMAGE_SERVER_URL}/merchant-images/upload-company-image`, imagesFormData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      console.log("Images upload full response:", {
        status: imagesResponse.status,
        headers: imagesResponse.headers,
        data: imagesResponse.data,
      });

      if (!imagesResponse.data.files || !Array.isArray(imagesResponse.data.files)) {
        throw new Error("Invalid images upload response");
      }
      company_image_urls = imagesResponse.data.files.map((file, index) => {
        if (!file.fileUrl) {
          throw new Error(`Missing fileUrl for file ${index}`);
        }
        return file.fileUrl;
      });
      console.log("Parsed company_image_urls:", company_image_urls);

      // Update formData
      console.log("Updating formData:", { company_logo_url, company_image_urls });
      setFormData((prev) => ({
        ...prev,
        company_logo_url,
        company_image_urls,
      }));

      return true;
    } catch (err) {
      console.error("Image upload error:", {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : null,
      });
      setError(err.response?.data?.message || err.message || "Failed to upload images.");
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="company_logo">Company Logo * (Max 5MB)</Label>
        <Input
          id="company_logo"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => handleFileChange(e, "logo")}
          disabled={uploading}
        />
        {logoPreview && (
          <div className="mt-2">
            <img
              src={logoPreview}
              alt="Company Logo Preview"
              className="h-20 w-20 object-cover rounded"
            />
          </div>
        )}
        {formData.company_logo_url && !logoPreview && (
          <div className="mt-2">
            <img
              src={formData.company_logo_url}
              alt="Company Logo"
              className="h-20 w-20 object-cover rounded"
            />
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="company_images">Company Images * (Up to 5, Max 5MB each)</Label>
        <Input
          id="company_images"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={(e) => handleFileChange(e, "images")}
          disabled={imageFiles.length >= 5 || uploading}
        />
        {imagePreviews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Company Image ${index + 1}`}
                  className="h-20 w-20 object-cover rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-0 right-0 h-6 w-6"
                  onClick={() => handleRemoveImage(index)}
                  disabled={uploading}
                >
                  X
                </Button>
              </div>
            ))}
          </div>
        )}
        {formData.company_image_urls && formData.company_image_urls.length > 0 && imagePreviews.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.company_image_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Company Image ${index + 1}`}
                className="h-20 w-20 object-cover rounded"
              />
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500">
          {imageFiles.length}/5 images uploaded
        </p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-between gap-2 pt-4">
        <Button variant="outline" onClick={handleBack} disabled={uploading}>
          Back
        </Button>
        <Button
          onClick={() => handleNext(uploadImages)}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Stepper4;