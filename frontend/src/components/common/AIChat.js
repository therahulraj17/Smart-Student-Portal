import React, { useContext, useState } from 'react';
import { AIContext } from '../../context/AIContext';
import { sendAIMessage } from '../../services/aiService';
import toast from 'react-hot-toast';

const AIChat = () => {
  const {
    isChatOpen,
    toggleChat,
    messages,
    addMessage,
    clearMessages,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useContext(AIContext);

  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      setError(null);
      addMessage('user', inputValue);
      const userMessage = inputValue;
      setInputValue('');
      setIsLoading(true);

      // Prepare conversation history for API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendAIMessage(userMessage, conversationHistory);

      if (response.message) {
        addMessage('assistant', response.message);
      } else {
        setError('No response from AI');
        toast.error('Failed to get AI response');
      }
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to send message';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-40 ${
          isChatOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        title={isChatOpen ? 'Close AI Chat' : 'Open AI Chat'}
      >
        {isChatOpen ? (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            <path d="M15 13H5m10-2H5m10-2H5" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <h3 className="font-semibold">Study Assistant</h3>
            <button
              onClick={() => clearMessages()}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
              title="Clear chat"
            >
              Clear
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-8">
                <p className="mb-2">👋 Welcome to your AI Study Assistant!</p>
                <p className="text-xs">Ask me anything about your courses,</p>
                <p className="text-xs">assignments, or study material.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
                  Error: {error}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-3 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors"
              >
                {isLoading ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
