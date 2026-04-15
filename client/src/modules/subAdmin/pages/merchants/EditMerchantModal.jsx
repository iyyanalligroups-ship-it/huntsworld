import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EditMerchantForm = ({ merchant, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    _id: merchant?._id || "",
    company_name: merchant?.company_name || "",
    company_email: merchant?.company_email || "",
    company_phone_number: merchant?.company_phone_number || "",
    company_type: merchant?.company_type || "",
    gst_number: merchant?.gst_number || "",
    msme_certificate_number: merchant?.msme_certificate_number || "",
    pan: merchant?.pan || "",
    aadhar: merchant?.aadhar || "",
    number_of_employees: merchant?.number_of_employees || "",
    year_of_establishment: merchant?.year_of_establishment || "",
    description: merchant?.description || "",
    company_logo: merchant?.company_logo || "",
    company_images: merchant?.company_images || [],
  });

  const [logoPreview, setLogoPreview] = useState(merchant?.company_logo || "");
  const [imagePreviews, setImagePreviews] = useState(merchant?.company_images || []);
  const [uploadError, setUploadError] = useState(null);

  // Initialize axios instance for image server (adjust URL as needed)
  const imageApi = axios.create({
    baseURL: import.meta.env.VITE_IMAGE_SERVER_URL || "https://image-server.com/api",
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setUploadError("Logo must be a PNG or JPEG image.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Logo file size must be less than 5MB.");
        return;
      }
      setUploadError(null);
      setLogoPreview(URL.createObjectURL(file));
      uploadImage(file, "logo");
    }
  };

  // Handle company images selection
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Validate files
      const validFiles = files.filter((file) =>
        ["image/png", "image/jpeg", "image/jpg"].includes(file.type) &&
        file.size <= 5 * 1024 * 1024
      );
      if (validFiles.length !== files.length) {
        setUploadError("Some images were invalid. Only PNG/JPEG images under 5MB are allowed.");
        return;
      }
      setUploadError(null);
      const previews = validFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
      files.forEach((file) => uploadImage(file, "images"));
    }
  };

  // Upload image to image server
  const uploadImage = async (file, type) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await imageApi.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = response.data.url;
      if (type === "logo") {
        setFormData((prev) => ({ ...prev, company_logo: imageUrl }));
      } else {
        setFormData((prev) => ({
          ...prev,
          company_images: [...prev.company_images, imageUrl],
        }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError("Failed to upload image. Please try again.");
    }
  };

  // Remove an image from company_images
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      company_images: prev.company_images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (uploadError) {
      alert("Please resolve upload errors before saving.");
      return;
    }
    onSave(formData);
  };

  if (!merchant) return null;

  return (
    <div className="mt-6 p-4 border rounded-lg bg-white shadow-md">
      <h2 className="text-xl font-semibold mb-4">Edit Merchant</h2>
      {uploadError && (
        <p className="text-red-500 mb-4">{uploadError}</p>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <Input
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Email</label>
          <Input
            name="company_email"
            value={formData.company_email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Phone Number</label>
          <Input
            name="company_phone_number"
            value={formData.company_phone_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Type</label>
          <Input
            name="company_type"
            value={formData.company_type}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">GST Number</label>
          <Input
            name="gst_number"
            value={formData.gst_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">MSME Certificate Number</label>
          <Input
            name="msme_certificate_number"
            value={formData.msme_certificate_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">PAN</label>
          <Input
            name="pan"
            value={formData.pan}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Aadhar</label>
          <Input
            name="aadhar"
            value={formData.aadhar}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Number of Employees</label>
          <Input
            name="number_of_employees"
            type="number"
            value={formData.number_of_employees}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Year of Establishment</label>
          <Input
            name="year_of_establishment"
            type="number"
            value={formData.year_of_establishment}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Logo</label>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo Preview"
              className="w-24 h-24 object-cover rounded-md mb-2"
            />
          )}
          <Input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleLogoChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Images</label>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Image Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <Input
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={handleImagesChange}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <Button onClick={handleSubmit} className="bg-[#1c1b20] hover:bg-[#c0302c] text-white">
          Save
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditMerchantForm;