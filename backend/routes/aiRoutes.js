const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getHistory,
  clearHistory,
} = require('../controllers/aiController');

const router = express.Router();

// All AI routes require authentication
router.use(protect);

/**
 * Chat with AI Assistant
 * POST /api/ai/chat
 * Body: { message: string, conversationHistory: Array }
 */
router.post('/chat', sendMessage);

/**
 * Get conversation history
 * GET /api/ai/history
 */
router.get('/history', getHistory);

/**
 * Clear conversation history
 * POST /api/ai/clear
 */
router.post('/clear', clearHistory);

module.exports = router;
