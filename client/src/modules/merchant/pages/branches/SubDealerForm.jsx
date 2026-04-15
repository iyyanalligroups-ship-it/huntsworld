import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';

const SubDealerForm = ({ formData, prevStep, nextStep, onSubmit, editing, currentStep, updateCompanyImages, deleteCompanyImage, uploadCompanyLogo, updateCompanyLogo, deleteCompanyLogo, updateSubDealer, editingId }) => {
  const [subForm, setSubForm] = useState({
    company_email: '',
    company_phone_number: '',
    company_name: '',
    gst_number: '',
    pan: '',
    aadhar: '',
    company_type: '',
    description: '',
    msme_certificate_number: '',
    number_of_employees: '',
    year_of_establishment: '',
    address_type: 'company',
    entity_type: 'sub_dealer',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    company_images: [],
    company_logo: null,
    ...formData,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [replaceImage, setReplaceImage] = useState(null);
  const [replaceImageUrl, setReplaceImageUrl] = useState(null);

  const sanitizeCompanyName = (name) => name.replace(/\s+/g, '_');

  const handleChange = (e) => {
    setSubForm({ ...subForm, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    console.log('Logo file selected:', file);
    setLogoFile(file);
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    console.log('Company images selected:', files);
    setImageFiles(files);
  };

  const handleReplaceImage = (e, oldImageUrl) => {
    const file = e.target.files[0];
    console.log('Replace image selected:', file, 'for URL:', oldImageUrl);
    setReplaceImage(file);
    setReplaceImageUrl(oldImageUrl);
  };

  const handleDeleteImage = async (filename) => {
    try {
      console.log('Deleting image:', filename);
      // Delete image from image server
      await deleteCompanyImage({
        entity_type: 'sub_dealer',
        company_name: sanitizeCompanyName(subForm.company_name),
        filename: filename.split('/').pop(),
      }).unwrap();

      // Update local state
      const updatedImages = subForm.company_images.filter((url) => url !== filename);
      setSubForm((prev) => ({
        ...prev,
        company_images: updatedImages,
      }));

      // Update database if in edit mode
      if (editingId) {
        console.log('Updating database, removing image:', filename);
        await updateSubDealer({
          id: editingId,
          body: { company_images: updatedImages },
        }).unwrap();
      }

      alert('Image deleted successfully');
    } catch (err) {
      console.error('Delete Image Error:', err);
      alert('Failed to delete image');
    }
  };

  const handleDeleteLogo = async () => {
    try {
      console.log('Deleting logo for company:', subForm.company_name);
      await deleteCompanyLogo({
        company_name: sanitizeCompanyName(subForm.company_name),
      }).unwrap();
      setSubForm((prev) => ({
        ...prev,
        company_logo: null,
      }));
      // Update database if in edit mode
      if (editingId) {
        await updateSubDealer({
          id: editingId,
          body: { company_logo: null },
        }).unwrap();
      }
      alert('Logo deleted successfully');
    } catch (err) {
      console.error('Delete Logo Error:', err);
      alert('Failed to delete logo');
    }
  };

  const validateCompanyDetails = () => {
    return subForm.company_name && subForm.company_email && subForm.company_phone_number;
  };

  const validateAddressDetails = () => {
    return subForm.address_line_1 && subForm.city && subForm.state && subForm.country && subForm.pincode;
  };

  const handleNext = async () => {
    if (currentStep === 2 && !validateCompanyDetails()) {
      alert('Please fill in Company Name, Email, and Phone Number');
      return;
    }
    if (currentStep === 3 && !validateAddressDetails()) {
      alert('Please fill in Address Line 1, City, State, Country, and Pincode');
      return;
    }
    if (currentStep === 4 && replaceImage && replaceImageUrl) {
      try {
        const imagesFormData = new FormData();
        imagesFormData.append('files', replaceImage);
        imagesFormData.append('entity_type', 'sub_dealer');
        imagesFormData.append('company_name', sanitizeCompanyName(subForm.company_name));
        imagesFormData.append('old_filename', replaceImageUrl.split('/').pop());
        console.log('Updating image with FormData:', {
          entity_type: 'sub_dealer',
          company_name: sanitizeCompanyName(subForm.company_name),
          old_filename: replaceImageUrl.split('/').pop(),
          file: replaceImage,
        });
        const response = await updateCompanyImages({
          formData: imagesFormData,
          entity_type: 'sub_dealer',
          company_name: sanitizeCompanyName(subForm.company_name),
          old_filename: replaceImageUrl.split('/').pop(),
        }).unwrap();
        const updatedImages = subForm.company_images.map((url) =>
          url === replaceImageUrl ? response.fileUrl : url
        );
        setSubForm((prev) => ({
          ...prev,
          company_images: updatedImages,
        }));
        // Update database if in edit mode
        if (editingId) {
          await updateSubDealer({
            id: editingId,
            body: { company_images: updatedImages },
          }).unwrap();
        }
        setReplaceImage(null);
        setReplaceImageUrl(null);
        alert('Image updated successfully');
      } catch (err) {
        console.error('Update Image Error:', err);
        alert('Failed to update image');
        return;
      }
    }
    console.log('Submitting form data:', subForm, 'Logo file:', logoFile, 'Image files:', imageFiles);
    onSubmit(
      { ...subForm, company_name: sanitizeCompanyName(subForm.company_name) },
      logoFile,
      imageFiles,
      currentStep === steps.length - 1
    );
    if (currentStep < steps.length - 1) {
      nextStep();
    }
  };

  const steps = ['Select Merchant', 'Select User', 'Company Details', 'Address Details', 'File Uploads'];

  const handleSubmit = () => {
    if (!validateCompanyDetails() || !validateAddressDetails()) {
      alert('Please complete all required fields in previous steps.');
      return;
    }
    if (!subForm.user_id) {
      alert('User ID is required. Please select a user in the previous step.');
      return;
    }
    console.log('Final submit:', subForm, 'Logo file:', logoFile, 'Image files:', imageFiles);
    onSubmit(
      { ...subForm, company_name: sanitizeCompanyName(subForm.company_name) },
      logoFile,
      imageFiles,
      true
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="company_name" className="mb-3">Company Name *</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={subForm.company_name}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="company_email" className="mb-3">Email *</Label>
                  <Input
                    id="company_email"
                    name="company_email"
                    type="email"
                    value={subForm.company_email}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter company email"
                  />
                </div>
                <div>
                  <Label htmlFor="company_phone_number" className="mb-3">Phone Number *</Label>
                  <Input
                    id="company_phone_number"
                    name="company_phone_number"
                    value={subForm.company_phone_number}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="gst_number" className="mb-3">GST Number</Label>
                  <Input
                    id="gst_number"
                    name="gst_number"
                    value={subForm.gst_number}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter GST number"
                  />
                </div>
                <div>
                  <Label htmlFor="pan" className="mb-3">PAN</Label>
                  <Input
                    id="pan"
                    name="pan"
                    value={subForm.pan}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter PAN"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="aadhar" className="mb-3">Aadhar</Label>
                  <Input
                    id="aadhar"
                    name="aadhar"
                    value={subForm.aadhar}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter Aadhar"
                  />
                </div>
                <div>
                  <Label htmlFor="company_type" className="mb-3">Company Type</Label>
                  <Input
                    id="company_type"
                    name="company_type"
                    value={subForm.company_type}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter company type"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-3">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={subForm.description}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label htmlFor="msme_certificate_number" className="mb-3">MSME Certificate Number</Label>
                  <Input
                    id="msme_certificate_number"
                    name="msme_certificate_number"
                    value={subForm.msme_certificate_number}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter MSME certificate number"
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_employees" className="mb-3">Number of Employees</Label>
                  <Input
                    id="number_of_employees"
                    name="number_of_employees"
                    type="number"
                    value={subForm.number_of_employees}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter number of employees"
                  />
                </div>
                <div>
                  <Label htmlFor="year_of_establishment" className="mb-3">Year of Establishment</Label>
                  <Input
                    id="year_of_establishment"
                    name="year_of_establishment"
                    type="number"
                    value={subForm.year_of_establishment}
                    onChange={handleChange}
                    className="w-full"
                    placeholder="Enter year of establishment"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" className="cursor-pointer" onClick={prevStep}>
                  Back
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      onClick={handleNext}
                      disabled={!validateCompanyDetails()}
                    >
                      Next
                    </Button>
                  </TooltipTrigger>
                  {!validateCompanyDetails() && (
                    <TooltipContent>
                      Please fill in Company Name, Email, and Phone Number
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Address Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address_line_1" className="mb-3">Address Line 1 *</Label>
                    <Input
                      id="address_line_1"
                      name="address_line_1"
                      value={subForm.address_line_1}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Enter address line 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line_2" className="mb-3">Address Line 2</Label>
                    <Input
                      id="address_line_2"
                      name="address_line_2"
                      value={subForm.address_line_2}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Enter address line 2 (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="mb-3">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={subForm.city}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Enter city"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="state" className="mb-3">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={subForm.state}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="mb-3">Country *</Label>
                    <Input
                      id="country"
                      name="country"
                      value={subForm.country}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="mb-3">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={subForm.pincode}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" className="cursor-pointer" onClick={prevStep}>
                  Back
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleNext}
                      className="cursor-pointer"
                      variant="outline"
                      disabled={!validateAddressDetails()}
                    >
                      Next
                    </Button>
                  </TooltipTrigger>
                  {!validateAddressDetails() && (
                    <TooltipContent>
                      Please fill in Address Line 1, City, State, Country, and Pincode
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_logo" className="mb-1 block">Company Logo</Label>
                <p className="text-sm text-muted-foreground mb-2">Upload a logo image (JPG/PNG)</p>
                <Input
                  id="company_logo"
                  name="company_logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full"
                />
                {subForm.company_logo && (
                  <div className="mt-2 flex items-center space-x-2">
                    <p className="text-sm text-gray-500">Current logo:</p>
                    <img src={subForm.company_logo} alt="Current logo" className="h-16 w-16 object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteLogo}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="company_images" className="mb-1 block">Company Images</Label>
                <p className="text-sm text-muted-foreground mb-2">Upload multiple company-related images (JPG/PNG)</p>
                <Input
                  id="company_images"
                  name="company_images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="w-full"
                />
                {subForm.company_images && subForm.company_images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Current images:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {subForm.company_images.map((url, index) => (
                        <div key={index} className="flex flex-col items-center space-y-2">
                          <img src={url} alt={`Company image ${index + 1}`} className="h-16 w-16 object-cover" />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReplaceImage(e, url)}
                            className="w-32"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteImage(url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" className="cursor-pointer" onClick={prevStep}>
                  Back
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSubmit}
                      className="cursor-pointer"
                      disabled={!validateCompanyDetails() || !validateAddressDetails() || !subForm.user_id}
                    >
                      {editing ? 'Update' : 'Submit'}
                    </Button>
                  </TooltipTrigger>
                  {(!validateCompanyDetails() || !validateAddressDetails() || !subForm.user_id) && (
                    <TooltipContent>
                      Please complete all required fields and select a user in previous steps
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default SubDealerForm;