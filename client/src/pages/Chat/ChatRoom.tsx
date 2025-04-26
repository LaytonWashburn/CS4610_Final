/**
 * Component: Chat Container
 * Description: Represents a unique chat room
 * @returns Chat Container
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ import useNavigate

interface ChatRoomProps {
    id: number;
    name: string;
    _count: number;
    deleteChatHandler: (id: number) => void; // Add a handler for deleting chat
    // createdAt: string; // or `Date` if you're not serializing to JSON yet
    // updatedAt: string;
    // _count?: {
    //   participants?: number;
    //   messages?: number;
    // };
  }

export const ChatRoom = ({ id, name, _count, deleteChatHandler }: ChatRoomProps) => {
    const [count, setCount] = useState(_count);
    const navigate = useNavigate(); // Initialize navigate

    const deleteChat = async (id: number) => {
        try {
            const response = await fetch(`/chat/delete/${id}`, {
                method: 'DELETE',
            });
      
            if (!response.ok) {
                throw new Error('Failed to delete chat');
            }
      
            deleteChatHandler(id);
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    const incrementRoomCount = async () => {
        try {
          const response = await fetch(`/chat/room/${id}/increment/`, {
            method: 'PATCH', // Specify the HTTP method as PATCH
            headers: {
              'Content-Type': 'application/json', // Indicate that you're sending JSON data (if needed)
              // You might need to include other headers like authorization tokens
            },
            // If you need to send data in the request body (though for increment/decrement, it's often in the URL)
            body: JSON.stringify({}),
          });
      
          if (!response.ok) {
            // Handle error responses (e.g., 4xx or 5xx status codes)
            console.error(`HTTP error! status: ${response.status}`);
            const errorData = await response.json();
            console.error('Error data:', errorData);
            return;
          }
      
          const updatedChatRoom = await response.json();
          console.log('Chat room count incremented:', updatedChatRoom);
          // Update your React state or UI with the new data
        } catch (error) {
          console.error('There was an error incrementing the chat room count:', error);
        }
      };


    const handleJoin = () => {
        incrementRoomCount();
        navigate(`/dashboard/chat/${id}`); // ✅ go to the room route
    };

    return(
        <div className="flex items-center justify-center ">
            <div className="p-6 w-[65vw] bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
                        <p className="text-gray-600 mt-1">
                            <span className="inline-flex items-center">
                                <span className="material-symbols-outlined mr-1 text-sm">people</span>
                                {count} participants
                            </span>
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                            onClick={() => deleteChat(id)}
                        >
                            <span className="material-symbols-outlined mr-2">delete</span>
                            Delete
                        </button>
                        <button 
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            onClick={handleJoin}
                        >
                            <span className="material-symbols-outlined mr-2">login</span>
                            Join
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}