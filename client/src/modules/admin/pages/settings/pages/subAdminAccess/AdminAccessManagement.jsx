import React, { useState, useEffect } from "react";
import { useSearchSubadminsQuery, useGetAccessRequestsBySubadminIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { useUpdateAccessRequestMutation, useDeleteAccessRequestMutation } from "@/redux/api/SubAdminAccessRequestApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Pencil, Trash2, User, Mail, Phone, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DeleteDialog from "@/model/DeleteModel";
import showToast from "@/toast/showToast";
import EditAccessRequestForm from "./EditAccessRequestForm";
import { Card, CardHeader, CardContent } from "@/components/ui/card"

// Helper function to get the last segment of a path
const getLastPathSegment = (path) => {
    if (!path) return '-';
    const segments = path.split('/');
    return segments[segments.length - 1] || '-';
};

// Helper to format page list with limit and ellipsis
const formatPageList = (permissions) => {
    if (!permissions || permissions.length === 0) return '-';
    const pageNames = permissions.map(p => getLastPathSegment(p.page));
    if (pageNames.length <= 2) return pageNames.join(', ');
    return `${pageNames.slice(0, 2).join(', ')}...`;
};

// Helper to format requested permissions with limit and ellipsis
const formatRequestedPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return '-';
    const formatted = permissions.map(p => `${getLastPathSegment(p.page)} (${p.actions.join(', ')})`);
    if (formatted.length <= 2) return formatted.join(', ');
    return `${formatted.slice(0, 2).join(', ')}...`;
};

// Helper to format approved permissions with limit and ellipsis
const formatApprovedPermissions = (approvedPermissions) => {
    if (!approvedPermissions || approvedPermissions.length === 0) return '-';
    const formatted = approvedPermissions.map(p => `${getLastPathSegment(p.page)} (${p.actions.join(', ')})`);
    if (formatted.length <= 2) return formatted.join(', ');
    return `${formatted.slice(0, 2).join(', ')}...`;
};

const AdminAccessManagement = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selectedSubadmin, setSelectedSubadmin] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 1000);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const { data: searchResults, isLoading: isSearching } = useSearchSubadminsQuery(debouncedQuery, { skip: !debouncedQuery });
    const { data: requestsData, isLoading: isLoadingRequests } = useGetAccessRequestsBySubadminIdQuery(
        { subadminId: selectedSubadmin?._id, page: currentPage, limit: itemsPerPage },
        { skip: !selectedSubadmin }
    );

    // Reset to page 1 if no records are found on the current page
    useEffect(() => {
        if (requestsData && requestsData.requests?.length === 0 && requestsData.totalRequests > 0 && currentPage > 1) {
            setCurrentPage(1);
        }
    }, [requestsData, currentPage]);

    const [updateAccessRequest] = useUpdateAccessRequestMutation();
    const [deleteAccessRequest] = useDeleteAccessRequestMutation();

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSelectSubadmin = (subadmin) => {
        setSelectedSubadmin(subadmin);
        setCurrentPage(1);
    };

    const handleEditRequest = (request) => {
        setSelectedRequest(request);
        setIsEditOpen(true);
    };

    const handleUpdateRequest = async (updatedPermissions) => {
        try {
            await updateAccessRequest({ request_id: selectedRequest._id, approved_permissions: updatedPermissions }).unwrap();
            showToast("Access request updated successfully", "success");
            setIsEditOpen(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error("Error updating access request:", error);
            showToast(error?.data?.message || "Failed to update access request", "error");
        }
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setIsDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteAccessRequest({ request_id: deleteId }).unwrap();
            showToast("Access request deleted successfully", "success");
            setIsDialogOpen(false);
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting access request:", error);
            showToast(error?.data?.message || "Failed to delete access request", "error");
            setIsDialogOpen(false);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= (requestsData?.totalPages || 1)) {
            setCurrentPage(page);
        }
    };

    const totalPages = requestsData?.totalPages || 1;
    const hasNoRecords = requestsData?.totalRequests === 0;

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">Manage Subadmin Access Requests</h2>

            {/* Search for Subadmin */}
            <div className="mb-6">
                <Input
                    placeholder="Search subadmin by email or phone..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="max-w-md w-full"
                />
                {isSearching ? (
                    <div className="mt-4 space-y-4">
                        {[1, 2, 3].map((_, index) => (
                            <Skeleton key={index} className="h-16 w-full" />
                        ))}
                    </div>
                ) : debouncedQuery && searchResults?.subadmins?.length === 0 ? (
                    <p className="mt-4 text-gray-600">No subadmins found.</p>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {searchResults?.subadmins?.map((subadmin) => (
                            <li
                                key={subadmin._id}
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md bg-white shadow-sm"
                            >
                                <div className="mb-2 sm:mb-0">
                                    <p><strong>Name:</strong> {subadmin.name || '-'}</p>
                                    <p><strong>Email:</strong> {subadmin.email || '-'}</p>
                                    <p><strong>Phone:</strong> {subadmin.phone || '-'}</p>
                                </div>
                                <Button onClick={() => handleSelectSubadmin(subadmin)}>Select</Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Selected Subadmin Details */}
            {selectedSubadmin && (
                <Card className="mb-6 bg-gray-100 shadow-sm border rounded-2xl">
                    <CardHeader>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                            Selected Subadmin Details
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Name:</span>
                                <span className="text-gray-700">{selectedSubadmin?.name || "-"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Email:</span>
                                <span className="text-gray-700">{selectedSubadmin?.email || "-"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Phone:</span>
                                <span className="text-gray-700">{selectedSubadmin?.phone || "-"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-gray-600" />
                                <span className="font-medium">Role:</span>
                                <span className="text-gray-700">{selectedSubadmin?.role || "-"}</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Access Requests List */}
            {selectedSubadmin && (
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-4">Access Requests</h3>
                    {isLoadingRequests ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, index) => (
                                <Skeleton key={index} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : hasNoRecords ? (
                        <p className="text-gray-600">No access requests found for this subadmin.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[600px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/4">Page</TableHead>
                                            <TableHead className="w-1/4">Requested Actions</TableHead>
                                            <TableHead className="w-1/4">Approved Actions</TableHead>
                                            <TableHead className="w-1/6">Status</TableHead>
                                            <TableHead className="w-1/6 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requestsData?.requests?.map((request) => (
                                            <TableRow key={request._id}>
                                                <TableCell>{formatPageList(request.permissions)}</TableCell>
                                                <TableCell>{formatRequestedPermissions(request.permissions)}</TableCell>
                                                <TableCell>{formatApprovedPermissions(request.approved_permissions)}</TableCell>
                                                <TableCell>{request.status || '-'}</TableCell>
                                                <TableCell className="flex justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Button variant="ghost" onClick={() => handleEditRequest(request)}>
                                                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit access request</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Button variant="ghost" onClick={() => handleDelete(request._id)}>
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Delete access request</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1 || hasNoRecords}
                                        />
                                    </PaginationItem>
                                    {[...Array(totalPages).keys()].map((page) => (
                                        <PaginationItem key={page + 1}>
                                            <PaginationLink
                                                onClick={() => handlePageChange(page + 1)}
                                                isActive={currentPage === page + 1}
                                            >
                                                {page + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages || hasNoRecords}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </>
                    )}
                </div>
            )}

            {/* Edit Access Request Form */}
            {isEditOpen && selectedRequest && (
                <EditAccessRequestForm
                    open={isEditOpen}
                    onClose={() => {
                        setIsEditOpen(false);
                        setSelectedRequest(null);
                    }}
                    onSubmit={handleUpdateRequest}
                    requestedPermissions={selectedRequest.permissions}
                    initialData={selectedRequest.approved_permissions || []}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Access Request?"
                description="This action will permanently remove the access request and update the user's permissions."
            />
        </div>
    );
};

export default AdminAccessManagement;