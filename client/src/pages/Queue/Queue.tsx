import { useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

interface MyTokenPayload {
    userId: number;
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

export const Queue = () => {
    const [queue, setQueue] = useState(false);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [chatRoomId, setChatRoomId] = useState<number | null>(null);
    const [formData, setFormData] = useState<QueueFormData>({
        subject: '',
        urgency: 'MEDIUM',
        description: '',
        estimatedTime: 15
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    async function getQueuePosition() {
        try {
            const response = await fetch('/queue/status');
            if (!response.ok) {
                throw new Error('Failed to get queue position');
            }
            const data = await response.json();
            setQueuePosition(data.queueLength);
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
            const response = await fetch('/queue/join/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: userId,
                    ...formData
                })
            });

            if (!response.ok) {
                throw new Error('Failed to join queue');
            }

            const body = await response.json();
            setQueue(true);
            setChatRoomId(body.result.chatRoomId);
            navigate(`/dashboard/chat/${body.result.chatRoomId}`);
        } catch (error) {
            console.error('Error joining queue:', error);
            setError('Failed to join queue');
        } finally {
            setIsSubmitting(false);
        }
    }

    useEffect(() => {
        if (queue) {
            const interval = setInterval(getQueuePosition, 5000);
            return () => clearInterval(interval);
        }
    }, [queue]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {!queue ? (
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
                ) : (
                    <div className="text-center">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">In Queue</h2>
                            <div className="mt-4 space-y-2">
                                <p className="text-gray-600">Your position: <span className="font-semibold">{queuePosition}</span></p>
                                <p className="text-gray-600">Subject: <span className="font-semibold">{formData.subject}</span></p>
                                <p className="text-gray-600">Urgency: 
                                    <span className={`ml-2 px-2 py-1 rounded-full ${urgencyColors[formData.urgency]}`}>
                                        {formData.urgency}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="animate-pulse">
                            <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto mt-2"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};