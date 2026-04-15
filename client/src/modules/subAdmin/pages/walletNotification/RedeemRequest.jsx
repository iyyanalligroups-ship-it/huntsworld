import { useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useGetAllRedeemRequestsQuery, useSendRedeemAmountMutation } from '@/redux/api/couponsNotificationApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const socket = io(import.meta.env.VITE_SOCKET_IO_URL,{
  withCredentials: true,
  transports: ["websocket"],
});

const RedeemRequest = () => {
    const { user } = useContext(AuthContext)
    const userId=user?.user?._id;
    const { isSidebarOpen } = useSidebar();
    const [requests, setRequests] = useState([]);
    const { data, isLoading, isError } = useGetAllRedeemRequestsQuery({ userId });
    const [sendRedeemAmount, { isLoading: sendLoading }] = useSendRedeemAmountMutation();

    useEffect(() => {
        socket.emit('join', userId);

        if (data?.notifications) {
            setRequests(data.notifications);
        }
    }, [data, userId]);

    useEffect(() => {
        socket.on('newRedemption', (notification) => {
            setRequests((prev) => [notification, ...prev]);
        });

        socket.on('notificationUpdated', (updatedNotification) => {
            setRequests((prev) =>
                prev.map((n) =>
                    n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n
                )
            );
        });

        return () => {
            socket.off('newRedemption');
            socket.off('notificationUpdated');
        };
    }, []);

    const handleComplete = async (notificationId,recieverId) => {
        console.log("Sending to backend:", { notificationId, recieverId }); // <--- Add this
        try {
            await sendRedeemAmount({ notificationId, recieverId }).unwrap();
            showToast('Redemption marked as completed', 'success');
        } catch (error) {
            showToast(error.data?.message || 'Failed to complete redemption', 'error');
        }
    };

    console.log(requests, "req");


    return (
        <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'} transition-all duration-300`}>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Merchant</TableHead>
                                    <TableHead>Coupon</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount Sent</TableHead>
                                    <TableHead>Read By</TableHead> {/* ✅ NEW COLUMN */}
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request._id}>
                                        <TableCell>{request?.redeemedBy?.name}</TableCell>
                                        <TableCell>{request.couponName}</TableCell>
                                        <TableCell>{request.redeemPointsId.redeem_point}</TableCell>
                                        <TableCell>{request.redeemPointsId.reason}</TableCell>
                                        <TableCell>{request.notes || 'N/A'}</TableCell>

                                        {/* isRead Status */}
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${String(request?.isRead) === 'true' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {String(request?.isRead) === 'true' ? 'Read' : 'Unread'}
                                            </span>

                                        </TableCell>

                                        {/* Amount Sent Status */}
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${request.amount_sent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {request.amount_sent ? 'Sent' : 'Pending'}
                                            </span>
                                        </TableCell>

                                        {/* Read By List */}
                                        <TableCell>
                                            {request.readBy && request.readBy.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {request.readBy.map((reader, index) => (
                                                        <span
                                                            key={index}
                                                            className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium"
                                                        >
                                                            {reader.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                                                    No Readers
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Complete Button */}
                                        <TableCell>
                                            {!request.amount_sent && (
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-[#0c1f4d] text-white text-sm py-2 rounded hover:bg-[#0c1f4dd0] transition cursor-pointer"
                                                    onClick={() => handleComplete(request._id,request.redeemPointsId.user_id._id)}
                                                    disabled={sendLoading}
                                                >
                                                    {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>

                        </Table>

                    ) : (
                        <p className="text-sm text-muted-foreground">No redeem requests</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default RedeemRequest;