import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubCategoryItem({ category, onEdit, onDelete, viewMode }) {
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
        <Button size="icon" variant="ghost" onClick={() => onEdit(category)}>
          <Pencil size={16} />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => onDelete(category._id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}
