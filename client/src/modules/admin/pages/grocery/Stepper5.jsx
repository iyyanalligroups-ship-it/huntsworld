import React, { useState } from "react";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const Stepper5 = ({ formData, error, setError, handleNext, handleBack, onSuccess }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitToBackend = async () => {
    setError("");
    setSubmitting(true);

    const apiUrl = `${import.meta.env.VITE_API_URL}/grocery-sellers/create-grocery-seller`;
    const token = sessionStorage.getItem("token");

    console.log("FormData before submission:", JSON.stringify(formData, null, 2));

    if (!acceptedTerms) {
      setError("You must accept the terms and conditions.");
      setSubmitting(false);
      return false;
    }

    if (!token) {
      setError("Authentication token is missing. Please log in and try again.");
      setSubmitting(false);
      return false;
    }

    if (!formData.user_id) {
      setError("User ID is missing. Please ensure a valid user is selected in Step 1.");
      setSubmitting(false);
      return false;
    }

    if (!isValidObjectId(formData.user_id)) {
      setError("Invalid User ID format. Please select a valid user.");
      setSubmitting(false);
      return false;
    }

    if (!formData.addressId) {
      setError("Address ID is missing. Please complete the address step (Step 2).");
      setSubmitting(false);
      return false;
    }

    if (!isValidObjectId(formData.addressId)) {
      setError("Invalid Address ID format. Please ensure a valid address is selected.");
      setSubmitting(false);
      return false;
    }

    if (!formData.shop_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.shop_email)) {
      setError("A valid shop email is required from Step 3.");
      setSubmitting(false);
      return false;
    }

    if (!formData.shop_name) {
      setError("Shop name is required from Step 3.");
      setSubmitting(false);
      return false;
    }

    if (!formData.shop_phone_number || !/^\d{10}$/.test(formData.shop_phone_number)) {
      setError("A valid 10-digit shop phone number is required from Step 3.");
      setSubmitting(false);
      return false;
    }

    if (!formData.aadhar || !/^\d{12}$/.test(formData.aadhar)) {
      setError("A valid 12-digit Aadhar number is required from Step 3.");
      setSubmitting(false);
      return false;
    }

    if (!formData.company_logo) {
      setError("Shop logo is required from Step 4.");
      setSubmitting(false);
      return false;
    }

    const payload = {
      user_id: formData.user_id,
      address_id: formData.addressId,
      shop_email: formData.shop_email.trim().toLowerCase(),
      shop_phone_number: formData.shop_phone_number,
      shop_name: formData.shop_name,
      aadhar: formData.aadhar,
      company_logo: formData.company_logo,
      company_images: Array.isArray(formData.company_images) ? formData.company_images : [],
      verified_status: formData.verified_status || false,
    };

    if (formData.verification_certificate_type && formData.verification_type_number?.trim()) {
      if (formData.verification_certificate_type === "MSME") {
        payload.msme_certificate_number = formData.verification_type_number.trim();
      } else if (formData.verification_certificate_type === "GST") {
        payload.gst_number = formData.verification_type_number.trim();
      } else if (formData.verification_certificate_type === "PAN") {
        payload.pan = formData.verification_type_number.trim();
      }
    }

    try {
      console.log("Submitting grocery seller payload to backend:", JSON.stringify(payload, null, 2));
      const sellerResponse = await axios.post(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });
      console.log("Grocery seller backend response:", JSON.stringify(sellerResponse.data, null, 2));

      console.log("Fetching roles from backend...");
      const roleResponse = await axios.get(`${import.meta.env.VITE_API_URL}/role/fetch-all-role`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });
      console.log("Roles fetched:", JSON.stringify(roleResponse.data, null, 2));

      const grocerySellerRole = roleResponse.data.data.find((role) => role.role === "GROCERY_SELLER");
      if (!grocerySellerRole) {
        throw new Error("GROCERY_SELLER role not found in the roles table");
      }
      const grocerySellerRoleId = grocerySellerRole._id;
      console.log("GROCERY_SELLER role _id:", grocerySellerRoleId);

      console.log("Updating user role for user_id:", formData.user_id);
      const userUpdateResponse = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/update-users-by-id/${formData.user_id}`,
        { role: grocerySellerRoleId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );
      console.log("User role update response:", JSON.stringify(userUpdateResponse.data, null, 2));

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (err) {
      console.error("Submission error:", {
        message: err.message,
        response: err.response
          ? {
              status: err.response.status,
              data: err.response.data,
              headers: err.response.headers,
            }
          : null,
        request: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data,
        },
        stack: err.stack,
      });

      let errorMessage = "An error occurred while submitting or updating user role. Please try again.";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.message || "Invalid data provided.";
        } else if (err.response.status === 401) {
          errorMessage = "Unauthorized. Please log in and try again.";
        } else if (err.response.status === 500) {
          errorMessage = err.response.data.message || "Server error. Please try again.";
          if (err.response.data.message?.includes("E11000")) {
            if (err.response.data.message.includes("shop_email")) {
              errorMessage = "Shop email already exists. Please use a different email.";
            } else if (err.response.data.message.includes("aadhar")) {
              errorMessage = "Aadhar number already exists. Please use a different Aadhar number.";
            } else if (err.response.data.message.includes("user_id")) {
              errorMessage =
                "This user is already registered as a grocery seller. Please select a different user or delete the existing seller.";
            } else if (err.response.data.message.includes("msme_certificate_number")) {
              errorMessage = "MSME certificate number already exists.";
            } else if (err.response.data.message.includes("gst_number")) {
              errorMessage = "GST number already exists.";
            } else if (err.response.data.message.includes("pan")) {
              errorMessage = "PAN number already exists.";
            } else if (err.response.data.message.includes("email")) {
              errorMessage =
                "Database error: Duplicate email detected. Please contact support to resolve the outdated 'email' index.";
            }
          } else if (err.response.data.message?.includes("ValidationError")) {
            errorMessage = err.response.data.message.includes("is required")
              ? "Missing required fields: " + err.response.data.message
              : "Invalid data: " + err.response.data.message;
          }
        }
      } else if (err.message === "GROCERY_SELLER role not found in the roles table") {
        errorMessage = "GROCERY_SELLER role not found. Please contact support.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your network or server status.";
      }

      setError(errorMessage);
      setSubmitting(false);
      return false;
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