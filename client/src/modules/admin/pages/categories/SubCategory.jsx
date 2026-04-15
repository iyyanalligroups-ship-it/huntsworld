
import { Button } from "@/components/ui/button";
import {
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
} from "@/redux/api/SubCategoryApi";
import CategoryList from "./pages/SubCategoryList";
import CategoryFormModal from "./forms/SubCategoryForm";
import { useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import {toast} from "react-toastify";


const SubCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [createSubCategory] = useCreateSubCategoryMutation();
  const [updateSubCategory] = useUpdateSubCategoryMutation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [categoryRefetch, setCategoryRefetch] = useState(null);

  const handleSave = async (form) => {
    if (editingCategory) {
    const response=  await updateSubCategory({ id: editingCategory._id, ...form }).unwrap();
      if (response.success == true) {
        toast.success(response.message || "SubCategory Updated Successfully");
      } else {
        toast.error(response.message || "Failed to Update");
      }
    } else {
      const response= await createSubCategory(form).unwrap();
      if (response.success == true) {
        toast.success(response.message || "SubCategory Added Successfully");
      } else {
        toast.error(response.message || "Failed to Add");
      }
    }
    setModalOpen(false);
    setEditingCategory(null);
    categoryRefetch?.();
  };

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="max-w-6xl w-full mx-auto mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage SubCategories</h2>
          <Button onClick={() => setModalOpen(true)}>+ Add SubCategory</Button>
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

export default SubCategory;
