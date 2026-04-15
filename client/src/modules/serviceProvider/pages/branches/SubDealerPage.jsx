import { useState, useEffect } from 'react';
import { useGetAllSubDealersQuery, useCreateSubDealerMutation, useUpdateSubDealerMutation, useDeleteSubDealerMutation, useGetAllMerchantsQuery } from '@/redux/api/SubDealerApi';
import { useUploadCompanyLogoMutation, useUpdateCompanyLogoMutation, useDeleteCompanyLogoMutation, useUploadCompanyImagesMutation, useUpdateCompanyImagesMutation, useDeleteCompanyImageMutation } from '@/redux/api/SubDealerImageApi';
import MerchantSelect from './MerchantSelect';
import UserSelect from './UserSelect';
import SubDealerForm from './SubDealerForm';
import SubDealerDetails from './SubDealerDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent,DialogDescription,DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

const SubDealerPage = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const { isSidebarOpen } = useSidebar();
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [page, setPage] = useState(1);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedSubDealerId, setSelectedSubDealerId] = useState(null);
  const limit = 10;

  const { data: subDealers, isLoading, isError, refetch } = useGetAllSubDealersQuery({
    search,
    dateFilter,
    merchant_id: merchantId,
    page,
    limit,
  });
  const { data: merchantsData, isLoading: merchantsLoading } = useGetAllMerchantsQuery();
  const merchants = merchantsData?.data?.filter(m => m._id && m.name) || [];

  const [createSubDealer] = useCreateSubDealerMutation();
  const [updateSubDealer] = useUpdateSubDealerMutation();
  const [deleteSubDealer] = useDeleteSubDealerMutation();
  const [uploadCompanyLogo] = useUploadCompanyLogoMutation();
  const [updateCompanyLogo] = useUpdateCompanyLogoMutation();
  const [deleteCompanyLogo] = useDeleteCompanyLogoMutation();
  const [uploadCompanyImages] = useUploadCompanyImagesMutation();
  const [updateCompanyImages] = useUpdateCompanyImagesMutation();
  const [deleteCompanyImage] = useDeleteCompanyImageMutation();

  const steps = ['Select Merchant', 'Select User', 'Company Details', 'Address Details', 'File Uploads'];

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const sanitizeCompanyName = (name) => name.replace(/\s+/g, '_');

  const handleSubmit = async (data, logoFile, imageFiles, shouldSubmit) => {
    if (!shouldSubmit) {
      updateFormData(data);
      return;
    }
    try {
      if (!data.user_id) {
        throw new Error('User ID is required');
      }
      const sanitizedCompanyName = sanitizeCompanyName(data.company_name);
      let subDealerData = {
        user_id: data.user_id,
        merchant_id: data.merchant_id,
        company_email: data.company_email,
        company_phone_number: data.company_phone_number,
        company_name: sanitizedCompanyName,
        gst_number: data.gst_number,
        pan: data.pan,
        aadhar: data.aadhar,
        company_type: data.company_type,
        description: data.description,
        msme_certificate_number: data.msme_certificate_number,
        number_of_employees: data.number_of_employees,
        year_of_establishment: data.year_of_establishment,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        entity_type: 'sub_dealer',
        address_type: data.address_type || 'company',
        company_images: data.company_images || [],
        company_logo: data.company_logo || null,
      };

      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        logoFormData.append('company_name', sanitizedCompanyName);
        console.log('Uploading logo with FormData:', {
          company_name: sanitizedCompanyName,
          file: logoFile,
        });
        const logoResponse = editingId
          ? await updateCompanyLogo({ formData: logoFormData }).unwrap()
          : await uploadCompanyLogo({ formData: logoFormData }).unwrap();
        subDealerData.company_logo = logoResponse.logoUrl;
      }

      if (imageFiles && imageFiles.length > 0) {
        const imagesFormData = new FormData();
        imageFiles.forEach((file, index) => {
          imagesFormData.append('files', file);
          console.log(`Appending file ${index + 1}:`, file.name);
        });
        imagesFormData.append('company_name', sanitizedCompanyName);
        imagesFormData.append('entity_type', 'sub_dealer');
        const formDataEntries = {};
        for (const [key, value] of imagesFormData.entries()) {
          formDataEntries[key] = value instanceof File ? value.name : value;
        }
        console.log('Uploading company images with FormData:', formDataEntries);
        const imagesResponse = await uploadCompanyImages({ formData: imagesFormData }).unwrap();
        console.log('Image upload response:', imagesResponse);
        subDealerData.company_images = [
          ...(subDealerData.company_images || []),
          ...imagesResponse.files.map((file) => file.fileUrl),
        ];
      } else {
        console.log('No image files to upload');
      }

      if (editingId) {
        await updateSubDealer({ id: editingId, body: subDealerData }).unwrap();
        setOpenDeleteDialog(false);
        setSelectedSubDealerId(null);
      } else {
        await createSubDealer(subDealerData).unwrap();
        setOpenDeleteDialog(false);
        setSelectedSubDealerId(null);
      }
      setStep(0);
      setFormData({});
      setEditingId(null);
      setMerchantId('');
      refetch();
    } catch (err) {
      console.error('Submission Error:', err);
      setOpenDeleteDialog(false);
      setSelectedSubDealerId(null);
    }
  };

  const handleEdit = (subDealer) => {
    setFormData({
      user_id: subDealer.user_id,
      merchant_id: subDealer.merchant_id,
      company_email: subDealer.company_email,
      company_phone_number: subDealer.company_phone_number,
      company_name: subDealer.company_name,
      gst_number: subDealer.gst_number,
      pan: subDealer.pan,
      aadhar: subDealer.aadhar,
      company_type: subDealer.company_type,
      description: subDealer.description,
      msme_certificate_number: subDealer.msme_certificate_number,
      number_of_employees: subDealer.number_of_employees,
      year_of_establishment: subDealer.year_of_establishment,
      address_line_1: subDealer.address?.address_line_1,
      address_line_2: subDealer.address?.address_line_2,
      city: subDealer.address?.city,
      state: subDealer.address?.state,
      country: subDealer.address?.country,
      pincode: subDealer.address?.pincode,
      address_type: subDealer.address?.address_type || 'company',
      entity_type: 'sub_dealer',
      company_logo: subDealer.company_logo,
      company_images: subDealer.company_images || [],
    });
    setMerchantId(subDealer.merchant_id || '');
    setEditingId(subDealer._id);
    setStep(0);
  };

  const handleView = (subDealerId) => {
    setSelectedSubDealerId(subDealerId);
    setOpenViewDialog(true);
  };

  const handleDelete = async (id) => {
    const subDealer = subDealers?.data?.find((d) => d._id === id);
    if (!subDealer) {
      console.error('Sub-dealer not found:', id);
      return;
    }
    setSelectedSubDealerId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const subDealer = subDealers?.data?.find((d) => d._id === selectedSubDealerId);
      if (subDealer?.company_name) {
        console.log('Deleting logo and images for:', subDealer.company_name);
        if (subDealer.company_logo) {
          await deleteCompanyLogo({
            company_name: sanitizeCompanyName(subDealer.company_name),
          }).unwrap();
        }
        if (subDealer.company_images && subDealer.company_images.length > 0) {
          for (const url of subDealer.company_images) {
            console.log('Deleting image:', url);
            await deleteCompanyImage({
              entity_type: 'sub_dealer',
              company_name: sanitizeCompanyName(subDealer.company_name),
              filename: url.split('/').pop(),
            }).unwrap();
          }
        }
      }
      await deleteSubDealer(selectedSubDealerId).unwrap();
      console.log('Sub-dealer deleted:', selectedSubDealerId);
      setOpenDeleteDialog(false);
      setSelectedSubDealerId(null);
      refetch();
    } catch (err) {
      console.error('Deletion Error:', err);
      setOpenDeleteDialog(false);
      setSelectedSubDealerId(null);
    }
  };

  const handleCreateNew = () => {
    setFormData({});
    setMerchantId('');
    setEditingId(null);
    setStep(0);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setPage(1);
  };

  const handleMerchantChange = (merchantId) => {
    setMerchantId(merchantId);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 w-24 p-2 rounded-r-2xl font-bold">Branches</h1>
        <h2 className="text-xl font-bold p-2 mb-6 text-[#0c1f4d]">
          {editingId ? 'Edit Sub Dealer' : 'Create Sub Dealer'}
        </h2>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((label, index) => (
              <div key={index} className="text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                    step >= index ? 'bg-[#0c1f4d] text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
          <Progress value={(step / (steps.length - 1)) * 100} className="w-full" />
        </div>
        {step === 0 && (
          <MerchantSelect nextStep={nextStep} updateFormData={updateFormData} formData={formData} />
        )}
        {step === 1 && (
          <UserSelect
            nextStep={nextStep}
            prevStep={prevStep}
            updateFormData={updateFormData}
            formData={formData}
          />
        )}
        {step >= 2 && (
          <SubDealerForm
            formData={formData}
            prevStep={prevStep}
            nextStep={nextStep}
            onSubmit={handleSubmit}
            editing={!!editingId}
            currentStep={step}
            updateCompanyImages={updateCompanyImages}
            deleteCompanyImage={deleteCompanyImage}
            uploadCompanyLogo={uploadCompanyLogo}
            updateCompanyLogo={updateCompanyLogo}
            deleteCompanyLogo={deleteCompanyLogo}
            updateSubDealer={updateSubDealer}
            editingId={editingId}
          />
        )}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sub Dealers List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search by company name"
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs"
              />
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={merchantId} onValueChange={handleMerchantChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Merchant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Merchants</SelectItem>
                  {merchants.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-[#0c1f4d] hover:bg-[#0b2561]" onClick={handleCreateNew}>Create New Sub Dealer</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || merchantsLoading ? (
              <p>Loading...</p>
            ) : isError ? (
              <p className="text-red-500">Failed to load sub-dealers.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subDealers?.data?.map((subDealer) => (
                      <TableRow key={subDealer._id}>
                        <TableCell>{subDealer.company_name}</TableCell>
                        <TableCell>{subDealer.company_email}</TableCell>
                        <TableCell>{subDealer.company_phone_number}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => handleView(subDealer._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => handleEdit(subDealer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => handleDelete(subDealer._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete the sub-dealer "{subDealer.company_name}"? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setOpenDeleteDialog(false);
                                    setSelectedSubDealerId(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={confirmDelete}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Sub-Dealer Details</DialogTitle>
                    </DialogHeader>
                    {selectedSubDealerId && (
                      <SubDealerDetails
                        subDealer={subDealers?.data?.find((d) => d._id === selectedSubDealerId)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
                {subDealers?.pagination && (
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      Showing {(subDealers.pagination.page - 1) * subDealers.pagination.limit + 1} to{' '}
                      {Math.min(
                        subDealers.pagination.page * subDealers.pagination.limit,
                        subDealers.pagination.total
                      )}{' '}
                      of {subDealers.pagination.total} sub-dealers
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className=" text-white bg-[#0c1f4d] hover:bg-[#0c1f4d]"
                        variant="outline"
                        disabled={subDealers.pagination.page === 1}
                        onClick={() => handlePageChange(page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        className="  text-white  bg-[#0c1f4d] hover:bg-[#0c1f4d]"
                        variant="outline"
                        disabled={subDealers.pagination.page >= subDealers.pagination.pages}
                        onClick={() => handlePageChange(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubDealerPage;