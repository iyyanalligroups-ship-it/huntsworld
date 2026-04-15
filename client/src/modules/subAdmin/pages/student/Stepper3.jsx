import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import axios from 'axios';

const Stepper3 = ({ formData, formErrors, onInputChange, onValidationChange }) => {
  const [isFormValid, setIsFormValid] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Validate required fields
  useEffect(() => {
    const requiredFields = [
      formData.college_name,
      formData.university_name,
      formData.id_card,
      formData.college_email,
    ];
    const allFilled = requiredFields.every((field) => field && field.trim() !== '');
    setIsFormValid(allFilled);
    onValidationChange(allFilled);
  }, [formData, onValidationChange]);

  // Suggest college email based on name and college_name
  useEffect(() => {
    if (formData.name && formData.college_name && !formData.college_email) {
      const emailPrefix = formData.name.toLowerCase().replace(/\s+/g, '');
      const emailDomain = formData.college_name.toLowerCase().replace(/\s+/g, '');
      onInputChange({ target: { name: 'college_email', value: `${emailPrefix}@${emailDomain}.edu` } });
    }
  }, [formData.name, formData.college_name, formData.college_email, onInputChange]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!formData.college_name) {
      setUploadError('Please enter the college name before uploading the ID card.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formDataToSend = new FormData();
    formDataToSend.append('id_card_image', file);
    formDataToSend.append('collage_name', formData.college_name);

    try {
      console.log('Uploading to:', `${import.meta.env.VITE_IMAGE_SERVER_URL}/id-card/upload`);
      const response = await axios.post(
        `${import.meta.env.VITE_IMAGE_SERVER_URL}/id-card/upload`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { logoUrl } = response.data;
      console.log('Upload successful, logoUrl:', logoUrl);
      onInputChange({ target: { name: 'id_card', value: logoUrl } });
    } catch (error) {
      setUploadError(`Error uploading ID card image: ${error.message}`);
      console.error('Image upload error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">College Name *</label>
        <Input
          type="text"
          name="college_name"
          value={formData.college_name || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.college_name && <p className="text-red-600 text-sm">{formErrors.college_name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">University Name *</label>
        <Input
          type="text"
          name="university_name"
          value={formData.university_name || ''}
          onChange={onInputChange}
          className="w-full"
        />
        {formErrors.university_name && <p className="text-red-600 text-sm">{formErrors.university_name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">College Email *</label>
        <Input
          type="email"
          name="college_email"
          value={formData.college_email || ''}
          onChange={onInputChange}
          placeholder={formData.name && formData.college_name
            ? `${formData.name.toLowerCase().replace(/\s+/g, '')}@${formData.college_name.toLowerCase().replace(/\s+/g, '')}.edu`
            : 'example@college.edu'}
          className="w-full"
        />
        {formErrors.college_email && <p className="text-red-600 text-sm">{formErrors.college_email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">College ID Card Image *</label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full"
          disabled={uploading || !formData.college_name}
        />
        {uploading && <p className="text-gray-600 text-sm">Uploading...</p>}
        {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
      </div>
      {formData.id_card && (
        <div>
          <label className="block text-sm font-medium">ID Card URL</label>
          <Input
            type="text"
            value={formData.id_card}
            readOnly
            className="w-full bg-gray-100 cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
};

export default Stepper3;