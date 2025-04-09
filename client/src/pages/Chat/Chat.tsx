/**
 * Component: Chat
 * Description: Main page for the chat room
 * @returns Chat component
 */

import {useState} from 'react';
import { ChatRoomInformation } from './ChatRoomInformation';
import "../../index.css";

export const Chat = () => {

    const [clicked, setClicked] = useState(false);

    const handleClick = () => {
        console.log("Button got clicked");
        setClicked(!clicked);
    }

    return (
        <div className="w-screen">
          <div className="w-[75vw] mx-auto flex justify-between">
            <p className="font-bold text-xl">Chats</p>
            <button 
              className="bg-secondary-teal rounded-sm hover:font-bold p-2 cursor-pointer" 
              onClick={handleClick}
            >
              New
            </button>
          </div>
      
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