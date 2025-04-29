import { useState } from 'react';
import { jwtDecode } from "jwt-decode";
import { useSocket } from "../../hooks/useSocket";
import { useNavigate } from 'react-router-dom';

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

interface QueueEntry {
    id: number;
    studentId: number;
    createdAt: string;
    status: string;
}

export const Queue = () => {
    const [formData, setFormData] = useState<QueueFormData>({
        subject: '',
        urgency: 'LOW',
        description: '',
        estimatedTime: 30
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInQueue, setIsInQueue] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [queueHistory, setQueueHistory] = useState<QueueEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isCancelling, setIsCancelling] = useState<number | null>(null);

    const navigate = useNavigate();

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const { socket, emit } = useSocket([
        {
            event: 'session_created',
            handler: (data: { success: boolean, session: Session }) => {
                console.log('Session created:', data);
                navigate(`/dashboard/chat/${data.session.chatRoomId}`);
            }
        },
        {
            event: 'session_ended',
            handler: (data: { success: boolean, navigateTo: string }) => {
                console.log('Session ended:', data);
               if (data.success) {
                navigate(data.navigateTo);
               }
            }
        }
    ]);

    async function joinQueue() {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("User is not logged in");
            setIsSubmitting(false);
            return;
        }
        const decoded = jwtDecode<{ userId: number }>(token);
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

            const queueEntry = await response.json();
            console.log('Joined queue:', queueEntry);
            
            if (socket?.connected) {
                socket.emit('student_enqueue', { studentId: userId, queueEntry: queueEntry.entry });
            }

            setIsInQueue(true);
            setCurrentPosition(queueEntry.position);
            setError(null);
        } catch (error) {
            console.error('Error joining queue:', error);
            setError('Failed to join queue');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function fetchQueueHistory() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("User is not logged in");
            return;
        }
        const decoded = jwtDecode<{ userId: number }>(token);
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
        const decoded = jwtDecode<{ userId: number }>(token);
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

            // If this was the current queue entry, update the queue state
            if (isInQueue && currentPosition !== null) {
                setIsInQueue(false);
                setCurrentPosition(null);
            }
        } catch (error) {
            console.error('Error cancelling queue entry:', error);
            setError('Failed to cancel queue entry');
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 relative">
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
                    </div>
                )}
            </div>

            {/* Queue History Drawer */}
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