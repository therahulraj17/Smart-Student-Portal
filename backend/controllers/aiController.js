const logger = require('../utils/logger');

/**
 * Send message to NVIDIA NIM AI
 * POST /api/ai/chat
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.NVIDIA_NIM_API_KEY) {
      logger.error('NVIDIA_NIM_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Build conversation with system prompt
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for the Smart Student Portal. Your role is to:
- Answer general questions about courses, assignments, and study materials
- Help students understand concepts and solve problems
- Provide study tips and academic guidance
- Be encouraging and supportive
- Keep responses concise and clear

The current user is a ${req.user?.role || 'student'} in the Smart Student Portal.`,
      },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // Call NVIDIA NIM API
    const response = await fetch(
      `${process.env.NVIDIA_NIM_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-405b-instruct',
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('NVIDIA NIM API Error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to get AI response',
        details: errorData.error?.message || 'Unknown error',
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'No response generated';

    logger.info(`AI Response generated for user ${req.user?.id}`);

    res.json({
      message: aiMessage,
      usage: data.usage,
    });
  } catch (error) {
    logger.error('AI Controller Error:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
};

/**
 * Get conversation history for a user (if stored in DB)
 * GET /api/ai/history
 */
exports.getHistory = async (req, res) => {
  try {
    // If you want to store conversation history in DB, implement here
    res.json({
      message: 'Conversation history endpoint',
      note: 'Currently conversations are stored client-side only',
    });
  } catch (error) {
    logger.error('History retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
};

/**
 * Clear conversation history
 * POST /api/ai/clear
 */
exports.clearHistory = async (req, res) => {
  try {
    res.json({
      message: 'Conversation cleared',
      note: 'Frontend should clear its state',
    });
  } catch (error) {
    logger.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};
