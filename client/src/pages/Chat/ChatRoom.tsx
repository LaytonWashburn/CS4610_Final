/**
 * Component: Chat Container
 * Description: Represents a unique chat room
 * @returns Chat Container
 */

import { useState } from 'react';

interface ChatRoomProps {
    course: string;
    _count: number; // optional prop
}

export const ChatRoom = ({ course, _count} : ChatRoomProps) => {

    const [count, setCount] = useState(_count);

    return(
        <div>
            <div>{course}</div>
            <div>{count}</div>
        </div>
    )
}