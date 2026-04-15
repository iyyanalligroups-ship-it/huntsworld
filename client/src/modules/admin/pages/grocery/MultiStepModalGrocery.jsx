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

const MultiStepModalGrocery = ({ open, onOpenChange, onSubmit, onRefresh, error: externalError }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    email: "", // Note: This is not sent to backend, used for user search
    phone_number: "",
    entity_type: "grocery_seller",
    address_type: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    addressId: "",
    isSearched: false,
    shop_name: "",
    shop_email: "", // Initialize as empty string
    shop_phone_number: "",
    verification_certificate_type: "",
    verification_type_number: "",
    aadhar: "",
    verified_status: false,
    company_logo: "",
    company_images: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      user_id: "",
      name: "",
      email: "",
      phone_number: "",
      entity_type: "grocery_seller",
      address_type: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      addressId: "",
      isSearched: false,
      shop_name: "",
      shop_email: "",
      shop_phone_number: "",
      verification_certificate_type: "",
      verification_type_number: "",
      aadhar: "",
      verified_status: false,
      company_logo: "",
      company_images: [],
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
        !formData.shop_name ||
        !formData.shop_email ||
        !formData.shop_phone_number ||
        !formData.aadhar
      ) {
        setError("Shop name, email, phone number, and Aadhar are required.");
        return false;
      }
      const trimmedShopEmail = formData.shop_email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedShopEmail)) {
        setError("Please provide a valid shop email.");
        return false;
      }
      if (!/^\d{10}$/.test(formData.shop_phone_number)) {
        setError("Shop phone number must be 10 digits.");
        return false;
      }
      if (!/^\d{12}$/.test(formData.aadhar)) {
        setError("Aadhar number must be 12 digits.");
        return false;
      }
      if (formData.verification_certificate_type && !formData.verification_type_number) {
        setError("Verification number is required if a certificate type is selected.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.company_logo) {
        setError("Shop logo is required.");
        return false;
      }
      if (formData.company_images.length > 5) {
        setError("Maximum 5 shop images allowed.");
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
          await handleSubmit();
        } else {
          setStep(step + 1);
        }
      }
    } else if (validateStep()) {
      if (step === 5) {
        await handleSubmit();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    console.log("Final formData before submission:", JSON.stringify(formData, null, 2));
    if (validateStep()) {
      try {
        const success = await onSubmit(formData);
        if (success) {
          resetForm();
          onOpenChange(false);
        }
      } catch (err) {
        setError("Failed to submit form. Please try again or contact support.");
        console.error("Submission error in handleSubmit:", err);
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    setError("");
    onOpenChange(false);
  };

  const handleModalClose = (isOpen) => {
    if (!isOpen) {
      console.log("Resetting form on modal close");
      resetForm();
      setError("");
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
    const steps = ["Search User", "Address Info", "Shop Details", "Images", "Confirmation"];
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
          <DialogTitle>Add New Grocery Seller - Step {step} of 5</DialogTitle>
          {renderStepper()}
        </DialogHeader>
        {externalError && <p className="text-red-500 text-sm mb-4">{externalError}</p>}
        <div className="py-4">{renderStep()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiStepModalGrocery;