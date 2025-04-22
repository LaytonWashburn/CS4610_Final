import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Message {
  id: number;
  content: string;
  sentAt: string;
  sender: {
    firstName: string;
    lastName: string;
  };
}

export const Room = () => {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://localhost:3000/messages/${id}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    if (id) fetchMessages();
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await fetch(`http://localhost:3000/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          chatRoomId: parseInt(id!), // assumes id is always defined
          senderId: 1, // 🔧 You should replace this with the actual logged-in user ID
        }),
      });

      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex justify-center flex-col items-center">
      <div className="bg-secondary-pink w-[100vw] h-[5vh] flex justify-center items-center shadow">
        <p className="text-center text-white font-bold">Welcome to Room: {id}</p>
      </div>

      <div className="flex flex-col w-[50vw] h-[75vh] overflow-y-auto p-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="bg-white p-3 rounded shadow">
              <div className="font-semibold text-sm">
                {msg.sender.firstName} {msg.sender.lastName}
              </div>
              <div className="text-gray-700">{msg.content}</div>
              <div className="text-xs text-gray-500">{new Date(msg.sentAt).toLocaleString()}</div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No messages yet.</p>
        )}
      </div>

      <div className="bg-secondary-grey w-[50vw] absolute bottom-0 m-4 rounded-lg h-[10vh] flex flex-col mx-auto">
        <input
          className="m-2 w-[100%] outline-none"
          type="text"
          placeholder="Send a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex flex-row align-center justify-between relative mt-auto">
          <div className="justify-start ml-2 mb-2">
            <button
              className="hover:bg-secondary-pink hover:rounded-full cursor-pointer flex items-center justify-center"
              onClick={() => console.log("Attach file clicked")}
              aria-label="Attach file"
            >
              <span className="material-symbols-outlined">
                attach_file
              </span>
            </button>
          </div>
          <div className="justify-end mr-2 mb-2">
            <button
              className="hover:bg-secondary-yellow hover:rounded-full cursor-pointer flex items-center justify-center"
              onClick={handleSendMessage}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined">
                arrow_upward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



// import { useParams } from 'react-router-dom';
// import { useState, useEffect } from 'react';

// export const Room = () => {

//     const { id } = useParams<{ id: string }>(); // id will be a string from the URL
    
//     const [messages , setMessages] = useState([]);

//     // Define the onClick handlers for each button
//     const handleAttachFileClick = () => {
//         console.log("Attach file clicked");
//     };

//     const handleArrowUpClick = () => {
//         console.log("Arrow up clicked");
//     };

//     useEffect(() => {

//     });

//     return (
//         <div className="flex justify-center flex-col items-center">
//             <div className="bg-secondary-pink w-[100vw] h-[5vh] flex justify-center items-center">
//                 <p className="text-center text-white font-bold">Welcome to Room: {id}</p>
//             </div>
//             <div className=" flex flex-col w-[50vw]">
//                 <div>Messages</div>
//             </div>
//             <div className="bg-secondary-grey w-[50vw] absolute bottom-0 m-4 rounded-lg h-[10vh] flex flex-col mx-auto">
//                 <input className="m-2 w-[100%] outline-none" type="text" placeholder="Send a message" />
//                 <div className="flex flex-row align-center justify-between relative mt-auto">
//                     <div className="justify-start ml-2 mb-2">
//                         <button 
//                             className="hover:bg-secondary-pink hover:rounded-full cursor-pointer flex items-center justify-center" 
//                             onClick={handleAttachFileClick}
//                             aria-label="Attach file"
//                         >
//                             <span className="material-symbols-outlined">
//                                 attach_file
//                             </span>
//                         </button>
//                     </div>
//                     <div className="justify-end mr-2 mb-2">
//                         <button
//                             className="hover:bg-secondary-yellow hover:rounded-full cursor-pointer flex items-center justify-center"
//                             onClick={handleArrowUpClick}
//                             aria-label="Send message"
//                         >
//                             <span className="material-symbols-outlined">
//                                 arrow_upward
//                             </span>
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

