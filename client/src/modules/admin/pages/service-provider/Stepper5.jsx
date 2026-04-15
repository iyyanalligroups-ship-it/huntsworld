import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const Stepper5 = ({ data, onChange, userData, addressId, formData, submitForm, prevStep }) => {
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [error, setError] = useState(null);

  const validateForm = () => {
    if (!isTermsAccepted) {
      return "You must agree to the terms and conditions.";
    }
    if (!userData?.user_id) {
      return "User ID is missing.";
    }
    if (!addressId) {
      return "Address ID is missing.";
    }
    if (!formData.step3.travelEmail || formData.step3.travelEmail.trim() === "") {
      return "Company email is required.";
    }
    if (!formData.step3.travelPhoneNumber) {
      return "Company phone number is required.";
    }
    if (!formData.step3.travelName) {
      return "Travel agency name is required.";
    }
    if (!formData.step3.licenseNumber) {
      return "License number is required.";
    }
    if (!formData.step3.numberOfVehicles) {
      return "Number of vehicles is required.";
    }
    if (!formData.step3.vehicleType) {
      return "Vehicle type is required.";
    }
    if (!formData.step3.description) {
      return "Description is required.";
    }
    const wordCount = formData.step3.description.trim().split(/\s+/).length;
    if (wordCount < 10 || wordCount > 3000) {
      return "Description must be between 30 and 3000 words.";
    }
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    submitForm();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Step 5: Confirmation</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Uploaded Images</h3>
          {formData.step4.logoUrl && (
            <div>
              <p className="text-sm">Logo:</p>
              <img
                src={formData.step4.logoUrl}
                alt="Logo"
                className="mt-1 h-20 w-20 object-cover"
              />
            </div>
          )}
          {formData.step4.travelImageUrls && formData.step4.travelImageUrls.length > 0 && (
            <div>
              <p className="text-sm">Travel Images:</p>
              <div className="flex space-x-2 mt-1">
                {formData.step4.travelImageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Travel ${index}`}
                    className="h-20 w-20 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={isTermsAccepted}
            onChange={(e) => setIsTermsAccepted(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="terms" className="text-sm">
            I have agreed to the{" "}
            <a
              href="/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              terms and conditions
            </a>
          </label>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="flex justify-between mt-4">
        <Button
          onClick={prevStep}
          variant="outline"
          className="text-sm"
        >
          Prev
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-[#0c1f4d] text-white text-sm"
          disabled={!isTermsAccepted}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default Stepper5;