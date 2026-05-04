import api from './api';

/**
 * Send message to AI chatbot and get response
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous conversation messages
 * @returns {Promise} AI response
 */
export const sendAIMessage = async (message, conversationHistory = []) => {
  try {
    const response = await api.post('/ai/chat', {
      message,
      conversationHistory,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending AI message:', error);
    throw error;
  }
};

/**
 * Get user's conversation history
 */
export const getAIChatHistory = async () => {
  try {
    const response = await api.get('/ai/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Clear conversation history
 */
export const clearAIChatHistory = async () => {
  try {
    const response = await api.post('/ai/clear');
    return response.data;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};
