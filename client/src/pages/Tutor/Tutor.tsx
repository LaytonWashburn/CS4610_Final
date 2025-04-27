import { useEffect, useRef, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import { io, Socket } from 'socket.io-client';

interface MyTokenPayload {
    userId: number;
}

interface StudentData {
    studentId: number;
    subject: string;
    urgency: string;
    description: string;
    estimatedTime: number;
}

export const Tutor = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [currentStudent, setCurrentStudent] = useState<StudentData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const socket = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize socket connection
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
        console.log('Tutor connecting to socket server at:', socketUrl);
        
        socket.current = io(socketUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        // Socket event listeners
        socket.current.on('connect', () => {
            console.log('Tutor socket connected successfully. Socket ID:', socket.current?.id);
            setIsConnected(true);
            
            // Get tutor ID from token
            const token = localStorage.getItem('authToken');
            if (token) {
                const decoded = jwtDecode<MyTokenPayload>(token);
                console.log('Tutor ID:', decoded.userId);
                // Register as available tutor
                socket.current?.emit('tutor_available', { tutorId: decoded.userId });
            }
        });

        socket.current.on('connect_error', (error) => {
            console.error('Tutor socket connection error:', error);
            setError('Failed to connect to server');
        });

        socket.current.on('disconnect', (reason) => {
            console.log('Tutor socket disconnected. Reason:', reason);
            setIsConnected(false);
            if (reason !== 'io client disconnect') {
                console.log('Attempting to reconnect...');
                socket.current?.connect();
            }
        });

        socket.current.on('student_assigned', (data: StudentData) => {
            console.log('Student assigned to tutor:', data);
            setCurrentStudent(data);
        });

        // Cleanup on unmount
        return () => {
            if (socket.current) {
                console.log('Cleaning up tutor socket connection');
                socket.current.disconnect();
            }
        };
    }, []);

    const handleAcceptStudent = () => {
        if (!currentStudent) return;
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("Tutor is not logged in");
            return;
        }
        const decoded = jwtDecode<MyTokenPayload>(token);
        const tutorId = decoded.userId;

        // Create a session and chat room
        const sessionId = Math.floor(Math.random() * 1000000); // Temporary solution
        const chatRoomId = Math.floor(Math.random() * 1000000); // Temporary solution

        // Notify the student
        socket.current?.emit('tutor_assigned', {
            studentId: currentStudent.studentId,
            tutorId: tutorId,
            sessionId: sessionId,
            chatRoomId: chatRoomId
        });

        console.log(`Tutor ${tutorId} accepted student ${currentStudent.studentId}`);
        console.log(`Created session ${sessionId} and chat room ${chatRoomId}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Tutor Dashboard</h2>
                
                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <p className="text-gray-600">
                        Status: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </p>
                </div>

                {currentStudent ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-700">Current Student</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p><span className="font-medium">Student ID:</span> {currentStudent.studentId}</p>
                            <p><span className="font-medium">Subject:</span> {currentStudent.subject}</p>
                            <p><span className="font-medium">Urgency:</span> {currentStudent.urgency}</p>
                            <p><span className="font-medium">Description:</span> {currentStudent.description}</p>
                            <p><span className="font-medium">Estimated Time:</span> {currentStudent.estimatedTime} minutes</p>
                        </div>
                        <button
                            onClick={handleAcceptStudent}
                            className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                        >
                            Accept Student
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center">Waiting for student assignment...</p>
                )}
            </div>
        </div>
    );
}; 