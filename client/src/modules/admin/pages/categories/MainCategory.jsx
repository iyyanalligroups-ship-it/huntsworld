
import { Button } from "@/components/ui/button";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/redux/api/CategoryApi";
import CategoryList from "./pages/CategoryList";
import CategoryFormModal from "./forms/CategoryForm";
import { useState,useEffect } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { toast } from "react-toastify";

const MainCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [categoryRefetch, setCategoryRefetch] = useState(null);

  
  const handleSave = async (form) => {
    try {
      if (editingCategory) {
        const response = await updateCategory({
          id: editingCategory._id,
          ...form,
        }).unwrap();
        if (response?.success) {
          toast.success(response?.message || "Category Updated Successfully");
        } else {
          toast.error(response?.message || "Failed to Update");
        }
      } else {
        const response = await createCategory(form).unwrap();
        console.log(response);
        
        if (response?.success) {
          toast.success(response?.message || "Category Added Successfully");
        } else {
          toast.error(response?.message || "Failed to Add");
        }
      }

      setModalOpen(false);
      setEditingCategory(null);
      categoryRefetch?.();
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error(
        error?.data?.message || error?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="max-w-6xl w-full mx-auto mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Categories</h2>
          <Button variant="default" onClick={() => setModalOpen(true)}>+ Add Category</Button>
        </div>

        <CategoryList
          onEdit={(cat) => {
            setEditingCategory(cat);
            setModalOpen(true);
          }}
        />

        <CategoryFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          editingCategory={editingCategory}
          onSave={handleSave}
          refetchList={categoryRefetch} 
        />
      </div>
    </div>
  );
};

export default MainCategory;
