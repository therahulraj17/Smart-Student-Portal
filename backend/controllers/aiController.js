const logger = require('../utils/logger');
const AIConversation = require('../models/AIConversation');

const getNimConfig = () => ({
  baseUrl: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_NIM_API_KEY,
  model: process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-405b-instruct',
});

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

    const { baseUrl, apiKey, model } = getNimConfig();

    if (!apiKey) {
      logger.error('NVIDIA_NIM_API_KEY not configured');
      return res.status(503).json({ error: 'AI service not configured' });
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
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
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

    await AIConversation.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: { lastMessageAt: new Date() },
        $setOnInsert: { userId: req.user._id },
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message },
              { role: 'assistant', content: aiMessage },
            ],
            $slice: -100,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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
    const conversation = await AIConversation.findOne({ userId: req.user._id }).lean();

    res.json({
      messages: conversation?.messages || [],
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
    await AIConversation.deleteOne({ userId: req.user._id });
    res.json({
      message: 'Conversation cleared',
    });
  } catch (error) {
    logger.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};
