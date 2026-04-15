import React, { useState, useContext } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { UploadCloud, Gavel, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useUploadImagesMutation, useDeleteImageMutation } from "@/redux/api/ComplaintFormImageApi";
import {
  useCreateComplaintFormMutation,
  useUpdateComplaintFormMutation,
} from "@/redux/api/ComplaintFormApi";

const complaintOptions = [
  { label: "Issue with BuyLead/Inquiry", value: "buylead_issue", type: "type1" },
  { label: "Account Activation and Deactivation", value: "account_status", type: "type1" },
  { label: "Account Related", value: "account_related", type: "type1" },
  { label: "IPR Dispute", value: "ipr_dispute", type: "type2" },
  { label: "Complaint of Buyer", value: "buyer_complaint", type: "type3" },
  { label: "Complaint of Supplier", value: "supplier_complaint", type: "type3" },
  { label: "Others", value: "others", type: "type1" },
];

const iprOptions = [
  "Trademark Infringement",
  "Copyright Violation",
  "Patent Infringement",
  "Design Concern",
  "Trade Secret Theft",
];

const courtOrderOptions = ["Yes", "No"];
const youAreOptions = ["Owner", "Agent", "License"];

const ComplaintForm = ({ onCancel }) => {
  const { user } = useContext(AuthContext);

  const [selectedOption, setSelectedOption] = useState(null);
  const [uploadedImages, setUploadedImages] = useState({
    court_order_attachment: [],
    related_attachment: [],
    attachment_1: [],
  });

  const [formData, setFormData] = useState({
    user_id: user?.user?._id,
    complaint_description: "",
    ipr_type: "",
    brand_name: "",
    court_order: "",
    court_order_attachment: [],
    infringing_urls: "",
    you_are: "",
    agreement: false,
    buyer_name: "",
    buyer_mobile: "",
    product_name: "",
    supplier_name: "",
    supplier_mobile: "",
    supplier_product_name: "",
    related_attachment: [],
    attachment_1: [],
    copyright_title: "",
  });
  const [charCount, setCharCount] = useState(3000);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(null);
  const [uploadImage] = useUploadImagesMutation();
  const [deleteImage] = useDeleteImageMutation();
  const [createComplaintForm] = useCreateComplaintFormMutation();
  const [updateComplaintForm] = useUpdateComplaintFormMutation();

  const handleOptionChange = (value) => {
    const opt = complaintOptions.find((o) => o.label === value);
    setSelectedOption(opt);
    setFormData({
      user_id: user?.user?._id || "",
      complaint_description: "",
      ipr_type: "",
      brand_name: "",
      court_order: "",
      court_order_attachment: [],
      infringing_urls: "",
      you_are: "",
      agreement: false,
      buyer_name: "",
      buyer_mobile: "",
      product_name: "",
      supplier_name: "",
      supplier_mobile: "",
      supplier_product_name: "",
      related_attachment: [],
      attachment_1: [],
      copyright_title: "",
    });
    setUploadedImages({
      court_order_attachment: [],
      related_attachment: [],
      attachment_1: [],
    });
    setCharCount(3000);
    setError("");
  };

  const handleChange = async (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      const selectedFiles = files;

      if (selectedFiles.length > 0) {
        const formDataToSend = new FormData();
        for (const file of selectedFiles) {
          formDataToSend.append("files", file);
        }

        formDataToSend.append("entity_type", "complaint_form");
        const complaintName =
          selectedOption.type === "type2" ? "IPR_dispute" : "complaint_of_buyer_and_seller";

        formDataToSend.append("complaint_name", complaintName);

        try {
          const res = await uploadImage(formDataToSend).unwrap();
          const urls = res.files;

          setUploadedImages((prev) => ({
            ...prev,
            [name]: [...(prev[name] || []), ...urls],
          }));

          setFormData((prev) => ({
            ...prev,
            [name]: [...(prev[name] || []), ...urls],
          }));
        } catch (err) {
          console.error("File upload failed:", err);
          toast.error("Failed to upload files");
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === "complaint_description") {
        setCharCount(3000 - value.length);
        if (value.length < 30) {
          setError("Minimum 30 characters required");
        } else {
          setError("");
        }
      }
    }
  };

  const handleDeleteImage = async (fieldName, url) => {
    const filename = url.fileUrl.split("/").pop();
    const complainName = url.fileUrl.split("/");
    const complaint_name = complainName[complainName.length - 2];

    try {
      await deleteImage({
        entity_type: "complaint_form",
        complaint_name: complaint_name || "default_name",
        filename,
      }).unwrap();

      setUploadedImages((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((item) => item.fileUrl !== url.fileUrl),
      }));

      setFormData((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((item) => item.fileUrl !== url.fileUrl),
      }));

      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Image delete failed:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError("Please select complaint type");
      return;
    }

    if (selectedOption.type === "type1") {
      if (!formData.complaint_description || formData.complaint_description.length < 30) {
        setError("Minimum 30 characters required in complaint description");
        return;
      }
    } else if (selectedOption.type === "type2") {
      if (!formData.ipr_type) {
        setError("Please select an IPR complaint type");
        return;
      }
      if (!formData.brand_name) {
        setError("Please enter a brand name");
        return;
      }
      if (!formData.agreement) {
        setError("You must agree to the terms and conditions");
        return;
      }
    } else if (selectedOption.type === "type3") {
      if (
        !formData.buyer_name &&
        !formData.supplier_name &&
        !formData.attachment_1.length
      ) {
        setError("Please fill in at least one field for the complaint");
        return;
      }
    }

    const details = {
      complaint_description: formData.complaint_description || "",
      ipr_type: formData.ipr_type || "",
      brand_name: formData.brand_name || "",
      court_order: formData.court_order || "",
      court_order_attachment: formData.court_order_attachment.length
        ? formData.court_order_attachment.map((v) => JSON.stringify(v))
        : [],
      infringing_urls: formData.infringing_urls || "",
      you_are: formData.you_are || "",
      agreement: formData.agreement || false,
      buyer_name: formData.buyer_name || "",
      buyer_mobile: formData.buyer_mobile || "",
      product_name: formData.product_name || "",
      supplier_name: formData.supplier_name || "",
      supplier_mobile: formData.supplier_mobile || "",
      supplier_product_name: formData.supplier_product_name || "",
      related_attachment: formData.related_attachment.length
        ? formData.related_attachment.map((v) => JSON.stringify(v))
        : [],
      attachment_1: formData.attachment_1.length
        ? formData.attachment_1.map((v) => JSON.stringify(v))
        : [],
      copyright_title: formData.copyright_title || "",
    };

    if (selectedOption.type === "type1") {
      delete details.ipr_type;
      delete details.brand_name;
      delete details.court_order;
      delete details.court_order_attachment;
      delete details.infringing_urls;
      delete details.you_are;
      delete details.agreement;
      delete details.buyer_name;
      delete details.buyer_mobile;
      delete details.product_name;
      delete details.supplier_name;
      delete details.supplier_mobile;
      delete details.supplier_product_name;
      delete details.related_attachment;
      delete details.attachment_1;
      delete details.copyright_title;
    } else if (selectedOption.type === "type2") {
      delete details.complaint_description;
      delete details.buyer_name;
      delete details.buyer_mobile;
      delete details.product_name;
      delete details.supplier_name;
      delete details.supplier_mobile;
      delete details.supplier_product_name;
      delete details.attachment_1;
    } else if (selectedOption.type === "type3") {
      delete details.complaint_description;
      delete details.ipr_type;
      delete details.brand_name;
      delete details.court_order;
      delete details.court_order_attachment;
      delete details.infringing_urls;
      delete details.you_are;
      delete details.agreement;
      delete details.related_attachment;
      delete details.copyright_title;
      if (selectedOption.value === "buyer_complaint") {
        delete details.supplier_name;
        delete details.supplier_mobile;
        delete details.supplier_product_name;
      } else if (selectedOption.value === "supplier_complaint") {
        delete details.buyer_name;
        delete details.buyer_mobile;
        delete details.product_name;
      }
    }

    const payload = {
      type: selectedOption.type,
      option: selectedOption.value,
      user_id: user?.user?._id || "",
      details,
    };

    try {
      if (isEditMode) {
        await updateComplaintForm({ id: isEditMode._id, body: payload }).unwrap();
        toast.success("Complaint updated successfully");
      } else {
        await createComplaintForm(payload).unwrap();
        toast.success("Complaint submitted successfully");
      }

      setFormData({
        user_id: user?.user?._id || "",
        complaint_description: "",
        ipr_type: "",
        brand_name: "",
        court_order: "",
        court_order_attachment: [],
        infringing_urls: "",
        you_are: "",
        agreement: false,
        buyer_name: "",
        buyer_mobile: "",
        product_name: "",
        supplier_name: "",
        supplier_mobile: "",
        supplier_product_name: "",
        related_attachment: [],
        attachment_1: [],
        copyright_title: "",
      });
      setUploadedImages({
        court_order_attachment: [],
        related_attachment: [],
        attachment_1: [],
      });
      setSelectedOption(null);
      setIsEditMode(null);
      setCharCount(3000);
      setError("");
      onCancel();
    } catch (err) {
      console.error("Error submitting complaint:", err);
      toast.error(`Failed to submit complaint: ${err.data?.message || err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8 sm:mt-12">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-4">Login Required</h2>
            <p className="text-sm sm:text-base text-gray-700 mb-6">
              You need to be logged in to submit a complaint.
            </p>
            <a
              href="/login"
              className="inline-block w-full sm:w-auto px-6 py-2 bg-[#0c1f4d] text-white rounded hover:bg-blue-700 transition"
            >
              Login Now
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold border-b-2 border-gray-300 pb-2">
          Add Complaint
        </h2>
      </div>
      
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">
            <span className="text-[#0c1f4d]">Hunts World</span>{" "}
            <span className="text-[#0c1f4d]">Complaint Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Complaint Type Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">
              Select Complaint Type *
            </Label>
            <Select onValueChange={handleOptionChange} value={selectedOption?.label || ""}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Complaint Type --" />
              </SelectTrigger>
              <SelectContent>
                {complaintOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption && (
            <>
              {/* TYPE 1: General Complaint */}
              {selectedOption.type === "type1" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Describe your complaint *
                    </Label>
                    <Textarea
                      name="complaint_description"
                      placeholder="Describe your complaint in detail (Min 30 characters) *"
                      value={formData.complaint_description}
                      onChange={handleChange}
                      className="min-h-[120px] resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Characters remaining: <span className="font-medium">{charCount}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* TYPE 2: IPR Dispute */}
              {selectedOption.type === "type2" && (
                <div className="space-y-4">
                  {/* IPR Type */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Select IPR Complaint Type *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleChange({ target: { name: "ipr_type", value } })
                      }
                      value={formData.ipr_type}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- Select IPR Complaint --" />
                      </SelectTrigger>
                      <SelectContent>
                        {iprOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Copyright Title (Conditional) */}
                  {formData.ipr_type === "Copyright Violation" && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Copyright Work Title *
                      </Label>
                      <Input
                        id="copyright_title"
                        name="copyright_title"
                        placeholder="e.g., Logo Design"
                        value={formData.copyright_title}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Brand Name */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Brand Name *
                    </Label>
                    <Input
                      id="brand_name"
                      name="brand_name"
                      placeholder="Enter your brand name"
                      value={formData.brand_name}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>

                  {/* Supporting Documents Upload */}
                  <FileUploadSection
                    label="Upload Supporting Documents"
                    fieldName="related_attachment"
                    uploadedImages={uploadedImages.related_attachment}
                    onChange={handleChange}
                    onDelete={handleDeleteImage}
                    icon={<UploadCloud className="w-5 h-5 text-red-500" />}
                  />

                  {/* Infringing URLs */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Infringing URLs
                    </Label>
                    <Textarea
                      id="infringing_urls"
                      name="infringing_urls"
                      placeholder="Enter one or more URLs (one per line)"
                      value={formData.infringing_urls}
                      onChange={handleChange}
                      className="min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Court Order */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Do you have a court order?
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleChange({ target: { name: "court_order", value } })
                      }
                      value={formData.court_order}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Yes/No" />
                      </SelectTrigger>
                      <SelectContent>
                        {courtOrderOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Court Order Upload (Conditional) */}
                  {formData.court_order === "Yes" && (
                    <FileUploadSection
                      label="Upload Court Order *"
                      fieldName="court_order_attachment"
                      uploadedImages={uploadedImages.court_order_attachment}
                      onChange={handleChange}
                      onDelete={handleDeleteImage}
                      icon={<Gavel className="w-5 h-5 text-red-500" />}
                    />
                  )}

                  {/* You Are */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      You Are *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleChange({ target: { name: "you_are", value } })
                      }
                      value={formData.you_are}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {youAreOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="agreement"
                      name="agreement"
                      checked={formData.agreement}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <Label htmlFor="agreement" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the terms and conditions *
                    </Label>
                  </div>
                </div>
              )}

              {/* TYPE 3: Buyer/Supplier Complaint */}
              {selectedOption.type === "type3" && (
                <div className="space-y-4">
                  {selectedOption.value === "buyer_complaint" && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Buyer Name *
                        </Label>
                        <Input
                          id="buyer_name"
                          name="buyer_name"
                          placeholder="Enter buyer name"
                          value={formData.buyer_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Buyer Mobile *
                        </Label>
                        <Input
                          id="buyer_mobile"
                          name="buyer_mobile"
                          placeholder="Enter buyer mobile"
                          value={formData.buyer_mobile}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Product Name *
                        </Label>
                        <Input
                          id="product_name"
                          name="product_name"
                          placeholder="Enter product name"
                          value={formData.product_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {selectedOption.value === "supplier_complaint" && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Supplier Name *
                        </Label>
                        <Input
                          id="supplier_name"
                          name="supplier_name"
                          placeholder="Enter supplier name"
                          value={formData.supplier_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Supplier Mobile *
                        </Label>
                        <Input
                          id="supplier_mobile"
                          name="supplier_mobile"
                          placeholder="Enter supplier mobile"
                          value={formData.supplier_mobile}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Product Name *
                        </Label>
                        <Input
                          id="supplier_product_name"
                          name="supplier_product_name"
                          placeholder="Enter product name"
                          value={formData.supplier_product_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Attachments Upload */}
                  <FileUploadSection
                    label="Upload Attachments *"
                    fieldName="attachment_1"
                    uploadedImages={uploadedImages.attachment_1}
                    onChange={handleChange}
                    onDelete={handleDeleteImage}
                    icon={<UploadCloud className="w-5 h-5 text-blue-600" />}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white flex-1"
                  onClick={handleSubmit}
                >
                  {isEditMode ? "Update Complaint" : "Submit Complaint"}
                </Button>
                <Button 
                  className="flex-1 sm:w-auto bg-gray-500 hover:bg-gray-600" 
                  onClick={onCancel}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Reusable File Upload Component
const FileUploadSection = ({ 
  label, 
  fieldName, 
  uploadedImages, 
  onChange, 
  onDelete, 
  icon 
}) => (
  <div>
    <Label className="text-sm font-medium text-gray-700 mb-2 block">
      {label}
    </Label>
    <div className="space-y-3">
      {/* Upload Area */}
      <div className="relative">
        <Input
          id={fieldName}
          type="file"
          multiple
          accept="*"
          name={fieldName}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={onChange}
        />
        <div className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-all duration-200 min-h-[56px]">
          {icon}
          <span className="text-sm text-gray-700">Choose Files (Multiple allowed)</span>
        </div>
      </div>
      
      {/* Uploaded Images */}
      {uploadedImages?.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <ul className="flex gap-2 min-w-max">
            {uploadedImages.map((url, index) => (
              <li key={index} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border flex-shrink-0">
                <img
                  src={url?.fileUrl}
                  alt={`uploaded-${index}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onDelete(fieldName, url)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);

export default ComplaintForm;