import { useState, useEffect } from 'react';
import { ChatRoomInformation } from './ChatRoomInformation';
import { ChatRoom } from './ChatRoom';
import "../../index.css";

export const Chat = () => {
  const [clicked, setClicked] = useState(false);
  const [chats, setChats] = useState<ChatRoom[]>([]); // Ensure chats is always an empty array

  const handleClick = () => {
    setClicked(!clicked);
  };

  const createChat = (newChatRoom: ChatRoom) => {
    // Check if the newChatRoom is valid before updating state
    if (!newChatRoom || !newChatRoom.name || !newChatRoom.id) {
      console.error("Invalid chat room data:", newChatRoom);
      return; // Avoid updating the state if the data is invalid
    }
  
    setChats((prevChats: ChatRoom[]) => [...prevChats, newChatRoom]);
    setClicked(false); // Optionally close the modal after creation
  };

  async function getChats() {
    const response = await fetch('/chats');
    const body = await response.json();
    return body.chatRooms || []; // Ensure empty array if chatRooms is undefined
  }

  useEffect(() => {
    async function fetchData() {
      const sums = await getChats();
      setChats(sums); // Update state with fetched chat rooms
    }

    fetchData(); // Fetch the chat rooms on mount
  }, []);

  const deleteChatHandler = (id: number) => {
    // Remove the chat from the chats list immediately
    setChats((prevChats: ChatRoom[]) => prevChats.filter((chat) => chat.id !== id));
  };

  return (
    <div className="w-screen">
      <div className="w-[65vw] mx-auto flex justify-between mt-4 mb-12">
        <p className="font-bold text-xl">Chats</p>
        <button
          className="bg-secondary-teal rounded-sm hover:font-bold p-2 cursor-pointer"
          onClick={handleClick}
        >
          New
        </button>
      </div>

      {/* Check if chats is an array and contains elements */}
      {Array.isArray(chats) && chats.length > 0 ? (
        chats.map((chat: ChatRoom) => (
          <ChatRoom
            name={chat.name}
            _count={0}
            key={chat.id}
            id={chat.id}
            deleteChatHandler={deleteChatHandler}
          />
        ))
      ) : (
        <div className="w-[65vw] mx-auto flex justify-center items-center mt-4">
          <p className="text-xl">No chats available</p> 
        </div>
      )}

      {clicked && (
        <>
          <span
            className="material-symbols-outlined absolute top-4 right-4 text-white cursor-pointer z-10"
            onClick={handleClick} // Close modal when clicking close
          >
            close
          </span>

          <ChatRoomInformation createChat={createChat} />
        </>
      )}
    </div>
  );
};
