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
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";

const TestimonialList = ({ onEdit, user, refreshKey, onRefresh }) => {
    const [filter, setFilter] = useState("all"); // For feedbackType filter
    const [page, setPage] = useState(1);
    const itemsPerPage = 10; // Number of items per page
    const [deleteId, setDeleteId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: testimonials, isLoading, refetch } = useGetTestimonialsQuery({ filter, page });
    const [deleteTestimonial] = useDeleteTestimonialMutation();

    const userId = user?.user?._id;
    const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

    // Check permissions for the current page
    const currentPagePath = "/subAdmin/others/testimonial";
    const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
    const canEdit = pagePermissions?.actions.includes("edit") || false;
    const canDelete = pagePermissions?.actions.includes("delete") || false;
    const isAdmin = user?.user?.role?.role === "ADMIN";

    if (isUserError) {
        console.error("Error fetching user permissions:", userError);
        toast.error("Failed to load user permissions");
    }

    useEffect(() => {
        refetch(); // Called when refreshKey changes
    }, [refreshKey, refetch]);

    // Ensuring totalCount exists and is a valid number
    const totalTestimonials = testimonials?.totalCount || 0;
    const totalPages = totalTestimonials > 0 ? Math.ceil(totalTestimonials / itemsPerPage) : 0; // Avoid NaN

    const handleDelete = (id) => {
        if (!isAdmin && !canDelete) {
            toast.error("You do not have permission to delete testimonials");
            return;
        }
        setIsDialogOpen(true);
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        try {
            const response = await deleteTestimonial(deleteId).unwrap();
            if (response) {
                toast.success("Testimonial deleted successfully");
            }
            setIsDialogOpen(false);
            setDeleteId(null);
            onRefresh?.();
        } catch (error) {
            setIsDialogOpen(false);
            toast.error(error.message || "Failed to delete testimonial");
        }
    };

    const handleEdit = (testimonial) => {
        if (!isAdmin && !canEdit) {
            toast.error("You do not have permission to edit testimonials");
            return;
        }
        onEdit(testimonial);
    };

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
    const currentTestimonials = testimonials?.data?.slice(startIndex, endIndex) || [];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4 border-b-2">Feedback List</h2>
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
                        <TableCell>Rating</TableCell>
                        <TableCell>Comments</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : currentTestimonials.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                No testimonials found
                            </TableCell>
                        </TableRow>
                    ) : (
                        currentTestimonials.map((testimonial) => (
                            <TableRow key={testimonial._id}>
                                <TableCell>{testimonial?.user_id?.name || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{testimonial.feedbackType}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="flex items-center gap-2">
                                        <Star size={16} color="#FFD700" />
                                        <span>{testimonial.rating}</span>
                                    </Badge>
                                </TableCell>
                                <TableCell>{testimonial.comments || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleEdit(testimonial)}
                                            disabled={!isAdmin && !canEdit}
                                            className={!isAdmin && !canEdit ? "opacity-50 cursor-not-allowed" : ""}
                                            title={!isAdmin && !canEdit ? "You do not have permission to edit testimonials" : "Edit"}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDelete(testimonial._id)}
                                            disabled={!isAdmin && !canDelete}
                                            className={!isAdmin && !canDelete ? "opacity-50 cursor-not-allowed" : ""}
                                            title={!isAdmin && !canDelete ? "You do not have permission to delete testimonials" : "Delete"}
                                        >
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
                description="This action will permanently remove the feedback."
            />
        </div>
    );
};

export default TestimonialList;