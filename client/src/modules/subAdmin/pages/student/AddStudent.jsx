import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import axios from 'axios';
import Stepper1 from './Stepper1';
import Stepper2 from './Stepper2';
import Stepper3 from './Stepper3';
import Stepper4 from './Stepper4';

function AddStudentModal({
  isOpen,
  onClose,

  onResetForm,  // ✅ Ensure this is passed from parent
  formData,
  formErrors,
  onInputChange,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);
  const [isStep4Valid, setIsStep4Valid] = useState(false);

  const totalSteps = 4;
  const stepLabels = ['User Info', 'ID Details', 'College Info', 'Verification'];

  const handleNext = async () => {
    if (currentStep === 1 && selectedUserId) {
      onInputChange({ target: { name: 'user_id', value: selectedUserId } });
    }

    if (currentStep === 2 && isStep2Valid) {
      try {
        const addressData = {
          user_id: formData.user_id,
          entity_type: 'student',
          address_type: formData.address_type,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
        };

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/address/create-address`,
          addressData
        );

        const addressId = response.data.address._id;
        onInputChange({ target: { name: 'address_id', value: addressId } });
      } catch (error) {
        console.error('Error creating address:', error);
        onInputChange({
          target: {
            name: 'submit',
            value: 'Error saving address. Please try again.',
          },
        });
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCancel = () => {
    onResetForm();
    setCurrentStep(1);
    setSelectedUserId(null);
    setIsStep2Valid(false);
    setIsStep3Valid(false);
    setIsStep4Valid(false);
    onClose();
  };

  const handleUserSelected = (userId) => {
    setSelectedUserId(userId);
  };

  const handleValidationChange = (step) => (isValid) => {
    if (step === 2) setIsStep2Valid(isValid);
    if (step === 3) setIsStep3Valid(isValid);
    if (step === 4) setIsStep4Valid(isValid);
  };

  const handleSubmit = async () => {
    try {
      const studentData = {
        user_id: formData.user_id,
        college_email: formData.college_email,
        id_card: formData.id_card,
        address_id: formData.address_id,
        college_name: formData.college_name,
        university_name: formData.university_name,
        expiry_date:
          formData.expiry_date ||
          new Date(new Date().setFullYear(new Date().getFullYear() + 4))
            .toISOString()
            .split('T')[0],
      };

      // 1. Create student
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/students/create-students`,
        studentData
      );

      const createdUserId = response.data.user_id;

      // 2. Get role for student
      const roleRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/fetch-student-role`
      );
      const studentRoleId = roleRes.data.role._id;

      // 3. Update user role
      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/update-role-by-user-id/`,
        {
          role_id: studentRoleId,
          user_id: createdUserId,
        }
      );

      // ✅ Reset and close
      onResetForm();
      setCurrentStep(1);
      setSelectedUserId(null);
      setIsStep2Valid(false);
      setIsStep3Valid(false);
      setIsStep4Valid(false);
      onClose();
    } catch (error) {
      console.error('Error creating student:', error);
      onInputChange({
        target: {
          name: 'submit',
          value: 'Error occurred. Please try again.',
        },
      });
    }
  };

  const renderStepper = () => {
    switch (currentStep) {
      case 1:
        return (
          <Stepper1
            onUserSelected={handleUserSelected}
            formData={formData}
            onInputChange={onInputChange}
          />
        );
      case 2:
        return (
          <Stepper2
            formData={formData}
            formErrors={formErrors}
            onInputChange={onInputChange}
            onValidationChange={handleValidationChange(2)}
          />
        );
      case 3:
        return (
          <Stepper3
            formData={formData}
            formErrors={formErrors}
            onInputChange={onInputChange}
            onValidationChange={handleValidationChange(3)}
          />
        );
      case 4:
        return (
          <Stepper4
            formData={formData}
            formErrors={formErrors}
            onInputChange={onInputChange}
            onValidationChange={handleValidationChange(4)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Student - Step {currentStep} of {totalSteps}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[400px]">
          {/* Stepper indicators */}
          <div className="flex justify-between items-center mb-6">
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isActive = stepNumber === currentStep;

              let circleStyle = '';
              let textStyle = '';
              let content = stepNumber;

              if (isCompleted) {
                circleStyle = 'bg-[#0c1f4d] text-white border-blue-500';
                textStyle = 'text-blue-500';
                content = '✔';
              } else if (isActive) {
                circleStyle = 'bg-[#0c1f4d] text-white border-blue-500';
                textStyle = 'text-blue-500';
              } else {
                circleStyle = 'bg-transparent text-gray-500 border-gray-300';
                textStyle = 'text-gray-500';
              }

              return (
                <div key={stepNumber} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${circleStyle} shadow-sm`}
                  >
                    {content}
                  </div>
                  <span className={`text-xs mt-2 ${textStyle}`}>
                    {stepLabels[index]}
                  </span>
                </div>
              );
            })}
          </div>

          {renderStepper()}

          {formErrors.submit && (
            <p className="text-red-600 text-sm">{formErrors.submit}</p>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {currentStep === totalSteps ? (
              <Button onClick={handleSubmit} disabled={!isStep4Valid}>
                Add Student
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !selectedUserId) ||
                  (currentStep === 2 && !isStep2Valid) ||
                  (currentStep === 3 && !isStep3Valid)
                }
              >
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddStudentModal;
