const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');

const aiService = new AIService();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await aiService.getChatbotResponse(message);
    res.json({ response });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;