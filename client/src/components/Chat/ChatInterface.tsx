import { useEffect, useState, KeyboardEvent } from 'react';
import { socket } from "../../socket";
import { useApi } from "../../lib/hooks/use_api";
import { jwtDecode } from "jwt-decode";

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

interface Tutor {
  id: number;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface ChatInterfaceProps {
  tutorId: number;
}

export const ChatInterface = ({ tutorId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [user, setUser] = useState<{ id: string; firstName: string; lastName: string } | null>(null);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  async function fetchUser() {
    try {
      const res = await api.get("/api/users/me");
      if (!res.error) {
        setUser(res.user);
      } else {
        setError('Failed to fetch user information');
      }
    } catch (error) {
      setError('Failed to fetch user information');
    }
    setLoading(false);
  }

  async function fetchTutor() {
    try {
      const response = await fetch(`/tutor/tutors/${tutorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tutor');
      }
      const data = await response.json();
      if (!data.tutor) {
        throw new Error('Tutor not found');
      }
      setTutor(data.tutor);
    } catch (error) {
      console.error('Error fetching tutor:', error);
      setError('Failed to fetch tutor information');
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/chat/tutor-messages/${tutorId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setError('Failed to fetch messages');
    }
  };

  useEffect(() => {
    fetchUser();
    fetchTutor();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    const handleReceiveMessage = (message: Message) => {
      setMessages((prevMessages: Message[]) => [...prevMessages, message]);
    };

    socket.on('receiveTutorMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveTutorMessage', handleReceiveMessage);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch(`/chat/tutor-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          tutorId: tutorId,
          senderId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message', err);
      setError('Failed to send message');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;
  if (!user || !tutor) return <div className="text-center p-4 text-red-600">User or tutor information not available</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Tutor Info Bar */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="font-semibold">Connected with Tutor {tutor.user.firstName} {tutor.user.lastName}</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${
                  msg.sender.id === user.id ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-gray-700">
                    {msg.sender.firstName} {msg.sender.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.sentAt).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    msg.sender.id === user.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 