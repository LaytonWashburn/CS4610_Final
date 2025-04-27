import { useEffect, useState, useRef } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { JwtPayload } from 'jose';
import { io, Socket } from 'socket.io-client';

interface MyTokenPayload {
    userId: number;
}

interface QueueEntry {
    id: number;
    studentId: number;
    createdAt: string;
    status: string;
}

interface QueueFormData {
    subject: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    estimatedTime: number;
}

interface FormErrors {
    subject?: string;
    description?: string;
}

interface TutorAssignedData {
    tutorId: number;
    sessionId: number;
    chatRoomId: number;
}

export const Queue = () => {
    const [queue, setQueue] = useState(false);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [chatRoomId, setChatRoomId] = useState<number | null>(null);
    const [formData, setFormData] = useState<QueueFormData>({
        subject: '',
        urgency: 'LOW',
        description: '',
        estimatedTime: 30
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [queueHistory, setQueueHistory] = useState<QueueEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isInQueue, setIsInQueue] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<number | null>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [tutorId, setTutorId] = useState<number | null>(null);
    const [assignedTutor, setAssignedTutor] = useState<TutorAssignedData | null>(null);
    const navigate = useNavigate();
    const positionPollInterval = useRef<NodeJS.Timeout>();
    const socket = useRef<Socket | null>(null);

    const subjects = [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Computer Science',
        'Engineering',
        'Other'
    ];

    const timeOptions = [15, 30, 45, 60];

    const urgencyColors = {
        HIGH: 'bg-red-100 text-red-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        LOW: 'bg-green-100 text-green-800'
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        if (!formData.subject) {
            errors.subject = 'Please select a subject';
        }
        if (!formData.description.trim()) {
            errors.description = 'Please provide a description of your question';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    async function getQueuePosition() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("User is not logged in");
                return;
            }
            const decoded = jwtDecode<MyTokenPayload>(token);
            const userId = decoded.userId;

            const response = await fetch(`/queue/status?studentId=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to get queue position');
            }
            const data = await response.json();
            setQueuePosition(data.position);
        } catch (error) {
            console.error('Error getting queue position:', error);
            setError('Failed to get queue position');
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    useEffect(() => {
        // Initialize socket connection with more configuration
        const socketUrl =  'http://localhost:3000';
        console.log('Connecting to socket server at:', socketUrl);
        
        socket.current = io(socketUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            transports: ['websocket', 'polling']
        });
        
        // Listen for tutor_available event
        socket.current.on('tutor_available', (data: { tutorId: number, isAvailable: boolean }) => {
            console.log('Tutor availability update:', data);
            if (data.isAvailable) {
                console.log(`Tutor ${data.tutorId} is now available`);
            } else {
                console.log(`Tutor ${data.tutorId} is no longer available`);
            }
        });

        // Socket event listeners with enhanced logging
        socket.current.on('connect', () => {
            console.log('Socket connected successfully. Socket ID:', socket.current?.id);
            console.log('Socket connection state:', socket.current?.connected);
            
            // Only re-emit join_queue if we're in the queue and not already in a session
            if (isInQueue && !assignedTutor) {
                const token = localStorage.getItem('authToken');
                if (token) {
                    const decoded = jwtDecode<MyTokenPayload>(token);
                    console.log('Re-emitting join_queue for existing queue entry. Student ID:', decoded.userId);
                    socket.current?.emit('join_queue', { studentId: decoded.userId });
                }
            }
        });

        socket.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            console.error('Socket connection state:', socket.current?.connected);
        });

        socket.current.on('disconnect', (reason) => {
            console.log('Socket disconnected. Reason:', reason);
            console.log('Socket connection state:', socket.current?.connected);
            // Only attempt to reconnect if the disconnect wasn't intentional
            if (reason !== 'io client disconnect') {
                console.log('Attempting to reconnect...');
                socket.current?.connect();
            }
        });

        socket.current.on('position_update', (data) => {
            console.log('Position update received:', data);
            setCurrentPosition(data.position);
        });

        socket.current.on('tutor_assigned', (data: TutorAssignedData) => {
            console.log('Tutor assigned:', data);
            setAssignedTutor(data);
            setIsInQueue(false);
            // Navigate to chat room
            navigate(`/dashboard/chat/${data.chatRoomId}`);
        });

        socket.current.on('queue_update', (data) => {
            console.log('Queue update received:', data);
            // Handle queue updates if needed
        });

        // Cleanup on unmount
        return () => {
            if (socket.current) {
                console.log('Cleaning up socket connection');
                socket.current.disconnect();
            }
        };
    }, [isInQueue, navigate]); // Add isInQueue and navigate to dependencies to handle reconnection

    async function joinQueue() {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("User is not logged in");
            setIsSubmitting(false);
            return;
        }
        const decoded = jwtDecode<MyTokenPayload>(token);
        const userId = decoded.userId;

        try {
            const response = await fetch('/queue/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: userId,
                    subject: formData.subject,
                    urgency: formData.urgency,
                    description: formData.description,
                    estimatedTime: formData.estimatedTime
                })
            });

            if (!response.ok) {
                throw new Error('Failed to join queue');
            }

            const data = await response.json();
            console.log('Joined queue:', data);
            
            // Emit socket event with connection check
            if (socket.current?.connected) {
                console.log('Socket is connected, emitting join_queue event for student:', userId);
                socket.current.emit('join_queue', { studentId: userId });
            } else {
                console.error('Socket is not connected, cannot emit join_queue event');
                // Attempt to reconnect
                socket.current?.connect();
            }

            setIsInQueue(true);
            setCurrentPosition(data.position);
            setError(null);
        } catch (error) {
            console.error('Error joining queue:', error);
            setError('Failed to join queue');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function leaveQueue() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("User is not logged in");
            return;
        }
        const decoded = jwtDecode<MyTokenPayload>(token);
        const userId = decoded.userId;

        try {
            const response = await fetch('/queue/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: userId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to leave queue');
            }

            // Emit socket event
            if (socket.current) {
                socket.current.emit('leave_queue', { studentId: userId });
                console.log('Emitted leave_queue event');
            }

            setQueue(false);
            setQueuePosition(null);
        } catch (error) {
            console.error('Error leaving queue:', error);
            setError('Failed to leave queue');
        }
    }

    async function fetchQueueHistory() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("User is not logged in");
            return;
        }
        const decoded = jwtDecode<MyTokenPayload>(token);
        const userId = decoded.userId;

        setIsLoadingHistory(true);
        try {
            const response = await fetch(`/queue/entries?studentId=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch queue history');
            }
            const data = await response.json();
            setQueueHistory(data.entries);
        } catch (error) {
            console.error('Error fetching queue history:', error);
            setError('Failed to fetch queue history');
        } finally {
            setIsLoadingHistory(false);
        }
    }

    async function cancelQueueEntry(entryId: number) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("User is not logged in");
            return;
        }
        const decoded = jwtDecode<MyTokenPayload>(token);
        const userId = decoded.userId;

        try {
            const response = await fetch('/queue/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: userId,
                    entryId: entryId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to cancel queue entry');
            }

            // Refresh the queue history
            await fetchQueueHistory();
        } catch (error) {
            console.error('Error cancelling queue entry:', error);
            setError('Failed to cancel queue entry');
        }
    }

    useEffect(() => {
        if (queue) {
            const interval = setInterval(getQueuePosition, 5000);
            return () => clearInterval(interval);
        }
    }, [queue]);

    useEffect(() => {
        if (isInQueue) {
            const token = localStorage.getItem('token');
            if (!token) return;

            const decodedToken = jwtDecode<JwtPayload>(token);
            const studentId = decodedToken.id;

            // Start polling for position updates
            const pollPosition = async () => {
                try {
                    const response = await fetch(`/queue/status?studentId=${studentId}`);
                    const data = await response.json();
                    if (data.position !== currentPosition) {
                        setCurrentPosition(data.position);
                        // If position is 1, show notification
                        if (data.position === 1) {
                            // You can add a notification system here
                            console.log('You are next in line!');
                        }
                    }
                } catch (error) {
                    console.error('Error polling queue position:', error);
                }
            };

            // Poll immediately and then every 10 seconds
            pollPosition();
            positionPollInterval.current = setInterval(pollPosition, 10000);

            return () => {
                if (positionPollInterval.current) {
                    clearInterval(positionPollInterval.current);
                }
            };
        }
    }, [isInQueue, currentPosition]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 relative">
                {/* My Queue Button - Moved inside the main card */}
                <button
                    onClick={() => {
                        setIsDrawerOpen(true);
                        fetchQueueHistory();
                    }}
                    className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                >
                    My Queue
                </button>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {!isInQueue ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Join the Queue</h2>
                            <p className="text-gray-600 mt-2">Fill out the form below to get help from a tutor</p>
                        </div>
                        
                        {/* Subject Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <select
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    formErrors.subject ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Select a subject</option>
                                {subjects.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                            {formErrors.subject && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.subject}</p>
                            )}
                        </div>

                        {/* Urgency Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Urgency Level
                            </label>
                            <div className="flex space-x-4">
                                {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
                                    <label key={level} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="urgency"
                                            value={level}
                                            checked={formData.urgency === level}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className={`ml-2 text-sm px-2 py-1 rounded-full ${urgencyColors[level]}`}>
                                            {level}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Briefly describe your question..."
                            />
                            {formErrors.description && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                            )}
                        </div>

                        {/* Estimated Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Time Needed
                            </label>
                            <select
                                name="estimatedTime"
                                value={formData.estimatedTime}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {timeOptions.map(time => (
                                    <option key={time} value={time}>{time} minutes</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={joinQueue}
                            disabled={isSubmitting}
                            className={`w-full py-4 px-6 text-white font-bold rounded-lg transition-colors duration-200 shadow-md ${
                                isSubmitting 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isSubmitting ? 'Joining Queue...' : 'Join Queue'}
                        </button>
                    </div>
                ) : assignedTutor ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">Tutor Assigned!</h2>
                        <div className="mb-6">
                            <p className="text-gray-600">You are now connected with a tutor.</p>
                            <p className="text-gray-600">Session ID: <span className="font-semibold">{sessionId}</span></p>
                            <p className="text-gray-600">Chat Room ID: <span className="font-semibold">{chatRoomId}</span></p>
                        </div>
                        <button
                            onClick={() => navigate(`/chat/${chatRoomId}`)}
                            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                        >
                            Go to Chat
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">In Queue</h2>
                        <div className="mb-6">
                            <p className="text-gray-600">Your position: <span className="font-semibold">{currentPosition}</span></p>
                            <p className="text-gray-600">Subject: <span className="font-semibold">{formData.subject}</span></p>
                            <p className="text-gray-600">Urgency: 
                                <span className={`ml-2 px-2 py-1 rounded-full ${urgencyColors[formData.urgency]}`}>
                                    {formData.urgency}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={leaveQueue}
                            className="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                        >
                            Leave Queue
                        </button>
                    </div>
                )}
            </div>

            {/* Queue History Drawer - Updated styles */}
            <div 
                className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                    isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ zIndex: 1000 }}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Queue History</h2>
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {isLoadingHistory ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : queueHistory.length === 0 ? (
                        <p className="text-gray-500 text-center">No queue history found</p>
                    ) : (
                        <div className="space-y-4">
                            {queueHistory.map((entry) => (
                                <div key={entry.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </p>
                                            <p className="font-medium">
                                                Status: <span className={`${entry.status === 'WAITING' ? 'text-yellow-600' : entry.status === 'COMPLETED' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {entry.status}
                                                </span>
                                            </p>
                                        </div>
                                        {entry.status === 'WAITING' && (
                                            <button
                                                onClick={() => cancelQueueEntry(entry.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};