import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Copy, Plus, MoreVertical, X, Check, CheckCircle2, Eye, Trash2 } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import showToast from "@/toast/showToast";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import Loader from "@/loader/Loader";

// We use the configured fetch API url. We'll utilize the standard fetch api with the token
const AskPriceList = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLeads, setTotalLeads] = useState(0);
    const [limit] = useState(10);
    const { isSidebarOpen } = useSidebar();

    useEffect(() => {
        fetchLeads(currentPage);

        const handleRefresh = () => {
            console.log("Real-time refresh triggered...");
            fetchLeads(currentPage);
        };

        window.addEventListener('refresh-ask-price-leads', handleRefresh);
        return () => window.removeEventListener('refresh-ask-price-leads', handleRefresh);
    }, [currentPage]);

    const fetchLeads = async (page = 1) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ask-price/merchant?page=${page}&limit=${limit}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setLeads(data.data || []);
                if (data.pagination) {
                    setTotalPages(data.pagination.pages);
                    setTotalLeads(data.pagination.total);
                }
            } else {
                showToast("Failed to load product leads.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("An error occurred while fetching leads.", "error");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast.success("Copied to clipboard!");
    };

    const handleMarkAsRead = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ask-price/${id}/read`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                // Optimistically update local state then fetch for fresh sorting/positions
                setLeads(prev => prev.map(l => l._id === id ? { ...l, isReadByMerchant: true } : l));
                fetchLeads(currentPage);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ask-price/mark-all-read`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setLeads(prev => prev.map(l => ({ ...l, isReadByMerchant: true })));
                showToast("All leads marked as read", "success");
                fetchLeads(currentPage);
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to mark all as read", "error");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const currentLead = leads.find(l => l._id === id);
        if (currentLead && currentLead.status === newStatus) return;

        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ask-price/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Status updated successfully!", "success");

                // 1. Optimistically update local state for immediate visual feedback
                setLeads(prevLeads => prevLeads.map(lead =>
                    lead._id === id ? { ...lead, status: newStatus } : lead
                ));

                // 2. Then trigger a background re-fetch to ensure perfect sync
                console.log("Triggering background re-fetch...");
                fetchLeads();
            } else {
                showToast(data.message || "Failed to update status.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("An error occurred while updating status.", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;

        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ask-price/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                showToast("Lead deleted successfully!", "success");
                setLeads(prev => prev.filter(l => l._id !== id));
            } else {
                showToast(data.message || "Failed to delete lead.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("An error occurred while deleting lead.", "error");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
            case "Contacted": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Contacted</Badge>;
            case "Closed": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Closed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-0 sm:ml-64" : "ml-0 sm:ml-16"}`}>
                <Loader contained={true} />
            </div>
        );
    }

    return (

        <div className={`container mx-auto max-w-7xl p-4 ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>

            <div className="p-6 bg-gray-50/50 min-h-[calc(100vh-4rem)]">
                <div className="max-w-[1200px] mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Leads</h1>
                            <p className="text-sm text-gray-500 mt-1">Manage price requests from customers</p>
                        </div>
                        <div className="flex items-center gap-2">
                             {leads.some(l => !l.isReadByMerchant) && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#0c1f4d] border border-blue-100 rounded-xl hover:bg-blue-100 transition-all text-sm font-semibold"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Mark All Read
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-2xl">
                        {leads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Copy className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No Product Leads Yet</h3>
                                <p className="text-sm text-gray-500 mt-1">When customers request a price for your products, they will appear here.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-[#0c1f4d] hover:bg-[#0e2d75]">
                                            <TableRow>
                                                <TableHead className="text-left text-xs sm:text-sm text-white">Date</TableHead>
                                                <TableHead className="text-left text-xs sm:text-sm text-white">Product</TableHead>
                                                <TableHead className="text-left text-xs sm:text-sm text-white">Customer Details</TableHead>
                                                <TableHead className="text-left text-xs sm:text-sm text-white">Message</TableHead>
                                                <TableHead className="text-left text-xs sm:text-sm text-white">Status</TableHead>
                                                <TableHead className="text-right text-xs sm:text-sm text-white">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leads.map((lead) => (
                                                <TableRow key={lead._id} className={cn("hover:bg-gray-50/50 transition-colors", !lead.isReadByMerchant && "bg-blue-50/30")}>
                                                    <TableCell className="text-sm text-gray-600 align-top py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {format(new Date(lead.createdAt), "MMM d, yyyy")}
                                                            {!lead.isReadByMerchant && (
                                                                <Badge className="w-fit bg-blue-600 text-white hover:bg-blue-700 text-[10px] px-1.5 py-0 h-4">New Lead</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-4">
                                                        {lead.product_id ? (
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                                    <img
                                                                        src={lead.product_id.product_image?.[0] || "/placeholder.png"}
                                                                        alt={lead.product_id.product_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{lead.product_id.product_name}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500 italic">Product Removed</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="align-top py-4">
                                                        <div className="space-y-1 mt-1">
                                                            <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <span>{lead.phone}</span>
                                                                <button onClick={() => copyToClipboard(lead.phone)} className="text-gray-400 hover:text-[#0c1f4d]">
                                                                    <Copy className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            {lead.email && (
                                                                <p className="text-xs text-gray-500">{lead.email}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-4">
                                                        <p className="text-sm text-gray-600 line-clamp-2 max-w-[250px]" title={lead.reason}>
                                                            {lead.reason}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="align-top py-4">
                                                        <div className="flex flex-col gap-2">
                                                            {getStatusBadge(lead.status)}
                                                            <Select
                                                                value={lead.status}
                                                                onValueChange={(value) => handleStatusUpdate(lead._id, value)}
                                                            >
                                                                <SelectTrigger className="w-[120px] h-8 text-xs border-2 border-slate-300">
                                                                    <SelectValue placeholder="Status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                                    <SelectItem value="Contacted">Contacted</SelectItem>
                                                                    <SelectItem value="Closed">Closed</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-4 text-right">
                                                        {!lead.isReadByMerchant && (
                                                            <button 
                                                                onClick={() => handleMarkAsRead(lead._id)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                                                title="Mark as Read"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                Read
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDelete(lead._id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 ml-2"
                                                            title="Delete Lead"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile View (Card View) */}
                                <div className="md:hidden space-y-4 p-4 bg-gray-50/50">
                                    {leads.map((lead) => (
                                        <div key={lead._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-1.5">
                                                    <Badge variant="outline" className="w-fit text-[10px] font-normal text-gray-400 border-gray-200">
                                                        {format(new Date(lead.createdAt), "MMM d, yyyy")}
                                                    </Badge>
                                                    {!lead.isReadByMerchant && (
                                                        <Badge className="w-fit bg-blue-600 text-white text-[9px] px-1.5 py-0 h-4">New Lead</Badge>
                                                    )}
                                                </div>
                                                {getStatusBadge(lead.status)}
                                            </div>

                                            <div className="flex gap-3">
                                                {lead.product_id ? (
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                        <img
                                                            src={lead.product_id.product_image?.[0] || "/placeholder.png"}
                                                            alt={lead.product_id.product_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : null}
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                        {lead.product_id?.product_name || "Product Removed"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">{lead.name}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-100">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Phone</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                                        <span>{lead.phone}</span>
                                                        <button onClick={() => copyToClipboard(lead.phone)} className="text-gray-400">
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                                                    <p className="text-xs text-gray-700 truncate">{lead.email || "N/A"}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Message</p>
                                                <p className="text-xs text-gray-600 line-clamp-2 italic">"{lead.reason}"</p>
                                            </div>

                                            <div className="pt-2 flex gap-2">
                                                <Select
                                                    value={lead.status}
                                                    onValueChange={(value) => handleStatusUpdate(lead._id, value)}
                                                >
                                                    <SelectTrigger className="flex-1 h-9 text-xs border-2 border-slate-300">
                                                        <SelectValue placeholder="Update Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                        <SelectItem value="Contacted">Contacted</SelectItem>
                                                        <SelectItem value="Closed">Closed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                
                                                {!lead.isReadByMerchant && (
                                                    <button 
                                                        onClick={() => handleMarkAsRead(lead._id)}
                                                        className="flex items-center justify-center px-4 h-9 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 shrink-0"
                                                    >
                                                        Read
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(lead._id)}
                                                    className="flex items-center justify-center px-4 h-9 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="p-4 border-t border-gray-100 bg-white">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        currentPage === 1 && "pointer-events-none opacity-50"
                                                    )}
                                                />
                                            </PaginationItem>

                                            {[...Array(totalPages)].map((_, i) => {
                                                const pageNum = i + 1;
                                                // Show first page, last page, and pages around current page
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <PaginationItem key={pageNum}>
                                                            <PaginationLink
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                isActive={currentPage === pageNum}
                                                                className="cursor-pointer"
                                                            >
                                                                {pageNum}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                }
                                                // Ellipses logic
                                                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                    return (
                                                        <PaginationItem key={pageNum}>
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    );
                                                }
                                                return null;
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        currentPage === totalPages && "pointer-events-none opacity-50"
                                                    )}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                    <div className="text-center mt-2">
                                        <p className="text-[10px] text-gray-400">
                                            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalLeads)} of {totalLeads} leads
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskPriceList;
