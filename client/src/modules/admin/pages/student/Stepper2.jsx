
import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Stepper2 = ({ formData, formErrors, onInputChange, onValidationChange }) => {

  console.log(formData,"formData");
  
  useEffect(() => {
    const requiredFields = [
      formData.address_type,
      formData.address_line_1,
      formData.city,
      formData.state,
      formData.country,
      formData.pincode,
    ];
    const allFilled = requiredFields.every((field) => field && field.trim() !== '');

    onValidationChange(allFilled);
  }, [formData, onValidationChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">User ID</label>
        <Input
          type="text"
          name="user_id"
          value={formData.user_id || ''}
          readOnly
          className="w-full bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Entity Type</label>
        <Input
          type="text"
          name="entity_type"
          value="student"
          readOnly
          className="w-full bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Address Type *</label>
        <Select
          name="address_type"
          value={formData.address_type || ''}
          onValueChange={(value) => onInputChange({ target: { name: 'address_type', value } })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select address type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="company">College</SelectItem>
          </SelectContent>
        </Select>
        {formErrors.address_type && <p className="text-red-600 text-sm">{formErrors.address_type}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Address Line 1 *</label>
        <Input
          type="text"
          name="address_line_1"
          value={formData.address_line_1 || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.address_line_1 && <p className="text-red-600 text-sm">{formErrors.address_line_1}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Address Line 2</label>
        <Input
          type="text"
          name="address_line_2"
          value={formData.address_line_2 || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.address_line_2 && <p className="text-red-600 text-sm">{formErrors.address_line_2}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">City *</label>
        <Input
          type="text"
          name="city"
          value={formData.city || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.city && <p className="text-red-600 text-sm">{formErrors.city}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">State *</label>
        <Input
          type="text"
          name="state"
          value={formData.state || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.state && <p className="text-red-600 text-sm">{formErrors.state}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Country *</label>
        <Input
          type="text"
          name="country"
          value={formData.country || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.country && <p className="text-red-600 text-sm">{formErrors.country}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Pincode *</label>
        <Input
          type="text"
          name="pincode"
          value={formData.pincode || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.pincode && <p className="text-red-600 text-sm">{formErrors.pincode}</p>}
      </div>
    </div>
  );
};

export default Stepper2;
