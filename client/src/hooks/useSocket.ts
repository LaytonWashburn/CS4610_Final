import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketEvent {
    event: string;
    handler: (data: any) => void;
}

export const useSocket = (events: SocketEvent[] = []) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(process.env.SOCKET_URL || 'http://localhost:3000', {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Set up event listeners
        events.forEach(({ event, handler }) => {
            socketRef.current?.on(event, handler);
        });

        // Cleanup on unmount
        return () => {
            events.forEach(({ event }) => {
                socketRef.current?.off(event);
            });
            socketRef.current?.disconnect();
        };
    }, [events]);

    // Function to emit events
    const emit = useCallback((event: string, data: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    return {
        socket: socketRef.current,
        emit,
        connected: socketRef.current?.connected || false,
    };
}; 