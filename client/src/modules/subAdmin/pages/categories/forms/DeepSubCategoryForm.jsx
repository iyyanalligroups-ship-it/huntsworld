import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  useUploadDeepSubCategoryImageMutation,
  useDeleteDeepSubCategoryImageMutation,
} from "@/redux/api/DeepSubCategoryImageApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetSuperSubCategoriesQuery,
} from "@/redux/api/ProductApi";
import { skipToken } from "@reduxjs/toolkit/query";
const DeepSubCategoryForm = ({ open, onClose, data, onSave, refetchList }) => {
  const isEdit = !!data?._id;

  const [formState, setFormState] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_id: "",
    deep_sub_category_name: "",
    deep_sub_category_image: "",
  });

  const [uploadImage] = useUploadDeepSubCategoryImageMutation();
  const [deleteImage] = useDeleteDeepSubCategoryImageMutation();

  const { data: categories } = useGetCategoriesQuery();

  // Fetch sub-categories dynamically when category_id is selected
  const { data: subCategories } = useGetSubCategoriesQuery(
    formState.category_id || skipToken
  );

  // Fetch super-sub-categories dynamically when sub_category_id is selected
  const { data: SuperSubCategories } = useGetSuperSubCategoriesQuery(
    formState.sub_category_id || skipToken
  );

  useEffect(() => {
    if (data) {
      setFormState({
        category_id: data.category_id?._id || "",
        sub_category_id: data.sub_category_id?._id || "",
        super_sub_category_id: data.super_sub_category_id?._id || "",
        deep_sub_category_name: data.deep_sub_category_name || "",
        deep_sub_category_image: data.deep_sub_category_image || "",
      });
    } else {
      setFormState({
        category_id: "",
        sub_category_id: "",
        super_sub_category_id: "",
        deep_sub_category_name: "",
        deep_sub_category_image: "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formState);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("deep_sub_category_name", formState.deep_sub_category_name);
    formData.append("deep_sub_category_image", file);

    try {
      const res = await uploadImage(formData).unwrap();
      const newImageUrl = res?.imageUrl || "";

      setFormState((prev) => ({
        ...prev,
        deep_sub_category_image: newImageUrl,
      }));
      refetchList?.();
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };

  const handleDeleteImage = async () => {
    const imageName = formState.deep_sub_category_image?.split("/").pop();
    if (!imageName) return;

    try {
      await deleteImage(imageName).unwrap();
      setFormState((prev) => ({ ...prev, deep_sub_category_image: "" }));
      refetchList?.();
    } catch (err) {
      console.error("Image delete failed:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Update" : "Add"} Deep Sub-Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2">Category</Label>
            <Select
              value={formState.category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({ ...prev, category_id: value }))
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.data?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">Sub-Category</Label>
            <Select
              value={formState.sub_category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  sub_category_id: value,
                  super_sub_category_id: "",
                }))
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Sub-Category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories?.data?.map((sub) => (
                  <SelectItem key={sub._id} value={sub._id}>
                    {sub.sub_category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">Super Sub-Category</Label>
            <Select
              value={formState.super_sub_category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  super_sub_category_id: value,
                }))
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Super-Sub-Category" />
              </SelectTrigger>
              <SelectContent>
                {SuperSubCategories?.data?.map((sup) => (
                  <SelectItem key={sup._id} value={sup._id}>
                    {sup.super_sub_category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">Deep Sub-Category Name</Label>
            <Input
              name="deep_sub_category_name"
              placeholder="Enter Deep Sub-Category Name"
              value={formState.deep_sub_category_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label className="mb-2">Upload Image</Label>
            <Input type="file" onChange={handleFileChange} />
            {formState.deep_sub_category_image && (
              <div className="mt-2 space-y-2 relative w-fit">
                <img
                  src={formState.deep_sub_category_image}
                  alt="preview"
                  className="h-24 rounded border object-cover"
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

          <Button type="submit" className="w-full">
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeepSubCategoryForm;
