import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/redux/api/CategoryApi";

import {
  useUploadCategoryImageMutation,
  useDeleteCategoryImageMutation,
} from "@/redux/api/CategoryImageApi";
export default function CategoryForm({ open, onClose, editingCategory,refetchList }) {
  const [form, setForm] = useState({ category_name: "", category_image: "" });

  const [uploadImage] = useUploadCategoryImageMutation();
  const [deleteImage] = useDeleteCategoryImageMutation();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();

  useEffect(() => {
    if (editingCategory) {
      setForm(editingCategory);
    } else {
      setForm({ category_name: "", category_image: "" });
    }
  }, [editingCategory]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("category_name", form.category_name);
    formData.append("category_image", file);

    try {
      const res = await uploadImage(formData).unwrap();
      const newImageUrl = res?.imageUrl || "";
     if (res) {
      refetchList?.();
     }

      const updatedForm = {
        ...form,
        category_image: newImageUrl,
      };
      setForm(updatedForm);


      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...updatedForm,
        }).unwrap();
        refetchList?.();
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };



  const handleDeleteImage = async () => {
    const category_name = form.category_image?.split("/").pop();
    if (!category_name) return;

    try {
      await deleteImage(category_name).unwrap();

      setForm((prev) => ({ ...prev, category_image: "" }));

      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...form,
          category_image: "",
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
        const response = await updateCategory({
          id: editingCategory._id,
          ...form,
        }).unwrap();
        console.log(response, "category");

        if (response.success == true) {
          onClose();
          setForm({
            category_name: "",
            category_image: "",
          });
        }
      } else {
        const response = await createCategory(form).unwrap();

        if (response.success == true) {
          onClose();
          setForm({
            category_name: "",
            category_image: "",
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
          <DialogTitle>{editingCategory ? "Edit" : "Add"} Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder="Category Name"
            name="category_name"
            value={form.category_name}
            onChange={handleChange}
            required
          />

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Category Image
            </label>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {form.category_image && (
              <div className="mt-2 relative w-fit">
                <img
                  src={`${encodeURI(form.category_image)}?t=${Date.now()}`}
                  alt="Preview"
                  className="w-24 h-24 rounded-md border object-cover"
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-0 right-0 bg-white p-1 rounded-full shadow-md hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
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
