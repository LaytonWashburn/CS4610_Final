import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import { jwtDecode } from 'jwt-decode';

interface MyTokenPayload {
    userId: number;
    isTutor: boolean;
}

export const TutorDashboard = () => {
    const [isOnline, setIsOnline] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/signin');
            return;
        }

        const decoded = jwtDecode<MyTokenPayload>(token);
        if (!decoded.isTutor) {
            navigate('/dashboard');
            return;
        }

        // Set tutor online when component mounts
        socket.emit('tutor-status', {
            userId: decoded.userId,
            action: 'online'
        });

        // Join the tutor's specific room using their user ID
        socket.emit('join-room', `tutor-${decoded.userId}`);

        setIsOnline(true);

        // Handle match events
        const handleMatch = (data: { studentId: number, chatRoomId: number }) => {
            console.log("Matched, navigating the tutor");
            navigate(`/dashboard/chat/${data.chatRoomId}`);
        };

        socket.on('match-found', handleMatch);

        // Listen for tutor session requests specific to this tutor's room
        socket.on('tutor-session-request', (data: { studentId: number, tutorId: number, chatRoomId: number }) => {
            console.log('Received tutor session request:', data);
            if (data.tutorId === decoded.userId) {
                navigate(`/dashboard/chat/${data.chatRoomId}`);
            }
        });

        socket.on('test', (data: { message: string }) => {
            console.log('Received test message:', data.message);
        });

        socket.on('match-error', (data: { error: string }) => {
            console.error('Match error:', data.error);
        });

        // Cleanup on unmount
        return () => {
            socket.off('match-found', handleMatch);
            socket.off('tutor-session-request');
            socket.emit('tutor-status', {
                userId: decoded.userId,
                action: 'offline'
            });
        };
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Tutor Dashboard</h2>
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <p className="text-gray-600">Waiting for student matches...</p>
                </div>
            </div>
        </div>
    );
}; 