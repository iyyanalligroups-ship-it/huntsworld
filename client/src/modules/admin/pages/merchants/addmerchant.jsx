import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Stepper1 from "./Stepper1";
import Stepper2 from "./Stepper2";
import Stepper3 from "./Stepper3";
import Stepper4 from "./Stepper4";
import Stepper5 from "./Stepper5";

const MultiStepModal = ({ open, onOpenChange, onSubmit, onRefresh }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    email: "",
    phone_number: "",
    entity_type: "merchant",
    address_type: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    addressId: "",
    isSearched: false,
    company_name: "",
    company_email: "",
    company_phone: "",
    verification_certificate_type: "",
    verification_type_number: "",
    aadhar: "",
    company_type: "",
    number_of_employees: "",
    year_of_establishment: "",
    description: "",
    company_logo_url: "",
    company_image_urls: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      user_id: "",
      name: "",
      email: "",
      phone_number: "",
      entity_type: "merchant",
      address_type: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      addressId: "",
      isSearched: false,
      company_name: "",
      company_email: "",
      company_phone: "",
      verification_certificate_type: "",
      verification_type_number: "",
      aadhar: "",
      company_type: "",
      number_of_employees: "",
      year_of_establishment: "",
      description: "",
      company_logo_url: "",
      company_image_urls: [],
    });
    setStep(1);
    setError("");
    setLoading(false);
  };

  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.isSearched) {
        setError("Please search for a user first.");
        return false;
      }
      if (!formData.name || !formData.phone_number) {
        setError("Name and phone number are required.");
        return false;
      }
    } else if (step === 3) {
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
        !formData.description
      ) {
        setError("All fields in Step 3 are required.");
        return false;
      }
      const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 10 || wordCount > 3000) {
        setError("Description must be between 10 and 3000 words.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.company_logo_url) {
        setError("Company logo is required.");
        return false;
      }
      if (formData.company_image_urls.length > 5) {
        setError("Maximum 5 company images allowed.");
        return false;
      }
    }
    return true;
  };

  const handleNext = async (stepSpecificValidation) => {
    if (stepSpecificValidation) {
      const success = await stepSpecificValidation();
      if (success) {
        if (step === 5) {
          handleSubmit();
        } else {
          setStep(step + 1);
        }
      }
    } else if (validateStep()) {
      if (step === 5) {
        handleSubmit();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = () => {
    console.log("Final formData before submission:", JSON.stringify(formData, null, 2));
    if (validateStep()) {
      onSubmit(formData);
      resetForm();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleModalClose = (isOpen) => {
    if (!isOpen) {
      console.log("Resetting form on modal close");
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Stepper1
            formData={formData}
            setFormData={setFormData}
            error={error}
            setError={setError}
            loading={loading}
            setLoading={setLoading}
            handleNext={handleNext}
            handleCancel={handleCancel}
          />
        );
      case 2:
        return (
          <Stepper2
            formData={formData}
            setFormData={setFormData}
            error={error}
            setError={setError}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        );
      case 3:
        return (
          <Stepper3
            formData={formData}
            setFormData={setFormData}
            error={error}
            setError={setError}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        );
      case 4:
        return (
          <Stepper4
            formData={formData}
            setFormData={setFormData}
            error={error}
            setError={setError}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        );
      case 5:
        return (
          <Stepper5
            formData={formData}
            setFormData={setFormData}
            error={error}
            setError={setError}
            handleNext={handleNext}
            handleBack={handleBack}
            onSuccess={onRefresh} 
          />
        );
      default:
        return null;
    }
  };


  const renderStepper = () => {
    const steps = ["Search User", "Contact Info", "Travel Details", "Verification", "Confirmation"];
    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < step;
          const isCurrent = stepNum === step;
          const isPending = stepNum > step;

          return (
            <div key={stepNum} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-[#0c1f4d] text-white"
                    : isCurrent
                    ? "bg-[#0c1f4d] text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <span className="text-sm">✔</span>
                ) : (
                  <span className="text-sm font-medium">{stepNum}</span>
                )}
              </div>
              <span className="text-xs mt-2 text-center">{label}</span>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Merchant - Step {step} of 5</DialogTitle>
          {renderStepper()}
        </DialogHeader>
        <div className="py-4">{renderStep()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiStepModal;