
import { Button } from "@/components/ui/button";
import {
  useCreateSuperSubCategoryMutation,
  useUpdateSuperSubCategoryMutation,
} from "@/redux/api/SuperSubCategoryApi";
import SuperSubCategoryList from "./pages/SuperSubCategoryList";
import SuperSubCategoryForm from "./forms/SuperSubCategoryForm";
import { useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";

const SuperSubCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [createSuperSubCategory] = useCreateSuperSubCategoryMutation();
  const [updateSuperSubCategory] = useUpdateSuperSubCategoryMutation();
  const { isSidebarOpen } = useSidebar();
  const [refetchListFn, setRefetchListFn] = useState(null);

  const handleSave = async (formData) => {
    if (editingData) {
    const response=  await updateSuperSubCategory({ id: editingData._id, ...formData }).unwrap();
    if (response.success == true) {
      toast.success(response.message || "SuperSubCategory Updated Successfully");
    } else {
      toast.error(response.message || "Failed to Update");
    }
    } else {
     const response= await createSuperSubCategory(formData).unwrap();
     if (response.success == true) {
      toast.success(response.message || "SuperSubCategory Added Successfully");
    } else {
      toast.error(response.message || "Failed to Add");
    }
    }
    setModalOpen(false);
    setEditingData(null);
    refetchListFn?.();
  };

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="max-w-6xl w-full mx-auto mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Super SubCategories</h2>
          <Button onClick={() => setModalOpen(true)}>+ Add Super SubCategory</Button>
        </div>

        <SuperSubCategoryList
          onEdit={(item) => {
            setEditingData(item);
            setModalOpen(true);
          }}
          setRefetchFn={setRefetchListFn}
        />

        <SuperSubCategoryForm
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingData(null);
          }}
          data={editingData}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};


export default SuperSubCategory;
