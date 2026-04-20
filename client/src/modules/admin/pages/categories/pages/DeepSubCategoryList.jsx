
import { useState, useEffect } from "react";
import {
  useGetDeepSubCategoriesQuery,
  useDeleteDeepSubCategoryMutation,
} from "@/redux/api/DeepSubCategoryApi";
import DeleteDialog from "@/model/DeleteModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteDeepSubCategoryImageMutation } from "@/redux/api/DeepSubCategoryImageApi";
import {toast} from "react-toastify";


const DeepSubCategoryList = ({ onEdit, setRefetchFn }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useGetDeepSubCategoriesQuery({ page });
  const [deleteImage] = useDeleteDeepSubCategoryImageMutation();
  const [deleteDeepSubCategory] = useDeleteDeepSubCategoryMutation();

  useEffect(() => {
    if (setRefetchFn) {
      console.log("Setting refetch fn...");
      setRefetchFn(() => refetch);
    }
  }, [refetch, setRefetchFn]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    const selectedItem = data?.data?.find((item) => item._id === deleteId);
    try {
      if (selectedItem?.deep_sub_category_image) {
        const imageName = selectedItem.deep_sub_category_image.split("/").pop();
        await deleteImage(imageName).unwrap();
      }
     const response= await deleteDeepSubCategory(deleteId).unwrap();
     if (response.success == true) {
      toast.success(response.message || "DeepCategory Deleted Successfully");
    } else {
      toast.error(response.message || "Failed to Delete");
    }
      await refetch();
    } catch (err) {
      console.error("Error during deletion:", err);
    }
    setDeleteId(null);
  };

  const filteredData = data?.data?.filter((item) =>
    item.deep_sub_category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search Deep Sub-Category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Sub-Category</TableHead>
              <TableHead>Super Sub-Category</TableHead>
              <TableHead>Deep Sub-Category</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            ) : filteredData?.length ? (
              filteredData.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.category_id?.category_name}</TableCell>
                  <TableCell>{item.sub_category_id?.sub_category_name}</TableCell>
                  <TableCell>{item.super_sub_category_id?.super_sub_category_name}</TableCell>
                  <TableCell>{item.deep_sub_category_name}</TableCell>
                  <TableCell>
                    <img
                      src={`${encodeURI(item.deep_sub_category_image)}?v=${Date.now()}`}
                      alt={item.deep_sub_category_name}
                      className="rounded-md border object-cover"
                      width="50"
                      height="50"
                    />
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(item._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>No records found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
        <div>Total Records: {data?.totalRecords || 0}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Deep Sub-Category?"
      />
    </div>
  );
};

export default DeepSubCategoryList;
