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
      await deleteCompanyImage({
        entity_type: 'sub_dealer',
        company_name: sanitizeCompanyName(subForm.company_name),
        filename: filename.split('/').pop(),
      }).unwrap();

      const updatedImages = subForm.company_images.filter((url) => url !== filename);
      setSubForm((prev) => ({
        ...prev,
        company_images: updatedImages,
      }));

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
      <div className="space-y-6 max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl">Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="company_name" className="mb-2 text-sm sm:text-base">Company Name *</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={subForm.company_name}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="company_email" className="mb-2 text-sm sm:text-base">Email *</Label>
                  <Input
                    id="company_email"
                    name="company_email"
                    type="email"
                    value={subForm.company_email}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter company email"
                  />
                </div>
                <div>
                  <Label htmlFor="company_phone_number" className="mb-2 text-sm sm:text-base">Phone Number *</Label>
                  <Input
                    id="company_phone_number"
                    name="company_phone_number"
                    value={subForm.company_phone_number}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="gst_number" className="mb-2 text-sm sm:text-base">GST Number</Label>
                  <Input
                    id="gst_number"
                    name="gst_number"
                    value={subForm.gst_number}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter GST number"
                  />
                </div>
                <div>
                  <Label htmlFor="pan" className="mb-2 text-sm sm:text-base">PAN</Label>
                  <Input
                    id="pan"
                    name="pan"
                    value={subForm.pan}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter PAN"
                  />
                </div>
                <div>
                  <Label htmlFor="aadhar" className="mb-2 text-sm sm:text-base">Aadhar</Label>
                  <Input
                    id="aadhar"
                    name="aadhar"
                    value={subForm.aadhar}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter Aadhar"
                  />
                </div>
                <div>
                  <Label htmlFor="company_type" className="mb-2 text-sm sm:text-base">Company Type</Label>
                  <Input
                    id="company_type"
                    name="company_type"
                    value={subForm.company_type}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter company type"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-2 text-sm sm:text-base">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={subForm.description}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label htmlFor="msme_certificate_number" className="mb-2 text-sm sm:text-base">MSME Certificate Number</Label>
                  <Input
                    id="msme_certificate_number"
                    name="msme_certificate_number"
                    value={subForm.msme_certificate_number}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter MSME certificate number"
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_employees" className="mb-2 text-sm sm:text-base">Number of Employees</Label>
                  <Input
                    id="number_of_employees"
                    name="number_of_employees"
                    type="number"
                    value={subForm.number_of_employees}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter number of employees"
                  />
                </div>
                <div>
                  <Label htmlFor="year_of_establishment" className="mb-2 text-sm sm:text-base">Year of Establishment</Label>
                  <Input
                    id="year_of_establishment"
                    name="year_of_establishment"
                    type="number"
                    value={subForm.year_of_establishment}
                    onChange={handleChange}
                    className="w-full text-sm sm:text-base"
                    placeholder="Enter year of establishment"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button variant="outline" className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white" onClick={prevStep}>
                  Back
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
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
              <CardTitle className="text-lg sm:text-xl md:text-2xl">Address Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address_line_1" className="mb-2 text-sm sm:text-base">Address Line 1 *</Label>
                    <Input
                      id="address_line_1"
                      name="address_line_1"
                      value={subForm.address_line_1}
                      onChange={handleChange}
                      className="w-full text-sm sm:text-base"
                      placeholder="Enter address line 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line_2" className="mb-2 text-sm sm:text-base">Address Line 2</Label>
                    <Input
                      id="address_line_2"
                      name="address_line_2"
                      value={subForm.address_line_2}
                      onChange={handleChange}
                      className="w-full text-sm sm:text-base"
                      placeholder="Enter address line 2 (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="mb-2 text-sm sm:text-base">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={subForm.city}
                      onChange={handleChange}
                      className="w-full text-sm sm:text-base"
                      placeholder="Enter city"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="state" className="mb-2 text-sm sm:text-base">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={subForm.state}
                      onChange={handleChange}
                      className="w-full text-sm sm:text-base"
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="mb-2 text-sm sm:text-base">Country *</Label>
                    <Input
                      id="country"
                      name="country"
                      value={subForm.country}
                      onChange={handleChange}
                      className="w-full text-sm sm:text-base"
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="mb-2 text-sm sm:text-base">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={subForm.pincode}
                      onChange={handleChange}
                      className="w-full text-sm sm:text-base"
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button variant="outline" className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white" onClick={prevStep}>
                  Back
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleNext}
                      className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
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
              <CardTitle className="text-lg sm:text-xl md:text-2xl">Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="company_logo" className="mb-2 block text-sm sm:text-base">Company Logo</Label>
                <p className="text-sm text-muted-foreground mb-2">Upload a logo image (JPG/PNG)</p>
                <Input
                  id="company_logo"
                  name="company_logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full text-sm sm:text-base"
                />
                {subForm.company_logo && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Current logo:</p>
                      <img src={subForm.company_logo} alt="Current logo" className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-md" />
                    </div>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteLogo}
                      className="text-sm bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="company_images" className="mb-2 block text-sm sm:text-base">Company Images</Label>
                <p className="text-sm text-muted-foreground mb-2">Upload multiple company-related images (JPG/PNG)</p>
                <Input
                  id="company_images"
                  name="company_images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="w-full text-sm sm:text-base"
                />
                {subForm.company_images && subForm.company_images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Current images:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subForm.company_images.map((url, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                          <img src={url} alt={`Company image ${index + 1}`} className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-md" />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReplaceImage(e, url)}
                            className="w-full text-sm sm:text-base"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteImage(url)}
                            className="text-sm bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button variant="outline" className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white" onClick={prevStep}>
                  Back
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSubmit}
                      className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
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