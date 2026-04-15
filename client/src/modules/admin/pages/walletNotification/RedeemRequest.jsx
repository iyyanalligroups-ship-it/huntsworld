
import { useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useGetAllRedeemRequestsQuery, useSendRedeemAmountMutation } from '@/redux/api/couponsNotificationApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import { Loader2 ,Send,Calculator,WalletCards} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthContext } from '@/modules/landing/context/AuthContext';

const socket = io(import.meta.env.VITE_SOCKET_IO_URL, {
    withCredentials: true,
    transports: ['websocket'],
});

const RedeemRequest = () => {
    const { user } = useContext(AuthContext);
    const userId = user?.user?._id;
    const { isSidebarOpen } = useSidebar();
    const [requests, setRequests] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 5; // 5 items per page
    const { data, isLoading, isError, refetch } = useGetAllRedeemRequestsQuery({ userId, page: currentPage, limit });
    const [sendRedeemAmount, { isLoading: sendLoading }] = useSendRedeemAmountMutation();

    useEffect(() => {
        socket.emit('join', userId);

        if (data?.notifications) {
            setRequests(data.notifications);
        }
    }, [data, userId]);

    useEffect(() => {
        socket.on('newRedemption', (notification) => {
            console.log('New redemption received:', notification);
            setRequests((prev) => [notification, ...prev].slice(0, limit));
            refetch(); // Refetch to ensure sync with backend
        });

        socket.on('notificationUpdated', (updatedNotification) => {
            console.log('Notification updated:', updatedNotification);
            setRequests((prev) =>
                prev.map((n) =>
                    n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n
                )
            );
            refetch(); // Refetch to sync with backend
        });

        socket.on('pointsUpdated', ({ view_points }) => {
            console.log('Points updated:', view_points);
            showToast(`Points updated: ${view_points} remaining`, 'info');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            showToast('Failed to connect to notification server', 'error');
        });

        return () => {
            socket.off('newRedemption');
            socket.off('notificationUpdated');
            socket.off('pointsUpdated');
            socket.off('connect_error');
        };
    }, [refetch]);

    const handleComplete = async (notificationId, receiverId, fullObject) => {
        console.log('Sending to backend:', { notificationId, receiverId, fullObject });
        try {
            await sendRedeemAmount({ notificationId, receiverId }).unwrap();
            showToast('Redemption marked as completed', 'success');
            refetch(); // Refetch after completing redemption
        } catch (error) {
            console.error('Complete redemption error:', error);
            showToast(error.data?.message || 'Failed to complete redemption', 'error');
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        refetch();
    };
    const getAvatarColor = (name) => {
        const colors = [
            "bg-red-100 text-red-700",
            "bg-blue-100 text-blue-700",
            "bg-green-100 text-green-700",
            "bg-yellow-100 text-yellow-700",
            "bg-purple-100 text-purple-700",
            "bg-pink-100 text-pink-700",
            "bg-orange-100 text-orange-700"
        ];
        if (!name) return colors[0];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };
    return (
        <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'} transition-all duration-300`}>
            {/* ---------------------------------------------------------------------------
            LEFT PANEL: SETTLEMENT SOP
           --------------------------------------------------------------------------- */}

            <Card>
                <CardHeader>
                    <CardTitle>Redeem Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="ml-2">Loading redeem requests...</p>
                        </div>
                    ) : isError ? (
                        <p className="text-red-500">Failed to load redeem requests</p>
                    ) : requests.length > 0 ? (
                        <>
                        
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Merchant</TableHead>
                                        <TableHead>Coupon</TableHead>
                                        <TableHead>Points</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Amount Sent</TableHead>
                                        <TableHead>Read By</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request._id}>
                                            {/* ✅ Merchant with avatar */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar>
                                                        <AvatarFallback className={`${getAvatarColor(request?.redeemedBy?.name)} font-medium`}>
                                                            {request?.redeemedBy?.name?.charAt(0).toUpperCase() || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-gray-800">
                                                        {request?.redeemedBy?.name || "N/A"}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Coupon Name */}
                                            <TableCell>{request.couponName || "N/A"}</TableCell>

                                            {/* Points */}
                                            <TableCell>{request?.redeemPointsId?.redeem_point || "N/A"}</TableCell>

                                            {/* Reason */}
                                            <TableCell>{request?.redeemPointsId?.reason || "N/A"}</TableCell>

                                            {/* Amount Sent Badge */}
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${request.amount_sent
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {request.amount_sent ? "Sent" : "Pending"}
                                                </span>
                                            </TableCell>

                                            {/* Read By Avatars */}
                                            <TableCell>
                                                {request.readBy && request.readBy.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {request.readBy.map((reader, index) => (
                                                            <Avatar key={index} className="h-6 w-6">
                                                                <AvatarFallback
                                                                    className={`${getAvatarColor(reader.name)} text-xs font-medium`}
                                                                >
                                                                    {reader.name?.charAt(0).toUpperCase() || "?"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                                        No Readers
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Action Button */}
                                            <TableCell>
                                                {!request.amount_sent && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#0c1f4d] text-white text-sm rounded hover:bg-[#0c1f4dd0] transition flex items-center gap-2"
                                                        onClick={() =>
                                                            handleComplete(
                                                                request._id,
                                                                request?.redeemPointsId?.user_id?._id,
                                                                request
                                                            )
                                                        }
                                                        disabled={sendLoading}
                                                    >
                                                        {sendLoading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            "Complete"
                                                        )}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className='float-right'>
                                {data?.pagination && (
                                    <Pagination className="mt-4 ">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
                                                    disabled={currentPage === 1}
                                                />
                                            </PaginationItem>
                                            {[...Array(data.pagination.totalPages)].map((_, index) => (
                                                <PaginationItem key={index + 1}>
                                                    <PaginationLink
                                                        href="#"
                                                        isActive={currentPage === index + 1}
                                                        onClick={() => handlePageChange(index + 1)}
                                                    >
                                                        {index + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={() =>
                                                        handlePageChange(
                                                            currentPage < data.pagination.totalPages ? currentPage + 1 : currentPage
                                                        )
                                                    }
                                                    disabled={currentPage === data.pagination.totalPages}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">No redeem requests</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default RedeemRequest;
