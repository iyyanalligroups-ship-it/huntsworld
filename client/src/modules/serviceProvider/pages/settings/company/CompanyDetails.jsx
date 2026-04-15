import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Edit, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {validateDescription} from '@/modules/validation/descriptionValidation';
import {validateEmail} from '@/modules/validation/emailvalidation'; // Adjust the import path as needed
import {validateLicence} from '@/modules/validation/licenceValidation';
import {validatePhoneNumber} from '@/modules/validation/phoneValidation';

function CompanyDetails() {
  const { user } = useContext(AuthContext);
  const [serviceProvider, setServiceProvider] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });
  const [images, setImages] = useState([]);
  const [logo, setLogo] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const IMAGE_API_BASE = `${import.meta.env.VITE_API_IMAGE_URL}`;
  const ENTITY_TYPE = 'service-providers';
  const vehicleTypes = ['2-wheeler', '3-wheeler', '4-wheeler', '8-wheeler', '12-wheeler'];

  useEffect(() => {
    const fetchServiceProvider = async () => {
      if (!user?.user?._id) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/service-providers/fetch-by-user-id/${user.user._id}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('token')}`,
            },
          }
        );
        if (!response.data?.data) {
          setError('No service provider profile found');
          setLoading(false);
          return;
        }
        setServiceProvider(response.data.data);
        setEditData(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch service provider error:', err.response?.status, err.response?.data, err.message);
        setError(err.response?.data?.message || 'Failed to fetch service provider details');
        setLoading(false);
      }
    };

    fetchServiceProvider();
  }, [user]);

  useEffect(() => {
    if (editData && isEditing) {
      setImages((editData.company_images || []).map(url => ({ url, isNew: false })));
      setLogo(editData.company_logo ? { url: editData.company_logo, isNew: false } : null);
    }
  }, [editData, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setValidationErrors({});
  };

  const handleCancel = () => {
    images.forEach(img => {
      if (img.isNew) {
        URL.revokeObjectURL(img.url);
      }
    });
    if (logo?.isNew) {
      URL.revokeObjectURL(logo.url);
    }
    setImages([]);
    setLogo(null);
    setIsEditing(false);
    setEditData(serviceProvider);
    setValidationErrors({});
  };

  const validateInputs = () => {
    const errors = {};
    // Validate company name (required)
    // const companyNameValidation = validateDescription(editData.travels_name);
    // if (!companyNameValidation.isValid) {
    //   errors.travels_name = companyNameValidation.errorMessage.replace('Description');
    // }
    // Validate email (required)
    const emailValidation = validateEmail(editData.company_email);
    if (!emailValidation.isValid) {
      errors.company_email = emailValidation.errorMessage;
    }
    // Validate phone number (required)
    const phoneValidation = validatePhoneNumber(editData.company_phone_number);
    if (!phoneValidation.isValid) {
      errors.company_phone_number = phoneValidation.errorMessage;
    }
    // Validate license number (optional)
    if (editData.license_number) {
      const licenseValidation = validateLicence(editData.license_number);
      if (!licenseValidation.isValid) {
        errors.license_number = licenseValidation.errorMessage;
      }
    }
    // Validate description (optional)
    if (editData.description) {
      const descriptionValidation = validateDescription(editData.description);
      if (!descriptionValidation.isValid) {
        errors.description = descriptionValidation.errorMessage;
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    const isValid = validateInputs();
    if (!isValid) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Please fix the validation errors before saving.',
      });
      return;
    }

    let updatedData = { ...editData };

    try {
      // Handle company logo upload/update
      if (logo?.isNew) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logo.file);
        logoFormData.append('company_name', editData.travels_name);

        const logoEndpoint = logo.url && !logo.isNew ? '/service-provider-images/update-logo' : '/service-provider-images/upload-logo';
        const logoRes = await axios.post(`${IMAGE_API_BASE}${logoEndpoint}`, logoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        });

        if (!logoRes.data?.logoUrl) {
          throw new Error('Invalid logo upload response: No logo URL returned');
        }
        updatedData.company_logo = logoRes.data.logoUrl;
      } else {
        updatedData.company_logo = logo ? logo.url : editData.company_logo;
      }

      // Handle company images upload
      const newFiles = images.filter(img => img.isNew).map(img => img.file);
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach(file => formData.append('files', file));
        formData.append('entity_type', ENTITY_TYPE);
        formData.append('company_name', editData.travels_name);

        const uploadRes = await axios.post(`${IMAGE_API_BASE}/service-provider-images/upload-company-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        });

        if (!uploadRes.data?.files) {
          throw new Error('Invalid image upload response: No files returned');
        }

        const newUrls = uploadRes.data.files.map(f => f.fileUrl);
        const allUrls = [
          ...images.filter(img => !img.isNew).map(img => img.url),
          ...newUrls,
        ];
        updatedData.company_images = allUrls;
      } else {
        updatedData.company_images = images.map(img => img.url);
      }

      // Update service provider with new logo and images
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/service-providers/update-service-providers/${serviceProvider._id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        }
      );

      if (!response.data?.data) {
        throw new Error('Empty or invalid response from server');
      }

      setServiceProvider(response.data.data);
      setEditData(response.data.data);
      setIsEditing(false);
      setAlert({
        open: true,
        type: 'success',
        message: 'Service provider details updated successfully',
      });
      images.forEach(img => {
        if (img.isNew) {
          URL.revokeObjectURL(img.url);
        }
      });
      if (logo?.isNew) {
        URL.revokeObjectURL(logo.url);
      }
      setImages([]);
      setLogo(null);
      setValidationErrors({});
    } catch (err) {
      console.error('Save error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setAlert({
        open: true,
        type: 'error',
        message: err.response?.data?.message || err.message || 'An unexpected error occurred',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for the field being edited
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleVehicleTypeChange = (value) => {
    setEditData((prev) => ({ ...prev, vehicle_type: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const currentCount = images.length;
    if (currentCount + files.length > 5) {
      setAlert({
        open: true,
        type: 'error',
        message: 'You can upload up to 5 images in total.',
      });
      return;
    }
    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      isNew: true,
      file,
    }));
    setImages([...images, ...newImages]);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (logo?.isNew) {
      URL.revokeObjectURL(logo.url);
    }
    setLogo({
      url: URL.createObjectURL(file),
      isNew: true,
      file,
    });
  };

  const handleDeleteImage = async (index) => {
    const image = images[index];
    try {
      if (!image.isNew) {
        const filename = image.url.split('/').pop();
        const sanitizedCompanyName = editData.travels_name.replace(/\s+/g, '_');
        await axios.delete(`${IMAGE_API_BASE}/service-provider-images/delete-company-image`, {
          data: {
            entity_type: ENTITY_TYPE,
            company_name: sanitizedCompanyName,
            filename,
          },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        });
      } else {
        URL.revokeObjectURL(image.url);
      }
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
    } catch (err) {
      console.error('Delete image error:', err.response?.status, err.response?.data);
      setAlert({
        open: true,
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete image',
      });
    }
  };

  const handleDeleteLogo = async () => {
    try {
      if (!logo.isNew) {
        const sanitizedCompanyName = editData.travels_name.replace(/\s+/g, '_');
        await axios.delete(`${IMAGE_API_BASE}/service-provider-images/delete-logo`, {
          data: {
            company_name: sanitizedCompanyName,
          },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        });
      } else {
        URL.revokeObjectURL(logo.url);
      }
      setLogo(null);
    } catch (err) {
      console.error('Delete logo error:', err.response?.status, err.response?.data);
      setAlert({
        open: true,
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete logo',
      });
    }
  };

  const closeAlert = () => {
    setAlert({ open: false, type: '', message: '' });
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;
  if (!serviceProvider) return <div className="text-center py-8">No service provider data found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <Card className="relative bg-white shadow-xl rounded-xl border border-gray-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{serviceProvider.travels_name}</h2>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="hover:bg-gray-100 w-10 h-10"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700">Company Name</label>
                  <Input
                    name="travels_name"
                    value={editData.travels_name || ''}
                    onChange={handleInputChange}
                    className={`mt-1 text-sm sm:text-base ${validationErrors.travels_name ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.travels_name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.travels_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700">Email</label>
                  <Input
                    name="company_email"
                    value={editData.company_email || ''}
                    onChange={handleInputChange}
                    className={`mt-1 text-sm sm:text-base ${validationErrors.company_email ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.company_email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.company_email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700">Phone Number</label>
                  <Input
                    name="company_phone_number"
                    value={editData.company_phone_number || ''}
                    onChange={handleInputChange}
                    className={`mt-1 text-sm sm:text-base ${validationErrors.company_phone_number ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.company_phone_number && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.company_phone_number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700">License Number</label>
                  <Input
                    name="license_number"
                    value={editData.license_number || ''}
                    onChange={handleInputChange}
                    className={`mt-1 text-sm sm:text-base ${validationErrors.license_number ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.license_number && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.license_number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700">Number of Vehicles</label>
                  <Input
                    name="number_of_vehicles"
                    type="number"
                    value={editData.number_of_vehicles || ''}
                    onChange={handleInputChange}
                    className="mt-1 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700">Vehicle Type</label>
                  <Select
                    name="vehicle_type"
                    value={editData.vehicle_type || ''}
                    onValueChange={handleVehicleTypeChange}
                  >
                    <SelectTrigger className="mt-1 text-sm sm:text-base">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700">Description</label>
                <Textarea
                  name="description"
                  value={editData.description || ''}
                  onChange={handleInputChange}
                  className={`mt-1 text-sm sm:text-base ${validationErrors.description ? 'border-red-500' : ''}`}
                  rows={4}
                />
                {validationErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                )}
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700">Company Logo</label>
                {logo && (
                  <div className="relative mt-2">
                    <Zoom>
                      <img
                        src={logo.url}
                        alt="Company Logo"
                        className="h-24 w-full sm:h-32 md:h-40 object-cover rounded-md cursor-pointer"
                      />
                    </Zoom>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleDeleteLogo}
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="mt-4 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700">Company Images (up to 5)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <Zoom>
                        <img
                          src={image.url}
                          alt={`Company Image ${index + 1}`}
                          className="h-24 w-full sm:h-32 md:h-40 object-cover rounded-md cursor-pointer"
                        />
                      </Zoom>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteImage(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-4 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base">
                  <X className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Cancel
                </Button>
                <Button onClick={handleSave} className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base">
                  <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p>
                  <strong className="text-sm sm:text-base text-gray-700">Email:</strong>{" "}
                  <span className="text-sm sm:text-base">{serviceProvider.company_email}</span>
                  {serviceProvider.email_verified && (
                    <span className="ml-2 text-xs text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Verified</span>
                  )}
                </p>
                <p>
                  <strong className="text-sm sm:text-base text-gray-700">Phone:</strong>{" "}
                  <span className="text-sm sm:text-base">{serviceProvider.company_phone_number}</span>
                  {serviceProvider.number_verified && (
                    <span className="ml-2 text-xs text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Verified</span>
                  )}
                </p>
                {serviceProvider.license_number && (
                  <p><strong className="text-sm sm:text-base text-gray-700">License Number:</strong> <span className="text-sm sm:text-base">{serviceProvider.license_number}</span></p>
                )}
                <p><strong className="text-sm sm:text-base text-gray-700">Verified:</strong> <span className="text-sm sm:text-base">{serviceProvider.verified_status ? 'Yes' : 'No'}</span></p>
                <p><strong className="text-sm sm:text-base text-gray-700">Trust Shield:</strong> <span className="text-sm sm:text-base">{serviceProvider.trust_shield ? 'Yes' : 'No'}</span></p>
                {serviceProvider.number_of_vehicles && (
                  <p><strong className="text-sm sm:text-base text-gray-700">Number of Vehicles:</strong> <span className="text-sm sm:text-base">{serviceProvider.number_of_vehicles}</span></p>
                )}
                {serviceProvider.vehicle_type && (
                  <p><strong className="text-sm sm:text-base text-gray-700">Vehicle Type:</strong> <span className="text-sm sm:text-base">{serviceProvider.vehicle_type}</span></p>
                )}
              </div>
              {serviceProvider.description && (
                <p><strong className="text-sm sm:text-base text-gray-700">Description:</strong> <span className="text-sm sm:text-base">{serviceProvider.description}</span></p>
              )}
              {serviceProvider.company_logo && (
                <div>
                  <strong className="text-sm sm:text-base text-gray-700">Logo:</strong>
                  <Zoom>
                    <img
                      src={serviceProvider.company_logo}
                      alt="Company Logo"
                      className="mt-2 mx-auto block max-w-full h-24 sm:h-32 md:h-40 object-contain rounded-md cursor-pointer"
                    />
                  </Zoom>
                </div>
              )}
              {serviceProvider.company_images?.length > 0 && (
                <div>
                  <strong className="text-sm sm:text-base text-gray-700">Images:</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {serviceProvider.company_images.map((image, index) => (
                      <Zoom key={index}>
                        <img
                          src={image}
                          alt={`Company Image ${index + 1}`}
                          className="h-24 sm:h-32 md:h-40 w-full object-cover rounded-md cursor-pointer"
                        />
                      </Zoom>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={alert.open} onOpenChange={setAlertOpen => setAlert(prev => ({ ...prev, open: setAlertOpen }))}>
        <DialogContent className="w-[90%] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {alert.type === 'success' ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              )}
              <span>{alert.type === 'success' ? 'Success' : 'Error'}</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {alert.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={closeAlert}
              className="mt-4 w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CompanyDetails;