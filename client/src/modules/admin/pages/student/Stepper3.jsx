
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const Stepper3 = ({ formData, formErrors, onInputChange, onValidationChange }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(formData.id_card || '');

  useEffect(() => {
    const requiredFields = [
      formData.college_name,
      formData.university_name,
      formData.college_email,
      formData.id_card,
    ];
    const allFilled = requiredFields.every((field) => field && field.trim() !== '');
    onValidationChange(allFilled);
  }, [formData, onValidationChange]);

  useEffect(() => {
    setPreviewUrl(formData.id_card || '');
  }, [formData.id_card]);

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
      const response = await axios.put(
        `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/update/${encodeURIComponent(formData.college_name)}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { logoUrl } = response.data;
      onInputChange({ target: { name: 'id_card', value: logoUrl } });
      setPreviewUrl(logoUrl);
    } catch (error) {
      setUploadError(`Error uploading ID card image: ${error.response?.data?.message || error.message}`);
      console.error('Image upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!formData.college_name) {
      setUploadError('College name is required to delete the ID card.');
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_IMAGE_URL}/student-images/id-card/delete/${encodeURIComponent(formData.college_name)}`
      );
      onInputChange({ target: { name: 'id_card', value: '' } });
      setPreviewUrl('');
      setUploadError('');
    } catch (error) {
      setUploadError(`Error deleting ID card image: ${error.response?.data?.message || error.message}`);
      console.error('Image delete error:', error);
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
          placeholder="example@college.edu"
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
      {previewUrl && (
        <div className="relative">
          <label className="block text-sm font-medium">ID Card Preview</label>
          <img
            src={previewUrl}
            alt="ID Card Preview"
            className="mt-2 max-w-full h-auto rounded-lg shadow-md"
            style={{ maxHeight: '200px' }}
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-0 right-0"
            onClick={handleImageDelete}
            disabled={uploading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      {formData.id_card && !previewUrl && (
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
