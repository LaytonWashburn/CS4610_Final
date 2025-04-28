import { useState, useRef, useEffect } from 'react';

interface OllamaMessage {
  content: string;
  role: string;
}

interface OllamaResponse {
  created_at: string;
  done: boolean;
  done_reason: string;
  eval_count: number;
  eval_duration: number;
  load_duration: number;
  message: OllamaMessage;
  model: string;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  total_duration: number;
}

interface OllamaApiResponse {
  response: OllamaResponse;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: OllamaResponse;
}

export const Ai = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Sending message:', input.trim());
      const response = await fetch('/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input.trim() }),
      });

      const data: OllamaApiResponse = await response.json();
      console.log('Response data:', data);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response.message.content,
        metadata: data.response
      };

      console.log('Assistant message:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ns: number) => {
    return `${(ns / 1000000000).toFixed(2)}s`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-800">Virtual Big Blue AI Assistant</h1>
      </div>

      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg">How can I help you today?</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <div className="mb-2">{message.content}</div>
                {message.metadata && (
                  <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold">Model:</span> {message.metadata.model}
                      </div>
                      <div>
                        <span className="font-semibold">Created:</span> {new Date(message.metadata.created_at).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold">Total Duration:</span> {formatDuration(message.metadata.total_duration)}
                      </div>
                      <div>
                        <span className="font-semibold">Load Duration:</span> {formatDuration(message.metadata.load_duration)}
                      </div>
                      <div>
                        <span className="font-semibold">Prompt Eval:</span> {message.metadata.prompt_eval_count} tokens ({formatDuration(message.metadata.prompt_eval_duration)})
                      </div>
                      <div>
                        <span className="font-semibold">Response Eval:</span> {message.metadata.eval_count} tokens ({formatDuration(message.metadata.eval_duration)})
                      </div>
                      <div>
                        <span className="font-semibold">Done Reason:</span> {message.metadata.done_reason}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
