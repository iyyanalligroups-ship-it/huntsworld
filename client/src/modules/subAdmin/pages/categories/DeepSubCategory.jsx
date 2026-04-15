
import { Button } from "@/components/ui/button";
import {
  useCreateDeepSubCategoryMutation,
  useUpdateDeepSubCategoryMutation,
} from "@/redux/api/DeepSubCategoryApi";
import DeepSubCategoryList from "./pages/DeepSubCategoryList";
import DeepSubCategoryForm from "./forms/DeepSubCategoryForm";
import { useState, useEffect } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";

const DeepSubCategory = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [createDeepSubCategory] = useCreateDeepSubCategoryMutation();
  const [updateDeepSubCategory] = useUpdateDeepSubCategoryMutation();
  const { isSidebarOpen } = useSidebar();
  const [refetchListFn, setRefetchListFn] = useState(null);

  const handleSave = async (formData) => {
    try {
      if (editingData) {
       const response= await updateDeepSubCategory({ id: editingData._id, ...formData }).unwrap();
       if (response.success == true) {
        toast.success(response.message || "DeepCategory Updated Successfully");
      } else {
        toast.error(response.message || "Failed to Update");
      }
      } else {
       const response= await createDeepSubCategory(formData).unwrap();
       if (response.success == true) {
        toast.success(response.message || "DeepCategory Added Successfully");
      } else {
        toast.error(response.message || "Failed to Add");
      }
      }
      setModalOpen(false);
      setEditingData(null);
      refetchListFn?.(); // Ensure data is refetched immediately after saving
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  useEffect(() => {
    // This will ensure the page gets refetched every time modal closes
    if (!modalOpen && refetchListFn) {
      refetchListFn();
    }
  }, [modalOpen, refetchListFn]); // Watching modalOpen to refetch when it closes

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="max-w-6xl w-full mx-auto mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Deep SubCategories</h2>
          <Button
            onClick={() => {
              setModalOpen(true);
              setEditingData(null);
            }}
          >
            + Add Deep SubCategory
          </Button>
        </div>

        <DeepSubCategoryList
          onEdit={(item) => {
            setEditingData(item);
            setModalOpen(true);
          }}
          setRefetchFn={setRefetchListFn}
        />

        <DeepSubCategoryForm
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingData(null);
          }}
          data={editingData}
          onSave={handleSave}
          refetchList={refetchListFn} 
        />
      </div>
    </div>
  );
};

export default DeepSubCategory;