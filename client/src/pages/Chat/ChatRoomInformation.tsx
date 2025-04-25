import {React, useState} from "react";

/**
 * Component: Chat Room Information
 * @returns 
 */

interface ChatRoom {

  createChat: (id: number) => void; // Add a handler for deleting chat
}

export const ChatRoomInformation = ({ createChat }: { createChat: (chat: ChatRoom) => void }) => {

  const [chatName, setChatName] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  
    if (!chatName.trim()) {
      alert("Please enter a chat name");
      return;
    }
  
    try {
      console.log("Starting Creating Chat Room");
  
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

      console.log("Response from server:", JSON.stringify(body, null, 2)); // Log the full response
  
      const newChatRoom = body.chatRoom; // Ensure you're accessing `chatRoom` here
      if (!newChatRoom || !newChatRoom.id || !newChatRoom.name) {
        throw new Error('Invalid chat room data received');
      }
  
      // Pass the new chat room data to the parent component (Chat)
      createChat(newChatRoom); // Send the valid chat room to the parent component

    } catch (error) {
      console.error("Error creating chat room:", error);
      alert("An error occurred while creating the chat room.");
    }
  }
  


    return (
        <>
          {/* Blurred background */}
          <div className="fixed inset-0 backdrop-blur-sm z-5 bg-opacity-50"></div>
      
          {/* Centered content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-secondary-pink w-[50vw] h-[50vh] mx-auto px-4 flex flex-col items-center justify-center">
            <form action="" className="relative h-full text-white font-bold flex flex-col items-center justify-center">
              <div className="px-4">
                <label className="px-4">Enter Chat Name: </label>
                <input 
                  type="text" 
                  name="" 
                  id="" 
                  className="bg-white text-black px-4"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)} 
                />
              </div>
              <button onClick={submit} className="absolute bottom-0 w-full bg-blue-500 text-white p-4 hover:font-bold cursor-pointer" >Create</button>
            </form>
          </div>
        </>
      );
      
      

}