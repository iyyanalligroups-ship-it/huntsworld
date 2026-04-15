import { useState, useEffect } from 'react';
import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useUploadBrandImageMutation,
  useUpdateBrandImageMutation,
  useDeleteBrandImageMutation,
} from '../features/api/apiSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import DeleteDialog from '../components/DeleteDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const BrandsPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [formData, setFormData] = useState({ brand_name: '', image_url: '', link: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const { data, isLoading, isFetching } = useGetBrandsQuery({ page, limit });
  const [createBrand, { isLoading: creating, isError: createError, isSuccess: createSuccess }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: updating, isError: updateError, isSuccess: updateSuccess }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: deleting, isError: deleteError, isSuccess: deleteSuccess }] = useDeleteBrandMutation();
  const [uploadBrandImage, { isLoading: uploading, isError: uploadError, isSuccess: uploadSuccess }] = useUploadBrandImageMutation();
  const [updateBrandImage, { isLoading: updatingImage, isError: updateImageError, isSuccess: updateImageSuccess }] = useUpdateBrandImageMutation();
  const [deleteBrandImage, { isLoading: deletingImage, isError: deleteImageError, isSuccess: deleteImageSuccess }] = useDeleteBrandImageMutation();

  useEffect(() => {
    if (createSuccess || updateSuccess || deleteSuccess || uploadSuccess || updateImageSuccess || deleteImageSuccess) {
      setOpenDialog(false);
      setEditBrand(null);
      setFormData({ brand_name: '', image_url: '', link: '' });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [createSuccess, updateSuccess, deleteSuccess, uploadSuccess, updateImageSuccess, deleteImageSuccess]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const formData = new FormData();
      formData.append('brand_image', file);
      formData.append('entity_type', 'brand');
      formData.append('company_name', 'admin');

      const response = await uploadBrandImage(formData).unwrap();
      if (response.success) {
        setFormData({ ...formData, image_url: response.data.fileUrl });
        setImagePreview(response.data.fileUrl);
      }
    }
  };

  const handleImageUpdate = async () => {
    if (imageFile && editBrand?.image_url) {
      const formData = new FormData();
      formData.append('brand_image', imageFile);
      formData.append('entity_type', 'brand');
      formData.append('company_name', 'admin');
      formData.append('old_filename', editBrand.image_url.split('/').pop());

      const response = await updateBrandImage(formData).unwrap();
      if (response.success) {
        setFormData({ ...formData, image_url: response.data.fileUrl });
        setImagePreview(response.data.fileUrl);
      }
    }
  };

  const handleImageDelete = async () => {
    if (imagePreview) {
      const response = await deleteBrandImage({
        entity_type: 'brand',
        company_name: 'admin',
        filename: imagePreview.split('/').pop(),
      }).unwrap();
      if (response.success) {
        setImagePreview(null);
        setFormData({ ...formData, image_url: '' });
        setImageFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editBrand) {
      await updateBrand({ id: editBrand._id, ...formData });
      if (imageFile) await handleImageUpdate();
    } else {
      if (imageFile) {
        const response = await uploadBrandImage({
          brand_image: imageFile,
          entity_type: 'brand',
          company_name: 'admin',
        }).unwrap();
        if (response.success) {
          await createBrand({ ...formData, image_url: response.data.fileUrl });
        }
      } else {
        await createBrand(formData);
      }
    }
  };

  const handleDelete = async () => {
    if (brandToDelete) {
      if (brandToDelete.image_url) {
        await deleteBrandImage({
          entity_type: 'brand',
          company_name: 'admin',
          filename: brandToDelete.image_url.split('/').pop(),
        }).unwrap();
      }
      await deleteBrand(brandToDelete._id);
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  };

  const isFormValid = formData.brand_name && formData.image_url && formData.link;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Brands</h1>
        <Button onClick={() => setOpenDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add Brand</Button>
      </div>

      {(createError || updateError || deleteError || uploadError || updateImageError || deleteImageError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {createError?.data?.message || updateError?.data?.message || deleteError?.data?.message ||
             uploadError?.data?.message || updateImageError?.data?.message || deleteImageError?.data?.message}
          </AlertDescription>
        </Alert>
      )}
      {(createSuccess || updateSuccess || deleteSuccess || uploadSuccess || updateImageSuccess || deleteImageSuccess) && (
        <Alert variant="success">
          <AlertDescription>
            {createSuccess && "Brand created successfully"}
            {updateSuccess && "Brand updated successfully"}
            {deleteSuccess && "Brand deleted successfully"}
            {uploadSuccess && "Image uploaded successfully"}
            {updateImageSuccess && "Image updated successfully"}
            {deleteImageSuccess && "Image deleted successfully"}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((brand) => (
                <TableRow key={brand._id}>
                  <TableCell>{brand.brand_name}</TableCell>
                  <TableCell>
                    <img src={brand.image_url} alt={brand.brand_name} className="h-12 w-12 object-cover rounded" />
                  </TableCell>
                  <TableCell>{brand.link}</TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => { setEditBrand(brand); setFormData(brand); setImagePreview(brand.image_url); setOpenDialog(true); }} className="mr-2"><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" onClick={() => { setBrandToDelete(brand); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <Button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1 || isFetching}
        >
          Previous
        </Button>
        <span>Page {data?.pagination.currentPage} of {data?.pagination.totalPages}</span>
        <Button
          onClick={() => setPage(prev => prev + 1)}
          disabled={page === data?.pagination.totalPages || isFetching}
        >
          Next
        </Button>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
            <DialogDescription>Enter brand details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="brand_name">Brand Name</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="image">Image</Label>
              <Input id="image" type="file" onChange={handleImageUpload} />
              {imagePreview && (
                <div className="mt-2 relative">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-0 right-0"
                    onClick={handleImageDelete}
                    disabled={deletingImage}
                  >
                    {deletingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={!isFormValid || creating || updating || uploading || updatingImage}>
                {(creating || updating || uploading || updatingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editBrand ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
      />
    </div>
  );
};

export default BrandsPage;