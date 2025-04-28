import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketEvent {
    event: string;
    handler: (data: any) => void;
}

export const useSocket = (events: SocketEvent[] = []) => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = io(import.meta.env.SOCKET_URL || 'http://localhost:3000', {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Update connection state
        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Register event handlers
        events.forEach(({ event, handler }) => {
            socket.on(event, handler);
        });

        // On reconnect, rebind all handlers
        const handleReconnect = () => {
            events.forEach(({ event, handler }) => {
                socket.on(event, handler);
            });
        };
        socket.on('reconnect', handleReconnect);

        return () => {
            // Clean up handlers
            events.forEach(({ event, handler }) => {
                socket.off(event, handler);
            });
            socket.off('reconnect', handleReconnect);
        };
    }, [events]);

    const emit = useCallback(<T = any>(event: string, data: T) => {
        socketRef.current?.emit(event, data);
    }, []);

    return {
        socket: socketRef.current,
        emit,
        connected,
    };
};


// import { useEffect, useRef, useCallback, useState } from 'react';
// import { io, Socket } from 'socket.io-client';

// interface SocketEvent {
//     event: string;
//     handler: (data: any) => void;
// }

// export const useSocket = (events: SocketEvent[] = []) => {
//     const socketRef = useRef<Socket | null>(null);
//     const [connected, setConnected] = useState(false);

//     useEffect(() => {
//         const socket = io(import.meta.env.SOCKET_URL || 'http://localhost:3000', {
//             autoConnect: true,
//             reconnection: true,
//             reconnectionAttempts: 5,
//             reconnectionDelay: 1000,
//         });

//         socketRef.current = socket;

//         // Update connection state
//         socket.on('connect', () => setConnected(true));
//         socket.on('disconnect', () => setConnected(false));

//         return () => {
//             socket.disconnect();
//         };
//     }, []);

//     useEffect(() => {
//         const socket = socketRef.current;
//         if (!socket) return;

//         // Register event handlers
//         events.forEach(({ event, handler }) => {
//             socket.on(event, handler);
//         });

//         // On reconnect, rebind all handlers
//         const handleReconnect = () => {
//             events.forEach(({ event, handler }) => {
//                 socket.on(event, handler);
//             });
//         };
//         socket.on('reconnect', handleReconnect);

//         return () => {
//             // Clean up handlers
//             events.forEach(({ event, handler }) => {
//                 socket.off(event, handler);
//             });
//             socket.off('reconnect', handleReconnect);
//         };
//     }, [events]);

//     const emit = useCallback(<T = any>(event: string, data: T) => {
//         socketRef.current?.emit(event, data);
//     }, []);

//     return {
//         socket: socketRef.current,
//         emit,
//         connected,
//     };
// };


// import { useEffect, useRef, useCallback } from 'react';
// import { io, Socket } from 'socket.io-client';

// interface SocketEvent {
//     event: string;
//     handler: (data: any) => void;
// }

// export const useSocket = (events: SocketEvent[] = []) => {
//     const socketRef = useRef<Socket | null>(null);

//     useEffect(() => {
//         // Initialize socket connection
//         socketRef.current = io(process.env.SOCKET_URL || 'http://localhost:3000', {
//             autoConnect: true,
//             reconnection: true,
//             reconnectionAttempts: 5,
//             reconnectionDelay: 1000,
//         });

//         // Set up event listeners
//         events.forEach(({ event, handler }) => {
//             socketRef.current?.on(event, handler);
//         });

//         // Cleanup on unmount
//         return () => {
//             events.forEach(({ event }) => {
//                 socketRef.current?.off(event);
//             });
//             socketRef.current?.disconnect();
//         };
//     }, [events]);

//     // Function to emit events
//     const emit = useCallback((event: string, data: any) => {
//         socketRef.current?.emit(event, data);
//     }, []);

//     return {
//         socket: socketRef.current,
//         emit,
//         connected: socketRef.current?.connected || false,
//     };
// }; 