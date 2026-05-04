import React, { createContext, useState, useCallback } from 'react';

export const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const value = {
    isChatOpen,
    setIsChatOpen,
    toggleChat,
    messages,
    setMessages,
    addMessage,
    clearMessages,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};
