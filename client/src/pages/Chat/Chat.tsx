/**
 * Component: Chat
 * Description: Main page for the chat room
 * @returns Chat component
 */

import { useState, useEffect } from 'react';
import { ChatRoomInformation } from './ChatRoomInformation';
import { ChatRoom } from './ChatRoom';
import { Room } from './Room';

import "../../index.css";



export const Chat = () => {

    const [clicked, setClicked] = useState(false);
    const [chats, setChats] = useState([]);

    const handleClick = () => {
        console.log("Button got clicked");
        setClicked(!clicked);
    }

    async function getChats() {
      const response = await fetch('/chats');
      const body = await response.json();
      return body.chatRooms;
  }

  useEffect(() => {
      async function fetchData() {
          const sums = await getChats(); // Await the promise here
          setChats(sums);
      }

      fetchData(); // Call the async function inside useEffect
  }, []);

    const deleteChatHandler = (id: number) => {
      // Remove the chat from the chats list immediately
      setChats((prevChats: ChatRoom[]) => prevChats.filter((chat) => chat.id !== id));
    };

    return (
        <div className="w-screen">
          <div className="w-[65vw] mx-auto flex justify-between mt-4">
            <p className="font-bold text-xl">Chats</p>
            <button 
              className="bg-secondary-teal rounded-sm hover:font-bold p-2 cursor-pointer" 
              onClick={handleClick}
            >
              New
            </button>
          </div>

          {
            chats.map((chat: ChatRoom) => {
              console.log(chat.name);
                  return <ChatRoom  name={chat.name}
                                    _count={0} 
                                    key={chat.id}
                                    id={chat.id}
                                    deleteChatHandler={deleteChatHandler}
                                    />
            })
          }

      
          {clicked && (
            <>
              {/* Render the close icon */}
              <span className="material-symbols-outlined absolute top-4 right-4 text-white cursor-pointer z-10" onClick={handleClick}>close</span>
      
              {/* Render the ChatRoomInformation component */}
               <ChatRoomInformation />
            </>
          )}
        </div>
      );
      

}