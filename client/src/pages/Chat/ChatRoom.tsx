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

export const ChatRoom = ({ id, name, _count, deleteChatHandler} : ChatRoomProps) => {

    const [count, setCount] = useState(_count);
    const navigate = useNavigate(); // Initialize navigate

    const deleteChat = async (id: number) => {
        try {
            console.log(`Id being deleted: ${id}`);
          const response = await fetch(`/chat/delete/${id}`, {
            method: 'DELETE',
          });
      
          if (!response.ok) {
            throw new Error('Failed to delete chat');
          }
      
          // Optionally, update the state if you're tracking chat list
          // Example: setChats(chats.filter(chat => chat.id !== chatId));
          console.log('Chat deleted successfully');
          // Optimistically remove the chat
          deleteChatHandler(id);

        } catch (error) {
          console.error('Error deleting chat:', error);
        }
      };

    const handleJoin = () => {
      console.log("In the handle join");
        navigate(`/dashboard/chat/${id}`); // ✅ go to the room route
    };

    return(
        <div className="bg-secondary-cyan flex justify-between p-1 m-1 w-[65vw] mx-auto rounded-lg">
            <div>
                <span>Course Name: {name}</span>
                <br />
                <span>Participants: {count}</span>
            </div>
            <div className="flex space-between">
                <button 
                    className="bg-primary-gray rounded-sm hover:font-bold p-2 cursor-pointer m-1"
                    onClick={() => deleteChat(id)}>
                    Delete
                </button>
                <button 
                    className="bg-secondary-pink rounded-sm hover:font-bold p-2 cursor-pointer m-1"
                    onClick={handleJoin} // Connect Join button
                >
                    Join
                </button>
            </div>
        </div>
    )
}