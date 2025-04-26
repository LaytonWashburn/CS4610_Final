import { useEffect, useState } from 'react';
import { socket } from "../../socket.ts"
import { jwtDecode } from "jwt-decode";
import { ChatInterface } from '../../components/Chat/ChatInterface';
import { useNavigate } from 'react-router-dom';

interface MyTokenPayload {
    userId: number;
}

interface Tutor {
    id: number;
    user: {
        firstName: string;
        lastName: string;
    };
}

export const Queue = () => {
    const [queue, setQueue] = useState(false);
    const [matched, setMatched] = useState(false);
    const [tutor, setTutor] = useState<Tutor | null>(null);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [showChat, setShowChat] = useState(false);
    const navigate = useNavigate();

    async function getTutorInfo(id: number | string) {
        try {
            const response = await fetch(`/tutor/tutors/${id}`);
            const body = await response.json();
            return body.tutor;
        } catch (error) {
            console.error(`Error getting tutor info: ${error}`);
            return null;
        }
    }

    async function getQueuePosition() {
        try {
            const response = await fetch('/queue/status');
            const data = await response.json();
            setQueuePosition(data.queueLength);
        } catch (error) {
            console.error('Error getting queue position:', error);
        }
    }

    async function joinQueue() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("User is not logged in");
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
                    studentId: userId
                })
            });

            const body = await response.json();
            setQueue(body.result.queue);
            setMatched(body.result.matched);
            
            if (body.result.matched && body.result.tutor) {
                const tutorInfo = await getTutorInfo(body.result.tutor.id);
                setTutor(tutorInfo);
                setShowChat(true);
                navigate(`/chat/${tutorInfo.id}`);
            } else if (body.result.queue) {
                getQueuePosition();
            }
        } catch (error) {
            console.error('Error joining queue:', error);
        }
    }

    useEffect(() => {
        if (queue && !matched) {
            const interval = setInterval(getQueuePosition, 5000);
            return () => clearInterval(interval);
        }
    }, [queue, matched]);

    // Listen for match events from socket
    useEffect(() => {
        const handleMatch = async (data: { tutorId: number }) => {
            const tutorInfo = await getTutorInfo(data.tutorId);
            setTutor(tutorInfo);
            setMatched(true);
            setQueue(false);
            setShowChat(true);
            navigate(`/chat/${tutorInfo.id}`);
        };

        socket.on('match-found', handleMatch);

        return () => {
            socket.off('match-found', handleMatch);
        };
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                {!queue && !matched && (
                    <button
                        onClick={joinQueue}
                        className="w-full py-4 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
                    >
                        Join Queue
                    </button>
                )}

                {queue && !matched && (
                    <div className="text-center">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">In Queue</h2>
                            <p className="text-gray-600">Your position in queue: {queuePosition}</p>
                        </div>
                        <div className="animate-pulse">
                            <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto mt-2"></div>
                        </div>
                    </div>
                )}

                {matched && tutor && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Connected with Tutor {tutor.user.firstName} {tutor.user.lastName}
                        </h2>
                        {showChat && (
                            <div className="mt-4">
                                <ChatInterface tutorId={tutor.id} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};