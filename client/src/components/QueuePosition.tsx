import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

interface QueuePositionProps {
    studentId: number;
}

export const QueuePosition = ({ studentId }: QueuePositionProps) => {
    const [position, setPosition] = useState<number | null>(null);
    const [isBeingHelped, setIsBeingHelped] = useState(false);

    const { emit, connected } = useSocket([
        {
            event: 'position_update',
            handler: (data: { position: number }) => {
                setPosition(data.position);
                setIsBeingHelped(data.position === 0);
            }
        },
        {
            event: 'tutor_assigned',
            handler: () => {
                setIsBeingHelped(true);
                setPosition(0);
            }
        }
    ]);

    useEffect(() => {
        if (connected) {
            // Request initial position
            emit('request_position', { studentId });
        }
    }, [connected, emit, studentId]);

    if (!connected) {
        return <div className="text-yellow-500">Connecting to queue service...</div>;
    }

    if (isBeingHelped) {
        return (
            <div className="text-green-500 font-semibold">
                A tutor is now helping you!
            </div>
        );
    }

    if (position === null) {
        return <div className="text-gray-500">Waiting for position update...</div>;
    }

    return (
        <div className="space-y-2">
            <div className="text-lg font-semibold">
                Your position in queue: <span className="text-blue-500">{position}</span>
            </div>
            {position === 1 && (
                <div className="text-green-500">
                    You're next in line! A tutor will be with you shortly.
                </div>
            )}
        </div>
    );
}; 