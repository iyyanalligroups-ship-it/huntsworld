import React, { useState, useEffect } from "react";
import { useGetTestimonialsQuery, useDeleteTestimonialMutation } from "@/redux/api/Testimonialapi";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import { Star } from "lucide-react";
import DeleteDialog from "@/model/DeleteModel";

const TestimonialList = ({ onEdit, refreshKey,onRefresh  }) => {
    const [filter, setFilter] = useState("all"); // For feedbackType filter
    const [page, setPage] = useState(1);
    const itemsPerPage = 10; // Number of items per page
    const [deleteId, setDeleteId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: testimonials, isLoading, refetch } = useGetTestimonialsQuery({ filter, page });
    const [deleteTestimonial] = useDeleteTestimonialMutation();

    useEffect(() => {
        refetch(); // <- called when refreshKey changes
    }, [refreshKey]);
    // Ensuring totalCount exists and is a valid number
    const totalTestimonials = testimonials?.totalCount || 0;
    const totalPages = totalTestimonials > 0 ? Math.ceil(totalTestimonials / itemsPerPage) : 0; // Avoid NaN

    const handleDelete = async (id) => {
       setIsDialogOpen(true);
       setDeleteId(id);
    };
const confirmDelete =async ()=>{
    try {
       const response= await deleteTestimonial(deleteId).unwrap();
       if (response) {
        toast.success("Testimonial deleted successfully");
       }
       setIsDialogOpen(false);
       onRefresh?.(); 
    } catch (error) {
        setIsDialogOpen(false);
        toast.error(error.message || "Failed to delete testimonial");
    }
}
    const handleFilterChange = (value) => {
        setFilter(value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const currentTestimonials = testimonials?.data?.slice(startIndex, endIndex);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4 border-b-2"> Feedback List</h2>
            {/* Filter Section */}
            <div className="flex items-center justify-between">
                <Select value={filter} onValueChange={handleFilterChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Feedback Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="suggestions">Suggestions</SelectItem>
                        <SelectItem value="applications">Applications</SelectItem>
                        <SelectItem value="bug_error_report">Bug / Error Report</SelectItem>
                        <SelectItem value="purchase_requirement">Purchase Requirement</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="interested_in_services">Interested in Services</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table Section */}
            <Table className="min-w-full">
                <TableHeader>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Feedback Type</TableCell>
                        <TableCell>Comments</TableCell>
                        <TableCell>Rating</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : (
                        currentTestimonials?.map((testimonial) => (
                            <TableRow key={testimonial._id}>
                                <TableCell>{testimonial?.user_id?.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{testimonial.feedbackType}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="flex items-center gap-2">
                                        <Star size={16} color="#FFD700" /> {/* Gold color for the star */}
                                        <span>{testimonial.rating}</span>
                                    </Badge>
                                </TableCell>
                                <TableCell>{testimonial.comments}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => onEdit(testimonial)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="outline" onClick={() => handleDelete(testimonial._id)}>
                                            <Trash size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Pagination Section */}
            <div className="flex justify-between items-center mt-4">
                {/* Previous Button */}
                <Button
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                >
                    Previous
                </Button>

                {/* Page Numbers */}
                <span className="text-sm">
                    Page {page} of {totalPages}
                </span>

                {/* Next Button */}
                <Button
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>
            <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Feedback?"
                description="This action will permanently remove the category."
            />
        </div>
    );
};

export default TestimonialList;
