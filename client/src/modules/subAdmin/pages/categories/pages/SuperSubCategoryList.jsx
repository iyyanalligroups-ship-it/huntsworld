import { useState, useContext } from "react";
import {
  useGetSuperSubCategoriesQuery,
  useDeleteSuperSubCategoryMutation,
} from "@/redux/api/SuperSubCategoryApi";
import DeleteDialog from "@/model/DeleteModel";
import SuperSubCategoryForm from "../forms/SuperSubCategoryForm";
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
import { toast } from "react-toastify";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";

const SuperSubCategoryList = () => {
  const { user } = useContext(AuthContext);
  const [deleteId, setDeleteId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "/subAdmin/categories/super-sub";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    toast.error("Failed to load user permissions");
  }

  const { data, isLoading } = useGetSuperSubCategoriesQuery({ page });

  const [deleteSuperSubCategory] = useDeleteSuperSubCategoryMutation();
  console.log(data, "super sub category");
  const handleDeleteConfirm = async () => {
    const response = await deleteSuperSubCategory(deleteId).unwrap();
    if (response.success == true) {
      toast.success(response.message || "SuperSubCategory Deleted Successfully");
    } else {
      toast.error(response.message || "Failed to Delete");
    }
    setDeleteId(null);
  };

  const filteredData = data?.data.filter((item) =>
    item.super_sub_category_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {/* <h2 className="text-xl font-semibold">Super Sub-Categories</h2> */}
        <div className="flex gap-2">
          <Input
            placeholder="Search Super Sub-Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button
            onClick={() => setOpenForm(true)}
            disabled={!canEdit}
          >
            Add New
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Sub-Category</TableHead>
              <TableHead>Super Sub-Category</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading...</TableCell>
              </TableRow>
            ) : filteredData?.length ? (
              filteredData.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.category_id?.category_name}</TableCell>
                  <TableCell>
                    {item.sub_category_id?.sub_category_name}
                  </TableCell>
                  <TableCell>{item.super_sub_category_name}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditData(item);
                        setOpenForm(true);
                      }}
                      disabled={!canEdit}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(item._id)}
                      disabled={!canDelete}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>No records found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom controls */}
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

      {/* Form Modal */}
      <SuperSubCategoryForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditData(null);
        }}
        data={editData}
      />

      {/* Delete Modal */}
      <DeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Super Sub-Category?"
      />
    </div>
  );
};

export default SuperSubCategoryList;