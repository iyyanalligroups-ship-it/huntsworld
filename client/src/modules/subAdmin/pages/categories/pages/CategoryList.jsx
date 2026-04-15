import { useState, useEffect } from "react";
import CategoryItem from "./CategoryItem";
import DeleteDialog from "@/model/DeleteModel";
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/redux/api/CategoryApi";
import { useDeleteCategoryImageMutation } from "@/redux/api/CategoryImageApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {toast} from "react-toastify";

export default function CategoryList({ onEdit, setRefetch }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const limit = 10;

  const { data, isLoading, refetch } = useGetCategoriesQuery({
    page,
    limit,
    search,
  });

  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteImage] = useDeleteCategoryImageMutation();
  const [deleteId, setDeleteId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (setRefetch) {
      setRefetch(() => refetch);
    }
  }, [refetch, setRefetch]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const selectedCategory = data?.data?.find((item) => item._id === deleteId);
    try {
      if (selectedCategory?.category_image) {
        const imageName = selectedCategory.category_image.split("/").pop();
        await deleteImage(imageName).unwrap();
      }
     const response= await deleteCategory(deleteId).unwrap();
     if (response.success == true) {
      toast.success(response.message || "Category Deleted Successfully");
    } else {
      toast.error(response.message || "Failed to Delete");
    }
      await refetch();
    } catch (err) {
      console.error("Deletion failed:", err);
    }
    setDeleteId(null);
    setIsDialogOpen(false);
  };

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="w-full">
      {/* Search + View Mode Controls */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <Input
          type="text"
          placeholder="Search by Category Name"
          className="border px-4 py-2 rounded-md w-full max-w-sm"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            Grid View
          </Button>
        </div>
      </div>

      {/* Category Items */}
      {isLoading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
              : "flex flex-col gap-2"
          }`}
        >
          {data?.data?.map((cat) => (
            <CategoryItem
              key={cat._id}
              category={cat}
              onEdit={onEdit}
              onDelete={() => {
                setDeleteId(cat._id);
                setIsDialogOpen(true);
              }}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center mt-6">
  {/* Total Records on the Left */}
  <div className="text-sm text-gray-600">
    Total Records: {data?.pagination?.totalItems || 0}
  </div>

  {/* Pagination Controls at Center/Right */}
  <div className="flex justify-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
    <Button
      disabled={page === 1}
      onClick={() => setPage((p) => p - 1)}
      variant="outline"
    >
      Previous
    </Button>
    <span className="font-semibold text-gray-700">
      Page {page} of {data?.pagination?.totalPages || 1}
    </span>
    <Button
      disabled={page === data?.pagination?.totalPages}
      onClick={() => setPage((p) => p + 1)}
      variant="outline"
    >
      Next
    </Button>
  </div>
</div>


      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category?"
        description="This action will permanently remove the category."
      />
    </div>
  );
}
