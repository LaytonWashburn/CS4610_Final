import {React, useState} from "react";

/**
 * Component: Chat Room Information
 * @returns 
 */

interface ChatRoom {
  id: number;
  name: string;
}

interface ChatRoomInformationProps {
  createChat: (chat: ChatRoom) => void;
}

export const ChatRoomInformation = ({ createChat }: ChatRoomInformationProps) => {
  const [chatName, setChatName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
  
    if (!chatName.trim()) {
      setError("Please enter a chat name");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await fetch(`/chat/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: chatName }),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const body = await response.json();
      const newChatRoom = body.chatRoom;
      
      if (!newChatRoom || !newChatRoom.id || !newChatRoom.name) {
        throw new Error('Invalid chat room data received');
      }
  
      createChat(newChatRoom);
      setChatName(""); // Reset form after successful creation

    } catch (error) {
      console.error("Error creating chat room:", error);
      setError("An error occurred while creating the chat room.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-5"></div>
  
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white w-[90%] max-w-md rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create New Chat Room</h2>
          
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="chatName" className="block text-sm font-medium text-gray-700">
                Chat Room Name
              </label>
              <input
                id="chatName"
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter chat room name"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setChatName("")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Chat Room"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};