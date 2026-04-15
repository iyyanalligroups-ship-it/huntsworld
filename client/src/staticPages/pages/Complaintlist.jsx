import { useState, useEffect } from "react";
import { useGetComplaintFormsQuery, useDeleteComplaintFormMutation } from "@/redux/api/ComplaintFormApi";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Download, Edit, Trash2, RefreshCw } from "lucide-react";
import DeleteDialog from "@/model/DeleteModel";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";

const ComplaintList = ({ onEdit, user }) => {
    const [page, setPage] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [filters, setFilters] = useState({
        type: "all",
        option: "all",
    });

    const userId = user?.user?._id;
    const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

    // Check permissions for the current page
    const currentPagePath = "/subAdmin/others/complaint";
    const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
    const canEdit = pagePermissions?.actions.includes("edit") || false;
    const canDelete = pagePermissions?.actions.includes("delete") || false;
    const isAdmin = user?.user?.role?.role === "ADMIN";

    if (isUserError) {
        console.error("Error fetching user permissions:", userError);
        toast.error("Failed to load user permissions");
    }

    // Prepare query parameters
    const queryParams = {
        page,
        limit: 10,
        ...(filters.type !== "all" && { type: filters.type }),
        ...(filters.option !== "all" && { option: filters.option }),
    };

    // RTK Query call
    const { data, isLoading, isFetching, error, refetch } = useGetComplaintFormsQuery(queryParams, {
        refetchOnMountOrArgChange: true,
    });
    const [deleteComplaint] = useDeleteComplaintFormMutation();
    console.log({ data, isLoading, isFetching, error, queryParams });

    // Data handling with proper fallbacks
    const complaints = data?.complaints || [];
    const pagination = data?.pagination || {
        totalPages: 1,
        page: 1,
        total: 0,
    };
    const { totalPages = 1, page: currentPage = 1 } = pagination;
    const isDataLoading = isLoading || isFetching;

    // Sync page state with response
    useEffect(() => {
        if (data?.pagination?.page) {
            setPage(data.pagination.page);
        }
    }, [data]);

    const handleFilterChange = (filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
    };

    useEffect(() => {
        setPage(1);
    }, [filters.type, filters.option]);

    const handlePrevious = () => setPage(Math.max(1, currentPage - 1));
    const handleNext = () => setPage(Math.min(totalPages, currentPage + 1));
    const handleRefresh = () => refetch();

    const handleEdit = (complaint) => {
        if (!isAdmin && !canEdit) {
            toast.error("You do not have permission to edit complaints");
            return;
        }
        onEdit(complaint);
    };

    const handleDelete = async (complaint) => {
        if (!isAdmin && !canDelete) {
            toast.error("You do not have permission to delete complaints");
            return;
        }
        setIsDialogOpen(true);
        setDeleteId(complaint._id);
    };

    const confirmDelete = async () => {
        try {
            await deleteComplaint(deleteId).unwrap();
            toast.success("Complaint deleted successfully");
            setIsDialogOpen(false);
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting complaint:", error);
            toast.error(`Failed to delete complaint: ${error.data?.message || error.message}`);
        }
    };

    const handleDownload = (url) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = url.split("/").pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderFieldValue = (value, fieldName) => {
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
            return "-";
        }
        if (Array.isArray(value) && (fieldName.includes("attachment") || fieldName.includes("attachment_1"))) {
            return (
                <div className="flex flex-col gap-1">
                    {value.map((item, idx) => {
                        const fileUrl = JSON.parse(item).fileUrl;
                        return (
                            <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={() => handleDownload(fileUrl)}
                                title="Download attachment"
                            >
                                <Download className="h-4 w-4" />
                                <span className="ml-2">{fileUrl.split("/").pop()}</span>
                            </Button>
                        );
                    })}
                </div>
            );
        }
        if (typeof value === "boolean") {
            return value ? "Yes" : "No";
        }
        if (typeof value === "object") {
            return JSON.stringify(value);
        }
        return value.toString();
    };

    const allFields = [
        "_id",
        "type",
        "option",
        "user_id.name",
        "user_id.email",
        "details.ipr_type",
        "details.brand_name",
        "details.court_order",
        "details.court_order_attachment",
        "details.infringing_urls",
        "details.you_are",
        "details.agreement",
        "details.related_attachment",
        "details.attachment_1",
        "details.copyright_title",
        "details.buyer_name",
        "details.buyer_mobile",
        "details.product_name",
        "details.complaint_description",
        "createdAt",
        "updatedAt",
    ];

    if (error) {
        return (
            <div className="flex items-center justify-center h-32 text-red-500">
                Error fetching complaints: {error.message || "Unknown error"}
            </div>
        );
    }

    // return (
    //     <div className="p-4 space-y-4 max-w-6xl mx-auto">
    //         <h2 className="text-xl font-bold mb-4 border-b-2">Complaint Details List</h2>
    //         <div className="flex gap-4 items-center">
    //             <Select
    //                 value={filters.type}
    //                 onValueChange={(val) => handleFilterChange("type", val)}
    //             >
    //                 <SelectTrigger className="w-[200px]">
    //                     <SelectValue placeholder="Select Type" />
    //                 </SelectTrigger>
    //                 <SelectContent>
    //                     <SelectItem value="all">All Types</SelectItem>
    //                     <SelectItem value="type1">Type 1</SelectItem>
    //                     <SelectItem value="type2">Type 2</SelectItem>
    //                     <SelectItem value="type3">Type 3</SelectItem>
    //                 </SelectContent>
    //             </Select>

    //             <Select
    //                 value={filters.option}
    //                 onValueChange={(val) => handleFilterChange("option", val)}
    //             >
    //                 <SelectTrigger className="w-[200px]">
    //                     <SelectValue placeholder="Select Option" />
    //                 </SelectTrigger>
    //                 <SelectContent>
    //                     <SelectItem value="all">All Options</SelectItem>
    //                     <SelectItem value="buylead_issue">Buy Lead Issue</SelectItem>
    //                     <SelectItem value="ipr_dispute">IPR Dispute</SelectItem>
    //                     <SelectItem value="buyer_complaint">Buyer Complaint</SelectItem>
    //                     <SelectItem value="supplier_complaint">Supplier Complaint</SelectItem>
    //                     <SelectItem value="account_related">Account Related Complaint</SelectItem>
    //                     <SelectItem value="account_status">Account Status Complaint</SelectItem>
    //                     <SelectItem value="others">Others Complaint</SelectItem>
    //                 </SelectContent>
    //             </Select>
    //         </div>

    //         <Card className="p-6">
    //             {isDataLoading ? (
    //                 <div className="space-y-4">
    //                     {[...Array(5)].map((_, i) => (
    //                         <Skeleton key={i} className="h-12 w-full" />
    //                     ))}
    //                 </div>
    //             ) : complaints.length === 0 ? (
    //                 <div className="flex items-center justify-center h-32 text-muted-foreground">
    //                     No complaints found
    //                 </div>
    //             ) : (
    //                 <Table>
    //                     <TableHeader>
    //                         <TableRow>
    //                             {allFields.map((field) => (
    //                                 <TableHead key={field} className="capitalize">
    //                                     {field.replace("details.", "").replace("user_id.", "").replace(".", " ")}
    //                                 </TableHead>
    //                             ))}
    //                             <TableHead>Actions</TableHead>
    //                         </TableRow>
    //                     </TableHeader>
    //                     <TableBody>
    //                         {complaints.map((complaint) => (
    //                             <TableRow key={complaint._id}>
    //                                 {allFields.map((field) => {
    //                                     let value;
    //                                     if (field.includes("user_id.")) {
    //                                         const subField = field.split(".")[1];
    //                                         value = complaint.user_id?.[subField];
    //                                     } else if (field.includes("details.")) {
    //                                         const subField = field.split(".")[1];
    //                                         value = complaint.details?.[subField];
    //                                     } else {
    //                                         value = complaint[field];
    //                                     }
    //                                     return (
    //                                         <TableCell key={field}>
    //                                             {renderFieldValue(value, field)}
    //                                         </TableCell>
    //                                     );
    //                                 })}
    //                                 <TableCell>
    //                                     <div className="flex gap-2">
    //                                         <Button
    //                                             variant="outline"
    //                                             size="sm"
    //                                             onClick={() => handleEdit(complaint)}
    //                                             disabled={!isAdmin && !canEdit}
    //                                             className={!isAdmin && !canEdit ? "opacity-50 cursor-not-allowed" : ""}
    //                                             title={!isAdmin && !canEdit ? "You do not have permission to edit complaints" : "Edit"}
    //                                         >
    //                                             <Edit className="h-4 w-4" />
    //                                         </Button>
    //                                         <Button
    //                                             variant="destructive"
    //                                             size="sm"
    //                                             onClick={() => handleDelete(complaint)}
    //                                             disabled={!isAdmin && !canDelete}
    //                                             className={!isAdmin && !canDelete ? "opacity-50 cursor-not-allowed" : ""}
    //                                             title={!isAdmin && !canDelete ? "You do not have permission to delete complaints" : "Delete"}
    //                                         >
    //                                             <Trash2 className="h-4 w-4" />
    //                                         </Button>
    //                                     </div>
    //                                 </TableCell>
    //                             </TableRow>
    //                         ))}
    //                     </TableBody>
    //                 </Table>
    //             )}
    //         </Card>

    //         <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 p-4">
    //             {/* Pagination Controls */}
    //             <div className="flex items-center gap-2 sm:gap-3">
    //                 <Button
    //                     variant="outline"
    //                     size="sm"
    //                     disabled={currentPage <= 1}
    //                     onClick={handlePrevious}
    //                     className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
    //                 >
    //                     <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
    //                     <span className="hidden sm:inline">Previous</span>
    //                     <span className="inline sm:hidden">Prev</span>
    //                 </Button>

    //                 <span className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-4">
    //                     Page {currentPage} of {totalPages} ({pagination.total || 0} total)
    //                 </span>

    //                 <Button
    //                     variant="outline"
    //                     size="sm"
    //                     disabled={currentPage >= totalPages}
    //                     onClick={handleNext}
    //                     className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
    //                 >
    //                     <span className="hidden sm:inline">Next</span>
    //                     <span className="inline sm:hidden">Next</span>
    //                     <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
    //                 </Button>
    //             </div>

    //             {/* Refresh Button */}
    //             <Button
    //                 variant="ghost"
    //                 size="sm"
    //                 onClick={handleRefresh}
    //                 className="mt-2 sm:mt-0 text-xs sm:text-sm"
    //             >
    //                 <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
    //                 Refresh
    //             </Button>
    //         </div>
    //         <DeleteDialog
    //             open={isDialogOpen}
    //             onClose={() => setIsDialogOpen(false)}
    //             onConfirm={confirmDelete}
    //             title="Delete Complaint?"
    //             description="This action will permanently remove the complaint."
    //         />
    //     </div>
    // );
};

export default ComplaintList;