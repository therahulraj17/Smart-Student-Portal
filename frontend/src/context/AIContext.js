import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { clearAIChatHistory, getAIChatHistory } from '../services/aiService';

export const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      setError(null);
      return;
    }

    let isActive = true;
    getAIChatHistory()
      .then((data) => {
        if (!isActive) return;
        setMessages(Array.isArray(data.data?.messages) ? data.data.messages : []);
      })
      .catch(() => {
        if (!isActive) return;
        setMessages([]);
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    clearAIChatHistory().catch(() => {});
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
