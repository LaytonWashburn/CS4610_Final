import { useEffect, useState } from 'react';
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

interface ChatInterfaceProps {
  tutorId: number;
}

export const ChatInterface = ({ tutorId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [user, setUser] = useState<{ id: string; firstName: string; lastName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  async function fetchUser() {
    const res = await api.get("/api/users/me");
    if (!res.error) {
      setUser(res.user);
    }
    setLoading(false);
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/chat/tutor-messages/${tutorId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    const handleReceiveMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.on('receiveTutorMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveTutorMessage', handleReceiveMessage);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await fetch(`/chat/tutor-messages`, {
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

  if (!user || loading) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Messages Container */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
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
                      : 'bg-gray-100 text-gray-800'
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
        <div className="border-t border-gray-200 p-4">
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 