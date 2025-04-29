import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { jwtDecode } from 'jwt-decode';

interface Session {
    id: number;
    studentId: number;
    tutorId: number;    
    subject: string;
    urgency: string;
    description: string;
    estimatedTime: number;
    status: string;
    chatRoomId: number;
    name: string;   
}

interface MyTokenPayload {
    userId: number;
    isTutor: boolean;
    firstName: string;
    lastName: string;
}

interface StudentRequest {
    studentId: number;
    subject: string;
    urgency: string;
    description: string;
    estimatedTime: number;
    studentName: string;
}

interface Tutor {
    id: number;
    firstName: string;
    lastName: string;
}

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

interface QueueEntry {
    id: number;
    studentId: number;
    subject: string;
    urgency: string;
    description: string;    
    estimatedTime: number;
    position: number;
    queueEntryId: number;
}

export const TutorDashboard = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<StudentRequest | null>(null);
    const [tutorName, setTutorName] = useState<{firstName: string, lastName: string} | null>(null);
    const navigate = useNavigate();


    const { socket, emit } = useSocket([
        {
            event: 'student_waiting',
            handler: (data: { tutor: Tutor, student: Student, queueEntry: QueueEntry }) => {
                console.log('Student waiting:', data);
                setCurrentRequest({
                    studentId: data.student.id,     
                    subject: data.queueEntry.subject,
                    urgency: data.queueEntry.urgency,
                    description: data.queueEntry.description,
                    estimatedTime: data.queueEntry.estimatedTime,
                    studentName: `${data.student.firstName} ${data.student.lastName}`,
                    queueEntryId: data.queueEntry.id,
                    position: data.queueEntry.position
                });
                setShowRequestModal(true);
            }
        },
        {
            event: 'session_created',
            handler: (data: { success: boolean, session: Session }) => {
                console.log('Session created:', data);
                navigate(`/dashboard/chat/${data.session.chatRoomId}`);
            }
        }
    ]);

    // Log socket connection status and set tutor as available
    useEffect(() => {
        if (socket) {
            console.log('Socket connected, setting tutor as available');
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

            setTutorName({
                firstName: decoded.firstName,
                lastName: decoded.lastName
            });

            // Set tutor as available
            emit('tutor_available', {
                tutorId: decoded.userId,
                isAvailable: true
            });
            setIsOnline(true);

            // Cleanup on unmount
            return () => {
                console.log('Cleaning up tutor socket');
                emit('tutor_available', {
                    tutorId: decoded.userId,
                    isAvailable: false
                });
                setIsOnline(false);
            };
        }
    }, [socket, emit]);

    const handleAccept = async () => {
        if (!currentRequest || !tutorName) return;
        
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const decoded = jwtDecode<MyTokenPayload>(token);
        
        console.log('Tutor accepted student, emitting tutor_assigned event:', currentRequest);

        // Emit tutor_assigned event with the student data
        emit('tutor_assigned', {
            studentId: currentRequest.studentId,
            tutorId: decoded.userId,
            subject: currentRequest.subject,
            urgency: currentRequest.urgency,
            description: currentRequest.description,
            estimatedTime: currentRequest.estimatedTime,
            studentName: currentRequest.studentName,
            queueEntryId: currentRequest.queueEntryId,
            position: currentRequest.position
        });

        

        // // Listen for the response with chat room ID
        // socket.on('tutor_assigned', async (response: { chatRoomId: number }) => {
        //     console.log('Tutor accepted student, navigating to chat room:', response.chatRoomId);
            
        //     // Send greeting message using the REST API
        //     try {
        //         const messageResponse = await fetch('/chat/messages', {
        //             method: 'POST',
        //             headers: {
        //                 'Content-Type': 'application/json',
        //             },
        //             body: JSON.stringify({
        //                 content: `Hello ${currentRequest.studentName}, I'm ${tutorName.firstName} ${tutorName.lastName}, I see you're working on ${currentRequest.subject}. How can I help you today?`,
        //                 chatRoomId: response.chatRoomId,
        //                 senderId: decoded.userId
        //             }),
        //         });

        //         if (!messageResponse.ok) {
        //             throw new Error('Failed to send greeting message');
        //         }
        //     } catch (error) {
        //         console.error('Error sending greeting message:', error);
        //     }
            
        //     navigate(`/dashboard/chat/${response.chatRoomId}`);
        // });

        // setShowRequestModal(false);
        // setCurrentRequest(null);
    };

    const handleReject = () => {
        setShowRequestModal(false);
        setCurrentRequest(null);
    };

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

            {/* Student Request Modal */}
            {showRequestModal && currentRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">New Student Request</h3>
                        <div className="space-y-3">
                            <p><span className="font-semibold">Student:</span> {currentRequest.studentName}</p>
                            <p><span className="font-semibold">Subject:</span> {currentRequest.subject}</p>
                            <p><span className="font-semibold">Urgency:</span> {currentRequest.urgency}</p>
                            <p><span className="font-semibold">Description:</span> {currentRequest.description}</p>
                            <p><span className="font-semibold">Estimated Time:</span> {currentRequest.estimatedTime} minutes</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleAccept}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 