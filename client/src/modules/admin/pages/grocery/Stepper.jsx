import React from 'react';

function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep > index + 1
                ? 'bg-[#0c1f4d] border-blue-500 text-white'
                : currentStep === index + 1
                ? 'bg-[#0c1f4d] border-blue-500 text-white'
                : 'bg-gray-100 border-gray-300 text-gray-600'
            }`}
          >
            {currentStep > index + 1 ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <div className={`mt-2 text-sm ${
            currentStep >= index + 1 ? 'text-blue-500' : 'text-gray-600'
          }`}>
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Stepper;