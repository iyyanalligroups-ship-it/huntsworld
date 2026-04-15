// Frontend: pages/admin/NewsAdmin.js
// Updated admin view with shadcn/ui Pagination, DeleteDialog, and toast notifications
// Uses shadcn/ui components, lucide-react icons, Tailwind CSS, and react-toastify

import { useState } from 'react';
import {
  useGetAllNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} from '@/redux/api/NewsApi'; // Adjusted import path as per your code
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Trash2, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import DeleteDialog from '@/model/DeleteModel'; // Adjust path to your DeleteDialog component
import showToast from '@/toast/showToast'; // Adjust path to your toast utility
import { useSidebar } from "../../hooks/useSidebar";

const NewsAdmin = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
  });
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { data: news = [], isLoading } = useGetAllNewsQuery();
  const [createNews] = useCreateNewsMutation();
  const [updateNews] = useUpdateNewsMutation();
  const [deleteNews] = useDeleteNewsMutation();

  // Sort news in descending order by startDate
  const sortedNews = [...news].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  const totalPages = Math.ceil(sortedNews.length / itemsPerPage);
  const paginatedNews = sortedNews.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNews) {
        await updateNews({ id: editingNews._id, ...formData }).unwrap();
        showToast('News updated successfully', 'success');
      } else {
        await createNews(formData).unwrap();
        showToast('News created successfully', 'success');
      }
      setFormData({ title: '', description: '', startDate: '', endDate: '', status: 'upcoming' });
      setEditingNews(null);
      setIsOpen(false);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      description: newsItem.description,
      startDate: newsItem.startDate.split('T')[0],
      endDate: newsItem.endDate.split('T')[0],
      status: newsItem.status,
    });
    setIsOpen(true);
  };

  const handleDeleteClick = (id) => {
    setNewsToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteNews(newsToDelete).unwrap();
      showToast('News deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setNewsToDelete(null);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  return (
    <div className={` p-6 ${isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News Management</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add News
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNews ? 'Edit News' : 'Add News'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">{editingNews ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* News Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : paginatedNews.length > 0 ? (
            paginatedNews.map((newsItem) => (
              <TableRow key={newsItem._id}>
                <TableCell>{newsItem.title}</TableCell>
                <TableCell>{newsItem.description}</TableCell>
                <TableCell>{format(new Date(newsItem.startDate), 'PPP')}</TableCell>
                <TableCell>{format(new Date(newsItem.endDate), 'PPP')}</TableCell>
                <TableCell>{newsItem.status}</TableCell>
                <TableCell className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(newsItem)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(newsItem._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">No news found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, index) => (
            <PaginationItem key={index + 1}>
              <PaginationLink
                onClick={() => setPage(index + 1)}
                isActive={page === index + 1}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete News"
        description="Are you sure you want to delete this news item? This action cannot be undone."
      />
    </div>
  );
};

export default NewsAdmin;