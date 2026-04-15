import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { useDeleteFaqQuestionMutation, useGetFaqQuestionsQuery ,useUpdateFaqQuestionMutation} from "@/redux/api/FAQapi";
import { Button } from "@/components/ui/button";

export function FaqQuestionList({ onEdit }) {
  const { data: questions = { data: [] }, isLoading } = useGetFaqQuestionsQuery();
  const [deleteQuestion] = useDeleteFaqQuestionMutation();
  const [updateQuestion] = useUpdateFaqQuestionMutation();
  if (isLoading) return <div>Loading...</div>;
  const handleTogglePublished = async (question) => {
    try {
      const updatedData = {
        id: question._id,
        isPublished: !question.isPublished,
      };
      const response = await updateQuestion(updatedData).unwrap();
      toast.success(response.message || "Published status updated successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update published status");
    }
  };
  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Question</TableHead>
                <TableHead className="w-1/3">Answer</TableHead>
                <TableHead className="w-1/6">Role</TableHead>
                <TableHead className="w-1/12">Published</TableHead>
                <TableHead className="w-1/12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.data.map((q) => (
                <TableRow key={q._id}>
                  <TableCell className="max-w-0 truncate">{q.question}</TableCell>
                  <TableCell className="max-w-0 truncate">
                    {q.answer == "" ? (
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => onEdit(q)}
                      >
                        Reply
                      </Button>
                    ) : (
                      <span className="text-ellipsis">{q.answer || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>{q.role}</TableCell>
                  <TableCell
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => handleTogglePublished(q)}
                  >
                    {q.isPublished ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => onEdit(q)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => deleteQuestion(q._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}