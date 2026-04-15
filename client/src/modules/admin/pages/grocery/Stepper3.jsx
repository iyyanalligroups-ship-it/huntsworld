import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const Stepper3 = ({ formData, setFormData, error, setError, handleNext, handleBack }) => {
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerificationTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      verification_certificate_type: value,
      verification_type_number: "",
    }));
  };

  const validateForm = () => {
    setError("");
    if (
      !formData.shop_name ||
      !formData.shop_email ||
      !formData.shop_phone_number ||
      !formData.verification_certificate_type ||
      !formData.verification_type_number ||
      !formData.aadhar
    ) {
      setError("All fields are required.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.shop_email)) {
      setError("Please enter a valid shop email.");
      return false;
    }

    return true;
  };

  const handleNextClick = () => {
    console.log("Stepper3 formData:", formData);
    if (validateForm()) {
      handleNext();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="shop_name">Shop Name *</Label>
            <Input
              id="shop_name"
              name="shop_name"
              value={formData.shop_name || ""}
              onChange={handleInputChange}
              placeholder="Enter shop name"
              required
              disabled={saving}
            />
          </div>
          <div>
            <Label htmlFor="shop_email">Shop Email *</Label>
            <Input
              id="shop_email"
              name="shop_email"
              type="email"
              value={formData.shop_email || ""}
              onChange={handleInputChange}
              placeholder="Enter shop email"
              required
              disabled={saving}
            />
          </div>
          <div>
            <Label htmlFor="shop_phone_number">Shop Phone Number *</Label>
            <Input
              id="shop_phone_number"
              name="shop_phone_number"
              type="tel"
              value={formData.shop_phone_number || ""}
              onChange={handleInputChange}
              placeholder="Enter shop phone number"
              required
              disabled={saving}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="verification_certificate_type">Verification Certificate Type *</Label>
            <Select
              onValueChange={(value) => handleVerificationTypeChange(value)}
              value={formData.verification_certificate_type || ""}
              required
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select verification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MSME">MSME</SelectItem>
                <SelectItem value="GST">GST</SelectItem>
                <SelectItem value="PAN">PAN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="verification_type_number">
              {formData.verification_certificate_type || "Verification"} Number *
            </Label>
            <Input
              id="verification_type_number"
              name="verification_type_number"
              value={formData.verification_type_number || ""}
              onChange={handleInputChange}
              placeholder={`Enter ${formData.verification_certificate_type || "verification"} number`}
              required
              disabled={saving}
            />
          </div>
          <div>
            <Label htmlFor="aadhar">Aadhar Number *</Label>
            <Input
              id="aadhar"
              name="aadhar"
              value={formData.aadhar || ""}
              onChange={handleInputChange}
              placeholder="Enter Aadhar number"
              required
              disabled={saving}
            />
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-between gap-2 pt-0">
        <Button variant="outline" onClick={handleBack} disabled={saving}>
          Back
        </Button>
        <Button
          onClick={handleNextClick}
          disabled={saving}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Stepper3;