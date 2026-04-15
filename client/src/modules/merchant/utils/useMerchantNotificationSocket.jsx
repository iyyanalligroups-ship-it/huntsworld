import { useEffect, useState, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_IO_URL || 'http://localhost:5000';

export const useMerchantNotificationSocket = () => {
    const { user } = useContext(AuthContext);
    const [unreadCounts, setUnreadCounts] = useState({ askPrice: 0, distributor: 0 });
    const socketRef = useRef(null);

    useEffect(() => {
        // Use userId directly — consistent with how phoneNumberAccessSocket works
        const userId = user?.user?._id;
        if (!userId) return;

        // Disconnect any previous socket before creating a new one
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const socket = io(`${SOCKET_URL}/merchant-notifications`, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            withCredentials: true,
        });

        socketRef.current = socket;

        const joinRoom = () => {
            socket.emit('join-merchant-room', userId.toString());
        };

        socket.on('connect', () => {
            joinRoom();
        });

        // Re-join after reconnection
        socket.on('reconnect', () => {
            joinRoom();
        });

        socket.on('merchant-unread-counts', (counts) => {
            setUnreadCounts({
                askPrice: Number(counts?.askPrice) || 0,
                distributor: Number(counts?.distributor) || 0,
            });
        });

        socket.on('refresh-ask-price-leads', () => {
            // This event is fired when a new lead is created or status changes
            // We can expose a trigger for components to listen to
            window.dispatchEvent(new CustomEvent('refresh-ask-price-leads'));
        });

        socket.on('refresh-distributor-requests', () => {
             window.dispatchEvent(new CustomEvent('refresh-distributor-requests'));
        });

        socket.on('connect_error', (err) => {
            console.error('[useMerchantNotificationSocket] Error:', err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?.user?._id]);   // Re-run only when userId changes

    return { unreadCounts };
};
