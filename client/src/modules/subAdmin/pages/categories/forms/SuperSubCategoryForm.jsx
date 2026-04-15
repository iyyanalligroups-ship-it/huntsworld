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
import {
  useCreateSuperSubCategoryMutation,
  useUpdateSuperSubCategoryMutation,
} from "@/redux/api/SuperSubCategoryApi";
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
} from "@/redux/api/ProductApi";
import { skipToken } from "@reduxjs/toolkit/query";

const SuperSubCategoryForm = ({ open, onClose, data }) => {
  const isEdit = !!data?._id;

  const [formState, setFormState] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_name: "",
  });

  const { data: categories } = useGetCategoriesQuery();
  const { data: subCategories } = useGetSubCategoriesQuery(
    formState.category_id || skipToken
  );

  const [createSuperSubCategory] = useCreateSuperSubCategoryMutation();
  const [updateSuperSubCategory] = useUpdateSuperSubCategoryMutation();

  useEffect(() => {
    if (data) {
      setFormState({
        category_id: data.category_id?._id,
        sub_category_id: data.sub_category_id?._id,
        super_sub_category_name: data.super_sub_category_name,
      });
    } else {
      setFormState({
        category_id: "",
        sub_category_id: "",
        super_sub_category_name: "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateSuperSubCategory({ id: data._id, ...formState });
    } else {
      await createSuperSubCategory(formState);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Update" : "Add"} Super Sub-Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2">Category</Label>
            <Select
              value={formState.category_id}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  category_id: value,
                  sub_category_id: "", // Reset dependent dropdown
                }))
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
                setFormState((prev) => ({ ...prev, sub_category_id: value }))
              }
              required
              disabled={!formState.category_id}
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
            <Label className="mb-2">Super Sub-Category Name</Label>
            <Input
              name="super_sub_category_name"
              value={formState.super_sub_category_name}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuperSubCategoryForm;
