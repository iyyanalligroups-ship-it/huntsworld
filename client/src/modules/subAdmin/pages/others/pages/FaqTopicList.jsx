import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { useDeleteFaqTopicMutation, useGetFaqTopicsQuery } from "@/redux/api/FAQapi";
import { toast } from "react-toastify";
import DeleteDialog from "@/model/DeleteModel";
import React,{useState} from "react";

export function FaqTopicList({ onEdit }) {
    const { data: topics, isLoading } = useGetFaqTopicsQuery();
    const [deleteFaqTopic] = useDeleteFaqTopicMutation();
      const [deleteId, setDeleteId] = useState(null);
      const [isDialogOpen, setIsDialogOpen] = useState(false);

    console.log(topics, "data");

    if (isLoading) return <p>Loading...</p>;

    const handleDelete = async (id) => {
            
        setIsDialogOpen(true);
        setDeleteId(id);
    };
  const confirmDelete= async()=>{
    try {
      const response=  await deleteFaqTopic(deleteId).unwrap();
      if (response) {
        setIsDialogOpen(false);
        toast.success(response.message || "Topic deleted successfully");
      }
    } catch (error) {
        setIsDialogOpen(false);
        console.error("Error deleting topic:", error);
        toast.error(`Failed to delete topic: ${error.data?.message || error.message}`);
    }

  }
    return (
        <div className="flex flex-wrap gap-2 mt-6">
            {topics?.data?.map((topic) => (
                <Badge
                    key={topic._id}
                    className="flex items-center gap-2 px-3 py-4 bg-blue-100 text-blue-800 rounded-full"
                >
                    <span>{topic.title} ({topic.role})</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(topic);
                        }}
                        aria-label={`Edit ${topic.title}`}
                        className="focus:outline-none"
                    >
                        <Pencil className="w-4 h-4 cursor-pointer ml-2 hover:text-blue-600" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(topic._id);
                        }}
                        aria-label={`Delete ${topic.title}`}
                        className="focus:outline-none"
                    >
                        <Trash2 className="w-4 h-4 cursor-pointer text-red-600 hover:text-red-800" />
                    </button>
                </Badge>
            ))}

            <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete FAQ Topic?"
                description="This action will permanently remove the category."
            />
        </div>
    );
}