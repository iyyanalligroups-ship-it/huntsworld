import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const Stepper3 = ({ formData, setFormData, error, setError, handleNext, handleBack }) => {
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerificationTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      verification_certificate_type: value,
      verification_type_number: "",
    }));
  };

  const wordCount = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const isDescriptionValid = formData.description
    ? wordCount(formData.description) >= 10 && wordCount(formData.description) <= 3000
    : false;

  const validateForm = () => {
    setError("");
    if (
      !formData.company_name ||
      !formData.company_email ||
      !formData.company_phone ||
      !formData.verification_certificate_type ||
      !formData.verification_type_number ||
      !formData.aadhar ||
      !formData.company_type ||
      !formData.number_of_employees ||
      !formData.year_of_establishment ||
      !formData.description ||
      !isDescriptionValid
    ) {
      setError("All fields are required, and description must be 30–3000 words.");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.company_email)) {
      setError("Please enter a valid company email.");
      return false;
    }

    return true;
  };

  const handleNextClick = () => {
    console.log("Stepper3 formData:", formData); // Debug log
    if (validateForm()) {
      handleNext();
    }
  };

  const years = Array.from({ length: 2026 - 1960 + 1 }, (_, i) => 1960 + i);

  return (
    <div className="max-w-7xl w-full max-h-[100vh] overflow-y-auto overflow-x-hidden space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name || ""}
              onChange={handleInputChange}
              placeholder="Enter company name"
              required
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="company_email">Company Email *</Label>
            <Input
              id="company_email"
              name="company_email"
              type="email"
              value={formData.company_email || ""}
              onChange={handleInputChange}
              placeholder="Enter company email"
              required
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="company_phone">Company Phone Number *</Label>
            <Input
              id="company_phone"
              name="company_phone"
              type="tel"
              value={formData.company_phone || ""}
              onChange={handleInputChange}
              placeholder="Enter company phone number"
              required
              disabled={saving}
            />
          </div>

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
        </div>

        <div className="space-y-4">
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

          <div>
            <Label htmlFor="company_type">Company Type *</Label>
            <Select
              onValueChange={(value) => handleSelectChange("company_type", value)}
              value={formData.company_type || ""}
              required
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Retailer">Retailer</SelectItem>
                <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                <SelectItem value="Sub_dealer">Sub-dealer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="number_of_employees">Number of Employees *</Label>
            <Input
              id="number_of_employees"
              name="number_of_employees"
              type="number"
              value={formData.number_of_employees || ""}
              onChange={handleInputChange}
              placeholder="Enter number of employees"
              required
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="year_of_establishment">Year of Establishment *</Label>
            <Select
              onValueChange={(value) => handleSelectChange("year_of_establishment", value)}
              value={formData.year_of_establishment || ""}
              required
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (30–3000 words) *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          placeholder="Enter company description (minimum 30 words)"
          className="w-full h-20 overflow-y-auto resize-none"
          required
          disabled={saving}
        />
        <p className="text-sm text-gray-500">
          Word count: {formData.description ? wordCount(formData.description) : 0}
          {formData.description && !isDescriptionValid && (
            <span className="text-red-500"> (Must be 30–3000 words)</span>
          )}
        </p>
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