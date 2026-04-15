


import { useState, useContext } from "react";
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
import { UploadCloud, Gavel, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { useUploadImagesMutation, useDeleteImageMutation } from "@/redux/api/ComplaintFormImageApi";
import {

  useCreateComplaintFormMutation,
  useUpdateComplaintFormMutation,

} from "@/redux/api/ComplaintFormApi";
import ComplaintList from "./pages/Complaintlist";
import { User } from "phosphor-react";
import { useNavigate } from "react-router-dom";

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

const ComplaintForm = () => {
  const { user } = useContext(AuthContext);
  console.log(user, "user");

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
  const navigate = useNavigate();
  const parseAttachments = (attachments) => {
    try {
      return attachments.map((attachment) => JSON.parse(attachment));
    } catch (error) {
      console.error("Error parsing attachments:", error);
      return [];
    }
  };

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

  const handleEdit = (edit) => {
    setIsEditMode(edit);
    console.log(edit, "selected complaint");

    const selectedOption = complaintOptions.find((opt) => opt.value === edit.option);

    if (!selectedOption) {
      console.error("Selected option not found in complaintOptions:", edit.option);
      toast.error("Invalid complaint type selected");
      return;
    }

    const courtOrderAttachments = parseAttachments(edit.details?.court_order_attachment || []);
    const relatedAttachments = parseAttachments(edit.details?.related_attachment || []);
    const attachment1 = parseAttachments(edit.details?.attachment_1 || []);

    setFormData({
      user_id: user?.user?._id || "",
      complaint_description: edit.details?.complaint_description || "",
      ipr_type: edit.details?.ipr_type || "",
      brand_name: edit.details?.brand_name || "",
      court_order: edit.details?.court_order || "",
      court_order_attachment: courtOrderAttachments,
      infringing_urls: edit.details?.infringing_urls || "",
      you_are: edit.details?.you_are || "",
      agreement: edit.details?.agreement || false,
      buyer_name: edit.details?.buyer_name || "",
      buyer_mobile: edit.details?.buyer_mobile || "",
      product_name: edit.details?.product_name || "",
      supplier_name: edit.details?.supplier_name || "",
      supplier_mobile: edit.details?.supplier_mobile || "",
      supplier_product_name: edit.details?.supplier_product_name || "",
      related_attachment: relatedAttachments,
      attachment_1: attachment1,
      copyright_title: edit.details?.copyright_title || "",
    });

    setUploadedImages({
      court_order_attachment: courtOrderAttachments,
      related_attachment: relatedAttachments,
      attachment_1: attachment1,
    });

    setSelectedOption(selectedOption);
    setCharCount(3000 - (edit.details?.complaint_description?.length || 0));
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

    // Validate required fields based on complaint type
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

    // Initialize details object with all relevant fields
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

    // Remove fields that are irrelevant for the complaint type
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

    // Log payload for debugging
    console.log("Submitting payload:", JSON.stringify(payload, null, 2));

    try {
      if (isEditMode) {
        await updateComplaintForm({ id: isEditMode._id, body: payload }).unwrap();
        toast.success("Complaint updated successfully");
      } else {
        await createComplaintForm(payload).unwrap();
        toast.success("Complaint submitted successfully");
      }

      // Reset form
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
    } catch (err) {
      console.error("Error submitting complaint:", err);
      toast.error(`Failed to submit complaint: ${err.data?.message || err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto text-center mt-12 p-4">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Login Required</h2>
        <p className="text-gray-700 mb-6">
          You need to be logged in to submit a complaint.
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-[#0c1f4d] text-white rounded hover:bg-blue-700 transition"
        >
          Login Now
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto ">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-40 left-1 z-40 hidden md:flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <h2 className="w-fit font-bold mb-4 mt-10 border-l-4 border-[#0c1f4d] text-[#0c1f4d] capitalize bg-gray-50 px-4 py-2 shadow-sm">Add Complaint</h2>


      <Card>
        <CardHeader>
          <CardTitle>
            <span className="text-[#0c1f4d]">Huntsworld</span>{" "}
            <span className="text-red-500">Complaint Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>Select Complaint Type</Label>
          <Select onValueChange={handleOptionChange} value={selectedOption?.label || ""}>
            <SelectTrigger>
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

          {selectedOption && (
            <>
              {selectedOption.type === "type1" && (
                <>
                  <Textarea
                    name="complaint_description"
                    placeholder="Describe your complaint *"
                    value={formData.complaint_description}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-600">Characters remaining: {charCount}</p>
                </>
              )}

              {selectedOption.type === "type2" && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="ipr_type" className="w-1/3 text-right">
                        Select Complaint Type
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

                    {formData.ipr_type === "Copyright Violation" && (
                      <div className="flex items-center gap-4">
                        <Label htmlFor="copyright_title" className="w-1/3 text-right">
                          Copyright Work Title
                        </Label>
                        <Input
                          id="copyright_title"
                          name="copyright_title"
                          placeholder="e.g., Logo Design"
                          className="w-full"
                          value={formData.copyright_title}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Label htmlFor="brand_name" className="w-1/3 text-right">
                        Brand Name
                      </Label>
                      <Input
                        id="brand_name"
                        name="brand_name"
                        placeholder="Enter your brand name"
                        className="w-full"
                        value={formData.brand_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <Label htmlFor="related_attachment" className="w-1/3 text-right">
                        Upload Supporting Documents
                      </Label>
                      <div className="flex flex-col gap-3">
                        <div className="relative w-full">
                          <Input
                            id="related_attachment"
                            type="file"
                            multiple
                            accept="*"
                            name="related_attachment"
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleChange}
                          />
                          <div className="flex items-center justify-center gap-2 border border-dashed border-gray-400 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition">
                            <UploadCloud className="w-5 h-5 text-red-500" />
                            <span className="text-sm text-gray-700">Choose Supporting Documents</span>
                          </div>
                        </div>
                        <div className="mt-2 max-lg:w-[30px]">
                          {uploadedImages?.related_attachment?.length > 0 && (
                            <ul className="flex overflow-x-auto gap-2">
                              {uploadedImages?.related_attachment?.map((url, index) => (
                                <li
                                  key={index}
                                  className="relative w-16 h-16 rounded-md overflow-hidden border"
                                >
                                  <img
                                    src={url?.fileUrl}
                                    alt={`uploaded-${index}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage("related_attachment", url)}
                                    className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-bl-md hover:bg-red-600 transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Label htmlFor="infringing_urls" className="w-1/3 text-right mt-2">
                        Infringing URLs
                      </Label>
                      <Textarea
                        id="infringing_urls"
                        name="infringing_urls"
                        placeholder="Enter one or more URLs"
                        className="w-full"
                        value={formData.infringing_urls}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="court_order" className="w-1/3 text-right">
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

                    {formData.court_order === "Yes" && (
                      <div className="flex items-center gap-4 mb-3">
                        <Label htmlFor="court_order_attachment" className="w-1/3 text-right">
                          Upload Court Order
                        </Label>
                        <div className="flex flex-col gap-3">
                          <div className="relative w-full">
                            <Input
                              id="court_order_attachment"
                              type="file"
                              multiple
                              accept="*"
                              name="court_order_attachment"
                              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={handleChange}
                            />
                            <div className="flex items-center justify-center gap-2 border border-dashed border-gray-400 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition">
                              <Gavel className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-gray-700">Choose Court Order</span>
                            </div>
                          </div>
                          <div className="mt-2 max-lg:w-[30px]">
                            {uploadedImages?.court_order_attachment?.length > 0 && (
                              <ul className="flex overflow-x-auto gap-2">
                                {uploadedImages?.court_order_attachment?.map((url, index) => (
                                  <li
                                    key={index}
                                    className="relative w-16 h-16 rounded-md overflow-hidden border"
                                  >
                                    <img
                                      src={url?.fileUrl}
                                      alt={`uploaded-${index}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteImage("court_order_attachment", url)}
                                      className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-bl-md hover:bg-red-600 transition"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Label htmlFor="you_are" className="w-1/3 text-right">
                        You Are
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
                  </div>
                </>
              )}

              {selectedOption.type === "type3" && (
                <>
                  {selectedOption.value === "buyer_complaint" && (
                    <>
                      <div className="flex items-center gap-4 mb-3">
                        <Label htmlFor="buyer_name" className="w-1/3 text-right">
                          Buyer Name
                        </Label>
                        <Input
                          id="buyer_name"
                          name="buyer_name"
                          placeholder="Buyer Name"
                          value={formData.buyer_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <Label htmlFor="buyer_mobile" className="w-1/3 text-right">
                          Buyer Mobile
                        </Label>
                        <Input
                          id="buyer_mobile"
                          name="buyer_mobile"
                          placeholder="Buyer Mobile"
                          value={formData.buyer_mobile}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <Label htmlFor="product_name" className="w-1/3 text-right">
                          Product Name
                        </Label>
                        <Input
                          id="product_name"
                          name="product_name"
                          placeholder="Product Name"
                          value={formData.product_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {selectedOption.value === "supplier_complaint" && (
                    <>
                      <div className="flex items-center gap-4 mb-3">
                        <Label htmlFor="supplier_name" className="w-1/3 text-right">
                          Supplier Name
                        </Label>
                        <Input
                          id="supplier_name"
                          name="supplier_name"
                          placeholder="Supplier Name"
                          value={formData.supplier_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <Label htmlFor="supplier_mobile" className="w-1/3 text-right">
                          Supplier Mobile
                        </Label>
                        <Input
                          id="supplier_mobile"
                          name="supplier_mobile"
                          placeholder="Supplier Mobile"
                          value={formData.supplier_mobile}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <Label htmlFor="supplier_product_name" className="w-1/3 text-right">
                          Product Name
                        </Label>
                        <Input
                          id="supplier_product_name"
                          name="supplier_product_name"
                          placeholder="Supplier Product Name"
                          value={formData.supplier_product_name}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-4 mb-3">
                    <Label htmlFor="attachment_1" className="w-1/3 text-right">
                      Upload Attachments
                    </Label>
                    <div className="flex flex-col gap-3">
                      <div className="relative w-full">
                        <Input
                          id="attachment_1"
                          type="file"
                          multiple
                          accept="*"
                          name="attachment_1"
                          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={handleChange}
                        />
                        <div className="flex items-center justify-center gap-2 border border-dashed border-gray-400 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition">
                          <UploadCloud className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-700">Choose File</span>
                        </div>
                      </div>
                      <div className="mt-2 max-lg:w-[30px]">
                        {uploadedImages?.attachment_1?.length > 0 && (
                          <ul className="flex overflow-x-auto gap-2">
                            {uploadedImages?.attachment_1?.map((url, index) => (
                              <li
                                key={index}
                                className="relative w-16 h-16 rounded-md overflow-hidden border"
                              >
                                <img
                                  src={url?.fileUrl}
                                  alt={`uploaded-${index}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage("attachment_1", url)}
                                  className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-bl-md hover:bg-red-600 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedOption.type === "type2" && (
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="agreement"
                    name="agreement"
                    checked={formData.agreement}
                    onChange={handleChange}
                  />
                  <Label htmlFor="agreement">
                    I agree to the terms and conditions
                  </Label>
                </div>
              )}
              <Button className="bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204dec] w-full" onClick={handleSubmit}>
                {isEditMode ? "Update Complaint" : "Submit Complaint"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
      <div className="mt-5 max-w-7xl">
        <ComplaintList onEdit={handleEdit} user={user} />
      </div>
    </div>
  );
};

export default ComplaintForm;
