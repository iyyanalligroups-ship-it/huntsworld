import React from "react";
import Stepper2 from "./Stepper2";
import Stepper3 from "./Stepper3";
import Stepper4 from "./Stepper4";
import Stepper5 from "./Stepper5";

const ServiceProviderSteps = ({
  step,
  nextStep,
  prevStep,
  handleClose,
  stepsLength,
  formData,
  updateFormData,
  userData,
  addressId,
  saveAddress,
  submitForm,
}) => {
  return (
    <>
      {step === 1 && (
        <Stepper2
          data={formData.step2}
          onChange={(data) => updateFormData("step2", data)}
          userData={userData}
          addressId={addressId}
          saveAddress={saveAddress}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}
      {step === 2 && (
        <Stepper3
          data={formData.step3}
          onChange={(data) => updateFormData("step3", data)}
          userData={userData}
          addressId={addressId}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}
    {step === 3 && (
  <Stepper4
    data={formData.step4}
    onChange={async (data) => await updateFormData("step4", data)} // Await updateFormData
    userData={userData}
    addressId={addressId}
    entityType={formData.step2.address_type}
    companyName={formData.step3.travelName}
    nextStep={nextStep}
    prevStep={prevStep}
  />
)}
      {step === 4 && (
        <Stepper5
          data={formData.step5}
          onChange={(data) => updateFormData("step5", data)}
          userData={userData}
          addressId={addressId}
          formData={formData}
          submitForm={submitForm}
          prevStep={prevStep}
        />
      )}
    </>
  );
};

export default ServiceProviderSteps;