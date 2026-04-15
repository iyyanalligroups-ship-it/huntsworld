    import React, { useEffect } from 'react';

    const Stepper4 = ({ formData, formErrors, onInputChange, onValidationChange }) => {
    // Validate the terms acceptance
    useEffect(() => {
        const isValid = formData.terms_accepted === true;
        onValidationChange(isValid);
    }, [formData.terms_accepted, onValidationChange]);

    return (
        <div className="space-y-4">
        <div className="flex items-center space-x-2">
            <input
            type="checkbox"
            name="terms_accepted"
            checked={formData.terms_accepted || false}
            onChange={onInputChange}
            className="h-4 w-4"
            />
            <label className="block text-sm font-medium">
            I accept the terms and conditions
            </label>
        </div>
        </div>
    );
    };

    export default Stepper4;