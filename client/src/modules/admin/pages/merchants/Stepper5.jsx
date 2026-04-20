import React, { useState } from "react";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const Stepper5 = ({ formData, error, setError, handleNext, handleBack, onSuccess }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitToBackend = async () => {
    setError("");
    setSubmitting(true);

    const apiUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
    }/merchants/create-merchant`;


    if (!acceptedTerms) {
      setError("You must accept the terms and conditions.");
      setSubmitting(false);
      return false;
    }

   
    if (!formData.user_id) {
      setError("User ID is missing. Please ensure a valid user is selected.");
      setSubmitting(false);
      return false;
    }

    const timestamp = Date.now();
    const uniqueSuffix = `-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    const normalizedCompanyType = formData.company_type === "Sub-dealer" ? "Sub_dealer" : formData.company_type;
    const payload = {
      user_id: formData.user_id || "",
      address_id: formData.addressId || "",
      company_email: formData.company_email?.trim() || `default${uniqueSuffix}@example.com`,
      company_phone_number: formData.company_phone || "",
      company_name: formData.company_name || "",
      company_type: normalizedCompanyType || "",
      number_of_employees: parseInt(formData.number_of_employees, 10) || 0,
      year_of_establishment: parseInt(formData.year_of_establishment, 10) || 0,
      description: formData.description || "",
      aadhar: formData.aadhar || "",
      msme_certificate_number:
        formData.verification_certificate_type === "MSME" && formData.verification_type_number?.trim()
          ? formData.verification_type_number
          : `MSME${uniqueSuffix}`,
      gst_number:
        formData.verification_certificate_type === "GST" && formData.verification_type_number?.trim()
          ? formData.verification_type_number
          : `GST${uniqueSuffix}`,
      pan:
        formData.verification_certificate_type === "PAN" && formData.verification_type_number?.trim()
          ? formData.verification_type_number
          : `PAN${uniqueSuffix}`,
      company_logo: formData.company_logo_url || undefined,
      company_images: formData.company_image_urls || [],
    };

    try {
      console.log("Submitting merchant payload to backend:", JSON.stringify(payload, null, 2));
      const merchantResponse = await axios.post(apiUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });
      console.log("Merchant backend response:", merchantResponse.data);

      console.log("Fetching roles from backend...");
      const roleResponse = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
        }/role/fetch-all-role`
      );
      console.log("Roles fetched:", roleResponse.data);

      const merchantRole = roleResponse.data.data.find((role) => role.role === "MERCHANT");
      if (!merchantRole) {
        throw new Error("MERCHANT role not found in the roles table");
      }
      const merchantRoleId = merchantRole._id;
      console.log("MERCHANT role _id:", merchantRoleId);

      const token = sessionStorage.getItem("token");
      console.log("Updating user role for user_id:", formData.user_id);
      const userUpdateResponse = await axios.put(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
        }/users/update-users-by-id/${formData.user_id}`,
        { role: merchantRoleId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          timeout: 10000,
        }
      );
      console.log("User role update response:", userUpdateResponse.data);

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (err) {
      console.error("Full error response:", err.response || err);
      const errorMessage = err.response?.data?.error
        ? `Submission failed: ${err.response.data.error}`
        : err.message === "MERCHANT role not found in the roles table"
        ? "MERCHANT role not found. Please contact support."
        : "An error occurred while submitting or updating user role. Please try again.";
      setError(errorMessage);
      console.error("Submission error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked)}
          disabled={submitting}
        />
        <Label htmlFor="terms">
          I accept the{" "}
          <a
            href="/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            terms and conditions
          </a>
        </Label>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {submitting && <div className="text-blue-500 text-sm">Submitting, please wait...</div>}
      <div className="flex justify-between gap-2 pt-4">
        <Button variant="outline" onClick={handleBack} disabled={submitting}>
          Back
        </Button>
        <Button
          onClick={() => handleNext(submitToBackend)}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
          disabled={!acceptedTerms || submitting}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default Stepper5;