import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import { io, Socket } from 'socket.io-client';
import { useApi } from "../../lib/hooks/use_api";
import { useNavigate } from 'react-router-dom'; // ✅ import useNavigate
import { useSocket } from '../../hooks/useSocket';

interface Message {
  id: number;
  content: string;
  sentAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const Room = () => {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [roomInformation, setRoomInformation] = useState<any>({});


  const api = useApi();
  const navigate = useNavigate(); // Initialize navigate


  const { socket, emit, connected } = useSocket([
    {
        event: 'message',
        handler: (message: string) => {
            setMessages(prev => [...prev, message]);
        }
    },
    {
      event:  'receiveMessage', 
      handler: (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    }
  ]);


  async function fetchUser() {
    const res = await api.get("/api/users/me");
    if (!res.error) {
      setUser(res.user);
    }
    setLoading(false);
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/chat/messages/${id}`);
      const data = await res.json();
      console.log('Fetched messages:', data); // Log the messages data to check sender info
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const fetchRoomInformation = async () => {
    const res = await fetch(`/chat/info/${id}`);
    const data = await res.json();
    console.log('Fetched room information:', data);
    setRoomInformation(data);
  }

  useEffect(() => {
    if (id) {
      emit('join-room', id);
    }
  }, [connected, id, emit]);

  
  useEffect(() => {
    fetchUser();
    fetchRoomInformation();
  }, []);

  useEffect(() => {
    if (id && user) fetchMessages();
  }, [id, user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message', (message: Message) => {
      console.log('Received message:', message);
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('message');
    };
  }, [socket, navigate]);

  // I might not need this
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await fetch(`/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          chatRoomId: parseInt(id!),
          senderId: parseInt(user.id),
        }),
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

        
  const decrementRoomCount = async () => {
    try {
      const response = await fetch(`/chat/room/${id}/decrement/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        const errorData = await response.json();
        console.error('Error data:', errorData);
        return;
      }
  
      const updatedChatRoom = await response.json();
      console.log('Chat room count decremented:', updatedChatRoom);
      // Update your React state or UI
    } catch (error) {
      console.error('There was an error decrementing the chat room count:', error);
    }
  };

  const handleLeave = () => {
    decrementRoomCount();
    navigate(`/dashboard/chat/`);
  }

  const handleEndSession = async () => {
    console.log("1. Starting handleEndSession");
    if (!socket) {
      console.log("2. Socket is null");
      return;
    }
    if (!user) {
      console.log("2. User is null");
      return;
    }

    try {
      console.log("3. Socket connection status:", socket.connected);
      console.log("4. Socket ID:", socket.id);
      console.log("5. User ID:", user.id);
      console.log("6. Room ID:", id);
      
      // Test socket connection with hello event
      console.log("7. Emitting hello event");
      socket.emit('hello');
      
      // Emit end_session event
      console.log("8. Emitting end_session event with data:", {
        tutorId: parseInt(user.id),
        chatRoomId: parseInt(id!)
      });
      
      socket.emit('end_session', {
        tutorId: parseInt(user.id),
        chatRoomId: parseInt(id!)
      });
      
      console.log("9. End session event emitted successfully");
    } catch (error) {
      console.error('10. Error in handleEndSession:', error);
    }
  }


  if (!user || loading) return <div>Loading...</div>;

  return (
    <div className="flex justify-center flex-col items-center">
      <div className="bg-secondary-pink w-[100vw] h-[5vh] flex justify-center items-center shadow">
        <p className="text-center text-white font-bold">Welcome to Room: {id} &nbsp;</p>
        <h1 className="text-red-700 text-secondary-yellow font-bold">{user?.firstName}</h1>
      </div>

      <div className="flex flex-col w-[50vw] h-[75vh] overflow-y-auto p-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[70%] px-3 py-2 rounded-lg text-sm shadow ${
                msg.sender && msg.sender.id === user.id
                  ? 'bg-yellow-300 self-end text-right'
                  : 'bg-gray-200 self-start text-left'
              }`}
            >
              <div className="font-semibold text-xs">
                {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown Sender'}
              </div>
              <div className="text-gray-700">{msg.content}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {new Date(msg.sentAt).toLocaleTimeString()}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No messages yet.</p>
        )}
      </div>
      {roomInformation && (
        <button 
          className="absolute bottom-4 right-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          onClick={roomInformation.isPrivate ? handleEndSession : handleLeave}
        >
          <span className="material-symbols-outlined mr-2">logout</span>
          {roomInformation.isPrivate ? "End Session" : "Leave"}
        </button>
      )}
      <div className="bg-secondary-grey w-[50vw] absolute bottom-0 m-4 rounded-lg h-[10vh] flex flex-col mx-auto">
        <input
          className="m-2 w-[100%] outline-none text-sm p-2 rounded"
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
              onClick={() => console.log('Attach file clicked')}
              aria-label="Attach file"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
          </div>
          <div className="justify-end mr-2 mb-2">
            <button
              className="hover:bg-secondary-yellow hover:rounded-full cursor-pointer flex items-center justify-center"
              onClick={handleSendMessage}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
