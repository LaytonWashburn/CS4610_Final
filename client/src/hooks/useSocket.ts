import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketEvent {
    event: string;
    handler: (data: any) => void;
}

export const useSocket = (events: SocketEvent[] = []) => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const connectSocket = useCallback(() => {
        const socket = io(import.meta.env.SOCKET_URL || 'http://localhost:3000', {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity, // Keep trying to reconnect forever
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        socketRef.current = socket;

        // Update connection state
        socket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);
            setIsReconnecting(false);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        // socket.on('reconnect_attempt', (attemptNumber) => {
        //     console.log('Reconnection attempt:', attemptNumber);
        //     setIsReconnecting(true);
        // });

        // socket.on('reconnect_error', (error) => {
        //     console.error('Reconnection error:', error);
        // });

        // socket.on('reconnect_failed', () => {
        //     console.error('Failed to reconnect');
        //     setIsReconnecting(false);
        // });

        return socket;
    }, []);

    useEffect(() => {
        const socket = connectSocket();

        return () => {
            socket.disconnect();
        };
    }, [connectSocket]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Register event handlers
        events.forEach(({ event, handler }) => {
            socket.on(event, handler);
        });

        // On reconnect, rebind all handlers
        const handleReconnect = () => {
            console.log('Socket reconnected, rebinding handlers');
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
        if (!socketRef.current?.connected) {
            console.log('Socket not connected, attempting to reconnect...');
            socketRef.current?.connect();
        }
        socketRef.current?.emit(event, data);
    }, []);

    const reconnect = useCallback(() => {
        console.log('Manual reconnection requested');
        if (socketRef.current) {
            socketRef.current.connect();
        }
    }, []);

    return {
        socket: socketRef.current,
        emit,
        connected,
        isReconnecting,
        reconnect
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