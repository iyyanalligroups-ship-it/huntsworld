import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
} from "@/redux/api/SubCategoryApi";

import {
  useUploadSubCategoryImageMutation,
  useDeleteSubCategoryImageMutation,
} from "@/redux/api/SubCategoryImageApi";
import { useGetCategoriesQuery } from "@/redux/api/SubCategoryApi";
export default function SubCategoryForm({ open, onClose, editingCategory ,refetchList}) {
  const [form, setForm] = useState({
    sub_category_name: "",
    sub_category_image: "",
    category_id: "",
  });
  const {  data, isLoading: loadingCategories } =
    useGetCategoriesQuery();


  const [uploadImage] = useUploadSubCategoryImageMutation();
  const [deleteImage] = useDeleteSubCategoryImageMutation();
  const [createCategory, { isLoading: creating }] =
    useCreateSubCategoryMutation();
  const [updateCategory, { isLoading: updating }] =
    useUpdateSubCategoryMutation();

    useEffect(() => {
      if (editingCategory) {
        setForm({
          sub_category_name: editingCategory.sub_category_name || "",
          sub_category_image: editingCategory.sub_category_image || "",
          category_id: editingCategory.category_id?._id || "",
        });
      } else {
        setForm({
          sub_category_name: "",
          sub_category_image: "",
          category_id: "",
        });
      }
    }, [editingCategory]);
    


  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("sub_category_name", form.sub_category_name);
    formData.append("sub_category_image", file);
  
    try {
      const res = await uploadImage(formData).unwrap();
      const newImageUrl = res?.imageUrl || "";
  
      setForm((prev) => ({
        ...prev,
        sub_category_image: newImageUrl,
      }));
  
      // Auto update image in DB if editing
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...form,
          sub_category_image: newImageUrl,
        }).unwrap();
        refetchList?.();
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };
  

  const handleDeleteImage = async () => {
    const sub_category_name = form.sub_category_image?.split("/").pop();
    if (!sub_category_name) return;
  
    try {
      await deleteImage(sub_category_name).unwrap();
  
   
      setForm((prev) => ({ ...prev, sub_category_image: "" }));
  
   
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...form,
          sub_category_image: "",
        }).unwrap();
        refetchList?.();
      }
    } catch (err) {
      console.error("Image delete failed:", err);
    }
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        console.log(form,'form');
        
        const response = await updateCategory({
          id: editingCategory._id,
          ...form,
        }).unwrap();
        console.log(response, "category");

        if (response.success == true) {
          onClose();
          setForm({
            sub_category_name: "",
            sub_category_image: "",
          });
        }
      } else {
        const response = await createCategory(form).unwrap();

        if (response.success == true) {
          onClose();
          setForm({
            sub_category_name: "",
            sub_category_image: "",
          });
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit" : "Add"} Sub Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Parent Category
            </label>
            <Select
              value={form.category_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, category_id: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {data?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        <div>
        <label className="block text-sm font-medium mb-1">
              Sub Category Name
            </label>
          <Input
            placeholder="Sub Category Name"
            name="sub_category_name"
            value={form.sub_category_name}
            onChange={handleChange}
            required
          />
        </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Sub Category Image
            </label>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {form.sub_category_image && (
              <div className="mt-2 relative w-fit">
                <img
                src={`${encodeURI(form.sub_category_image)}?t=${new Date().getTime()}`} 
                  alt="Preview"
                  className="w-24 h-24 rounded-md border object-cover"
                />
                <Button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-0 right-0 bg-white p-1 rounded-full shadow-md hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={creating || updating}
          >
            {editingCategory
              ? updating
                ? "Updating..."
                : "Update"
              : creating
              ? "Creating..."
              : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
