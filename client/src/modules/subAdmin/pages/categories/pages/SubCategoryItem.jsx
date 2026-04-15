import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from "@/toast/showToast";

export default function SubCategoryItem({ category, onEdit, onDelete, viewMode }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const currentPagePath = "/subAdmin/categories/sub";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  return (
    <div
      className={`p-4 border rounded-xl shadow-sm ${
        viewMode === "grid" ? "" : "flex justify-between items-center"
      }`}
    >
      <div>
        <h4 className="font-semibold">{category.sub_category_name}</h4>
        {category.sub_category_image && (
          <img
            src={encodeURI(category.sub_category_image)}
            width="100"
            height="100"
            alt="sub-category-image"
            className="mt-2 rounded-md border object-cover"
          />
        )}
      </div>
      <div className="flex gap-2 mt-2 sm:mt-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(category)}
          disabled={!canEdit}
        >
          <Pencil size={16} />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => onDelete(category._id)}
          disabled={!canDelete}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}