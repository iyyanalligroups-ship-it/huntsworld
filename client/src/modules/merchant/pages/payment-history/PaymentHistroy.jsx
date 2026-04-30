import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { Eye, Loader2, Receipt, CreditCard, Download, FileText, Info } from 'lucide-react';
import showToast from '@/toast/showToast';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import the function explicitly
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import Loader from '@/loader/Loader';

const PaymentHistory = () => {
    const { user } = useContext(AuthContext);
    const userId = user?.user?._id;

    const [history, setHistory] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { isSidebarOpen } = useSidebar();
    const fetchHistory = async (page) => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/payment-history/payment-history/${userId}`, {
                params: { page, limit: pagination.limit }
            });
            const { data, pagination: pag } = response.data;
            setHistory(data);
            setPagination((prev) => ({ ...prev, ...pag, page }));
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch history', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(pagination.page);
    }, [pagination.page, userId]);

    const formatCurrency = (amount) => {
        if (amount == null) return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(0);
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount / 100);
    };

    const getStatusVariant = (status) => {
        const s = status?.toLowerCase();
        if (s === 'paid' || s === 'captured' || s === 'success') return 'default';
        if (s === 'pending') return 'outline';
        return 'destructive';
    };

    const getDetailedDesc = (p) => {
        if (p.payment_type === 'subscription') return p.subscription_plan_id?.plan_name || 'Subscription';
        if (p.payment_type === 'banner') return p.banner_id?.title || 'Banner Ad';
        if (p.payment_type === 'e_book') return p.ebook_id?.title || 'E-Book';
        if (p.payment_type === 'trust_seal') return 'Trust Seal';
        if (p.payment_type === 'trending_point') return 'Trending Points';
        return p.payment_type;
    };

    const formatNotes = (notes) => {
        if (!notes) return 'N/A';
        try {
            // Check if it's a JSON string (starts with { and ends with })
            if (typeof notes === 'string' && notes.trim().startsWith('{') && notes.trim().endsWith('}')) {
                const parsed = JSON.parse(notes);
                if (parsed.description) return parsed.description;
                // If it's JSON but no description, maybe return a cleaned up version or the original
                return notes;
            }
            return notes;
        } catch (e) {
            return notes;
        }
    };

    // --- PDF Export Logic ---
    const exportToPDF = (p) => {
        const doc = new jsPDF();

        // 1. Company Branding
        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text('HUNTSWORLD', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('www.huntsworld.com', 14, 26);

        doc.setDrawColor(200);
        doc.line(14, 30, 196, 30);

        // 2. Bill To Section
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('BILL TO:', 14, 40);

        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`${p.user_id?.name || 'Customer'}`, 14, 46);
        doc.text(`Email: ${p.user_id?.email || 'N/A'}`, 14, 51);
        doc.text(`Phone: ${p.user_id?.phone || 'N/A'}`, 14, 56);

        // 3. Invoice Header Info
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('INVOICE / PAYMENT RECEIPT', 14, 70);

        doc.setFontSize(10);
        doc.text(`Receipt No: ${p.receipt}`, 14, 80);
        doc.text(`Date: ${new Date(p.paid_at).toLocaleString('en-IN')}`, 14, 86);
        doc.text(`Status: ${p.status.toUpperCase()}`, 14, 92);

        // 4. FIXING THE MATH: Manual calculation for the PDF
        const subtotal = p.amount / 100; // 1000.00
        const tax = p.gst_amount / 100;  // 180.00
        const grandTotal = subtotal + tax; // This will result in 1180.00

        const tableData = [
            ['Description', getDetailedDesc(p)],
            ['Payment Type', p.payment_type.toUpperCase()],
            ['Transaction ID', p.razorpay_payment_id || 'N/A'],
            ['Order ID', p.razorpay_order_id],
            ['Base Amount (Excl. GST)', `INR ${subtotal.toFixed(2)}`],
            ['GST Percentage', `${p.gst_percentage}%`],
            ['GST Amount', `INR ${tax.toFixed(2)}`],
        ];

        autoTable(doc, {
            startY: 100,
            head: [['Field', 'Details']],
            body: tableData,
            // Using the manually calculated total here
            foot: [['TOTAL AMOUNT (Incl. GST)', `INR ${grandTotal.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }, // Blue Header
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 11 },
            styles: { cellPadding: 5, fontSize: 10 }
        });

        // 5. Notes Section
        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text('Notes:', 14, finalY + 15);
        doc.setFontSize(10);
        doc.setTextColor(80);

        const formattedNotes = formatNotes(p.notes);
        const splitNotes = doc.splitTextToSize(formattedNotes, 180);
        doc.text(splitNotes, 14, finalY + 22);

        // 6. Footer
        doc.setFontSize(9);
        doc.setTextColor(150);
        const footerY = doc.internal.pageSize.height - 10;
        doc.text('This is a computer-generated receipt and does not require a physical signature.', 14, footerY);

        doc.save(`Huntsworld_Invoice_${p.razorpay_payment_id || p.receipt}.pdf`);
        showToast('Invoice downloaded successfully', 'success');
    };
    // --- Sub-component: Detail Content ---
    const PaymentDetails = ({ p }) => (
        <div className="space-y-4 py-2">
            <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border">
                <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Method</p>
                    <p className="text-sm font-medium">{p.payment_method || 'Razorpay'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4">
                <div>
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-mono break-all">{p.razorpay_order_id}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Payment ID</p>
                    <p className="font-mono break-all text-blue-600">{p.razorpay_payment_id}</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                    <span>Amount</span>
                    <span>{formatCurrency(p.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>GST ({p.gst_percentage}%)</span>
                    <span>{formatCurrency(p.gst_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg pt-1">
                    <span>Total Paid</span>
                    <span className="text-primary">{formatCurrency(p.total_amount)}</span>
                </div>
            </div>

            <div className="text-[11px] space-y-1 bg-muted/20 p-2 rounded">
                <p><strong>Paid At:</strong> {new Date(p.paid_at).toLocaleString()}</p>
                <p><strong>Receipt:</strong> {p.receipt}</p>
                <p><strong>Notes:</strong> {formatNotes(p.notes)}</p>
            </div>

            <Button className="w-full mt-2" onClick={() => exportToPDF(p)}>
                <Download className="w-4 h-4 mr-2" /> Download Invoice (PDF)
            </Button>
        </div>
    );

    return (
        <div className={`${isSidebarOpen ? ' lg:ml-52' : ' lg:ml-16'}`}>
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-36 font-bold inline-block mb-2 md:mb-6">
                            Billing History
                        </h1>
                        <p className="text-muted-foreground">Manage your invoices and payment records.</p>
                    </div>

                    {/* SOP Info Box - Integrated into the header area */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md max-w-md">
                        <div className="flex items-center gap-2 mb-1">
                            <Info className="w-4 h-4 text-blue-700" />
                            <span className="font-bold text-sm text-blue-800">Quick Guide (SOP)</span>
                        </div>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• <strong>View:</strong> Click the eye icon to see a full breakdown.</li>
                            <li>• <strong>Download:</strong> Use the download icon to save your PDF invoice.</li>
                            <li>• <strong>Status:</strong> Check the "Status" column for real-time payment updates.</li>
                        </ul>
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block border rounded-lg shadow-sm">
                            <Table>
                                <TableHeader className="bg-[#0c1f4d] hover:bg-[#0e2d75]">
                                    <TableRow>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Payment Type</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Description</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Amount</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Status</TableHead>
                                        <TableHead className="text-left text-xs sm:text-sm text-white">Date</TableHead>
                                        <TableHead className="text-center text-xs sm:text-sm text-white">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((p) => (
                                        <TableRow key={p._id} className="hover:bg-gray-50">
                                            <TableCell className="capitalize font-semibold text-blue-600">{p.payment_type}</TableCell>
                                            <TableCell>{getDetailedDesc(p)}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(p.total_amount)}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(p.status)}>{p.status}</Badge></TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {/* Action: View Details */}
                                                <Button
                                                    size="icon"
                                                    title="View Details"
                                                    className="cursor-pointer"
                                                    variant="outline"
                                                    onClick={() => { setSelectedPayment(p); setIsDialogOpen(true); }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {/* Action: Download Invoice */}
                                                <Button
                                                    size="icon"
                                                    title="Download Invoice"
                                                    className="cursor-pointer"
                                                    variant="ghost"
                                                    onClick={() => exportToPDF(p)}
                                                >
                                                    <Download className="w-4 h-4 text-gray-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile UI (Cards) */}
                        <div className="md:hidden space-y-4">
                            {history.map((p) => (
                                <Card key={p._id} className="border-l-4 border-l-[#0c1f4d]">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between">
                                            <Badge variant="secondary">{p.payment_type}</Badge>
                                            <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge>
                                        </div>
                                        <CardTitle className="text-sm mt-2">{getDetailedDesc(p)}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 flex justify-between items-center">
                                        <span className="font-bold">{formatCurrency(p.total_amount)}</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => exportToPDF(p)}>Invoice</Button>
                                            <Button size="sm" onClick={() => { setSelectedPayment(p); setIsDialogOpen(true); }}>Details</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination className="justify-end mt-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        className="cursor-pointer"
                                        onClick={() => pagination.page > 1 && setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    />
                                </PaginationItem>
                                <PaginationItem><PaginationLink isActive>{pagination.page}</PaginationLink></PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        className="cursor-pointer"
                                        onClick={() => pagination.page < pagination.totalPages && setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </>
                )}

                {/* Transaction Detail Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#0c1f4d]" />
                                Transaction Details
                            </DialogTitle>
                            <DialogDescription>Full breakdown of your payment processing.</DialogDescription>
                        </DialogHeader>
                        {selectedPayment && <PaymentDetails p={selectedPayment} />}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default PaymentHistory;
